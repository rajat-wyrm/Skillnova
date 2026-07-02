# SkillNova — Low-Level Design

## Google OAuth — Module Breakdown

### File Map

```
server/src/
  services/google.service.js      ← OAuth2 URL builder, code exchange, profile fetch
  controllers/googleAuth.controller.js ← start, callback, status handlers
  routes/auth.routes.js           ← 3 new GET routes (no CSRF — GET only)
  utils/auth.js                   ← signOAuthState / verifyOAuthState (10-min JWT)
  config/index.js                 ← google block + TTL bare-number fix
  utils/ApiError.js               ← serviceUnavailable (503)

src/
  auth/pages/AuthCallback.jsx     ← post-redirect landing, error decode, hydrate
  auth/pages/Login.jsx            ← Google button + ?error= decoding
  App.jsx                         ← /auth/callback before AuthGate
  lib/auth.js                     ← hydrate() calls /auth/me first
```

### Data Flow — Google OAuth Callback

```
1. Browser → GET /auth/google/callback?code=X&state=Y
2. Controller: verifyOAuthState(state)
   └─ JWT verify, check purpose === 'oauth_state'
3. Controller: exchangeCodeForProfile(code)
   └─ POST googleapis.com/token → access_token
   └─ GET googleapis.com/oauth2/v2/userinfo → { id, email, name, picture, email_verified }
4. Controller: email_verified === true? → reject if false
5. Controller: find user by googleId → find by email → link if found → reject if neither
6. Controller: issueTokens(res, user, req)
   └─ signAccessToken({ sub, role, sid })
   └─ signRefreshToken({ sub, sid })
   └─ Set 4 cookies: sn_sid, sn_refresh, sn_sid_sid, sn_csrf
   └─ Domain=localhost in dev for cross-port
7. Controller: audit + redirect → APP_URL + returnTo
```

### Cookie Architecture

| Cookie | HttpOnly | Purpose | TTL |
|--------|----------|---------|-----|
| sn_sid | yes | Access token (JWT) | 15 min |
| sn_refresh | yes | Refresh token (JWT) | 30 days |
| sn_sid_sid | yes | Session ID for server-side validation | 15 min |
| sn_csrf | no | CSRF double-submit (matches X-CSRF-Token header) | 24h |

### State Token Design

```js
{
  purpose: 'oauth_state',   // rejects access tokens via audience/purpose check
  returnTo: '/dashboard',   // preserved through OAuth redirect
  iat: ..., exp: ...        // 10-min TTL
}
// Signed with JWT_ACCESS_SECRET, audience: 'skillnova.oauth'
```

### Account Linking Priority

1. `googleId` match → update name/avatar, issue tokens
2. `email` match → link googleId to existing account, update authProvider
3. No match → redirect with `error=no_account_match`

### Frontend Auth State Machine

```
[hydrated=false] → hydrate()
  ├─ /auth/me succeeds → step='authenticated' → render role app
  └─ /auth/me fails → check localStorage
       ├─ has data → set user (step='login' until re-validated)
       └─ no data → step='login' → render AuthGate
```

### RBAC Permission Map (server-side)

```
PERMISSIONS = {
  'users:read':    ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'users:create':  ['SUPER_ADMIN', 'ADMIN'],
  'reports:read':  ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'ai:use':        ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  // ... 30+ permissions across 12 resource groups
}
```

### Cache Layers

| Layer | Where | TTL | Purpose |
|-------|-------|-----|---------|
| LRU in-memory | server/utils/lru.js | 30s–60s | User-by-id, user:full |
| memoryStore | server/utils/redis.js | 7 days | Session validation |
| Upstash Redis | optional | config | Shared cache across instances |

### Prisma Schema — Google Fields

```prisma
model User {
  passwordHash    String?    // nullable for Google-only accounts
  googleId        String?    @unique
  authProvider    String     @default("password")
}
```

### Test Coverage

| Test | What it verifies |
|------|-----------------|
| round-trips with default returnTo | sign → verify returns purpose + returnTo |
| round-trips with custom returnTo | custom path preserved |
| rejects tampered token | modified JWT throws |
| rejects garbage input | non-JWT string throws |
| rejects empty string | empty string throws |
| isGoogleEnabled returns boolean | config gating works |

### Bug Fixes Preserved (from original /tmp session)

1. TTL bare numbers parsed as seconds (not strings)
2. hydrate() calls /auth/me first (cookie auth survives reload)
3. Domain=localhost for dev cross-port cookies
4. email scope restored (was removed for misleading redirect_uri_mismatch)
5. /auth/callback routed before AuthGate (no login flash)
