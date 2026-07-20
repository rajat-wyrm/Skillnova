// ════════════════════════════════════════════════════════════
//  Streak service — unit tests
// ════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEffectiveStreak, getUtcMidnight } from '../src/services/streak.service.js';

test('getEffectiveStreak returns 0 for null/undefined user or activity', () => {
  assert.equal(getEffectiveStreak(null), 0);
  assert.equal(getEffectiveStreak({}), 0);
  assert.equal(getEffectiveStreak({ currentStreak: 5 }), 0);
});

test('getEffectiveStreak returns currentStreak when last activity is today', () => {
  const today = new Date();
  const user = {
    currentStreak: 4,
    lastActivityAt: today,
  };
  assert.equal(getEffectiveStreak(user), 4);
});

test('getEffectiveStreak returns currentStreak when last activity was yesterday', () => {
  const today = getUtcMidnight();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const user = {
    currentStreak: 7,
    lastActivityAt: yesterday,
  };
  assert.equal(getEffectiveStreak(user), 7);
});

test('getEffectiveStreak returns 0 when last activity is older than yesterday', () => {
  const today = getUtcMidnight();
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
  const user = {
    currentStreak: 12,
    lastActivityAt: twoDaysAgo,
  };
  assert.equal(getEffectiveStreak(user), 0);
});

test('getUtcMidnight normalizes date to UTC midnight', () => {
  const date = new Date('2026-07-14T13:36:12Z');
  const normalized = getUtcMidnight(date);
  assert.equal(normalized.getUTCHours(), 0);
  assert.equal(normalized.getUTCMinutes(), 0);
  assert.equal(normalized.getUTCSeconds(), 0);
  assert.equal(normalized.getUTCMilliseconds(), 0);
  assert.equal(normalized.getUTCDate(), 14);
  assert.equal(normalized.getUTCMonth(), 6); // July (0-indexed)
  assert.equal(normalized.getUTCFullYear(), 2026);
});
