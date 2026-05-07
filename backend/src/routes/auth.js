import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['business', 'driver']),
  name: z.string().min(2),
  phone: z.string().optional(),
  vehicle_type: z.enum(['small', 'medium', 'large']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export async function authRoutes(fastify, options) {
  const db = fastify.db;

  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, role, name, phone, vehicle_type } = registerSchema.parse(request.body);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();

      await db.run(
        `INSERT INTO users (id, email, password_hash, role, name, phone, vehicle_type, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, hashedPassword, role, name, phone || null, vehicle_type || null, role === 'driver' ? 'offline' : null]
      );

      const token = fastify.jwt.sign({ id, email, role });
      return { token, user: { id, email, role, name } };
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

      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
      return { token, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await db.get('SELECT id, email, role, name, phone, vehicle_type, status FROM users WHERE id = ?', [request.user.id]);
    
    if (user.role === 'driver') {
      const stats = await db.get(
        'SELECT COUNT(*) as total_deliveries, SUM(price) as total_earnings FROM deliveries WHERE driver_id = ? AND status = "delivered"',
        [user.id]
      );
      user.stats = stats;
    } else if (user.role === 'business') {
      const stats = await db.get(
        'SELECT COUNT(*) as total_deliveries, SUM(price) as total_spent FROM deliveries WHERE business_id = ?',
        [user.id]
      );
      user.stats = stats;
    }
    
    return user;
  });
}
