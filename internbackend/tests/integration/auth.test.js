const supertest = require('supertest');
const app = require('../../src/app');

let csrfToken, accessToken, refreshToken;

beforeAll(async () => {
  await app.ready();
  // Get CSRF token
  const csrfRes = await app.inject({ method: 'GET', url: '/api/auth/csrf-token' });
  csrfToken = JSON.parse(csrfRes.body).csrfToken;
});

afterAll(async () => {
  await app.close();
});

describe('Auth Integration Tests', () => {

  // ---------- Login Tests ----------
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { email: 'admin@internops.com', password: 'Admin@123' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      accessToken = body.accessToken;
      refreshToken = body.refreshToken;
    });

    it('should reject invalid password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { email: 'admin@internops.com', password: 'wrong' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject missing email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { password: 'Admin@123' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('should reject non-existent user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { email: 'ghost@test.com', password: 'Test@123' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ---------- Refresh Token Tests ----------
  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.accessToken).toBeDefined();
    });

    it('should reject reuse of old refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { refreshToken: 'invalid.token.here' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ---------- Logout Test ----------
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ---------- Protected Route Tests ----------
  describe('Protected Routes', () => {
    it('should access GET /api/users/me with valid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/me',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-CSRF-Token': csrfToken },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.email).toBe('admin@internops.com');
    });

    it('should reject request without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/users/me' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject request with tampered token', async () => {
      const tampered = accessToken.slice(0, -5) + 'xxxxx';
      const res = await app.inject({
        method: 'GET',
        url: '/api/users/me',
        headers: { Authorization: `Bearer ${tampered}`, 'X-CSRF-Token': csrfToken },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ---------- CSRF Protection Tests ----------
  describe('CSRF Protection', () => {
    it('should reject POST without CSRF token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/departments',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        payload: { name: 'Test' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('should allow POST with CSRF token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/departments',
        headers: { Authorization: `Bearer ${accessToken}`, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { name: 'TestDept_' + Date.now() },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ---------- Password Reset Tests ----------
  describe('Password Reset Flow', () => {
    it('should accept forgot-password request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { email: 'admin@internops.com' },
      });
      expect(res.statusCode).toBe(200);
    });

    it('should reject reset with invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
        payload: { token: 'invalid', newPassword: 'ValidPass123!' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});