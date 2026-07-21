// ════════════════════════════════════════════════════════════
//  Notification service — DB persist + Socket.io broadcast
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { getIO } from '../sockets/index.js';
import { logger } from '../utils/logger.js';

export async function notify(userId, payload) {
  const { type, title, body, link } = payload;

  let saved;
  try {
    saved = await prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  } catch (err) {
    logger.warn({ err, userId }, 'notification:create-failed');
    return null;
  }

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

export async function notifyRole(role, payload) {
  try {
    const io = getIO();
    if (io) io.to(`role:${role}`).emit('notification', payload);
  } catch {
    /* socket layer might not be ready yet */
  }
}

export async function broadcast(payload) {
  try {
    const io = getIO();
    if (io) io.emit('broadcast', payload);
  } catch {
    /* noop */
  }
}

export default { notify, notifyMany, notifyRole, broadcast };
