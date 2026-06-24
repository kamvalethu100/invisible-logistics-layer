
import { v4 as uuidv4 } from 'uuid';

export const revenueService = {
  /**
   * Deduct delivery fee from business balance and record it.
   */
  async deductDeliveryFee(db, userId, deliveryId, amount, currency, category) {
    const deductionResult = await db.run(
      'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, userId, amount]
    );

    if (deductionResult.changes === 0) {
      throw new Error('Insufficient balance');
    }

    await db.run(
      `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, -amount, currency, 'COMPLETED', 'INTERNAL', 'DELIVERY_FEE', category, JSON.stringify({ delivery_id: deliveryId })]
    );

    console.log(`[RevenueService] Deducted ${amount} ${currency} from business ${userId} for delivery ${deliveryId}`);
  },

  /**
   * Credit driver earning and record it.
   */
  async creditDriverEarning(db, driverId, deliveryId, amount, currency, category) {
    const earning = Math.round(amount * 0.8 * 100) / 100;
    
    await db.run(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [earning, driverId]
    );

    await db.run(
      `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), driverId, earning, currency, 'COMPLETED', 'INTERNAL', 'EARNING', category, JSON.stringify({ delivery_id: deliveryId })]
    );

    console.log(`[RevenueService] Credited ${earning} ${currency} to driver ${driverId} for delivery ${deliveryId}`);
  },

  /**
   * Refund delivery fee to business and record it.
   */
  async refundDelivery(db, userId, deliveryId, amount, currency, category, reason) {
    await db.run(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, userId]
    );

    await db.run(
      `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, amount, currency, 'COMPLETED', 'INTERNAL', 'REFUND', category, JSON.stringify({ delivery_id: deliveryId, reason })]
    );

    console.log(`[RevenueService] Refunded ${amount} ${currency} to business ${userId} for delivery ${deliveryId} (${reason})`);
  },

  /**
   * Handle referral award logic.
   */
  async handleReferralAward(db, userId, deliveryId, category) {
    const user = await db.get('SELECT id, role, referred_by, verification_status, data_category FROM users WHERE id = ?', [userId]);
    
    if (!user || !user.referred_by || user.verification_status !== 'VERIFIED' || user.data_category !== 'real') {
      return;
    }

    // Check if this is the first completed delivery/job for this user
    let completedCount = 0;
    if (user.role === 'business') {
      const result = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE business_id = ? AND status = "delivered"', [userId]);
      completedCount = result.count;
    } else if (user.role === 'driver') {
      const result = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE driver_id = ? AND status = "delivered"', [userId]);
      completedCount = result.count;
    }

    if (completedCount === 1) {
      // Award credit to the referrer
      const creditAmount = user.role === 'business' ? 100 : 50; // R100 for SME, R50 for Driver
      const currency = 'ZAR'; // Defaulting for now, should ideally match user
      
      await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [creditAmount, user.referred_by]);
      
      await db.run(
        'INSERT INTO referral_credits (id, referrer_id, referred_id, amount, status) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), user.referred_by, user.id, creditAmount, 'COMPLETED']
      );

      await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, type, data_category, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), user.referred_by, creditAmount, currency, 'COMPLETED', 'INTERNAL', 'REFERRAL_REWARD', category, JSON.stringify({ referred_user_id: user.id, delivery_id: deliveryId })]
      );

      // Add notification for the referrer
      await db.run(
        'INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
        [uuidv4(), user.referred_by, 'referral_earned', `You earned ${creditAmount} ${currency} from your referral ${user.name}!`]
      );

      console.log(`[Referral] Paid ${creditAmount} to referrer ${user.referred_by} for user ${user.id} (${user.role})`);
    }
  },

  /**
   * Record a topup or other payment.
   */
  async recordPayment(db, userId, amount, currency, type, category, provider, providerTxId, metadata = {}) {
     // This is usually handled by the callback, but keeping it here for consistency if needed.
     await db.run(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userId]
      );

      await db.run(
        `INSERT INTO payments (id, user_id, amount, currency, status, provider, provider_tx_id, type, data_category, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, amount, currency, 'COMPLETED', provider, providerTxId, type, category, JSON.stringify(metadata)]
      );
      
      console.log(`[RevenueService] Recorded ${type} of ${amount} ${currency} for user ${userId} via ${provider}`);
  }
};
