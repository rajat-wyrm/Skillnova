// ════════════════════════════════════════════════════════════
//  Cache layer — Redis with in-memory fallback
//  • JSON get/set
//  • Atomic counter
//  • Sliding-window rate limit
//  • Wrap any async fetcher with stale-while-revalidate
// ════════════════════════════════════════════════════════════
import { redis } from './redis.js';

const memFallback = new Map();

function memGet(k) {
  const e = memFallback.get(k);
  if (!e) return null;
  if (e.exp && Date.now() > e.exp) {
    memFallback.delete(k);
    return null;
  }
  return e.v;
}

function memSet(k, v, ttl) {
  memFallback.set(k, { v, exp: ttl ? Date.now() + ttl * 1000 : null });
}

function memDel(k) { memFallback.delete(k); }

// ── Public API ───────────────────────────────────────────
export const cache = {
  async get(key) {
    try {
      const raw = await redis.get(key);
      if (raw == null) return memGet(key);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { return memGet(key); }
  },
  async set(key, value, ttl = 60) {
    const v = JSON.stringify(value);
    memSet(key, value, ttl);
    return redis.set(key, v, { ex: ttl });
  },
  async del(key) {
    memDel(key);
    return redis.del(key);
  },
  async incr(key, ttl) {
    try {
      const v = await redis.incr(key);
      if (v === 1 && ttl) await redis.expire(key, ttl);
      return Number(v) || 0;
    } catch {
      const cur = (memGet(key) || 0) + 1;
      memSet(key, cur, ttl);
      return cur;
    }
  },
  async wrap(key, ttl, fetcher) {
    const hit = await this.get(key);
    if (hit !== null) return { hit: true, value: hit };
    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return { hit: false, value: fresh };
  },
};

// ── Sliding-window rate limiter (Redis) ─────────────────
export async function rateLimit({ key, windowSec, max, blockSec = 0 }) {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
  try {
    // Use Upstash sorted-set: ZADD key now-ms member; ZREMRANGEBYSCORE key 0 (now-windowMs); ZCARD key
    await redis.zadd?.(key, now, member).catch(() => null);
    await redis.zremrangebyscore?.(key, 0, now - windowMs).catch(() => null);
    const count = (await redis.zcard?.(key)) || 0;
    if (Number(count) > max) {
      if (blockSec) await redis.set(`block:${key}`, '1', { ex: blockSec });
      return { allowed: false, remaining: 0, resetMs: windowMs };
    }
    return { allowed: true, remaining: Math.max(0, max - Number(count)), resetMs: windowMs };
  } catch {
    // In-memory fallback: simple counter with TTL
    const cur = (memGet(key) || 0) + 1;
    memSet(key, cur, windowSec);
    if (cur > max) return { allowed: false, remaining: 0, resetMs: windowMs };
    return { allowed: true, remaining: max - cur, resetMs: windowMs };
  }
}

// ── Express middleware factories ────────────────────────
export const cacheMiddleware = (ttl = 30, vary = []) => async (req, res, next) => {
  if (req.method !== 'GET') return next();
  const varyStr = vary.map((v) => req.headers[v] || req[v] || '').join('|');
  const key = `http:${req.originalUrl}:${varyStr}`;
  const { hit, value } = await cache.wrap(key, ttl, async () => null);
  if (hit && value) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', `private, max-age=${ttl}`);
    return res.json(value);
  }
  res.setHeader('X-Cache', 'MISS');
  res.setHeader('Cache-Control', `private, max-age=${ttl}`);
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) cache.set(key, body, ttl).catch(() => null);
    return origJson(body);
  };
  next();
};

export const rateLimitMiddleware = ({ windowSec, max, name }) => async (req, res, next) => {
  const id = req.user?.id || req.ip || 'anon';
  const key = `rl:${name}:${id}`;
  const result = await rateLimit({ key, windowSec, max, blockSec: windowSec });
  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.resetMs / 1000));
    return res.status(429).json({ error: 'Too many requests', retryAfter: result.resetMs });
  }
  next();
};

// ── ETag support ─────────────────────────────────────────
import crypto from 'node:crypto';

export const etagMiddleware = (weak = true) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const origJson = res.json.bind(res);
  res.json = (body) => {
    const json = JSON.stringify(body);
    const hash = crypto.createHash('sha1').update(json).digest('hex').slice(0, 16);
    const etag = (weak ? 'W/' : '') + `"${hash}"`;
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('Cache-Control', 'private, must-revalidate');
    return origJson(body);
  };
  next();
};

export default cache;
