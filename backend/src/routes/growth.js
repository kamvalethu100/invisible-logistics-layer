
import { z } from 'zod';

export async function growthRoutes(fastify, options) {
  const db = fastify.db;

  fastify.addHook('preHandler', fastify.authenticate);

  // Admin or Growth Lead only
  fastify.get('/dashboard', async (request, reply) => {
    // In a real app, restrict this to specific roles
    const { timeframe = '24h', category = 'real', region } = request.query;
    
    let timeFilter = "datetime('now', '-24 hours')";
    if (timeframe === '7d') timeFilter = "datetime('now', '-7 days')";
    if (timeframe === '30d') timeFilter = "datetime('now', '-30 days')";
    if (timeframe === 'all') timeFilter = "datetime('0')";

    let regionFilter = region ? 'AND region = ?' : '';
    let params = [category];
    if (region) params.push(region);

    const stats = await db.get(`
      SELECT 
        SUM(price) as gtv,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as fulfilled_requests,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_requests
      FROM deliveries 
      WHERE data_category = ? AND created_at >= ${timeFilter} ${regionFilter}`,
      params
    );

    const activeDrivers = await db.get(`
      SELECT COUNT(DISTINCT driver_id) as count 
      FROM deliveries 
      WHERE data_category = ? AND status = 'delivered' AND updated_at >= ${timeFilter} ${regionFilter}`,
      params
    );

    const transactingSMEs = await db.get(`
      SELECT COUNT(DISTINCT business_id) as count 
      FROM deliveries 
      WHERE data_category = ? AND created_at >= ${timeFilter} ${regionFilter}`,
      params
    );

    const fulfillmentRate = stats.total_requests > 0 
      ? (stats.fulfilled_requests / (stats.fulfilled_requests + stats.cancelled_requests || 1)) * 100 
      : 100;

    return {
      gtv: stats.gtv || 0,
      total_requests: stats.total_requests || 0,
      fulfilled_requests: stats.fulfilled_requests || 0,
      active_drivers: activeDrivers.count || 0,
      transacting_smes: transactingSMEs.count || 0,
      fulfillment_rate: Math.round(fulfillmentRate * 100) / 100 + '%',
      timeframe,
      category,
      region: region || 'all'
    };
  });

  // List referral performance
  fastify.get('/referrals', async (request, reply) => {
    const referrals = await db.all(`
      SELECT 
        u.name, 
        u.role, 
        COUNT(r.id) as total_referrals, 
        SUM(r.amount) as total_earned
      FROM users u
      JOIN referral_credits r ON u.id = r.referrer_id
      WHERE u.data_category = 'real'
      GROUP BY u.id
      ORDER BY total_earned DESC
    `);
    return referrals;
  });

  // User: Get my own referrals
  fastify.get('/my-referrals', async (request, reply) => {
    const userId = request.user.id;
    
    // Get confirmed referrals (who have earned credits)
    const confirmed = await db.all(`
      SELECT r.referred_id, u.name, u.role, r.amount, r.created_at as awarded_at
      FROM referral_credits r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    // Get pending referrals (who signed up but haven't transacted yet)
    const pending = await db.all(`
      SELECT id as referred_id, name, role, created_at as signed_up_at
      FROM users
      WHERE referred_by = ? AND id NOT IN (SELECT referred_id FROM referral_credits WHERE referrer_id = ?)
      ORDER BY created_at DESC
    `, [userId, userId]);

    return {
      confirmed,
      pending,
      total_earned: confirmed.reduce((sum, r) => sum + r.amount, 0)
    };
  });

  // User: Get notifications
  fastify.get('/notifications', async (request, reply) => {
    const notifications = await db.all(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [request.user.id]);
    return notifications;
  });

  // User: Mark notification as read
  fastify.patch('/notifications/:id/read', async (request, reply) => {
    const { id } = request.params;
    await db.run(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [id, request.user.id]
    );
    return { status: 'success' };
  });
}
