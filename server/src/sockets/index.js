// ════════════════════════════════════════════════════════════
//  Socket.io — Authenticated realtime channel
//  Rooms: user:<id>, role:<role>, broadcast
// ════════════════════════════════════════════════════════════
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/auth.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let io = null;
const MAX_CONNECTIONS_PER_IP = 10;
const connectionsPerIp = new Map();

export function createSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  // ── Auth middleware (read JWT from auth header or cookies) ──
  io.use((socket, next) => {
    try {
      const header = socket.handshake.headers.authorization;
      let token;
      if (header && header.startsWith('Bearer ')) token = header.slice(7);
      else if (socket.handshake.auth?.token) token = socket.handshake.auth.token;
      else if (socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie
          .split(';')
          .map((s) => s.trim())
          .find((s) => s.startsWith('sn_refresh=') || s.startsWith('sn_session='));
        if (match) token = match.split('=')[1];
      }
      if (!token) return next(new Error('UNAUTHENTICATED'));

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake.address;
    const count = (connectionsPerIp.get(clientIp) || 0) + 1;
    if (count > MAX_CONNECTIONS_PER_IP) {
      connectionsPerIp.set(clientIp, count);
      logger.warn({ clientIp, count }, 'socket:rate-limited');
      socket.disconnect(true);
      return;
    }
    connectionsPerIp.set(clientIp, count);

    const { sub, role } = socket.data.user || {};
    if (sub) {
      socket.join(`user:${sub}`);
      socket.join(`role:${role}`);
      logger.info({ sub, role, sid: socket.id }, 'socket:connected');
    }

    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('join:qa', (questionId) => {
      socket.join(`qa:${questionId}`);
    });

    socket.on('leave:qa', (questionId) => {
      socket.leave(`qa:${questionId}`);
    });

    socket.on('ping', (cb) => cb?.('pong'));

    socket.on('disconnect', (reason) => {
      const c = (connectionsPerIp.get(clientIp) || 1) - 1;
      if (c <= 0) connectionsPerIp.delete(clientIp);
      else connectionsPerIp.set(clientIp, c);
      logger.debug({ sub, reason }, 'socket:disconnect');
    });
  });

  io.engine.on('connection_error', () => {
    logger.warn('socket:connection-error');
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitToRoom(room, event, data) {
  io?.to(room).emit(event, data);
}

export default { createSocketServer, getIO, emitToRoom };
