import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';
import { JwtPayload } from '../shared/types/index.js';

const socketPlugin = fp(async (app: FastifyInstance) => {
  const io = new Server(app.server, {
    cors: {
      origin: app.config.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  app.decorate('io', io);

  // Verify JWT on every socket connection — runs before 'connection' fires
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const payload = await app.jwt.verify<JwtPayload>(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data.user as JwtPayload;

    // Auto-join rooms from the verified token — client cannot spoof these
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    app.log.info(`🔌 Socket connected: ${socket.id} → user:${userId} role:${role}`);

    // join:room kept for client compatibility but rooms are already joined above
    socket.on('join:room', () => { /* no-op: rooms joined from verified token */ });

    socket.on('disconnect', () => {
      app.log.info(`🔌 Socket disconnected: ${socket.id} (user:${userId})`);
    });
  });

  app.addHook('onClose', (app, done) => {
    app.io.close();
    done();
  });
});

export default socketPlugin;

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
