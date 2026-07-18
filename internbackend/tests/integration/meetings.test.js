const supertest = require('supertest');
const app = require('../../src/app');

let csrfToken, accessToken, meetingId;

beforeAll(async () => {
  await app.ready();
  const csrfRes = await app.inject({ method: 'GET', url: '/api/auth/csrf-token' });
  csrfToken = JSON.parse(csrfRes.body).csrfToken;
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
    payload: { email: 'admin@internops.com', password: 'Admin@123' },
  });
  accessToken = JSON.parse(loginRes.body).accessToken;
});

afterAll(async () => {
  await app.close();
});

function authHeaders() {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  };
}

describe('Meetings Integration Tests', () => {

  describe('POST /api/meetings', () => {
    it('should create a new meeting', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/meetings',
        headers: authHeaders(),
        payload: {
          title: 'Test Meeting',
          description: 'Discussion',
          meetingDate: '2026-12-01',
          startTime: '10:00',
          endTime: '11:00',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      meetingId = body.id || body.meeting?.id || body.data?.id;
      expect(meetingId).toBeDefined();
    });

    it('should reject meeting without title', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/meetings',
        headers: authHeaders(),
        payload: { meetingDate: '2026-12-01' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/meetings', () => {
    it('should list meetings', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/meetings',
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should get meeting by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/meetings/${meetingId}`,
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.id).toBe(meetingId);
    });

    it('should return 404 for non-existent meeting', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/meetings/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/meetings/:id', () => {
    it('should update meeting title', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/meetings/${meetingId}`,
        headers: authHeaders(),
        payload: { title: 'Updated Meeting' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.title).toBe('Updated Meeting');
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should delete meeting', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/meetings/${meetingId}`,
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for already deleted meeting', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/meetings/${meetingId}`,
        headers: authHeaders(),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});