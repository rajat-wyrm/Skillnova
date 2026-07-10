// ════════════════════════════════════════════════════════════
//  Socket.io client with auth + auto-reconnect
// ════════════════════════════════════════════════════════════
import { io } from 'socket.io-client';
import { APP_CONSTANTS } from '../shared/config/constants';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io('/', {
    transports: ['websocket', 'polling'],
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: APP_CONSTANTS.SOCKET_RECONNECT_DELAY,
    reconnectionDelayMax: APP_CONSTANTS.SOCKET_RECONNECT_DELAY_MAX,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.info('[socket] connected', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.warn('[socket] disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
