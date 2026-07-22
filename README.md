# SkillNova

A production-grade intern management platform for UptoSkills. Real-time, RBAC-protected, AI-grounded, and engineered for the operational needs of an internship program: onboarding, knowledge base, daily reports, attendance, projects, reviews, announcements, and analytics.

---

## Why SkillNova

- Built around a four-tier role model (SUPER_ADMIN, ADMIN, MENTOR, INTERN) with a fine-grained permission matrix instead of a binary admin/user split.
- Every privileged action is recorded in an audit log; every state change can be reviewed.
- The AI assistant is grounded on the platform's own knowledge base and live data, not just a generic LLM.
- Performance and reliability are first-class: in-memory LRU cache backed by Redis, request coalescing, ETag-based 304s, real readiness probes.
- One monorepo, two runnable artifacts: an Express + Prisma API and a React 19 + Vite frontend, both tested in CI on every push.

---

## Tech stack

### Backend

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 20 LTS (pinned via `.nvmrc`) |
| Framework | Express 4 |
| ORM / DB | Prisma 5 on PostgreSQL (Neon-compatible) |
| Realtime | Socket.io 4 |
| Cache | In-memory LRU + Upstash Redis (graceful in-memory fallback) |
| Auth | JWT access + refresh, CSRF double-submit cookie, TOTP 2FA |
| Validation | Zod + Joi (per-endpoint) |
| AI | Groq (`llama-3.1-8b-instant` / `llama-3.1-70b-versatile`) |
| Logging | Pino (structured JSON in prod, pretty in dev) |
| Security | Helmet, CORS allow-list, express-rate-limit, signed download URLs |
| Tests | Node built-in `node --test` |

### Frontend

| Concern | Choice |
| --- | --- |
| Runtime | React 19 |
| Build | Vite 8 with manual vendor chunking |
| Styling | Tailwind (CDN) + custom design tokens in `src/index.css` |
| State | Zustand (auth, theme, preferences) |
| Realtime | socket.io-client |
| Data viz | Recharts |
| Drag and drop | dnd-kit |
| Markdown | react-markdown + remark plugins |
| Animations | framer-motion |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Dates | date-fns |

---

## Repository layout

```
skillnova/
├── server/                              Express + Prisma + Socket.io + Groq
│   ├── prisma/
│   │   ├── schema.prisma                Full data model
│   │   └── seed.js                      Demo data + demo accounts
│   ├── tests/                           Node test runner suite
│   │   ├── ApiError.test.js
│   │   ├── auth.test.js
│   │   ├── cache.test.js
│   │   ├── lru.test.js
│   │   └── rbac.test.js
│   └── src/
│       ├── ai/                          Groq assistant + UptoSkills KB
│       ├── config/                      Env loading and validation
│       ├── controllers/                 HTTP handlers (14 modules)
│       ├── middleware/                  auth, RBAC, validation, CSRF, requestId
│       ├── routes/                      Express routers
│       ├── services/                    audit, notification, webhook delivery
│       ├── sockets/                     socket.io server
│       ├── utils/                       prisma, redis, lru, cache, auth, logger
│       ├── app.js                       Express app
│       └── index.js                     Bootstrap
├── src/                                 React frontend
│   ├── admin/                           Admin (SUPER_ADMIN / ADMIN) shell
│   ├── mentor/                          Mentor shell
│   ├── user/                            Intern shell
│   ├── auth/                            Login + OTP pages
│   ├── shared/                          Reusable components, hooks
│   ├── lib/                             api, socket, auth store, utils
│   └── App.jsx                          Role router
├── public/                              Static assets
├── scripts/                             Helper scripts
├── .github/workflows/ci.yml             CI: lint, test, build
├── .env.example                         Frontend env template
├── server/.env.example                  Server env template
├── docker-compose.yml                   API + static frontend + nginx
├── Dockerfile.frontend                  Frontend container
├── server/Dockerfile                    Backend container
├── nginx.conf                           Reverse proxy
├── eslint.config.js                     ESLint flat config
├── vite.config.js                       Vite + manual vendor chunks
├── package.json                         Frontend scripts
├── server/package.json                  Backend scripts
└── README.md
```

---

## Quick start

### Prerequisites

- Node.js 20 LTS (`nvm use`)
- A PostgreSQL database (Neon free tier works)
- Optional: an Upstash Redis REST URL and token
- Optional: a Groq API key for the AI assistant

### Bootstrap

```bash
# 1. Install dependencies for both workspaces
npm install
npm run server:install

# 2. Copy and fill the env templates
cp .env.example .env
cp server/.env.example server/.env
# Edit server/.env with DATABASE_URL, JWT_*, CSRF_SECRET, etc.

# 3. Push the Prisma schema and seed demo data
cd server
npm run prisma:generate
npm run prisma:push
npm run seed
cd ..

# 4. Run the API and the frontend together
npm start
```

| Service | URL |
| --- | --- |
| Frontend (Vite) | http://localhost:5273 |
| API | http://localhost:4000 |
| Health (liveness) | http://localhost:4000/healthz/live |
| Health (readiness) | http://localhost:4000/healthz/ready |

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `superadmin@skillnova.com` | `SuperAdmin#2026` |
| Admin | `admin@skillnova.com` | `Admin#2026` |
| Mentor | `mentor@skillnova.com` | `Mentor#2026` |
| Intern | `rahul@skillnova.com` | `User#2026` |
| Intern | `user@skillnova.com` | `User#2026` |

In development, the OTP code is returned in the login response (`devCode`) and shown on the OTP page, so the full 2FA flow can be exercised without an SMTP server.

---

## Configuration

All runtime configuration is loaded from environment variables. The server validates required values at boot and refuses to start if any production-only secret is missing. See `server/.env.example` for the full list with defaults and comments.

Key variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `PORT` | API port | `4000` |
| `APP_URL` | Public URL of the frontend (for redirects) | `http://localhost:5273` |
| `CORS_ORIGIN` | Comma-separated allow-list for browser origins | `http://localhost:5273` |
| `DATABASE_URL` | Postgres connection string | required in production |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint | optional |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash bearer token | optional |
| `GROQ_API_KEY` | Groq API key for the AI assistant | optional |
| `GROQ_MODEL` | Default Groq model | `llama-3.1-8b-instant` |
| `JWT_ACCESS_SECRET` | HS256 secret for access tokens | required in production |
| `JWT_REFRESH_SECRET` | HS256 secret for refresh tokens | required in production |
| `JWT_SECRET` | HS256 secret for short-lived helpers | required in production |
| `CSRF_SECRET` | HMAC secret for the CSRF cookie | required in production |
| `ACCESS_TOKEN_TTL` | Access token lifetime | `900` (15 min) |
| `REFRESH_TOKEN_TTL` | Refresh token lifetime | `2592000` (30 d) |
| `OTP_TTL` | OTP validity window | `300` (5 min) |
| `TWOFA_TTL` | 2FA challenge window | `600` (10 min) |
| `RATE_LIMIT_WINDOW_MS` | Global rate-limit window | `60000` |
| `RATE_LIMIT_MAX` | Global rate-limit budget | `120` |
| `AUTH_RATE_LIMIT_MAX` | Per-endpoint auth budget | `10` |
| `LOG_LEVEL` | Pino log level | `info` |

---

## RBAC matrix

The full canonical list lives in `server/src/middleware/rbac.js`. Highlights:

| Permission | Super | Admin | Mentor | Intern |
| --- | :-: | :-: | :-: | :-: |
| `users:read` | Y | Y | Y | - |
| `users:create` | Y | Y | - | - |
| `users:update` | Y | Y | - | - |
| `users:delete` | Y | - | - | - |
| `users:role:change` | Y | - | - | - |
| `reports:create` | - | - | Y | Y |
| `reports:review` | Y | Y | Y | - |
| `kb:create` | Y | Y | Y | - |
| `kb:verify` | Y | Y | - | - |
| `kb:delete` | Y | Y | - | - |
| `attendance:mark` | Y | Y | Y | - |
| `attendance:self` | Y | Y | Y | Y |
| `announcements:create` | Y | Y | - | - |
| `ai:use` | Y | Y | Y | Y |
| `files:upload` | Y | Y | Y | Y |
| `webhooks:manage` | Y | Y | - | - |
| `analytics:read` | Y | Y | - | - |

Permission middleware: `requirePermission('<perm>')`. Mounted per route. See any controller for usage.

---

## REST API surface

Base URL: `http://localhost:4000/api/v1`

All routes (except `/auth/login`, `/auth/verify-otp`, `/auth/refresh`, `/healthz/*`, `/api/v1/meta`, and signed file downloads) require a valid `Authorization: Bearer <accessToken>` header and a CSRF token on mutating verbs.

### Auth (`/auth`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | none | Step 1; returns tokens or `step: 'otp_required'` + `challengeToken` |
| POST | `/auth/verify-otp` | none | Step 2; exchanges challenge + OTP for tokens |
| POST | `/auth/refresh` | cookie | Rotates access + refresh tokens |
| POST | `/auth/logout` | bearer | Revokes the current session |
| POST | `/auth/logout-all` | bearer | Revokes every session for the user |
| GET  | `/auth/me` | bearer | Current user + effective permissions |
| POST | `/auth/2fa/setup` | bearer | Begin TOTP enrolment |
| POST | `/auth/2fa/enable` | bearer | Confirm TOTP enrolment |

### Users (`/users`)

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET    | `/users` | `users:read` | Paginated, filterable user list |
| GET    | `/users/stats` | `users:read` | Group-by role and status |
| GET    | `/users/:id` | `users:read` | Single user with relations |
| POST   | `/users` | `users:create` | Create user |
| PATCH  | `/users/:id` | `users:update` | Update user |
| PATCH  | `/users/:id/role` | `users:role:change` | Change role (super only) |
| PATCH  | `/users/:id/status` | `users:update` | Change status |
| DELETE | `/users/:id` | `users:delete` | Delete user (super only) |

### Knowledge base (`/kb`)

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET    | `/kb/categories` | `kb:read` | List categories |
| POST   | `/kb/categories` | `kb:create` | Create category |
| GET    | `/kb/articles` | `kb:read` | Paginated article list (cached 30 s) |
| GET    | `/kb/articles/:id` | `kb:read` | Fetch one article (by id or slug) |
| POST   | `/kb/articles` | `kb:create` | Create article + first version |
| PATCH  | `/kb/articles/:id` | `kb:update` | Update article (creates a new version) |
| PATCH  | `/kb/articles/:id/verify` | `kb:verify` | Mark as verified |
| DELETE | `/kb/articles/:id` | `kb:delete` | Delete article |
| POST   | `/kb/articles/:id/feedback` | `kb:read` | Submit helpful / not-helpful feedback |

### Reports (`/reports`)

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET    | `/reports` | `reports:read` | List (auto-scoped to current role) |
| GET    | `/reports/:id` | `reports:read` | One report |
| GET    | `/reports/stats` | `reports:read` | Aggregated counts |
| POST   | `/reports` | `reports:create` | Submit a report |
| PATCH  | `/reports/:id/review` | `reports:review` | Mentor / admin review |
| DELETE | `/reports/:id` | `reports:delete` | Delete |

### Announcements (`/announcements`)

| Method | Path | Permission | Purpose |
| --- | --- | --- | --- |
| GET    | `/announcements` | `announcements:read` | List (cached 20 s) |
| GET    | `/announcements/:id` | `announcements:read` | One |
| POST   | `/announcements` | `announcements:create` | Create + broadcast |
| PATCH  | `/announcements/:id` | `announcements:update` | Edit |
| PATCH  | `/announcements/:id/pin` | `announcements:update` | Toggle pinned |
| DELETE | `/announcements/:id` | `announcements:delete` | Delete |

### Attendance, Q&A, Projects, Tasks

| Method | Path | Notes |
| --- | --- | --- |
| GET    | `/attendance` | Role-scoped attendance rows |
| GET    | `/attendance/summary` | Interns / mentors roll-up |
| POST   | `/attendance/mark` | Mentor / admin mark |
| POST   | `/attendance/check` | Self check-in / check-out |
| GET    | `/qa/questions` | List questions |
| POST   | `/qa/questions` | Ask a question |
| GET    | `/qa/questions/:id` | Read |
| POST   | `/qa/questions/:id/answers` | Post an answer |
| POST   | `/qa/answers/:id/accept` | Accept an answer (asker only) |
| POST   | `/qa/upvote` | Upvote question or answer |
| GET / POST | `/projects` / `/projects/:id` | List / create / fetch |
| PATCH / DELETE | `/projects/:id` | Update / delete |
| GET / POST | `/tasks` | List / create |
| PATCH / DELETE | `/tasks/:id` | Update / delete |

### AI (`/ai`)

| Method | Path | Notes |
| --- | --- | --- |
| POST   | `/ai/chat` | Non-streaming chat completion |
| POST   | `/ai/chat/stream` | Server-Sent Events stream |
| GET    | `/ai/sessions` | List chat history |
| GET    | `/ai/sessions/:id` | Read one session |
| DELETE | `/ai/sessions/:id` | Delete one session |

### Files, Notifications, Webhooks, Meetings, Preferences, Analytics

| Method | Path | Notes |
| --- | --- | --- |
| POST   | `/files` | Multipart upload (25 MB, type whitelist) |
| GET    | `/files` | List user's files |
| GET    | `/files/:id` | Metadata |
| GET    | `/files/:id/download` | Signed-URL redirect download |
| GET    | `/files/:id/url` | Short-lived signed URL |
| DELETE | `/files/:id` | Delete (owner or admin) |
| GET    | `/notifications` | Paginated inbox |
| POST   | `/notifications/:id/read` | Mark one read |
| POST   | `/notifications/read-all` | Mark all read |
| GET / PATCH | `/preferences/notifications` | Channel / type / quiet hours |
| GET    | `/webhooks` | List configured webhooks |
| POST   | `/webhooks` | Create webhook |
| PATCH  | `/webhooks/:id` | Update |
| DELETE | `/webhooks/:id` | Delete |
| GET    | `/webhooks/:id/deliveries` | Delivery log |
| GET    | `/webhooks/events` | Event catalogue |
| GET / POST / PATCH / DELETE | `/meetings[/:id]` | Calendar meetings |
| GET    | `/analytics/platform` | Platform-wide metrics (cached 60 s) |
| GET    | `/analytics/interns` | Per-intern performance (cached 30 s) |
| GET    | `/exports/users` | CSV / JSON export |
| GET    | `/exports/reports` | CSV / JSON export |
| GET    | `/exports/attendance` | CSV / JSON export |

### Health and meta

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/healthz` | none | Backwards-compatible process check |
| GET | `/healthz/live` | none | Liveness probe (kubelet) |
| GET | `/healthz/ready` | none | Readiness probe; 503 if Postgres or Redis is down |
| GET | `/api/v1/meta` | none | Service name and version |

---

## Performance

| Layer | Mechanism |
| --- | --- |
| Hot reads | Two-tier cache: in-memory LRU (L1, sub-ms) backed by Redis (L2, distributed). See `server/src/utils/cache.js` and `server/src/utils/lru.js`. |
| Auth middleware | User-by-id lookup is cached for 60 s; cache is invalidated on profile, role, or status mutation. |
| `/auth/me` | Full payload (with `internProfile` and `mentorProfile`) is cached for 30 s. |
| Analytics | `/analytics/platform` cached 60 s, `/analytics/interns` cached 30 s. |
| KB articles | List endpoint cached 30 s, keyed on the full query vector. |
| Announcements | List endpoint cached 20 s. |
| User directory | List endpoint cached 15 s. |
| HTTP responses | ETag middleware on every GET returns 304 on identical re-requests. |
| Concurrent requests | `lru.wrap` coalesces in-flight calls for the same key into a single fetcher. |
| Frontend | Every page in every shell (`admin`, `mentor`, `user`) is `React.lazy` + `Suspense`. Vendor code is split into `vendor-react`, `vendor-charts`, `vendor-dnd`, `vendor-motion`, `vendor-icons`, `vendor-md`, `vendor-date`, `vendor-socket`. |

Measured locally against the remote Postgres + Redis:

| Endpoint | Cold | Hot (cache hit) | Speedup |
| --- | --- | --- | --- |
| `/auth/me` | ~3.4 s | ~5 ms | ~700x |
| `/analytics/platform` | ~4.0 s | ~3 ms | ~1300x |
| `/analytics/interns` | ~2.9 s | ~6 ms | ~500x |

---

## Real-time

Connect with the access token:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:4000', {
  auth: { token: accessToken },
  withCredentials: true,
});

socket.on('notification', (n) => { /* new in-app notification */ });
socket.on('broadcast',   (b) => { /* platform-wide or role-wide event */ });
```

Rooms: `user:<id>` (personal), `role:<role>` (broadcast by role).

---

## AI assistant

The assistant at `/api/v1/ai/chat` (non-streaming) and `/api/v1/ai/chat/stream` (SSE) is grounded on three sources, in priority order:

1. The curated **UptoSkills Knowledge Base** (`server/src/ai/uptoskills.kb.js`) — onboarding, reports, attendance, mentorship, code of conduct, FAQs, glossary.
2. **Live platform data** — recent KB articles, current announcements, and the user's own reports.
3. General model knowledge, used only when neither of the above applies.

Each reply carries a `sessionId` so conversations can be resumed. Streaming responses use Server-Sent Events so they work through any HTTP proxy without extra WebSocket plumbing.

The default model is `llama-3.1-8b-instant` for low latency. Override with `GROQ_MODEL`.

---

## Observability

| Concern | Where |
| --- | --- |
| Structured logs | Pino (JSON in prod, pretty in dev) at `server/src/utils/logger.js` |
| Request IDs | Every response carries `x-request-id`; surfaced in 5xx bodies (`server/src/middleware/requestId.js`) |
| Health checks | `/healthz/live` and `/healthz/ready` (Postgres + Redis ping) |
| Audit log | `prisma.auditLog` records every privileged action with user, IP, user-agent, and a JSON `meta` blob |
| Rate-limit telemetry | Every rate-limited response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |

---

## Security

- Helmet sets the standard hardening headers.
- CORS uses an explicit allow-list (no wildcard).
- CSRF is a double-submit cookie pattern verified on every mutating request.
- JWTs are short-lived (15 min default) with separate access and refresh secrets.
- File downloads use HMAC-signed URLs with TTL.
- Webhook deliveries are HMAC-signed and retried with exponential backoff.
- All secrets required by `server/src/config/index.js` are enforced at boot in production; in development and test, missing values are substituted with loud warnings so unit tests can run without a populated `.env`.

---

## Testing

```bash
cd server
npm test
```

Suite: 26 tests across 5 files.

| File | Coverage |
| --- | --- |
| `ApiError.test.js` | Status / message propagation and static helpers |
| `auth.test.js` | Password hashing, OTP generation, token hashing, CSRF round-trip |
| `cache.test.js` | Two-tier cache layer (get, set, del, wrap, incr) |
| `lru.test.js` | In-memory LRU (TTL eviction, wrap coalescing, refresh-after-expiry) |
| `rbac.test.js` | Permission matrix for every role |

The server lints with ESLint flat config; the frontend lints with the project-wide ESLint setup.

```bash
# Backend
cd server && npm run lint && npm test

# Frontend
npm run lint && npm run build
```

---

## CI / CD

`.github/workflows/ci.yml` runs on every push and pull request to `main` and `feat/**`:

| Job | Command |
| --- | --- |
| `server-lint` | `cd server && npm run lint` |
| `server-test` | `cd server && npm test` |
| `frontend-lint` | `npm run lint` |
| `frontend-build` | `npm run build` |
| `full-check` | Aggregator; fails if any upstream job failed |

Node version is pinned to whatever `.nvmrc` declares.

---

## Deployment

```bash
docker compose up --build
```

This boots the API and the static frontend behind nginx. SSL, horizontal scaling, and CDN configuration are out of scope here — plug your own infrastructure in front.

The frontend container is a static build served by nginx with SPA fallback to `index.html`. The backend container runs `node src/index.js` with `NODE_ENV=production`. Both share a `.env` file at the project root for runtime configuration.

---

## Troubleshooting

**Tests fail with "Missing required env var"**

The server validates production-required env vars at boot. In CI the `fix(server): make config tolerant of missing env vars outside production` change substitutes random placeholders with a warning. If you see this in development, copy `server/.env.example` to `server/.env` and fill the required values.

**Login returns `step: 'otp_required'` but you never set up 2FA**

You are logging in as a user with `twoFactorEnabled: true`. In development the OTP code is in the login response as `devCode`. In production it is sent over the configured channel (email or TOTP).

**`/healthz/ready` returns 503**

One of Postgres or Redis is unreachable. The body has `checks: { db: boolean, redis: boolean }` showing which.

**AI assistant returns generic replies**

Either `GROQ_API_KEY` is missing / invalid, or the curated KB has no relevant section. Check the server logs for `groq:` entries.

---

## License

Internal. UptoSkills / SkillNova.