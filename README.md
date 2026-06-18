# SkillNova

> The production-grade intern management platform built for **UptoSkills**.
> Refactored, secured, realtime, RBAC-protected, AI-powered.

---

## Highlights

- **Backend** — Node.js 20 + Express 4 + Prisma 5 (PostgreSQL / Neon) + Socket.io + Upstash Redis + Groq AI.
- **Frontend** — React 19 + Vite + Tailwind (via CDN) + framer-motion + recharts + zustand + react-hot-toast + socket.io-client.
- **Auth** — JWT (access + refresh) + CSRF double-submit cookie + account lockout + 2FA OTP + role hierarchy.
- **RBAC** — Four roles (`SUPER_ADMIN`, `ADMIN`, `MENTOR`, `INTERN`) and a fine-grained permission matrix in `server/src/middleware/rbac.js`.
- **Realtime** — Socket.io rooms (`user:<id>`, `role:<role>`) deliver notifications instantly.
- **AI Assistant** — Groq-powered chat grounded on the **UptoSkills Knowledge Base** plus live platform data (reports, articles, announcements).
- **Audit log** — Every privileged action is recorded with user, IP and user-agent.
- **Production** — Docker + docker-compose + nginx reverse proxy.

## Project layout

```
skillnova/
├── server/                 # Express + Prisma + Socket.io + Groq
│   ├── prisma/
│   │   ├── schema.prisma   # full data model
│   │   └── seed.js         # demo data + demo accounts
│   └── src/
│       ├── config/         # env loading + validation
│       ├── controllers/    # HTTP handlers
│       ├── middleware/     # auth, RBAC, validation, CSRF
│       ├── routes/         # express routers
│       ├── services/       # notification + audit
│       ├── sockets/        # socket.io server
│       ├── ai/             # Groq assistant + UptoSkills KB
│       ├── utils/          # prisma, redis, jwt, helpers
│       ├── app.js          # express app
│       └── index.js        # bootstrap
├── src/                    # React frontend
│   ├── admin/              # Admin (SUPER_ADMIN / ADMIN)
│   ├── mentor/             # Mentor app
│   ├── user/               # Intern app
│   ├── auth/               # Login + OTP pages
│   ├── shared/             # Reusable components, hooks
│   ├── lib/                # api, socket, auth store, utils
│   └── App.jsx             # Role router
├── docker-compose.yml      # API + frontend
├── Dockerfile.frontend
├── nginx.conf
├── server/Dockerfile
└── README.md
```

## Quick start (local dev)

```bash
# 1. Install everything
npm install
npm run server:install

# 2. Push schema + seed demo data (uses .env DATABASE_URL)
npm run prisma:generate --prefix server
npm run prisma:push --prefix server
npm run seed --prefix server

# 3. Run both API + frontend together
npm start
# Frontend:  http://localhost:5173
# API:       http://localhost:4000
```

Open the frontend, log in with any demo account below.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `superadmin@skillnova.com` | `SuperAdmin#2026` |
| Admin       | `admin@skillnova.com`      | `Admin#2026`      |
| Mentor      | `mentor@skillnova.com`     | `Mentor#2026`     |
| Intern      | `rahul@skillnova.com`      | `User#2026`       |
| Intern      | `user@skillnova.com`       | `User#2026`       |

> In dev, the OTP code is returned in the login response (`devCode`) and shown in the OTP page so you can complete the flow without an SMTP server.

## RBAC matrix

See `server/src/middleware/rbac.js` for the canonical list. Highlights:

| Permission | Super | Admin | Mentor | Intern |
| --- | :-: | :-: | :-: | :-: |
| `users:delete` | ✅ | ❌ | ❌ | ❌ |
| `users:role:change` | ✅ | ❌ | ❌ | ❌ |
| `reports:review` | ✅ | ✅ | ✅ | ❌ |
| `kb:verify` | ✅ | ✅ | ❌ | ❌ |
| `attendance:mark` | ✅ | ✅ | ✅ | ❌ |
| `ai:use` | ✅ | ✅ | ✅ | ✅ |

## REST API surface

Base URL: `http://localhost:4000/api/v1`

```
POST  /auth/login                # → either tokens OR step='otp_required'
POST  /auth/verify-otp           # → tokens (with devCode in non-prod)
POST  /auth/refresh              # → rotated tokens
POST  /auth/logout
GET   /auth/me                   # current user + permissions

GET   /users                     # admin: list users
POST  /users                     # admin: create
PATCH /users/:id                 # admin: update
PATCH /users/:id/role            # super-admin only
PATCH /users/:id/status          # admin
DELETE /users/:id                # super-admin only

GET   /kb/articles               # list
POST  /kb/articles               # create (admin/mentor/super)
PATCH /kb/articles/:id           # edit
PATCH /kb/articles/:id/verify    # admin/super
DELETE /kb/articles/:id
POST  /kb/articles/:id/feedback

GET   /reports                   # list (auto-scoped)
POST  /reports                   # create (intern/mentor)
PATCH /reports/:id/review        # admin/mentor/super
DELETE /reports/:id

GET   /announcements
POST  /announcements             # admin/super
PATCH /announcements/:id/pin
DELETE /announcements/:id

GET   /qa/questions
POST  /qa/questions
POST  /qa/questions/:id/answers
POST  /qa/upvote

GET   /attendance
GET   /attendance/summary
POST  /attendance/mark
POST  /attendance/check          # self check-in (intern)

GET   /projects
POST  /projects
GET   /tasks
POST  /tasks
PATCH /tasks/:id

POST  /ai/chat                   # non-streaming
POST  /ai/chat/stream            # SSE streaming
GET   /ai/sessions
GET   /ai/sessions/:id

GET   /notifications
POST  /notifications/:id/read
POST  /notifications/read-all

GET   /analytics/platform
GET   /analytics/interns
```

## Socket.io

Connect with the access token:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:4000', { auth: { token }, withCredentials: true });

socket.on('notification', (n) => { /* ... */ });
socket.on('broadcast',   (b) => { /* ... */ });
```

Rooms: `user:<id>` (personal), `role:<role>` (broadcast by role).

## AI assistant

The assistant (`/api/v1/ai/chat` and `/api/v1/ai/chat/stream`) is grounded on:

1. The curated **UptoSkills Knowledge Base** (`server/src/ai/uptoskills.kb.js`) — onboarding, reports, attendance, mentorship, code of conduct, FAQs, glossary.
2. **Live platform data** — recent KB articles, announcements and the user's own reports.
3. General knowledge (used only when 1 & 2 don't apply).

Powered by Groq (`llama-3.1-70b-versatile`). Supports streaming responses via Server-Sent Events.

## Production (Docker)

```bash
docker compose up --build
```

`docker-compose.yml` boots the API and a static frontend container behind nginx. SSL, scaling and CDN are out of scope here — plug your own infra in.

## Tests

```bash
cd server
npm test
```

`tests/` covers auth helpers, ApiError and RBAC matrix.

## License

Internal — UptoSkills / SkillNova.
