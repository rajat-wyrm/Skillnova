import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// In-memory buffer for high-frequency heartbeats
// Key: sessionId, Value: { duration: number, lastPing: number }
const activeSessions = new Map();

// Flush to DB every 60 seconds
setInterval(async () => {
  if (activeSessions.size === 0) return;
  const entries = Array.from(activeSessions.entries());
  activeSessions.clear();

  try {
    // Bulk update durations
    for (const [sessionId, data] of entries) {
      await prisma.userSession.updateMany({
        where: { id: sessionId },
        data: {
          durationSeconds: { increment: data.duration },
          lastActive: new Date(data.lastPing)
        }
      });
    }
  } catch (err) {
    logger.error({ err }, 'telemetry:flush-error');
  }
}, 60000);

export const heartbeat = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw ApiError.badRequest('Missing sessionId');

  const now = Date.now();
  const sessionData = activeSessions.get(sessionId) || { duration: 0, lastPing: now };

  // Assume 30s heartbeat interval, add ~30s if reasonable
  let elapsed = Math.floor((now - sessionData.lastPing) / 1000);
  if (elapsed <= 0 || elapsed > 60) {
      elapsed = 30; // fallback default ping interval
  }
  
  sessionData.duration += elapsed;
  sessionData.lastPing = now;
  
  activeSessions.set(sessionId, sessionData);

  res.json({ ok: true });
});

export const pageEvent = asyncHandler(async (req, res) => {
  const { sessionId, route, pageTitle, enteredAt, exitedAt, timeSpentSeconds, actionsPerformed } = req.body;
  if (!sessionId) throw ApiError.badRequest('Missing sessionId');

  await prisma.pageActivity.create({
    data: {
      sessionId,
      userId: req.user.id,
      route,
      pageTitle,
      enteredAt: new Date(enteredAt || Date.now()),
      exitedAt: exitedAt ? new Date(exitedAt) : undefined,
      timeSpentSeconds: timeSpentSeconds || 0,
      actionsPerformed: actionsPerformed || {}
    }
  });

  res.json({ ok: true });
});

export const endSession = asyncHandler(async (req, res) => {
  const { sessionId, exitType } = req.body;
  if (!sessionId) throw ApiError.badRequest('Missing sessionId');

  // Flush any pending duration
  const pending = activeSessions.get(sessionId);
  let durationIncrement = 0;
  if (pending) {
    let elapsed = Math.floor((Date.now() - pending.lastPing) / 1000);
    if (elapsed < 0 || elapsed > 60) elapsed = 30;
    durationIncrement = pending.duration + elapsed;
    activeSessions.delete(sessionId);
  }

  await prisma.userSession.updateMany({
    where: { id: sessionId },
    data: {
      logoutAt: new Date(),
      exitType: exitType || 'EXPLICIT_LOGOUT',
      durationSeconds: { increment: durationIncrement }
    }
  });

  res.json({ ok: true });
});

export default { heartbeat, pageEvent, endSession };
