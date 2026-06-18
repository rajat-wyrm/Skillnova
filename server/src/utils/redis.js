// ════════════════════════════════════════════════════════════
//  Redis (Upstash REST API) — connection-less HTTP client
//  Plus optional local ioredis for pub/sub if available.
// ════════════════════════════════════════════════════════════
import { config } from '../config/index.js';
import { logger } from './logger.js';

// ── Upstash REST helpers ──────────────────────────────────
async function upstashExec(command) {
  if (!config.redis.url || !config.redis.token) return null;
  try {
    const res = await fetch(`${config.redis.url}/${command}`, {
      headers: { Authorization: `Bearer ${config.redis.token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err) {
    logger.warn({ err }, 'redis:rest-error');
    return null;
  }
}

// Encode for URL safety
const enc = (s) => encodeURIComponent(s);

// ── Public API ────────────────────────────────────────────
export const redis = {
  async get(key) {
    return upstashExec(`get/${enc(key)}`);
  },
  async set(key, value, { ex } = {}) {
    const exParam = ex ? `?ex=${ex}` : '';
    return upstashExec(`set/${enc(key)}/${enc(value)}${exParam}`);
  },
  async del(key) {
    return upstashExec(`del/${enc(key)}`);
  },
  async exists(key) {
    return upstashExec(`exists/${enc(key)}`);
  },
  async incr(key) {
    return upstashExec(`incr/${enc(key)}`);
  },
  async expire(key, seconds) {
    return upstashExec(`expire/${enc(key)}/${seconds}`);
  },
  async ping() {
    return upstashExec('ping');
  },
};

// In-memory fallback when Redis is unavailable (dev convenience)
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
};

export async function connectRedis() {
  if (!config.redis.url) {
    logger.warn('⚠️  Redis not configured — using in-memory store');
    return;
  }
  const pong = await redis.ping();
  if (pong === 'PONG') logger.info('✅  Redis connected');
  else logger.warn('⚠️  Redis ping returned unexpected result, continuing with in-memory fallback');
}

export default redis;
