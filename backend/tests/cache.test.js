// ════════════════════════════════════════════════════════════
//  Cache utility — unit tests for the two-tier (LRU + Redis) layer
// ════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { cache } from '../src/utils/cache.js';

// Per-run unique prefix so cache state from other test files
// (shared in-memory LRU module) cannot pollute these tests.
const K = `unit-${crypto.randomBytes(4).toString('hex')}`;

test('cache.get returns null for unknown keys', async () => {
  const v = await cache.get(`${K}:missing`);
  assert.equal(v, null);
});

test('cache.set then cache.get round-trips through the L1 layer', async () => {
  await cache.set(`${K}:roundtrip`, { hello: 'world' }, 60);
  const v = await cache.get(`${K}:roundtrip`);
  assert.deepEqual(v, { hello: 'world' });
});

test('cache.del removes the key from L1', async () => {
  await cache.set(`${K}:del`, 'value', 60);
  await cache.del(`${K}:del`);
  assert.equal(await cache.get(`${K}:del`), null);
});

test('cache.wrap serves cached value without invoking fetcher', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return { n: calls };
  };
  const a = await cache.wrap(`${K}:wrap`, 60, fetcher);
  const b = await cache.wrap(`${K}:wrap`, 60, fetcher);
  assert.deepEqual(a.value, { n: 1 });
  assert.deepEqual(b.value, { n: 1 });
  assert.equal(b.hit, true);
  assert.equal(calls, 1);
});

test('cache.wrap calls fetcher on cache miss', async () => {
  const fetcher = async () => 'fresh-value';
  const r = await cache.wrap(`${K}:miss`, 60, fetcher);
  assert.equal(r.hit, false);
  assert.equal(r.value, 'fresh-value');
});

test('cache.incr increments a counter', async () => {
  const a = await cache.incr(`${K}:counter`, 60);
  const b = await cache.incr(`${K}:counter`, 60);
  const c = await cache.incr(`${K}:counter`, 60);
  assert.equal(typeof a, 'number');
  assert.ok(b > a);
  assert.ok(c > b);
});