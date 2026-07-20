// ════════════════════════════════════════════════════════════
//  Audit Logging service
// ════════════════════════════════════════════════════════════
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../sockets/index.js';

export async function audit({
  userId,
  action,
  resource,
  resourceId,
  meta,
  ip,
  userAgent,
  req,
}) {
  try {
    if (req) {
      ip = ip ?? req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ?? req.ip;
      userAgent = userAgent ?? req.headers?.['user-agent'];
    }
    const [actionCategory] = action.split('.');
    const entry = await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        resource,
        resourceId,
        meta: meta ?? undefined,
        ip,
        userAgent,
      },
    });
    getIO()?.to('role:SUPER_ADMIN').to('role:ADMIN').emit('audit:new', entry);
  } catch (err) {
    logger.warn({ err, action }, 'audit:log-failed');
  }
}

export default audit;
