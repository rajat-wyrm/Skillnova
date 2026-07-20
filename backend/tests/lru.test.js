// ════════════════════════════════════════════════════════════
//  LRU utility — unit tests
// ════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lru } from '../src/utils/lru.js';

test('lru.set and lru.get return the stored value', () => {
  lru.set('k1', { a: 1 }, 60);
  assert.deepEqual(lru.get('k1'), { a: 1 });
});

test('lru.has returns false for unknown keys', () => {
  assert.equal(lru.has('does-not-exist'), false);
});

test('lru.has returns true for stored keys within TTL', () => {
  lru.set('present', 42, 60);
  assert.equal(lru.has('present'), true);
});

test('lru.del removes the entry', () => {
  lru.set('temp', 'value', 60);
  lru.del('temp');
  assert.equal(lru.has('temp'), false);
});

test('expired entries are evicted on read', async () => {
  lru.set('short', 'v', 1);
  await new Promise((r) => setTimeout(r, 1100));
  assert.equal(lru.get('short'), null);
  assert.equal(lru.has('short'), false);
});

test('wrap() calls the fetcher on cache miss', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return 'fresh';
  };
  const v = await lru.wrap('wrap:miss', 60, fetcher);
  assert.equal(v, 'fresh');
  assert.equal(calls, 1);
});

test('wrap() serves from cache without re-invoking the fetcher', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return 'cached-value';
  };
  await lru.wrap('wrap:hit', 60, fetcher);
  const v = await lru.wrap('wrap:hit', 60, fetcher);
  assert.equal(v, 'cached-value');
  assert.equal(calls, 1);
});

test('wrap() coalesces concurrent requests for the same key', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 30));
    return 'coalesced';
  };
  const [a, b, c] = await Promise.all([
    lru.wrap('wrap:coalesce', 60, fetcher),
    lru.wrap('wrap:coalesce', 60, fetcher),
    lru.wrap('wrap:coalesce', 60, fetcher),
  ]);
  assert.equal(a, 'coalesced');
  assert.equal(b, 'coalesced');
  assert.equal(c, 'coalesced');
  assert.equal(calls, 1, 'fetcher should only run once for concurrent calls');
});

test('wrap() allows a new fetch after TTL expires', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return `v${calls}`;
  };
  const v1 = await lru.wrap('wrap:expiry', 1, fetcher);
  assert.equal(v1, 'v1');
  await new Promise((r) => setTimeout(r, 1100));
  const v2 = await lru.wrap('wrap:expiry', 1, fetcher);
  assert.equal(v2, 'v2');
  assert.equal(calls, 2);
});