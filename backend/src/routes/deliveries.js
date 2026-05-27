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
  urgency: z.enum(['standard', 'express']),
  insurance_opt_in: z.boolean().optional().default(false)
});

// Refined pricing logic for Sprint 4 - Categorized Isolation & Multi-Region
async function calculatePrice(db, distance, packageSize, urgency, dataCategory = 'real', countryCode = 'ZA', insuranceOptIn = false) {
  const baseFees = { small: 5, medium: 10, large: 20 };
  const ratePerKm = 1.5;
  const largeItemSurcharge = 30; // R30 surcharge for Large items
  const insurancePremium = 10;   // Flat R10 insurance protection
  
  // Calculate surge based on supply/demand within the specific data category AND country
  const pendingDeliveries = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE status = "pending" AND data_category = ? AND country_code = ?', [dataCategory, countryCode]);
  const pendingCount = pendingDeliveries.count || 0;
  const onlineDriversCount = Array.from(onlineDrivers.values()).filter(d => 
    d.status === 'online' && d.data_category === dataCategory && d.country_code === countryCode
  ).length;
  
  let surgeMultiplier = 1.0;
  if (onlineDriversCount > 0) {
    const ratio = pendingCount / onlineDriversCount;
    if (ratio > 1.5) surgeMultiplier = 1.5;
    else if (ratio > 0.8) surgeMultiplier = 1.2;
  } else if (pendingCount > 0) {
    surgeMultiplier = 2.0; // No drivers online but jobs waiting
  }

  const urgencyMultiplier = urgency === 'express' ? 1.5 : 1.0;
  
  let price = (baseFees[packageSize] + (distance * ratePerKm)) * surgeMultiplier * urgencyMultiplier;
  
  if (packageSize === 'large') {
    price += largeItemSurcharge;
  }
  
  if (insuranceOptIn) {
    price += insurancePremium;
  }
  
  console.log(`[Pricing] Calculated price for ${dataCategory} delivery in ${countryCode}: ${price} (Distance: ${distance.toFixed(2)}km, Surge: ${surgeMultiplier}x, Package: ${packageSize}, Insurance: ${insuranceOptIn})`);
  
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

async function logFailure(db, type, deliveryId, reason, dataCategory, metadata = null) {
  await db.run(
    'INSERT INTO failures (id, type, delivery_id, reason, data_category, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), type, deliveryId, reason, dataCategory, metadata ? JSON.stringify(metadata) : null]
  );
}

async function logEvent(db, type, userId, deliveryId, dataCategory, metadata = null) {
  await db.run(
    'INSERT INTO events (id, type, user_id, delivery_id, data_category, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), type, userId, deliveryId, dataCategory, metadata ? JSON.stringify(metadata) : null]
  );
}

export async function deliveryRoutes(fastify, options) {
  const db = fastify.db;

  fastify.addHook('preHandler', fastify.authenticate);

  // Health endpoint for production observability
  fastify.get('/health', async (request, reply) => {
    const { category = 'real' } = request.query;
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'assigned' OR status = 'delivered' OR status = 'picked_up' THEN 1 ELSE 0 END) as successful_dispatches,
        SUM(CASE WHEN accepted_at IS NOT NULL THEN (strftime('%s', accepted_at) - strftime('%s', created_at)) ELSE 0 END) / 
        NULLIF(SUM(CASE WHEN accepted_at IS NOT NULL THEN 1 ELSE 0 END), 0) as avg_dispatch_latency_sec
      FROM deliveries 
      WHERE data_category = ? AND created_at >= datetime('now', '-24 hours')`,
      [category]
    );

    const failures = await db.all(`
      SELECT type, COUNT(*) as count 
      FROM failures 
      WHERE data_category = ? AND timestamp >= datetime('now', '-24 hours')
      GROUP BY type`,
      [category]
    );

    const dispatchSuccessRate = stats.total_requests > 0 
      ? (stats.successful_dispatches / stats.total_requests) * 100 
      : 100;

    return {
      status: 'healthy',
      category,
      timeframe: 'last_24_hours',
      metrics: {
        dispatch_success_rate: Math.round(dispatchSuccessRate * 100) / 100 + '%',
        avg_dispatch_latency_sec: Math.round((stats.avg_dispatch_latency_sec || 0) * 100) / 100,
        total_requests: stats.total_requests,
        failures_by_type: failures.reduce((acc, f) => ({ ...acc, [f.type]: f.count }), {})
      }
    };
  });

  // Get delivery stats
  fastify.get('/stats', async (request, reply) => {
    const { category, region } = request.query;
    const user = await db.get('SELECT data_category, region FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;
    const filterRegion = region || user.region;

    let stats = {};
    if (request.user.role === 'business') {
      stats = await db.get(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries,
          SUM(CASE WHEN status != 'delivered' AND status != 'cancelled' THEN 1 ELSE 0 END) as active_deliveries,
          SUM(price) as total_spent
        FROM deliveries 
        WHERE business_id = ? AND data_category = ? AND region = ?`, 
        [request.user.id, filterCategory, filterRegion]
      );
    } else if (request.user.role === 'driver') {
      stats = await db.get(`
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_jobs,
          SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END) as total_earnings
        FROM deliveries 
        WHERE driver_id = ? AND data_category = ? AND region = ?`,
        [request.user.id, filterCategory, filterRegion]
      );
    }
    return { ...stats, data_category: filterCategory, region: filterRegion };
  });

  // Create delivery
  fastify.post('/', async (request, reply) => {
    if (request.user.role !== 'business') {
      return reply.status(403).send({ error: 'Only businesses can create deliveries' });
    }

    try {
      const data = deliveryCreateSchema.parse(request.body);
      const user = await db.get('SELECT data_category, country_code, currency_code, region, verification_status FROM users WHERE id = ?', [request.user.id]);
      
      // Growth Constraint: Unverified limited to 1 delivery
      if (user.verification_status !== 'VERIFIED') {
        const deliveryCount = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE business_id = ?', [request.user.id]);
        if (deliveryCount.count >= 1) {
          return reply.status(403).send({ error: 'Unverified businesses are limited to 1 test delivery. Please complete KYB verification.' });
        }
        
        // Growth Constraint: No access to Express jobs for unverified
        if (data.urgency === 'express') {
            return reply.status(403).send({ error: 'Express deliveries are only available to verified businesses.' });
        }
      }

      const data_category = user.data_category;
      const country_code = user.country_code;
      const currency_code = user.currency_code;
      const region = user.region;

      const distance = getDistance(data.pickup_lat, data.pickup_lng, data.dropoff_lat, data.dropoff_lng);
      const price = await calculatePrice(db, distance, data.package_size, data.urgency, data_category, country_code, data.insurance_opt_in);
      const insurance_premium = data.insurance_opt_in ? 10 : 0;
      
      const id = uuidv4();
      const status = 'pending';

      await db.run(
        `INSERT INTO deliveries (
          id, business_id, status, pickup_address, pickup_lat, pickup_lng, 
          dropoff_address, dropoff_lat, dropoff_lng, package_size, urgency, price, data_category, country_code, currency_code, region, insurance_opt_in, insurance_premium
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, request.user.id, status, data.pickup_address, data.pickup_lat, data.pickup_lng,
          data.dropoff_address, data.dropoff_lat, data.dropoff_lng, data.package_size, data.urgency, price, data_category, country_code, currency_code, region, data.insurance_opt_in ? 1 : 0, insurance_premium
        ]
      );

      const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
      
      // Trigger matching
      const nearbyDrivers = findNearbyDrivers(data.pickup_lat, data.pickup_lng, 5, null, data_category, country_code);
      if (nearbyDrivers.length > 0) {
        // For MVP, we'll notify all nearby drivers (broadcast) or just the closest one.
        // Let's notify the top 3 closest drivers.
        nearbyDrivers.slice(0, 3).forEach(driver => {
          fastify.io.to(driver.socketId).emit('job_offer', delivery);
        });
      } else {
        // Log failure: no drivers found
        await logFailure(db, 'matching_failure', id, 'no_drivers_nearby', data_category, { lat: data.pickup_lat, lng: data.pickup_lng });
      }

      return delivery;
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // List deliveries
  fastify.get('/', async (request, reply) => {
    const { status, category, region } = request.query;
    const user = await db.get('SELECT data_category, region FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;
    const filterRegion = region || user.region;

    let query = 'SELECT * FROM deliveries WHERE data_category = ? AND region = ?';
    let params = [filterCategory, filterRegion];

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
    const { category, region } = request.query;
    const user = await db.get('SELECT data_category, region FROM users WHERE id = ?', [request.user.id]);
    const filterCategory = category || user.data_category;
    const filterRegion = region || user.region;

    let query = 'SELECT * FROM deliveries WHERE status IN ("delivered", "cancelled") AND data_category = ? AND region = ?';
    let params = [filterCategory, filterRegion];

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

    const driver = await db.get('SELECT verification_status FROM users WHERE id = ?', [request.user.id]);
    if (driver.verification_status !== 'VERIFIED') {
        return reply.status(403).send({ error: 'Only verified drivers can accept jobs. Please complete KYC verification.' });
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
      'UPDATE deliveries SET driver_id = ?, status = "assigned", updated_at = CURRENT_TIMESTAMP, accepted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [request.user.id, id]
    );

    // Update driver to busy
    await updateDriverStatus(fastify, request.user.id, 'busy');

    const updatedDelivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    
    // Persistent log
    await logEvent(db, 'job_accepted', request.user.id, id, updatedDelivery.data_category, {
        price: updatedDelivery.price,
        currency: updatedDelivery.currency_code
    });

    // Notify business via socket
    fastify.io.to(`delivery_${id}`).emit('status_update', updatedDelivery);
    fastify.io.to(`delivery_${id}`).emit('job_accepted', {
        delivery_id: id,
        driver_id: request.user.id,
        status: 'assigned'
    });

    return updatedDelivery;
  });

  // Update delivery status (Driver)
  fastify.patch('/:id/status', async (request, reply) => {
    if (request.user.role !== 'driver') {
      return reply.status(403).send({ error: 'Only drivers can update delivery status' });
    }

    const { id } = request.params;
    const { status, reason } = request.body;

    const allowedStatuses = ['en_route_to_pickup', 'picked_up', 'en_route_to_delivery', 'delivered', 'cancelled'];
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

    // If cancelled, log as failure
    if (status === 'cancelled') {
      await logFailure(db, 'delivery_cancelled', id, reason || 'driver_cancelled', delivery.data_category, { driver_id: request.user.id });
      await updateDriverStatus(fastify, request.user.id, 'online');
    }

    // If delivered, update driver back to online
    if (status === 'delivered') {
      await updateDriverStatus(fastify, request.user.id, 'online');
      
      // Referral Logic: Trigger on first verified delivery
      const business = await db.get('SELECT id, referred_by, verification_status, data_category FROM users WHERE id = ?', [delivery.business_id]);
      if (business && business.referred_by && business.verification_status === 'VERIFIED' && business.data_category === 'real') {
          const completedCount = await db.get('SELECT COUNT(*) as count FROM deliveries WHERE business_id = ? AND status = "delivered"', [delivery.business_id]);
          if (completedCount.count === 1) {
              // This is the first delivery! Credit the referrer.
              const creditAmount = 100;
              await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [creditAmount, business.referred_by]);
              
              await db.run(
                  'INSERT INTO referral_credits (id, referrer_id, referred_id, amount, status) VALUES (?, ?, ?, ?, ?)',
                  [uuidv4(), business.referred_by, business.id, creditAmount, 'COMPLETED']
              );
              
              await logEvent(db, 'referral_reward_paid', business.referred_by, id, 'real', {
                  referred_user_id: business.id,
                  amount: creditAmount
              });
              
              console.log(`[Referral] Paid ${creditAmount} to referrer ${business.referred_by} for user ${business.id}`);
          }
      }
    }

    const updatedDelivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    
    // Notify business via socket
    fastify.io.to(`delivery_${id}`).emit('status_update', updatedDelivery);

    return updatedDelivery;
  });

  // Cancel delivery (Business or Admin)
  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body;

    const delivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    if (!delivery) {
      return reply.status(404).send({ error: 'Delivery not found' });
    }

    if (request.user.role === 'business' && delivery.business_id !== request.user.id) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    if (delivery.status === 'delivered' || delivery.status === 'cancelled') {
      return reply.status(400).send({ error: 'Cannot cancel a completed or already cancelled delivery' });
    }

    await db.run(
      'UPDATE deliveries SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // If driver was assigned, make them online again
    if (delivery.driver_id) {
      await updateDriverStatus(fastify, delivery.driver_id, 'online');
    }

    await logFailure(db, 'delivery_cancelled', id, reason || 'business_cancelled', delivery.data_category, { cancelled_by: request.user.id });

    const updatedDelivery = await db.get('SELECT * FROM deliveries WHERE id = ?', [id]);
    fastify.io.to(`delivery_${id}`).emit('status_update', updatedDelivery);

    return updatedDelivery;
  });
}
