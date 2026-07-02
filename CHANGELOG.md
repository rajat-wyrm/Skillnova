# Changelog

## [2.1.0] - 2026-07-02

### Added
- Google OAuth2 integration (direct, no third-party provider)
- `googleId`, `authProvider` fields on User model (Prisma)
- `passwordHash` now nullable for Google-only accounts
- `GET /auth/google/status` — check if Google sign-in is enabled
- `GET /auth/google` — redirect to Google consent screen
- `GET /auth/google/callback` — OAuth callback with account linking
- `signOAuthState()` / `verifyOAuthState()` — 10-min purpose-scoped JWT
- `ApiError.serviceUnavailable()` (503) for disabled services
- AuthCallback.jsx — post-Google redirect landing page
- Google sign-in button on Login.jsx with G mark SVG
- URL `?error=` param decoding on login page
- `Domain=localhost` cookie strategy for dev cross-port access
- Google OAuth unit tests (6 tests)
- HLD and LLD documentation
- Google OAuth runbook (`docs/GOOGLE_OAUTH.md`)

### Fixed
- `hydrate()` now calls `/auth/me` first — cookie-based auth survives page reload
- TTL config now parses bare numbers as seconds (not string literals)
- `/auth/callback` routed before AuthGate to prevent login flash

### Security
- State token is audience-scoped (`skillnova.oauth`) to reject access token confusion
- `email_verified: true` required from Google at trust boundary
- Account linking by verified email only (no auto-create)
