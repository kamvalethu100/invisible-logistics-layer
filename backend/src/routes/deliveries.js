import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { findNearbyDrivers, updateDriverStatus, onlineDrivers } from '../sockets.js';

const deliveryCreateSchema = z.object({
  pickup_address: z.string(),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  dropoff_address: z.string(),
  dropoff_lat: z.number(),
  dropoff_lng: z.number(),
  package_size: z.enum(['small', 'medium', 'large']),
  urgency: z.enum(['standard', 'express'])
});

// Refined pricing logic for Sprint 4
async function calculatePrice(db, distance, packageSize, urgency) {
  const baseFees = { small: 5, medium: 10, large: 20 };
  const ratePerKm = 1.5;
  
  // Calculate surge based on supply/demand
  const pendingDeliveries = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE status = "pending"');
  const pendingCount = pendingDeliveries.count || 0;
  const onlineDriversCount = Array.from(onlineDrivers.values()).filter(d => d.status === 'online').length;
  
  let surgeMultiplier = 1.0;
  if (onlineDriversCount > 0) {
    const ratio = pendingCount / onlineDriversCount;
    if (ratio > 1.5) surgeMultiplier = 1.5;
    else if (ratio > 0.8) surgeMultiplier = 1.2;
  } else if (pendingCount > 0) {
    surgeMultiplier = 2.0; // No drivers online but jobs waiting
  }

  const urgencyMultiplier = urgency === 'express' ? 1.5 : 1.0;
  
  const price = (baseFees[packageSize] + (distance * ratePerKm)) * surgeMultiplier * urgencyMultiplier;
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

// Simple Haversine distance for pricing (in km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function deliveryRoutes(fastify, options) {
  const db = fastify.db;

  fastify.addHook('preHandler', fastify.authenticate);

  // Get delivery stats
  fastify.get('/stats', async (request, reply) => {
    const { category } = request.query;
    const user = await db.get('SELECT data_category FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;

    let stats = {};
    if (request.user.role === 'business') {
      stats = await db.get(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries,
          SUM(CASE WHEN status != 'delivered' AND status != 'cancelled' THEN 1 ELSE 0 END) as active_deliveries,
          SUM(price) as total_spent
        FROM deliveries 
        WHERE business_id = ? AND data_category = ?`, 
        [request.user.id, filterCategory]
      );
    } else if (request.user.role === 'driver') {
      stats = await db.get(`
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_jobs,
          SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END) as total_earnings
        FROM deliveries 
        WHERE driver_id = ? AND data_category = ?`,
        [request.user.id, filterCategory]
      );
    }
    return { ...stats, data_category: filterCategory };
  });

  // Create delivery
  fastify.post('/', async (request, reply) => {
    if (request.user.role !== 'business') {
      return reply.status(403).send({ error: 'Only businesses can create deliveries' });
    }

    try {
      const data = deliveryCreateSchema.parse(request.body);
      const user = await db.get('SELECT data_category FROM users WHERE id = ?', [request.user.id]);
      const data_category = user.data_category;

      const distance = getDistance(data.pickup_lat, data.pickup_lng, data.dropoff_lat, data.dropoff_lng);
      const price = await calculatePrice(db, distance, data.package_size, data.urgency);
      
      const id = uuidv4();
      const status = 'pending';

      await db.run(
        `INSERT INTO deliveries (
          id, business_id, status, pickup_address, pickup_lat, pickup_lng, 
          dropoff_address, dropoff_lat, dropoff_lng, package_size, urgency, price, data_category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, request.user.id, status, data.pickup_address, data.pickup_lat, data.pickup_lng,
          data.dropoff_address, data.dropoff_lat, data.dropoff_lng, data.package_size, data.urgency, price, data_category
        ]
      );

      const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
      
      // Trigger matching
      const nearbyDrivers = findNearbyDrivers(data.pickup_lat, data.pickup_lng, 5, null, data_category);
      if (nearbyDrivers.length > 0) {
        // For MVP, we'll notify all nearby drivers (broadcast) or just the closest one.
        // Let's notify the top 3 closest drivers.
        nearbyDrivers.slice(0, 3).forEach(driver => {
          fastify.io.to(driver.socketId).emit('job_offer', delivery);
        });
      }

      return delivery;
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // List deliveries
  fastify.get('/', async (request, reply) => {
    const { status, category } = request.query;
    const user = await db.get('SELECT data_category FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;

    let query = 'SELECT * FROM deliveries WHERE data_category = ?';
    let params = [filterCategory];

    if (request.user.role === 'business') {
      query += ' AND business_id = ?';
      params.push(request.user.id);
    } else if (request.user.role === 'driver') {
      query += ' AND (driver_id = ? OR status = "pending")';
      params.push(request.user.id);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const deliveries = await db.all(query + ' ORDER BY created_at DESC', params);
    return deliveries;
  });

  // History endpoint (delivered or cancelled)
  fastify.get('/history', async (request, reply) => {
    const { category } = request.query;
    const user = await db.get('SELECT data_category FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;

    let query = 'SELECT * FROM deliveries WHERE status IN ("delivered", "cancelled") AND data_category = ?';
    let params = [filterCategory];

    if (request.user.role === 'business') {
      query += ' AND business_id = ?';
      params.push(request.user.id);
    } else if (request.user.role === 'driver') {
      query += ' AND driver_id = ?';
      params.push(request.user.id);
    }

    const history = await db.all(query + ' ORDER BY updated_at DESC', params);
    return history;
  });

  // Get single delivery
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);

    if (!delivery) {
      return reply.status(404).send({ error: 'Delivery not found' });
    }

    // Check permissions
    if (request.user.role === 'business' && delivery.business_id !== request.user.id) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }
    
    // Drivers can see pending jobs or jobs assigned to them
    if (request.user.role === 'driver' && delivery.driver_id !== request.user.id && delivery.status !== 'pending') {
        return reply.status(403).send({ error: 'Unauthorized' });
    }

    return delivery;
  });

  // Accept delivery (Driver)
  fastify.patch('/:id/accept', async (request, reply) => {
    if (request.user.role !== 'driver') {
      return reply.status(403).send({ error: 'Only drivers can accept deliveries' });
    }

    const { id } = request.params;
    const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);

    if (!delivery) {
      return reply.status(404).send({ error: 'Delivery not found' });
    }

    if (delivery.status !== 'pending') {
      return reply.status(400).send({ error: 'Delivery is no longer available' });
    }

    // Assign driver and update status
    await db.run(
      'UPDATE deliveries SET driver_id = ?, status = "assigned", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [request.user.id, id]
    );

    // Update driver to busy
    await updateDriverStatus(fastify, request.user.id, 'busy');

    const updatedDelivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    
    // Notify business via socket
    fastify.io.to(`delivery_${id}`).emit('status_update', updatedDelivery);

    return updatedDelivery;
  });

  // Update delivery status (Driver)
  fastify.patch('/:id/status', async (request, reply) => {
    if (request.user.role !== 'driver') {
      return reply.status(403).send({ error: 'Only drivers can update delivery status' });
    }

    const { id } = request.params;
    const { status } = request.body;

    const allowedStatuses = ['en_route_to_pickup', 'picked_up', 'en_route_to_delivery', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      return reply.status(400).send({ error: 'Invalid status transition' });
    }

    const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    if (!delivery) {
      return reply.status(404).send({ error: 'Delivery not found' });
    }

    if (delivery.driver_id !== request.user.id) {
      return reply.status(403).send({ error: 'You are not the assigned driver for this delivery' });
    }

    await db.run(
      'UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // If delivered, update driver back to online
    if (status === 'delivered') {
      await updateDriverStatus(fastify, request.user.id, 'online');
    }

    const updatedDelivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    
    // Notify business via socket
    fastify.io.to(`delivery_${id}`).emit('status_update', updatedDelivery);

    return updatedDelivery;
  });
}
