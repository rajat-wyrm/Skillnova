// ════════════════════════════════════════════════════════════
//  Google OAuth — unit tests for state token + helpers
// ════════════════════════════════════════════════════════════
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-1234567890abcdef';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-1234567890abcdef';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret-1234567890abcdef';

const { signOAuthState, verifyOAuthState } = await import('../src/utils/auth.js');
const { isGoogleEnabled } = await import('../src/services/google.service.js');

describe('OAuth State Token', () => {
  it('round-trips with default returnTo', () => {
    const token = signOAuthState();
    const payload = verifyOAuthState(token);
    assert.equal(payload.returnTo, '/');
    assert.equal(payload.purpose, 'oauth_state');
  });

  it('round-trips with custom returnTo', () => {
    const token = signOAuthState('/dashboard');
    const payload = verifyOAuthState(token);
    assert.equal(payload.returnTo, '/dashboard');
  });

  it('rejects tampered token', () => {
    const token = signOAuthState('/dashboard');
    const tampered = token.slice(0, -5) + 'XXXXX';
    assert.throws(() => verifyOAuthState(tampered));
  });

  it('rejects garbage input', () => {
    assert.throws(() => verifyOAuthState('not-a-jwt'));
  });

  it('rejects empty string', () => {
    assert.throws(() => verifyOAuthState(''));
  });
});

describe('Google Auth Service', () => {
  it('isGoogleEnabled returns boolean', () => {
    const result = isGoogleEnabled();
    assert.equal(typeof result, 'boolean');
    assert.equal(result, false); // no creds in test env
  });
});
