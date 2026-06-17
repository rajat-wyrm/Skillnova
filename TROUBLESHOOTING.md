# Troubleshooting

Common failures and how to fix them.

## Python chatbot

### `ImportError: No module named 'fastapi'` (or similar)

You skipped the pip install step. Fix:

```bash
cd internbackend
pip install -r requirements.txt
```

If `pip` itself is missing on your distro (Arch, fresh Debian):
`python -m ensurepip --upgrade` or use your package manager.

### `GEMINI_API_KEY missing`

The chatbot runs in KB-fallback mode without any LLM key. The /api/chat
endpoint will still respond using the knowledge base, but replies will
be shorter and template-shaped. Set at least one of:

```env
GROQ_API_KEY=...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
```

### `sqlite3.OperationalError: unable to open database file`

`DATABASE_URL` points at a directory the process cannot write to.
Default is `sqlite:///./skillnova_chat.db` (relative). Either:

```bash
mkdir -p data
DATABASE_URL=sqlite:///./data/skillnova_chat.db python main.py
```

or point at a managed Postgres:

```bash
DATABASE_URL=postgres://user:pass@host:5432/skillnova python main.py
```

### Streaming endpoint hangs at `data: ` only

The agent graph finished but `_format_reply` produced an empty string
(every LLM provider returned blank). Set `LOG_LEVEL=DEBUG` and tail the
output — every provider attempt logs `[LLM] All providers failed`.

### `429 Rate limit exceeded`

`RATE_LIMIT_PER_MIN` is hit. Either bump the env var or deploy behind
a CDN/edge that handles rate limiting.

## Node InternOps

### `Error: Cannot find module 'pg'`

```bash
cd internbackend
npm install
```

### `ECONNREFUSED 127.0.0.1:5432`

Postgres isn't running. Either:

```bash
docker compose up -d db          # local Postgres via compose
# or
export DATABASE_URL=postgres://user:pass@host:5432/skillnova
```

### `CSRF token missing or invalid`

The exempt routes are `/api/auth/login`, `/api/auth/refresh`,
`/api/auth/forgot-password`, `/api/auth/reset-password`. Every other
state-changing request must include `X-CSRF-Token`. See EXAMPLES.md.

### `relation "users" does not exist`

Migrations haven't been applied.

```bash
cd internbackend
node src/db/migrate.js
```

### `argon2` build fails on Alpine

Use the `node:20-bookworm` base image (matches Dockerfile). Alpine
needs the extra build deps:

```dockerfile
RUN apk add --no-cache python3 make g++
```

### `fastify-plugin: @fastify/websocket - expected '5.x'`

You pinned `@fastify/websocket` to v11 which requires Fastify 5. Pin
to v10 to stay on Fastify 4:

```bash
npm install @fastify/websocket@10
```

## Frontend

### `Failed to fetch` on first load

The chatbot page calls `getAiAssistantBootstrap()` which fans out to
`/api/ai/suggestions`, `/api/ai/capabilities`, `/api/ai/welcome-message`.
If any one fails the page falls back to a sensible default — but if
**all three** fail the page throws. Verify the Python service is up:

```bash
curl http://localhost:5000/api/ai/welcome-message
```

### `useMockApi=true` is the default

The frontend boots with mock data so the UI renders without a backend.
To hit a real backend, set in `.env.local`:

```env
VITE_API_BASE_URL=https://api.example.com/api
VITE_USE_MOCK_API=false
```

## Docker / Render

### Container exits immediately with no log

Override the entrypoint to inspect:

```bash
docker run --rm -it --entrypoint /bin/bash skillnova-api
```

### Render: deploy succeeds, healthcheck fails

The blueprint mounts migrations into Postgres initdb, but a Postgres
service with existing data won't re-run them. Wipe the DB once or
apply migrations manually from the shell tab.

### Image too large

The unified `Dockerfile` installs Python **and** Node into one image.
If you only need one backend, use `Dockerfile.python` (~250 MB) or
`Dockerfile.node` (~180 MB) instead.

## CI

### Python: `pytest: command not found`

`pip install -r requirements.txt` ran before pytest was declared.
Pinning `pytest>=7.4` in `requirements.txt` so it lands in the install.
Already done in this repo.

### Node: `pg` errors during syntax check

Tests stub `pg` via `Module._load` patch so this should never happen.
If it does, check that `tests/unit/wiring.test.js` runs **before**
any test that touches the real DB.

### Docker build step fails with "no space left on device"

GitHub Actions free runners have 14 GB of disk. Our `Dockerfile.node`
ends up around 180 MB; if a future change bloats it, move the build
to a matrix split or a self-hosted runner.