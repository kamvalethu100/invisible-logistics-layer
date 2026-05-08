import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for active drivers
// Map<userId, { socketId, lat, lng, status }>
export const onlineDrivers = new Map();

export async function initSockets(fastify) {
  const io = new Server(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = await fastify.jwt.verify(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role}) [Category: ${socket.user.data_category}]`);

    if (socket.user.role === 'driver') {
      onlineDrivers.set(socket.user.id, {
        socketId: socket.id,
        lat: null,
        lng: null,
        status: 'online',
        data_category: socket.user.data_category
      });
      
      // Update driver status in DB
      fastify.db.run('UPDATE users SET status = "online" WHERE id = ?', [socket.user.id]);
    }

    // Driver location update
    socket.on('update_location', async (data) => {
      if (socket.user.role !== 'driver') return;
      
      const { lat, lng } = data;
      const driverData = onlineDrivers.get(socket.user.id);
      if (driverData) {
        driverData.lat = lat;
        driverData.lng = lng;
        onlineDrivers.set(socket.user.id, driverData);
        
        // Telemetry logging with category for verifiability
        console.log(`[Telemetry] Driver ${socket.user.id} (${driverData.data_category}): ${lat}, ${lng}`);
      }

      // If driver is currently on a delivery, broadcast to the delivery room
      const activeDelivery = await fastify.db.get(
        'SELECT id FROM deliveries WHERE driver_id = ? AND status IN ("assigned", "en_route_to_pickup", "picked_up", "en_route_to_delivery")',
        [socket.user.id]
      );

      if (activeDelivery) {
        io.to(`delivery_${activeDelivery.id}`).emit('location_update', { lat, lng });
      }
    });

    // Join room for specific delivery tracking
    socket.on('track_delivery', (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log(`User ${socket.user.id} tracking delivery ${deliveryId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.id}`);
      if (socket.user.role === 'driver') {
        const driverData = onlineDrivers.get(socket.user.id);
        
        // Production Observability: Track disconnects during active deliveries
        const activeDelivery = await fastify.db.get(
          'SELECT id, data_category FROM deliveries WHERE driver_id = ? AND status IN ("assigned", "en_route_to_pickup", "picked_up", "en_route_to_delivery")',
          [socket.user.id]
        );

        if (activeDelivery) {
          await fastify.db.run(
            'INSERT INTO failures (id, type, delivery_id, reason, data_category, metadata) VALUES (?, ?, ?, ?, ?, ?)',
            [
              uuidv4(), 
              'gps_signal_drop', 
              activeDelivery.id, 
              'driver_disconnected', 
              activeDelivery.data_category, 
              JSON.stringify({ driver_id: socket.user.id, last_lat: driverData?.lat, last_lng: driverData?.lng })
            ]
          );
        }

        onlineDrivers.delete(socket.user.id);
        fastify.db.run('UPDATE users SET status = "offline" WHERE id = ?', [socket.user.id]);
      }
    });
  });

  return io;
}

// Function to update driver status in memory and DB
export async function updateDriverStatus(fastify, driverId, status) {
  const driverData = onlineDrivers.get(driverId);
  if (driverData) {
    driverData.status = status;
    onlineDrivers.set(driverId, driverData);
  }
  await fastify.db.run('UPDATE users SET status = ? WHERE id = ?', [status, driverId]);
}

// Function to find nearby drivers
export function findNearbyDrivers(lat, lng, radiusKm = 5, vehicleType = null, category = 'real') {
  const nearby = [];
  
  for (const [driverId, data] of onlineDrivers.entries()) {
    if (data.lat === null || data.lng === null) continue;
    if (data.status !== 'online') continue;
    if (data.data_category !== category) continue; // Strict separation

    const distance = getDistance(lat, lng, data.lat, data.lng);
    if (distance <= radiusKm) {
      nearby.push({ driverId, ...data, distance });
    }
  }

  // Sort by distance
  return nearby.sort((a, b) => a.distance - b.distance);
}

// Haversine distance formula (in km)
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
