# Changelog

## [2.2.0] - 2026-07-02

### Added
- Skill Gap Analyzer - career readiness analysis tool
- Real-time WebSocket events for Kanban, Q&A, Reports
- Centralized configuration system
- Comprehensive error handling with timestamps
- Request deduplication for token refresh
- API response time tracking headers
- CORS preflight caching (24h)
- Health check endpoints (disk, database pool)
- Memory monitoring with periodic logging
- Socket connection rate limiting
- Comprehensive contributing guide
- Code of Conduct (Contributor Covenant v2.1)
- Security policy and vulnerability reporting guide
- GitHub Actions workflows for achievements

### Fixed
- Login response format mismatch between frontend and backend
- CSRF token handling in frontend requests
- Profile page date normalization for ISO timestamps
- Conflicting validation states on login failure
- Redis fallback logging with persistence warnings
- Environment variable validation with clear error messages
- DATABASE_URL format validation at startup
- Socket notification race conditions

### Changed
- All hardcoded values centralized to config files
- Dead code removed from frontend and backend
- LRU cache improved with request coalescing
- Notification service error handling improved
- Google OAuth error messages made more specific

### Security
- Added FILE_SIGN_SECRET requirement in production
- Bcrypt rounds configurable via environment
- TOTP issuer configurable via environment
- Account lockout threshold and duration configurable
- Cookie TTLs derived from configuration

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
