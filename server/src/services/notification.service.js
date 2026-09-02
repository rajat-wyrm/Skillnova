// ════════════════════════════════════════════════════════════
//  Notification service — DB persist + Socket.io broadcast
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { getIO } from '../sockets/index.js';

export async function notify(userId, payload) {
  const { type, title, body, link } = payload;

  const saved = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  try {
    const io = getIO();
    if (io) io.to(`user:${userId}`).emit('notification', saved);
  } catch {
    /* socket layer might not be ready yet */
  }

  return saved;
}

export async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map((id) => notify(id, payload)));
}

export async function broadcast(payload) {
  try {
    const io = getIO();
    if (io) io.emit('broadcast', payload);
  } catch {
    /* noop */
  }
}

export default { notify, notifyMany, broadcast };
