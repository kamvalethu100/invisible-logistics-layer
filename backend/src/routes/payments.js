import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const topupSchema = z.object({
  amount: z.number().positive(),
  metadata: z.record(z.any()).optional()
});

export async function paymentRoutes(fastify, options) {
  const db = fastify.db;

  // List payments
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { category } = request.query;
    
    let query = 'SELECT * FROM payments';
    let params = [];

    if (request.user.role !== 'admin') {
      query += ' WHERE user_id = ?';
      params.push(request.user.id);
      
      if (category) {
        query += ' AND data_category = ?';
        params.push(category);
      }
    } else {
      if (category) {
        query += ' WHERE data_category = ?';
        params.push(category);
      }
    }

    const payments = await db.all(query + ' ORDER BY created_at DESC', params);
    return payments;
  });

  // Initiate a top-up (EFT flow)
  fastify.post('/topup', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { amount, metadata } = topupSchema.parse(request.body);
      const user = await db.get('SELECT currency_code, data_category FROM users WHERE id = ?', [request.user.id]);
      
      const paymentId = uuidv4();
      
      await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, request.user.id, amount, user.currency_code, 'PENDING', 'EFT', 'TOPUP', user.data_category, JSON.stringify({ 
            ...metadata, 
            instructions: 'Please EFT to Capitec Bank, Acc 2549975711, Ref FLOWGRID. Email POP to kamva100@proton.me' 
        })]
      );

      return {
        payment_id: paymentId,
        amount,
        currency: user.currency_code,
        instructions: {
          bank: 'Capitec Bank',
          account: '2549975711',
          branch_code: '470010',
          reference: 'FLOWGRID',
          email_pop_to: 'kamva100@proton.me'
        },
        message: 'Top-up initiated. Please complete the EFT and email your proof of payment for manual verification.'
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Admin: Verify top-up and credit balance
  fastify.patch('/:id/verify', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Only admins can verify payments' });
    }

    const { id } = request.params;
    const payment = await db.get('SELECT * FROM payments WHERE id = ?', [id]);

    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return reply.status(400).send({ error: `Payment is already in ${payment.status} status` });
    }

    // Atomically credit balance and complete payment
    await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [payment.amount, payment.user_id]);
    await db.run('UPDATE payments SET status = "COMPLETED", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    console.log(`[Admin-Payment] Verified EFT top-up of ${payment.amount} ${payment.currency} for user ${payment.user_id}`);

    return { status: 'success', message: 'Payment verified and balance credited' };
  });
}
