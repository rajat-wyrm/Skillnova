import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveOtpMode } from '../src/utils/authFlow.js';

test('returns admin flow for admin and super admin roles', () => {
  assert.equal(resolveOtpMode('ADMIN'), 'admin');
  assert.equal(resolveOtpMode('SUPER_ADMIN'), 'admin');
});

test('returns user flow for intern and mentor roles', () => {
  assert.equal(resolveOtpMode('INTERN'), 'user');
  assert.equal(resolveOtpMode('MENTOR'), 'user');
});
