import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleHasPermission, ROLE_HIERARCHY, roleAtLeast } from '../src/middleware/rbac.js';

test('SUPER_ADMIN has all permissions', () => {
  assert.equal(roleHasPermission('SUPER_ADMIN', 'users:delete'), true);
  assert.equal(roleHasPermission('SUPER_ADMIN', 'users:role:change'), true);
});

test('INTERN cannot manage users', () => {
  assert.equal(roleHasPermission('INTERN', 'users:create'), false);
  assert.equal(roleHasPermission('INTERN', 'users:delete'), false);
});

test('INTERN can use AI', () => {
  assert.equal(roleHasPermission('INTERN', 'ai:use'), true);
  assert.equal(roleHasPermission('INTERN', 'reports:create'), true);
});

test('ADMIN can review reports', () => {
  assert.equal(roleHasPermission('ADMIN', 'reports:review'), true);
  assert.equal(roleHasPermission('ADMIN', 'kb:verify'), true);
});

test('Role hierarchy works', () => {
  assert.equal(roleAtLeast('SUPER_ADMIN', 'ADMIN'), true);
  assert.equal(roleAtLeast('INTERN', 'ADMIN'), false);
  assert.equal(ROLE_HIERARCHY.SUPER_ADMIN > ROLE_HIERARCHY.INTERN, true);
});
