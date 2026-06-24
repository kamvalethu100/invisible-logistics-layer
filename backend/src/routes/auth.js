import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['business', 'driver', 'admin']),
  name: z.string().min(2),
  phone: z.string().optional(),
  vehicle_type: z.enum(['small', 'medium', 'large']).optional(),
  data_category: z.enum(['real', 'test', 'simulated']).default('real'),
  country_code: z.string().length(2).default('ZA'),
  currency_code: z.string().length(3).default('ZAR'),
  region: z.string().default('johannesburg'),
  referral_code: z.string().optional()
});

function generateReferralCode(name) {
  const prefix = (name || 'USR').substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function authRoutes(fastify, options) {
  const db = fastify.db;

  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, role, name, phone, vehicle_type, data_category, country_code, currency_code, region, referral_code } = registerSchema.parse(request.body);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const myReferralCode = generateReferralCode(name);

      let referredBy = null;
      if (referral_code) {
        const referrer = await db.get('SELECT id FROM users WHERE referral_code = ?', [referral_code]);
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      await db.run(
        `INSERT INTO users (id, email, password_hash, role, name, phone, vehicle_type, status, data_category, country_code, currency_code, region, referral_code, referred_by, balance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, hashedPassword, role, name, phone || null, vehicle_type || null, 'offline', data_category, country_code, currency_code, region, myReferralCode, referredBy, 0]
      );

      const token = fastify.jwt.sign({ 
        id, email, role, data_category, country_code, currency_code, region,
        verification_status: 'PENDING', is_premium: 0 
      });
      return { token, user: { 
        id, email, role, name, data_category, country_code, currency_code, region,
        verification_status: 'PENDING', is_premium: 0, referral_code: myReferralCode
      } };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        return reply.status(400).send({ error: 'Email already exists' });
      }
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        data_category: user.data_category,
        country_code: user.country_code,
        currency_code: user.currency_code,
        region: user.region,
        verification_status: user.verification_status,
        is_premium: user.is_premium
      });
      return { 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          name: user.name, 
          data_category: user.data_category,
          country_code: user.country_code,
          currency_code: user.currency_code,
          region: user.region,
          verification_status: user.verification_status,
          is_premium: user.is_premium
        } 
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await db.get('SELECT id, email, role, name, phone, vehicle_type, status, data_category, country_code, currency_code, region, verification_status, is_premium, gold_status, referral_code, balance FROM users WHERE id = ?', [request.user.id]);
    
    if (user.role === 'driver') {
      const stats = await db.get(
        'SELECT COUNT(*) as total_deliveries, SUM(price) as total_earnings FROM deliveries WHERE driver_id = ? AND status = "delivered" AND data_category = ?',
        [user.id, user.data_category]
      );
      user.stats = stats;
    } else if (user.role === 'business') {
      const stats = await db.get(
        'SELECT COUNT(*) as total_deliveries, SUM(price) as total_spent FROM deliveries WHERE business_id = ? AND data_category = ?',
        [user.id, user.data_category]
      );
      user.stats = stats;
    }
    
    return user;
  });

  fastify.patch('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, phone, webhook_url } = request.body;
    const userId = request.user.id;

    const sets = [];
    const params = [];

    if (name) { sets.push('name = ?'); params.push(name); }
    if (phone) { sets.push('phone = ?'); params.push(phone); }
    if (webhook_url !== undefined) { sets.push('webhook_url = ?'); params.push(webhook_url); }

    if (sets.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    params.push(userId);
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    return { status: 'success' };
  });
}
