import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/ApiError.js';

test('ApiError carries status + message', () => {
  const e = ApiError.badRequest('missing field');
  assert.equal(e.status, 400);
  assert.equal(e.message, 'missing field');
  assert.equal(e.name, 'ApiError');
});

test('ApiError static helpers', () => {
  assert.equal(ApiError.unauthorized().status, 401);
  assert.equal(ApiError.forbidden().status, 403);
  assert.equal(ApiError.notFound().status, 404);
  assert.equal(ApiError.conflict().status, 409);
  assert.equal(ApiError.rateLimit().status, 429);
  assert.equal(ApiError.internal().status, 500);
});
