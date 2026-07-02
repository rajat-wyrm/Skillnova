// ════════════════════════════════════════════════════════════
//  Redis (Upstash REST) — full helper set
//  Upstash supports: GET, SET, DEL, EXISTS, INCR, EXPIRE, PING
//  via REST. We add ZSET ops for the rate-limiter.
// ════════════════════════════════════════════════════════════
import { config } from '../config/index.js';
import { logger } from './logger.js';

async function upstashExec(command) {
  if (!config.redis.url || !config.redis.token) return null;
  try {
    const res = await fetch(`${config.redis.url}/${command}`, {
      headers: { Authorization: `Bearer ${config.redis.token}` },
    });
    if (!res.ok) {
      logger.warn({ status: res.status, cmd: command.slice(0, 40) }, 'redis:rest-fail');
      return null;
    }
    const data = await res.json();
    return data.result;
  } catch (err) {
    logger.warn({ err: err.message }, 'redis:rest-error');
    return null;
  }
}

const enc = (s) => encodeURIComponent(s);

export const redis = {
  async get(key) { return upstashExec(`get/${enc(key)}`); },
  async set(key, value, { ex } = {}) {
    const exParam = ex ? `?ex=${ex}` : '';
    return upstashExec(`set/${enc(key)}/${enc(value)}${exParam}`);
  },
  async del(key) { return upstashExec(`del/${enc(key)}`); },
  async exists(key) { return upstashExec(`exists/${enc(key)}`); },
  async incr(key) { return upstashExec(`incr/${enc(key)}`); },
  async expire(key, seconds) { return upstashExec(`expire/${enc(key)}/${seconds}`); },
  async ping() { return upstashExec('ping'); },
  // ZSET operations for sliding-window rate limit
  async zadd(key, score, member) { return upstashExec(`zadd/${enc(key)}/${score}/${enc(member)}`); },
  async zcard(key) { return upstashExec(`zcard/${enc(key)}`); },
  async zremrangebyscore(key, min, max) { return upstashExec(`zremrangebyscore/${enc(key)}/${min}/${max}`); },
};

// In-memory fallback
const memStore = new Map();
export const memoryStore = {
  get: (k) => memStore.get(k),
  set: (k, v, ttl) => {
    memStore.set(k, { v, exp: ttl ? Date.now() + ttl * 1000 : null });
  },
  del: (k) => memStore.delete(k),
  has: (k) => {
    const e = memStore.get(k);
    if (!e) return false;
    if (e.exp && Date.now() > e.exp) {
      memStore.delete(k);
      return false;
    }
    return true;
  },
  getValid(k) {
    if (!this.has(k)) return null;
    return memStore.get(k).v;
  },
  // In-memory ZSET for rate-limit fallback
  zset: new Map(),
  zadd(key, score, member, ttl = 60) {
    if (!this.zset.has(key)) this.zset.set(key, []);
    this.zset.get(key).push({ score, member });
    setTimeout(() => {
      const arr = this.zset.get(key);
      if (!arr) return;
      const filtered = arr.filter((e) => e.score > Date.now() - ttl * 1000);
      this.zset.set(key, filtered);
    }, ttl * 1000);
  },
  zcard(key) {
    return (this.zset.get(key) || []).length;
  },
};

export async function connectRedis() {
  if (!config.redis.url) {
    logger.warn('Redis not configured (UPSTASH_REDIS_REST_URL not set) — using in-memory store. Data will NOT persist across restarts.');
    return;
  }
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      logger.info('Redis connected');
      return;
    }
    logger.warn({ attempt }, 'redis:ping-failed — retrying');
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  logger.warn('Redis unreachable after max retries — using in-memory fallback. Data will NOT persist across restarts.');
}

export default redis;
