// ════════════════════════════════════════════════════════════
//  Google OAuth Controller — start, callback, status
// ════════════════════════════════════════════════════════════
import crypto from 'node:crypto';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  signCsrf,
  COOKIE_NAMES,
} from '../utils/auth.js';
import { config } from '../config/index.js';
import { memoryStore } from '../utils/redis.js';
import { getClientIp, getUserAgent } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';
import {
  isGoogleEnabled,
  buildAuthUrl,
  exchangeCodeForProfile,
  verifyOAuthState,
} from '../services/google.service.js';

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const CSRF_COOKIE_OPTS = {
  httpOnly: false,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

function issueTokens(res, user, req) {
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    .catch((err) => logger.warn({ err }, 'google:refreshToken-save-failed'));

  // In dev, set Domain=localhost so cookies work across ports (4000 ↔ 5273)
  const domain = config.isProd ? undefined : 'localhost';
  const accessOpts = { ...ACCESS_COOKIE_OPTS, ...(domain && { domain }) };
  const refreshOpts = { ...REFRESH_COOKIE_OPTS, ...(domain && { domain }) };
  const csrfOpts = { ...CSRF_COOKIE_OPTS, ...(domain && { domain }) };

  res.cookie(COOKIE_NAMES.session, accessToken, accessOpts);
  res.cookie(COOKIE_NAMES.refresh, refreshToken, refreshOpts);
  res.cookie(COOKIE_NAMES.session + '_sid', sessionId, { ...accessOpts, httpOnly: true });
  res.cookie(COOKIE_NAMES.csrf, signCsrf(sessionId), csrfOpts);

  memoryStore.set(`session:${sessionId}`, { uid: user.id, role: user.role }, 30 * 24 * 60 * 60);
  return { accessToken, refreshToken, sessionId };
}

// ── GET /auth/google/status ─────────────────────────────
export const status = asyncHandler(async (_req, res) => {
  res.json({ enabled: isGoogleEnabled() });
});

// ── GET /auth/google?returnTo=/dashboard ────────────────
export const start = asyncHandler(async (req, res) => {
  if (!isGoogleEnabled()) throw ApiError.serviceUnavailable('Google sign-in is not enabled');
  const returnTo = req.query.returnTo || '/';
  const url = buildAuthUrl(returnTo);
  res.redirect(url);
});

// ── GET /auth/google/callback?code=...&state=... ────────
export const callback = asyncHandler(async (req, res) => {
  const { code, state, error: googleError } = req.query;

  if (googleError) {
    const errorMessages = {
      access_denied: 'Google sign-in was denied. You may have cancelled the login or need to grant the required permissions.',
      invalid_request: 'The OAuth request was malformed. Please try signing in again from the beginning.',
      server_error: 'Google temporarily experienced an error. Please wait a moment and try again.',
      temporarily_unavailable: 'Google is temporarily unavailable. Please try again in a few minutes.',
    };
    const msg = errorMessages[googleError] || `Google returned an error: ${googleError}. Please try again.`;
    return res.redirect(`${config.appUrl}/login?error=${encodeURIComponent(msg)}`);
  }
  if (!code || !state) {
    return res.redirect(`${config.appUrl}/login?error=Missing OAuth authorization code. The redirect from Google may have been incomplete. Please try signing in again.`);
  }

  // Verify state token
  let statePayload;
  try {
    statePayload = verifyOAuthState(state);
  } catch {
    return res.redirect(`${config.appUrl}/login?error=The OAuth state token is invalid or expired. This can happen if the sign-in process took too long. Please try signing in again.`);
  }

  const returnTo = statePayload.returnTo || '/';

  // Exchange code for profile
  let profile;
  try {
    profile = await exchangeCodeForProfile(code);
  } catch (err) {
    logger.error({ err }, 'google:exchange-failed');
    const exchangeMsg = err.message?.includes('invalid_grant')
      ? 'The authorization code has expired or was already used. Please try signing in again.'
      : `Failed to exchange authorization code with Google: ${err.message || 'unknown error'}. Please try again.`;
    return res.redirect(`${config.appUrl}/login?error=${encodeURIComponent(exchangeMsg)}`);
  }

  // Reject unverified emails at trust boundary
  if (!profile.emailVerified) {
    logger.warn({ email: profile.email }, 'google:email-not-verified');
    return res.redirect(`${config.appUrl}/login?error=${encodeURIComponent('Your Google email address is not verified. Please verify your email in your Google account settings and try again.')}`);
  }

  // Find user by googleId first, then by email (account linking)
  let user = await prisma.user.findFirst({
    where: { googleId: profile.googleId },
  });

  if (!user && profile.email) {
    user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
    if (user) {
      // Link googleId to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, authProvider: 'google' },
      });
    }
  }

  if (!user) {
    return res.redirect(
      `${config.appUrl}/login?error=${encodeURIComponent('No account found matching your Google email. Please sign up first or contact support if you believe this is an error.')}`
    );
  }

  // Update profile fields on login
  user = await prisma.user.update({
    where: { id: user.id },
    data: { name: profile.name, avatarUrl: profile.avatarUrl },
  });

  // Issue tokens and redirect to frontend
  issueTokens(res, user, req);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: getClientIp(req) },
  }).catch(() => {});

  await audit({ userId: user.id, action: 'auth.google.login', req });

  res.redirect(`${config.appUrl}${returnTo}`);
});
