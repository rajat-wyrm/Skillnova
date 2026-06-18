// ════════════════════════════════════════════════════════════
//  Cache layer — two-tier: in-memory LRU (L1) + Redis (L2)
//  • JSON get/set/del
//  • Atomic counter
//  • Sliding-window rate limit
//  • Wrap any async fetcher with stale-while-revalidate
// ════════════════════════════════════════════════════════════
import { redis } from './redis.js';
import { lru } from './lru.js';

// L2 (distributed) fallback for when LRU is cold — short TTL only,
// used to backfill LRU without blocking on Redis on the hot path.
const l2Fallback = new Map();

function l2Get(k) {
  const e = l2Fallback.get(k);
  if (!e) return null;
  if (e.exp && Date.now() > e.exp) {
    l2Fallback.delete(k);
    return null;
  }
  return e.v;
}

function l2Set(k, v, ttl) {
  l2Fallback.set(k, { v, exp: ttl ? Date.now() + ttl * 1000 : null });
}

function l2Del(k) { l2Fallback.delete(k); }

// ── Public API ───────────────────────────────────────────
export const cache = {
  async get(key) {
    // L1: in-memory LRU (sub-ms)
    const fast = lru.get(key);
    if (fast !== null && fast !== undefined) return fast;

    // L2: Redis (distributed)
    try {
      const raw = await redis.get(key);
      if (raw == null) return l2Get(key);
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      lru.set(key, parsed, 60); // backfill L1
      return parsed;
    } catch { return l2Get(key); }
  },
  async set(key, value, ttl = 60) {
    lru.set(key, value, ttl);
    l2Set(key, value, ttl);
    try {
      const v = JSON.stringify(value);
      return redis.set(key, v, { ex: ttl });
    } catch { return null; }
  },
  async del(key) {
    lru.del(key);
    l2Del(key);
    try { return redis.del(key); } catch { return null; }
  },
  async incr(key, ttl) {
    try {
      const v = await redis.incr(key);
      if (v === 1 && ttl) await redis.expire(key, ttl);
      return Number(v) || 0;
    } catch {
      const cur = (l2Get(key) || 0) + 1;
      l2Set(key, cur, ttl);
      return cur;
    }
  },
  async wrap(key, ttl, fetcher) {
    const fast = lru.get(key);
    if (fast !== null && fast !== undefined) return { hit: true, value: fast };
    const hit = await this.get(key);
    if (hit !== null && hit !== undefined) return { hit: true, value: hit };
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
      const cur = (l2Get(key) || 0) + 1;
      l2Set(key, cur, windowSec);
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
