// ════════════════════════════════════════════════════════════
//  Auth Middleware — JWT verification + CSRF + DB Sessions
// ════════════════════════════════════════════════════════════
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { verifyAccessToken, verifyCsrf, COOKIE_NAMES } from '../utils/auth.js';
import { memoryStore } from '../utils/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { lru } from '../utils/lru.js';
import prisma from '../utils/prisma.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

// ── 1. Populate req.user from JWT & DB Session ─────────────
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    let token;
    
    // Extract token from Header or Cookie
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    } else if (req.cookies && req.cookies[COOKIE_NAMES.session]) {
      token = req.cookies[COOKIE_NAMES.session];
    }

    if (!token) return next(); // public route

    // Verify token (Supports your old util or standard JWT)
    const payload = verifyAccessToken ? verifyAccessToken(token) : jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.sub && !payload?.id) return next();
    
    const userId = payload.sub || payload.id;

    // Fast check: Redis memory store (defense against revoked tokens)
    const sid = req.cookies?.[COOKIE_NAMES.session + '_sid'];
    if (sid && memoryStore.has(`session:${sid}`) === false) {
      return next();
    }

    // Deep check: Database session validation (Added from Claude)
    const dbSession = await prisma.session.findFirst({
      where: { token, isActive: true }
    });
    if (!dbSession || new Date() > dbSession.expiresAt) {
      return next(); // Session invalid or expired in DB
    }

    // Cache user-by-id for 60s — saves a DB round-trip per request
    const user = await lru.wrap(`user:${userId}`, 60, () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          department: true,
          rating: true,
          twoFactorEnabled: true,
          emailVerified: true,
        },
      })
    );

    if (!user || user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      return next();
    }

    req.user = user;
    req.sessionId = sid || dbSession.id;
    return next();
  } catch {
    return next(); // anonymous if token fails
  }
}

// ── 2. Guard Routes (Requires active user) ────────────────
export function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  next();
}

// ── 3. Role-Based Authorization (Added from Claude) ───────
export function authorize(roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Unauthorized role'));
    }
    next();
  };
}

// ── 4. CSRF protection (state-changing requests) ──────────
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.sessionId) return next();

  const headerToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    req.body?._csrf;
  const cookieToken = req.cookies?.[COOKIE_NAMES.csrf];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return next(ApiError.forbidden('Invalid or missing CSRF token'));
  }
  if (!verifyCsrf(headerToken, req.sessionId)) {
    return next(ApiError.forbidden('CSRF token mismatch'));
  }
  return next();
}

// Allow CSRF for a few special routes that lack cookies (e.g. login)
export function csrfOptional(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.sessionId) return next();
  return csrfProtection(req, res, next);
}

// ── 5. IP / Device extraction helpers ─────────────────────
export function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

// ── 6. Touch session activity ─────────────────────────────
export function trackActivity() {
  return async (req, _res, next) => {
    if (req.sessionId && req.user) {
      memoryStore.set(`session:${req.sessionId}`, { uid: req.user.id, ua: req.user.role }, SESSION_TTL);
    }
    next();
  };
}

// ── 7. Rate Limiters (Added from Claude) ──────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed login attempts, please try again later' }
});