# Google OAuth Integration — Runbook

## Overview

Direct Google OAuth2 integration in Express (no third-party auth provider). Backend handles code exchange and JWT issuance; frontend is a pure consumer.

## Architecture

```
Browser → Google → /auth/google/callback (Express)
                    ↓ verify state + exchange code
                    ↓ fetch profile (email verified?)
                    ↓ find/link user by googleId or email
                    ↓ issue httpOnly cookies (access + refresh + CSRF)
                    → redirect to APP_URL (frontend)
```

## Setup

### Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. **Authorized JavaScript origins:** `http://localhost:4000`, `http://localhost:5273`
4. **Authorized redirect URIs:** `http://localhost:4000/api/v1/auth/google/callback`
5. Enable **People API** in the API library (required for userinfo)

### Environment Variables

```bash
# server/.env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_OAUTH_ENABLED=true
APP_URL=http://localhost:4000          # frontend origin
BACKEND_URL=http://localhost:4000      # callback origin (same in dev)
```

### Cookie Strategy (Dev)

In dev, backend and frontend may be on different ports. Cookies use `Domain=localhost` so they work across ports. In production, domain is `undefined` (exact origin).

## Account Linking

1. User clicks "Continue with Google"
2. On callback, system searches by `googleId` first
3. If not found, searches by verified email
4. If email match found, links `googleId` to existing account
5. If no match, redirects with `error=no_account_match`

## Security

- **State token:** 10-min signed JWT with `purpose: 'oauth_state'`, audience-scoped to reject access token confusion
- **Email verification:** Required from Google before accepting profile
- **Trust boundary:** `email_verified: true` checked at controller level
- **httpOnly cookies:** Session, refresh, and CSRF tokens are all httpOnly in production
- **CSRF:** Double-submit cookie pattern, stateless JWT verification

## Gotchas

1. **redirect_uri_mismatch can be misleading** — Google wraps scope errors as redirect_uri_mismatch. Ensure callback URL matches exactly.
2. **TTL bare numbers** — Config now parses `900` as 900 seconds, not the string `'900'`.
3. **hydrate() must call /auth/me** — Google login uses cookies, not localStorage. Page reload bounces back to login if hydrate only checks localStorage.
4. **Domain=localhost** — Dev cookies need this for cross-port access (4000 ↔ 5273).

## Testing

```bash
cd server && npm test
# 32/32 pass (includes 6 Google OAuth tests)
```

## Rollback

Set `GOOGLE_OAUTH_ENABLED=false` in `server/.env`. The Google button hides automatically (`/auth/google/status` returns `{ enabled: false }`). All existing password auth is unaffected.
