import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';

/**
 * Fastify Redis Plugin.
 * Connects to Redis and decorates the fastify instance with `app.redis`.
 * If Redis is unavailable, the server will log a warning and continue.
 */
const redisPlugin = fp(async (app: FastifyInstance) => {
  const redisUrl = app.config.REDIS_URL;

  // Skip Redis entirely if no real URL is configured or it's the localhost default on a cloud env
  if (!redisUrl || redisUrl === 'redis://localhost:6379') {
    app.log.warn('⚠️  Redis not configured — skipping Redis plugin. GPS tracking & caching will be disabled.');
    return;
  }

  try {
    await app.register(fastifyRedis, { url: redisUrl, closeClient: true });
    app.log.info('✅ Redis connected');
  } catch (err) {
    app.log.warn({ err }, '⚠️  Redis connection failed — server will continue without caching.');
  }
});

export default redisPlugin;
