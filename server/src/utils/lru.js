// ════════════════════════════════════════════════════════════
//  LRU cache with TTL — for hot in-memory data (analytics, KB, etc.)
// ════════════════════════════════════════════════════════════

const store = new Map();
const inflight = new Map();

function memGet(k) {
  const e = store.get(k);
  if (!e) return null;
  if (e.exp && Date.now() > e.exp) { store.delete(k); return null; }
  return e.v;
}

function memSet(k, v, ttl) {
  // Simple LRU-ish: cap at 2000 entries
  if (store.size > 2000) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  store.set(k, { v, exp: ttl ? Date.now() + ttl * 1000 : null });
}

export const lru = {
  get: memGet,
  set: memSet,
  del: (k) => store.delete(k),
  has: (k) => memGet(k) != null,
  size: () => store.size,
  // Wrap a fetcher with request coalescing + cache
  async wrap(key, ttlSec, fetcher) {
    if (inflight.has(key)) return inflight.get(key);
    const hit = memGet(key);
    if (hit !== null) return hit;
    const p = (async () => {
      try {
        const fresh = await fetcher();
        memSet(key, fresh, ttlSec);
        return fresh;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, p);
    return p;
  },
};

export default lru;
