// ════════════════════════════════════════════════════════════
//  Socket.io — Authenticated realtime channel
//  Rooms: user:<id>, role:<role>, broadcast
// ════════════════════════════════════════════════════════════
import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/auth.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let io = null;

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
    const { sub, role } = socket.data.user || {};
    if (sub) {
      socket.join(`user:${sub}`);
      socket.join(`role:${role}`);
      logger.info({ sub, role, sid: socket.id }, 'socket:connected');
    }

    socket.on('ping', (cb) => cb?.('pong'));

    socket.on('disconnect', (reason) => {
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

export default { createSocketServer, getIO };
