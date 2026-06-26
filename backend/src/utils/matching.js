import { findNearbyDrivers, onlineDrivers } from '../sockets.js';

export async function startMatchingLoop(fastify) {
  const db = fastify.db;
  const io = fastify.io;

  console.log('[MatchingLoop] Initializing Persistent Matching Retry Loop...');

  // Region centers for fallback matching when drivers aren't connected to WebSocket
  const regionCenters = {
    'johannesburg': { lat: -26.2041, lng: 28.0473 },
    'nairobi': { lat: -1.2921, lng: 36.8219 }
  };

  setInterval(async () => {
    try {
      // Find all pending deliveries that haven't been matched
      // LOGISTIQS LIVE PHASE: Only match jobs that have entered the settlement gate
      const pendingDeliveries = await db.all(
        'SELECT * FROM deliveries WHERE status = "pending" AND data_category = "real" AND payment_status IN ("initiated", "completed")'
      );

      if (pendingDeliveries.length === 0) return;

      // Get all drivers who are "online" in the database to include those not currently on WebSocket
      const dbOnlineDrivers = await db.all(
        'SELECT id, region, data_category, country_code FROM users WHERE role = "driver" AND status = "online" AND verification_status = "VERIFIED"'
      );

      console.log(`[MatchingLoop] Found ${pendingDeliveries.length} pending deliveries and ${dbOnlineDrivers.length} online verified drivers in DB.`);

      for (const delivery of pendingDeliveries) {
        // 1. Try real-time matching via WebSocket first (accurate location)
        let nearbyDrivers = findNearbyDrivers(
          delivery.pickup_lat, 
          delivery.pickup_lng, 
          15, // Expanded radius for blitz
          null, 
          delivery.data_category, 
          delivery.country_code
        );

        // 2. Fallback: If no real-time drivers, use DB-online drivers in the same region
        if (nearbyDrivers.length === 0) {
          const regionalDrivers = dbOnlineDrivers.filter(d => 
            d.region === delivery.region && 
            d.data_category === delivery.data_category &&
            d.country_code === delivery.country_code
          );
          
          if (regionalDrivers.length > 0) {
            console.log(`[MatchingLoop] Fallback matching for job ${delivery.id}: Found ${regionalDrivers.length} regional drivers in ${delivery.region}.`);
            
            // For fallback, we don't have socket IDs for most, but we can auto-assign the closest one or just the first one to clear backlog
            // In a blitz, we'll auto-assign to the first available driver in the region if it's been pending for more than 5 mins
            const createdTime = new Date(delivery.created_at).getTime();
            const now = new Date().getTime();
            
            if (now - createdTime > 30000) { // 30 seconds for the blitz demo speed
                const driver = regionalDrivers[0];
                console.log(`[MatchingLoop] AUTO-ASSIGNING job ${delivery.id} to driver ${driver.id} to clear backlog.`);
                
                await db.run(
                    'UPDATE deliveries SET driver_id = ?, status = "assigned", updated_at = CURRENT_TIMESTAMP, accepted_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [driver.id, delivery.id]
                );
                
                // Update driver to busy
                await db.run('UPDATE users SET status = "busy" WHERE id = ?', [driver.id]);
                
                // If the driver happens to be connected, notify them
                const socketData = onlineDrivers.get(driver.id);
                if (socketData) {
                    io.to(socketData.socketId).emit('status_update', { ...delivery, status: 'assigned', driver_id: driver.id });
                }
            }
          }
        } else {
          console.log(`[MatchingLoop] WebSocket matching for job ${delivery.id}: Found ${nearbyDrivers.length} drivers. Re-offering...`);
          nearbyDrivers.slice(0, 5).forEach(driver => {
            io.to(driver.socketId).emit('job_offer', delivery);
          });
        }
      }
    } catch (error) {
      console.error('[MatchingLoop] Error in matching loop:', error);
    }
  }, 10000); // Run every 10 seconds during the blitz
}
