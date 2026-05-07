import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { initDb } from './db.js';
import { authRoutes } from './routes/auth.js';
import { deliveryRoutes } from './routes/deliveries.js';
import { initSockets } from './sockets.js';
import dotenv from 'dotenv';

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

// Initialize DB, Sockets and Routes
const start = async () => {
  try {
    const db = await initDb();
    fastify.decorate('db', db);

    // Initialize Sockets
    const io = await initSockets(fastify);
    fastify.decorate('io', io);

    fastify.register(authRoutes, { prefix: '/api/auth' });
    fastify.register(deliveryRoutes, { prefix: '/api/deliveries' });

    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
