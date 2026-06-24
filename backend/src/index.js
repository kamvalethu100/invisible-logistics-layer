import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { initDb } from './db.js';
import { authRoutes } from './routes/auth.js';
import { deliveryRoutes } from './routes/deliveries.js';
import { leadRoutes } from './routes/leads.js';
import { growthRoutes } from './routes/growth.js';
import { verificationRoutes } from './routes/verification.js';
import { paymentRoutes } from './routes/payments.js';
import { revenueService } from './utils/revenue.js';
import { startMatchingRetryLoop } from "./utils/matchingRetry.js";
import { initSockets } from './sockets.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register JWT
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production'
});

// Register Cors
fastify.register(fastifyCors, {
  origin: '*'
});

// Auth Middleware
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Production Observability: API Latency Spike Tracking
fastify.addHook('onResponse', async (request, reply) => {
  const duration = reply.elapsedTime; // Fastify measure time by default if requested
  if (duration > 500) { // Threshold: 500ms
    const db = fastify.db;
    const category = request.user?.data_category || 'real';
    try {
      await db.run(
        'INSERT INTO failures (id, type, reason, data_category, metadata) VALUES (?, ?, ?, ?, ?)',
        [
          uuidv4(), 
          'api_latency_spike', 
          `${request.method} ${request.url}`, 
          category, 
          JSON.stringify({ duration_ms: Math.round(duration), user_id: request.user?.id })
        ]
      );
    } catch (e) {
      // Don't crash if logging fails
    }
  }
});

// Initialize DB, Sockets and Routes
const start = async () => {
  try {
    const db = await initDb();
    fastify.decorate('db', db);
    fastify.decorate('revenue', revenueService);
    // Initialize Sockets
    const io = await initSockets(fastify);
    fastify.decorate('io', io);
    // Start background matching retry loop
    startMatchingRetryLoop(fastify);

    fastify.register(authRoutes, { prefix: '/api/auth' });
    fastify.register(deliveryRoutes, { prefix: '/api/deliveries' });
    fastify.register(leadRoutes, { prefix: '/api/leads' });
    fastify.register(growthRoutes, { prefix: '/api/growth' });
    fastify.register(verificationRoutes, { prefix: '/api/verification' });
    fastify.register(paymentRoutes, { prefix: '/api/payments' });

    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`Server listening on http://0.0.0.0:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
