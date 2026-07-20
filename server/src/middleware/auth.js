// ════════════════════════════════════════════════════════════
//  Auth Middleware — JWT verification + CSRF (double submit)
// ════════════════════════════════════════════════════════════
import { verifyAccessToken, verifyCsrf, COOKIE_NAMES } from '../utils/auth.js';
import { memoryStore } from '../utils/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { lru } from '../utils/lru.js';
import prisma from '../utils/prisma.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  if (req.cookies && req.cookies[COOKIE_NAMES.session]) {
    return req.cookies[COOKIE_NAMES.session];
  }
  if (req.query?.token) {
    return req.query.token;
  }
  return null;
}

// ── Populate req.user from JWT ────────────────────────────
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    let token;
    let tokenSource;
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
      tokenSource = 'header';
    } else if (req.cookies && req.cookies[COOKIE_NAMES.session]) {
      token = req.cookies[COOKIE_NAMES.session];
      tokenSource = 'cookie';
    }
    const token = extractToken(req);

    if (!token) return next(); // public route

    const payload = verifyAccessToken(token);
    if (!payload?.sub) return next();

    // Check session is still active (defense against revoked tokens)
    const sid = payload.sid ?? req.cookies?.[COOKIE_NAMES.session + '_sid'];
    if (tokenSource === 'cookie' && sid && memoryStore.has(`session:${sid}`) === false) {
      return next();
    }

    // Cache user-by-id for 60s — saves a DB round-trip per request
    const user = await lru.wrap(`user:${payload.sub}`, 60, () =>
      prisma.user.findUnique({
        where: { id: payload.sub },
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
    req.sessionId = sid;
    return next();
  } catch {
    return next(); // anonymous
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  next();
}

// ── CSRF protection (state-changing requests) ─────────────
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

// ── IP / device extraction helpers ────────────────────────
export function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function getUserAgent(req) {
  return (req.headers['user-agent'] || 'unknown').slice(0, 250);
}

// ── Touch session activity (lightweight rate-limit per user) ──
export function trackActivity() {
  return async (req, _res, next) => {
    if (req.sessionId && req.user) {
      memoryStore.set(`session:${req.sessionId}`, { uid: req.user.id, ua: req.user.role }, SESSION_TTL);
    }
    next();
  };
}
