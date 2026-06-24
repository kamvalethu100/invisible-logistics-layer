import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { daraja } from '../utils/daraja.js';
import { paystack } from '../utils/paystack.js';
import { taxCompliance } from '../utils/taxCompliance.js';

const paymentSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['TOPUP', 'PREMIUM_SUBSCRIPTION']),
  phone_number: z.string().optional(), // Required for STK Push
  metadata: z.record(z.any()).optional()
});

const payoutSchema = z.object({
  amount: z.number().positive(),
  delivery_id: z.string().optional()
});

export async function paymentRoutes(fastify, options) {
  const db = fastify.db;

  // Initialize payment
  fastify.post('/initiate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = paymentSchema.parse(request.body);
      const user = await db.get('SELECT country_code, currency_code, data_category, phone FROM users WHERE id = ?', [request.user.id]);
      
      const paymentId = uuidv4();
      const provider = user.country_code === 'KE' ? 'MPESA' : 'PAYSTACK';
      const phoneNumber = data.phone_number || user.phone;

      if (provider === 'MPESA' && !phoneNumber) {
        return reply.status(400).send({ error: 'Phone number is required for M-Pesa payments' });
      }
      
      let externalResponse = null;
      if (provider === 'MPESA') {
        const callbackUrl = `${process.env.APP_BASE_URL || 'http://localhost:3002'}/api/payments/callback/mpesa/stk/${paymentId}`;
        externalResponse = await daraja.stkPush({
          phoneNumber,
          amount: data.amount,
          callbackUrl,
          description: `Payment for ${data.type}`,
          dataCategory: user.data_category
        });
      } else if (provider === 'PAYSTACK') {
        const callbackUrl = `${process.env.APP_BASE_URL || 'http://localhost:3002'}/api/payments/callback/paystack`;
        externalResponse = await paystack.initializeTransaction({
          email: request.user.email,
          amount: data.amount,
          callbackUrl,
          dataCategory: user.data_category
        });
      }

      await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, request.user.id, data.amount, user.currency_code, 'PENDING', provider, data.type, user.data_category, JSON.stringify({ ...data.metadata, phone: phoneNumber, external_response: externalResponse })]
      );

      return { 
        payment_id: paymentId, 
        provider, 
        amount: data.amount,
        currency: user.currency_code,
        external_response: externalResponse
      };
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // B2C Payout
  fastify.post('/payout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'driver') {
        return reply.status(403).send({ error: 'Only drivers can request payouts' });
    }

    try {
        const data = payoutSchema.parse(request.body);
        const user = await db.get('SELECT country_code, currency_code, data_category, phone, verification_status, verification_metadata FROM users WHERE id = ?', [request.user.id]);

        if (user.verification_status !== 'VERIFIED') {
            return reply.status(403).send({ error: 'Only verified drivers can receive payouts' });
        }

        // Check sufficient balance for payout
        const userWithBalance = await db.get('SELECT balance FROM users WHERE id = ?', [request.user.id]);
        if (userWithBalance.balance < data.amount) {
            return reply.status(402).send({ error: 'Insufficient balance for payout', current_balance: userWithBalance.balance });
        }

        // Tax Compliance Check
        const compliance = await taxCompliance.checkCompliance(user, db);
        if (!compliance.compliant) {
            return reply.status(400).send({ error: `Tax compliance failed: ${compliance.reason}` });
        }

        let payoutAmount = data.amount;
        let taxAmount = 0;

        if (user.country_code === 'KE') {
            taxAmount = taxCompliance.calculateKenyanWHT(data.amount);
            payoutAmount = data.amount - taxAmount;
            console.log(`[TaxCompliance] Kenyan Payout: Gross=${data.amount}, WHT(5%)=${taxAmount}, Net=${payoutAmount}`);
        }

        const payoutId = uuidv4();
        const provider = user.country_code === 'KE' ? 'MPESA_B2C' : 'BANK_TRANSFER';

        if (provider === 'MPESA_B2C' && !user.phone) {
            return reply.status(400).send({ error: 'M-Pesa phone number not found in profile' });
        }

        let externalResponse = null;
        if (provider === 'MPESA_B2C') {
            const callbackUrl = `${process.env.APP_BASE_URL || 'http://localhost:3002'}/api/payments/callback/mpesa/b2c/${payoutId}`;
            externalResponse = await daraja.b2cPayout({
                phoneNumber: user.phone,
                amount: payoutAmount,
                callbackUrl,
                remarks: `Payout for delivery ${data.delivery_id || 'manual'}`,
                dataCategory: user.data_category
            });
        }

        // Deduct balance immediately with atomicity check
        const deductionResult = await db.run(
            'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', 
            [data.amount, request.user.id, data.amount]
        );

        if (deductionResult.changes === 0) {
            return reply.status(402).send({ 
                error: 'Insufficient balance', 
                message: 'Balance may have changed during processing. Please ensure you have enough funds.' 
            });
        }
        
        console.log(`[Revenue] Atomic deduction of ${data.amount} from driver ${request.user.id} for payout ${payoutId}`);

        await db.run(
            `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [payoutId, request.user.id, -payoutAmount, user.currency_code, 'PENDING', provider, 'PAYOUT', user.data_category, JSON.stringify({ 
                delivery_id: data.delivery_id, 
                gross_amount: data.amount,
                tax_amount: taxAmount,
                net_amount: payoutAmount,
                kra_pin: compliance.kra_pin,
                external_response: externalResponse 
            })]
        );

        return { 
            status: 'success', 
            payout_id: payoutId, 
            message: `Payout initiated via ${provider}. ${taxAmount > 0 ? `Tax of ${taxAmount} withheld.` : ''}`,
            net_amount: payoutAmount,
            tax_amount: taxAmount,
            external_response: externalResponse
        };
    } catch (error) {
        return reply.status(400).send({ error: error.message });
    }
  });

  // Daraja STK Callback
  fastify.post('/callback/mpesa/stk/:paymentId', async (request, reply) => {
    const { paymentId } = request.params;
    const { Body } = request.body;
    
    if (!Body || !Body.stkCallback) {
        fastify.log.error(`[Daraja Callback] Invalid STK payload for ${paymentId}: ${JSON.stringify(request.body)}`);
        return reply.status(400).send({ error: 'Invalid payload' });
    }

    const payment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) {
        fastify.log.warn(`[Daraja Callback] Payment not found: ${paymentId}`);
        return reply.status(404).send({ error: 'Payment not found' });
    }

    // Idempotency check: if already processed, return success
    if (payment.status !== 'PENDING') {
        fastify.log.info(`[Daraja Callback] Payment ${paymentId} already processed (Status: ${payment.status})`);
        return { status: 'success', already_processed: true };
    }

    console.log(`[Daraja Callback] STK for ${paymentId}: ResultCode=${Body.stkCallback.ResultCode}`);
    fastify.log.info({ paymentId, callback: Body.stkCallback }, 'M-Pesa STK Callback Received');

    if (Body.stkCallback.ResultCode === 0) {
        await db.run('UPDATE payments SET status = "COMPLETED", provider_tx_id = ? WHERE id = ?', [Body.stkCallback.MerchantRequestID, paymentId]);
        
        if (payment.type === 'PREMIUM_SUBSCRIPTION') {
            const user = await db.get('SELECT data_category FROM users WHERE id = ?', [payment.user_id]);
            if (user.data_category === 'real') {
                await db.run('UPDATE users SET is_premium = 1 WHERE id = ?', [payment.user_id]);
            }
        } else if (payment.type === 'TOPUP') {
            await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [payment.amount, payment.user_id]);
            console.log(`[Balance] Credited ${payment.amount} to user ${payment.user_id} via M-Pesa STK`);
        }
    } else {
        await db.run('UPDATE payments SET status = "FAILED", metadata = ? WHERE id = ?', [JSON.stringify(Body.stkCallback), paymentId]);
    }

    return { status: 'success' };
  });

  // Daraja B2C Callback
  fastify.post('/callback/mpesa/b2c/:payoutId', async (request, reply) => {
      const { payoutId } = request.params;
      const { Result } = request.body;

      if (!Result) {
          fastify.log.error(`[Daraja Callback] Invalid B2C payload for ${payoutId}: ${JSON.stringify(request.body)}`);
          return reply.status(400).send({ error: 'Invalid payload' });
      }

      const payment = await db.get('SELECT * FROM payments WHERE id = ?', [payoutId]);
      if (!payment) {
          fastify.log.warn(`[Daraja Callback] Payout not found: ${payoutId}`);
          return reply.status(404).send({ error: 'Payout not found' });
      }

      // Idempotency check
      if (payment.status !== 'PENDING') {
          fastify.log.info(`[Daraja Callback] Payout ${payoutId} already processed (Status: ${payment.status})`);
          return { status: 'success', already_processed: true };
      }

      console.log(`[Daraja Callback] B2C for ${payoutId}: ResultCode=${Result.ResultCode}`);
      fastify.log.info({ payoutId, callback: Result }, 'M-Pesa B2C Callback Received');

      if (Result.ResultCode === 0) {
          await db.run('UPDATE payments SET status = "COMPLETED", provider_tx_id = ? WHERE id = ?', [Result.TransactionID, payoutId]);
      } else {
          await db.run('UPDATE payments SET status = "FAILED", metadata = ? WHERE id = ?', [JSON.stringify(Result), payoutId]);
          
          // Refund user balance on failed payout
          const metadata = JSON.parse(payment.metadata || '{}');
          const grossAmount = metadata.gross_amount || Math.abs(payment.amount);
          await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [grossAmount, payment.user_id]);
          console.log(`[Revenue] Refunded ${grossAmount} to user ${payment.user_id} due to failed payout ${payoutId}`);
      }

      return { status: 'success' };
  });

  // Paystack Webhook
  fastify.post('/callback/paystack', async (request, reply) => {
      const signature = request.headers['x-paystack-signature'];
      const payload = request.body;

      if (!paystack.verifyWebhookSignature(signature, payload)) {
          fastify.log.error('[Paystack Callback] Invalid signature');
          return reply.status(401).send({ error: 'Invalid signature' });
      }

      const { event, data } = payload;
      fastify.log.info({ event, reference: data.reference }, 'Paystack Webhook Received');

      if (event === 'charge.success') {
          const reference = data.reference;
          const payment = await db.get('SELECT * FROM payments WHERE id = ? OR metadata LIKE ?', [reference, `%${reference}%`]);
          
          if (!payment) {
              fastify.log.warn(`[Paystack Callback] Payment not found for reference: ${reference}`);
              return reply.status(404).send({ error: 'Payment not found' });
          }

          if (payment.status === 'PENDING') {
              await db.run('UPDATE payments SET status = "COMPLETED", provider_tx_id = ? WHERE id = ?', [data.id, payment.id]);
              
              if (payment.type === 'PREMIUM_SUBSCRIPTION') {
                  const user = await db.get('SELECT data_category FROM users WHERE id = ?', [payment.user_id]);
                  if (user.data_category === 'real') {
                      await db.run('UPDATE users SET is_premium = 1 WHERE id = ?', [payment.user_id]);
                  }
              } else if (payment.type === 'TOPUP') {
                  await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [payment.amount, payment.user_id]);
                  console.log(`[Balance] Credited ${payment.amount} to user ${payment.user_id} via Paystack`);
              }
          }
      }

      return { status: 'success' };
  });

  // Get user payments
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const payments = await db.all('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [request.user.id]);
    return payments;
  });

  // Admin: Check M-Pesa Account Balance
  fastify.get('/balance/mpesa', { preHandler: [fastify.authenticate] }, async (request, reply) => {
      // In real app, restrict to admin
      const user = await db.get('SELECT data_category, country_code FROM users WHERE id = ?', [request.user.id]);
      
      if (user.country_code !== 'KE') {
          return reply.status(400).send({ error: 'M-Pesa balance check only available for Kenya region' });
      }

      const externalResponse = await daraja.checkBalance({ dataCategory: user.data_category });
      return { status: 'initiated', external_response: externalResponse };
  });

  // Daraja Account Balance Callback
  fastify.post('/callback/mpesa/balance', async (request, reply) => {
      const { Result } = request.body;
      console.log(`[Daraja Callback] Balance:`, JSON.stringify(Result));
      // Typically we'd update some system-wide balance record or notify admins
      return { status: 'success' };
  });
}
