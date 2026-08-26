import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  generateOtp,
  hashToken,
  signCsrf,
  verifyCsrf,
} from '../src/utils/auth.js';

test('hashPassword + verifyPassword round trip', () => {
  const h = hashPassword('hello world 123');
  assert.equal(verifyPassword('hello world 123', h), true);
  assert.equal(verifyPassword('wrong', h), false);
});

test('OTP has expected length', () => {
  assert.equal(generateOtp().length, 6);
  assert.equal(generateOtp(8).length, 8);
});

test('hashToken is deterministic', () => {
  assert.equal(hashToken('abc'), hashToken('abc'));
  assert.notEqual(hashToken('abc'), hashToken('abd'));
});

test('CSRF round trip with matching sessionId', () => {
  const sid = 'session-123';
  const t = signCsrf(sid);
  assert.equal(verifyCsrf(t, sid), true);
  assert.equal(verifyCsrf(t, 'other'), false);
});
