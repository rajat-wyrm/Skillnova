// ════════════════════════════════════════════════════════════
//  Auth Utilities — JWT, password hashing, OTP generation
// ════════════════════════════════════════════════════════════
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import { config } from '../config/index.js';

const ALGO = 'HS256';

export const hashPassword = (plain) => bcrypt.hashSync(plain, 12);
export const verifyPassword = (plain, hash) => bcrypt.compareSync(plain, hash);

export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
    algorithm: ALGO,
    issuer: 'skillnova',
    audience: 'skillnova.api',
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
    algorithm: ALGO,
    issuer: 'skillnova',
    audience: 'skillnova.api',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, {
    algorithms: [ALGO],
    issuer: 'skillnova',
    audience: 'skillnova.api',
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: [ALGO],
    issuer: 'skillnova',
    audience: 'skillnova.api',
  });
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── OTP / 2FA helpers ─────────────────────────────────────
export function generateOtp(length = 6) {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

export function generateSecret() {
  return speakeasy.generateSecret({ name: 'SkillNova', length: 32 });
}

export function verifyTotp(token, secret) {
  return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
}

// ── CSRF token (double submit cookie pattern, stateless) ──
export function signCsrf(sessionId) {
  return jwt.sign({ sid: sessionId, nonce: crypto.randomBytes(8).toString('hex') }, config.csrf.secret, {
    expiresIn: '1d',
    algorithm: ALGO,
  });
}

export function verifyCsrf(token, sessionId) {
  try {
    const payload = jwt.verify(token, config.csrf.secret, { algorithms: [ALGO] });
    return payload.sid === sessionId;
  } catch {
    return false;
  }
}

// ── Random helpers ─────────────────────────────────────────
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// ── OAuth state token (10-min, purpose-scoped, rejects access tokens) ──
export function signOAuthState(returnTo = '/') {
  return jwt.sign({ purpose: 'oauth_state', returnTo }, config.jwt.accessSecret, {
    expiresIn: '10m',
    algorithm: ALGO,
    issuer: 'skillnova',
    audience: 'skillnova.oauth',
  });
}

export function verifyOAuthState(token) {
  const payload = jwt.verify(token, config.jwt.accessSecret, {
    algorithms: [ALGO],
    issuer: 'skillnova',
    audience: 'skillnova.oauth',
  });
  if (payload.purpose !== 'oauth_state') throw new Error('Not an OAuth state token');
  return payload;
}

export const COOKIE_NAMES = {
  refresh: 'sn_refresh',
  csrf: 'sn_csrf',
  session: 'sn_sid',
};

export const isProd = config.isProd;
