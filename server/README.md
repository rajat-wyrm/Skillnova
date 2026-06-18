# Server
SkillNova API

## Quick start

```bash
cd server
cp .env .env.local       # edit if needed
npm install
npm run prisma:generate
npm run prisma:push      # creates tables in your Postgres
npm run seed             # demo data
npm run dev              # http://localhost:4000
```

## Demo accounts

| Role        | Email                          | Password         |
|-------------|--------------------------------|------------------|
| Super Admin | superadmin@skillnova.com       | SuperAdmin#2026  |
| Admin       | admin@skillnova.com            | Admin#2026       |
| Mentor      | mentor@skillnova.com           | Mentor#2026      |
| Intern      | rahul@skillnova.com            | User#2026        |

## Architecture

- **Express** + **Prisma** (Postgres) + **Upstash Redis** + **Socket.io** + **Groq AI**
- JWT auth with access + refresh + CSRF (double-submit cookie)
- Strong RBAC with permission matrix (see `src/middleware/rbac.js`)
- Realtime notifications via Socket.io rooms (`user:<id>`, `role:<role>`)
- Audit log for every privileged action
- AI assistant grounded on the UptoSkills knowledge base + live user data
- Input validation via Zod schemas on every route

## Folder layout

```
server/
  prisma/
    schema.prisma        # data model
    seed.js              # demo data
  src/
    config/              # env loading
    controllers/         # route logic
    middleware/          # auth, RBAC, validation
    routes/              # express routers
    services/            # notification, audit
    sockets/             # socket.io setup
    ai/                  # Groq + UptoSkills KB
    utils/               # prisma, redis, auth helpers, logger
    app.js               # express app
    index.js             # http + socket bootstrap
  tests/                 # node:test unit tests
```

## RBAC permissions

See `src/middleware/rbac.js` for the full matrix. Highlights:
- Only `SUPER_ADMIN` can delete users or change roles.
- `SUPER_ADMIN`, `ADMIN`, `MENTOR` can review reports.
- `INTERN` can read KB, create reports, ask the AI Assistant.
- `MENTOR` has scoped access to their interns.

## REST API

Base URL: `http://localhost:4000/api/v1`

```
POST /auth/login                 -> step: 'otp_required' | tokens
POST /auth/verify-otp            -> tokens
POST /auth/refresh               -> new tokens
POST /auth/logout
GET  /auth/me                    -> current user + permissions
POST /auth/2fa/setup
POST /auth/2fa/enable

GET/POST/PATCH/DELETE /users     -> admin only
GET/POST/PATCH/DELETE /kb/...
GET/POST/PATCH/DELETE /reports
GET/POST/PATCH/DELETE /announcements
GET/POST/PATCH/DELETE /qa/...
GET/POST          /attendance
GET/POST/PATCH/DELETE /projects
GET/POST/PATCH/DELETE /tasks
POST /ai/chat                    -> non-streaming
POST /ai/chat/stream             -> SSE stream
GET  /ai/sessions
GET  /notifications
GET  /analytics/platform
GET  /analytics/interns
```

## Socket.io

Connect with the access token (header or auth.token). Rooms:
- `user:<id>` — personal notifications
- `role:<role>` — role broadcasts

Events:
- `notification` — new notification payload
- `broadcast` — platform-wide announcements

## Tests

```bash
npm test
```
