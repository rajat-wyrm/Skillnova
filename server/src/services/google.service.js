// ════════════════════════════════════════════════════════════
//  Google OAuth Service — build URL, exchange code, fetch profile
// ════════════════════════════════════════════════════════════
import { config } from '../config/index.js';
import { signOAuthState, verifyOAuthState } from '../utils/auth.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const SCOPES = ['openid', 'profile', 'email'];

export function isGoogleEnabled() {
  return config.google.enabled && config.google.clientId && config.google.clientSecret;
}

export function buildAuthUrl(returnTo = '/') {
  const state = signOAuthState(returnTo);
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: SCOPES.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForProfile(code) {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
  }

  const profileRes = await fetch(GOOGLE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.id) {
    throw new Error('Failed to fetch Google profile');
  }

  return {
    googleId: profile.id,
    email: profile.email || null,
    emailVerified: profile.email_verified || false,
    name: profile.name || profile.given_name || 'Google User',
    avatarUrl: profile.picture || null,
  };
}

export { verifyOAuthState };
