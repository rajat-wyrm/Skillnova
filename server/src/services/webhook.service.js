// ════════════════════════════════════════════════════════════
//  Webhook service — HMAC-signed delivery with retries
// ════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

const MAX_ATTEMPTS = 5;
const TIMEOUT_MS = 10_000;

export async function fireWebhook(event, payload) {
  try {
    const hooks = await prisma.webhook.findMany({
      where: { enabled: true, events: { has: event } },
    });
    await Promise.all(hooks.map((h) => deliver(h, event, payload)));
  } catch (err) {
    logger.warn({ err: err.message, event }, 'webhook:list-failed');
  }
}

async function deliver(hook, event, payload, attempt = 1) {
  const body = JSON.stringify({ event, data: payload, ts: Date.now() });
  const sig = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
  const start = Date.now();
  let status = 0;
  let response = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SkillNova-Event': event,
        'X-SkillNova-Signature': `sha256=${sig}`,
        'X-SkillNova-Delivery': crypto.randomBytes(8).toString('hex'),
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    status = res.status;
    response = (await res.text()).slice(0, 500);
    if (status >= 200 && status < 300) {
      await prisma.webhook.update({
        where: { id: hook.id },
        data: { lastFiredAt: new Date(), lastStatus: status, failureCount: 0 },
      });
    } else {
      throw new Error(`HTTP ${status}`);
    }
  } catch (err) {
    response = String(err.message || err).slice(0, 500);
    if (attempt < MAX_ATTEMPTS) {
      const backoff = Math.min(2 ** attempt, 60) * 1000;
      setTimeout(() => deliver(hook, event, payload, attempt + 1).catch(() => null), backoff).unref();
    } else {
      await prisma.webhook.update({
        where: { id: hook.id },
        data: { lastFiredAt: new Date(), lastStatus: status, failureCount: { increment: 1 } },
      });
    }
  } finally {
    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: hook.id,
          event,
          payload,
          status,
          response,
          durationMs: Date.now() - start,
          attempts: attempt,
        },
      });
    } catch { /* ignore */ }
  }
}

export function verifySignature(rawBody, headerSig, secret) {
  if (!headerSig || !headerSig.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(headerSig.slice(7)), Buffer.from(expected));
  } catch { return false; }
}

export default { fireWebhook, verifySignature };
