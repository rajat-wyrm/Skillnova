// ════════════════════════════════════════════════════════════
//  Auth Controller — login (password + OTP/2FA), refresh, logout
//  Two-step flow with cookie-based session
// ════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { lru } from '../utils/lru.js';
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateOtp,
  verifyTotp,
  signCsrf,
  COOKIE_NAMES,
} from '../utils/auth.js';
import { config } from '../config/index.js';
import { memoryStore } from '../utils/redis.js';
import { getClientIp, getUserAgent } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';
import { notify } from '../services/notification.service.js';

function parseDurationToMs(val) {
  if (typeof val === 'number') return val;
  const match = String(val).match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 600000;
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

// ── Cookie options ───────────────────────────────────────
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/api/v1/auth',
  maxAge: config.security.refreshCookieMaxAge,
  domain: config.isProd ? undefined : 'localhost',
};

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: config.security.accessCookieMaxAge,
  domain: config.isProd ? undefined : 'localhost',
};

const CSRF_COOKIE_OPTS = {
  httpOnly: false,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: config.security.csrfCookieMaxAge,
  domain: config.isProd ? undefined : 'localhost',
};

// ── Helpers ──────────────────────────────────────────────
function issueTokens(res, user, req, { rememberMe = true } = {}) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const tokenPayload = { sub: user.id, role: user.role, sid: sessionId };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ sub: user.id, sid: sessionId });

  prisma.refreshToken
    .create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        device: req.headers?.['x-device-id'] ?? null,
        ip: getClientIp(req),
        userAgent: getUserAgent(req).slice(0, 250),
        expiresAt: new Date(Date.now() + config.security.refreshCookieMaxAge),
      },
    })
    .catch((err) => logger.warn({ err }, 'auth:refreshToken-save-failed'));

  res.cookie(COOKIE_NAMES.session, accessToken, ACCESS_COOKIE_OPTS);
  res.cookie(COOKIE_NAMES.refresh, refreshToken, rememberMe ? REFRESH_COOKIE_OPTS : { ...REFRESH_COOKIE_OPTS, maxAge: undefined });
  res.cookie(COOKIE_NAMES.session + '_sid', sessionId, { ...ACCESS_COOKIE_OPTS, httpOnly: true });
  res.cookie(COOKIE_NAMES.csrf, signCsrf(sessionId), CSRF_COOKIE_OPTS);

  memoryStore.set(`session:${sessionId}`, { uid: user.id, role: user.role }, config.security.refreshCookieMaxAge / 1000);
  return { accessToken, refreshToken, sessionId };
}

// Issue a SHORT-LIVED "pending auth" session so the OTP step has CSRF set up
function issuePendingSession(res, user) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  res.cookie(COOKIE_NAMES.session + '_sid', sessionId, { ...ACCESS_COOKIE_OPTS, httpOnly: true });
  res.cookie(COOKIE_NAMES.csrf, signCsrf(sessionId), CSRF_COOKIE_OPTS);
  memoryStore.set(`session:${sessionId}`, { uid: user.id, role: user.role, pending: true }, config.security.pendingSessionTtlSeconds);
  return sessionId;
}

// ── POST /auth/login ─────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.forbidden(`Account locked until ${user.lockedUntil.toISOString()}`);
  }

  if (user.status === 'SUSPENDED') throw ApiError.forbidden('Account suspended');
  if (user.status === 'INACTIVE') throw ApiError.forbidden('Account inactive');

  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) {
    const failed = user.failedAttempts + 1;
    const lockedUntil = failed >= config.security.maxFailedAttempts ? new Date(Date.now() + config.security.lockDurationMs) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: failed, lockedUntil },
    });
    await audit({ userId: user.id, action: 'auth.login.failed', ip: getClientIp(req), userAgent: getUserAgent(req), req });
    throw ApiError.unauthorized('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: getClientIp(req) },
  });

  const requireSecondFactor =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'ADMIN' ||
    user.twoFactorEnabled;

  if (requireSecondFactor) {
    // Issue a pending session (cookies + CSRF) so the next request is authenticated for the OTP step
    const sessionId = issuePendingSession(res, user);

    const code = generateOtp(6);
    await prisma.otpChallenge.create({
      data: {
        email: user.email,
        purpose: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? 'login_admin' : 'login_2fa',
        codeHash: await bcrypt.hash(code, config.security.otpHashRounds),
        expiresAt: new Date(Date.now() + parseDurationToMs(config.jwt.otpTtl)),
      },
    });

    // Sign a SHORT-LIVED challenge token (used only to identify the OTP step)
    const challengeToken = signAccessToken({
      sub: user.id,
      purpose: 'otp',
      role: user.role,
      sid: sessionId,
    });

    const responsePayload = {
      step: 'otp_required',
      challengeToken,
      sessionId,
      contactHint: user.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
    };
    if (!config.isProd) responsePayload.devCode = code;

    await audit({ userId: user.id, action: 'auth.otp.sent', req });
    return res.json(responsePayload);
  }

  const { accessToken, refreshToken } = issueTokens(res, user, req, { rememberMe });
  await audit({ userId: user.id, action: 'auth.login.success', req });
  await notify(user.id, { type: 'security', title: 'New login', body: `From ${getClientIp(req)}` });

  res.json({
    user: sanitize(user),
    accessToken,
    refreshToken,
  });
});

// ── POST /auth/verify-otp ────────────────────────────────
export const verifyOtp = asyncHandler(async (req, res) => {
  const { challengeToken, code, useTotp = false } = req.body;
  if (!challengeToken) throw ApiError.badRequest('challengeToken required');

  let payload;
  try {
    // BUG FIX: the challenge token is signed with the ACCESS secret
    payload = verifyAccessToken(challengeToken);
    if (payload.purpose !== 'otp') throw new Error('bad purpose');
  } catch {
    throw ApiError.unauthorized('Invalid or expired challenge');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('Invalid user');

  let ok = false;
  const challenges = await prisma.otpChallenge.findMany({
    where: { email: user.email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  if (useTotp && user.twoFactorSecret) {
    ok = verifyTotp(code, user.twoFactorSecret);
  } else {
    for (const c of challenges) {
      if (await bcrypt.compare(code, c.codeHash)) {
        ok = true;
        await prisma.otpChallenge.update({
          where: { id: c.id },
          data: { consumedAt: new Date() },
        });
        break;
      } else {
        await prisma.otpChallenge.update({
          where: { id: c.id },
          data: { attempts: { increment: 1 } },
        });
      }
    }
  }

  if (!ok) throw ApiError.unauthorized('Incorrect or expired code');

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: getClientIp(req) },
  });

  // Clear the pending session and issue real tokens
  if (payload.sid && payload.sid !== 'pending') {
    memoryStore.del(`session:${payload.sid}`);
  }
  const { accessToken, refreshToken } = issueTokens(res, user, req);
  await audit({ userId: user.id, action: 'auth.otp.verified', req });

  res.json({
    user: sanitize(user),
    accessToken,
    refreshToken,
  });
});

// ── POST /auth/refresh ───────────────────────────────────
const recentlyRefreshed = new Set();
const REFRESH_DEDUP_TTL = 5000;

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAMES.refresh] ?? req.body.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');

  const tokenHash = hashToken(token);
  if (recentlyRefreshed.has(tokenHash)) {
    throw ApiError.unauthorized('Refresh token already used');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token revoked or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    throw ApiError.unauthorized('User no longer active');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken: newRefresh } = issueTokens(res, user, req);
  recentlyRefreshed.add(tokenHash);
  setTimeout(() => recentlyRefreshed.delete(tokenHash), REFRESH_DEDUP_TTL);
  await audit({ userId: user.id, action: 'auth.refresh', req });

  res.json({ user: sanitize(user), accessToken, refreshToken: newRefresh });
});

// ── POST /auth/logout ────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAMES.refresh];
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken
      .updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } })
      .catch(() => {});
  }
  if (req.sessionId) memoryStore.del(`session:${req.sessionId}`);

  res.clearCookie(COOKIE_NAMES.session, { path: '/' });
  res.clearCookie(COOKIE_NAMES.refresh, { path: '/api/v1/auth' });
  res.clearCookie(COOKIE_NAMES.session + '_sid', { path: '/' });
  res.clearCookie(COOKIE_NAMES.csrf, { path: '/' });

  if (req.user) await audit({ userId: req.user.id, action: 'auth.logout', req });

  res.json({ ok: true });
});

// ── POST /auth/logout-all ────────────────────────────────
export const logoutAll = asyncHandler(async (req, res) => {
  await prisma.refreshToken.updateMany({
    where: { userId: req.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  res.json({ ok: true });
});

// ── GET /auth/me ─────────────────────────────────────────
export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const full = await lru.wrap(`user:full:${req.user.id}`, 30, () =>
    prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        internProfile: { include: { mentor: { select: { id: true, name: true, email: true } } } },
        mentorProfile: true,
      },
    })
  );
  res.json({ user: sanitize(full), permissions: derivePermissions(full.role) });
});

// ── Helpers ──────────────────────────────────────────────
function sanitize(u) {
  if (!u) return null;
  const { passwordHash: _ph, twoFactorSecret: _tfs, ...rest } = u;
  return rest;
}

import { PERMISSIONS } from '../middleware/rbac.js';
function derivePermissions(role) {
  return Object.entries(PERMISSIONS)
    .filter(([, allowed]) => allowed.includes(role))
    .map(([p]) => p);
}

export const setupTotp = asyncHandler(async (req, res) => {
  const { generateSecret } = await import('../utils/auth.js');
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
  });
  res.json({
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    message: 'Scan the QR code, then verify a code to enable 2FA.',
  });
});

export const enableTotp = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.twoFactorSecret) throw ApiError.badRequest('Start TOTP setup first');
  if (!verifyTotp(code, user.twoFactorSecret)) throw ApiError.badRequest('Invalid code');
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  await audit({ userId: req.user.id, action: 'auth.2fa.enabled', req });
  res.json({ ok: true });
});
