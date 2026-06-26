import { v4 as uuidv4 } from 'uuid';

export async function notificationRoutes(fastify, options) {
  const db = fastify.db;

  // Get notifications for current user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return notifications;
  });

  // Mark notification as read
  fastify.patch('/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const userId = request.user.id;

    await db.run(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return { success: true };
  });

  // Acknowledge system notice
  fastify.post('/acknowledge-notice', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    await db.run(
      'UPDATE users SET system_notice_acknowledged = 1 WHERE id = ?',
      [userId]
    );

    return { success: true };
  });

  // Admin: Broadcast notification to all users
  fastify.post('/broadcast', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Only admins can broadcast' });
    }

    const { message, type = 'system_announcement' } = request.body;

    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }

    const users = await db.all('SELECT id FROM users');
    
    for (const user of users) {
      const notificationId = uuidv4();
      await db.run(
        'INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)',
        [notificationId, user.id, type, message]
      );
    }

    // Also reset acknowledgement for everyone so they see it again if it's a critical update
    await db.run('UPDATE users SET system_notice_acknowledged = 0');

    // Notify via Sockets if available
    if (fastify.io) {
      fastify.io.emit('broadcast_notification', { message, type });
    }

    return { success: true, count: users.length };
  });
}
