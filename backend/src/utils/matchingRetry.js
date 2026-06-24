import { findNearbyDrivers } from '../sockets.js';
import { v4 as uuidv4 } from 'uuid';

async function logEvent(db, type, userId, deliveryId, dataCategory, metadata = null) {
  try {
    await db.run(
      'INSERT INTO events (id, type, user_id, delivery_id, data_category, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), type, userId, deliveryId, dataCategory, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (e) {
    console.error('[MatchingRetry] Failed to log event:', e.message);
  }
}

export async function startMatchingRetryLoop(fastify) {
  const { db, io } = fastify;
  
  console.log('[MatchingRetry] Starting background matching retry loop (Interval: 1 minute)');
  
  setInterval(async () => {
    try {
      // 1. Get all pending deliveries
      const pendingDeliveries = await db.all('SELECT * FROM deliveries WHERE status = "pending"');
      
      if (pendingDeliveries.length === 0) return;

      for (const delivery of pendingDeliveries) {
        // 2. Get drivers who have already declined this job
        const declines = await db.all(
          'SELECT user_id FROM events WHERE delivery_id = ? AND type = "job_declined"',
          [delivery.id]
        );
        const declinedDriverIds = new Set(declines.map(d => d.user_id));
        
        // 3. Find nearby online drivers
        // Using a slightly larger radius for retry to increase fulfillment chances
        const searchRadius = 10; 
        const nearbyDrivers = findNearbyDrivers(
          delivery.pickup_lat, 
          delivery.pickup_lng, 
          searchRadius, 
          null, 
          delivery.data_category, 
          delivery.country_code
        );
        
        // 4. Filter out drivers who declined
        const eligibleDrivers = nearbyDrivers.filter(d => !declinedDriverIds.has(d.driverId));
        
        if (eligibleDrivers.length > 0) {
          eligibleDrivers.forEach(driver => {
            io.to(driver.socketId).emit('job_offer', {
              ...delivery,
              retry: true
            });
          });
          
          // 5. Log retry attempt
          await logEvent(db, 'matching_retry', null, delivery.id, delivery.data_category, {
            drivers_notified: eligibleDrivers.length,
            driver_ids: eligibleDrivers.map(d => d.driverId),
            radius_km: searchRadius
          });
          
          console.log(`[MatchingRetry] Re-dispatched delivery ${delivery.id} to ${eligibleDrivers.length} drivers`);
        }
      }
    } catch (error) {
      console.error('[MatchingRetry] Error in loop:', error.message);
    }
  }, 60000); // Every 1 minute
}
