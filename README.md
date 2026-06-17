# SkillNova

Two backends in one repo, plus the chatbot frontend in `frontend/`.

- **Python AI chatbot** — `internbackend/main.py` (FastAPI + LangGraph,
  multi-provider LLM race, KB fallback, real token streaming via SSE,
  WebSocket bridge, Prometheus `/api/metrics`)
- **Node.js InternOps platform** — `internbackend/src/app.js` (Fastify +
  PostgreSQL, RBAC, audit, file uploads, real-time chat WebSocket,
  Prometheus `/metrics`)
- **Chatbot UI** — `frontend/src/user/pages/AIAssistant.jsx`

## Quick start (local)

```bash
# Python chatbot
cd internbackend
pip install -r requirements.txt
cp .env.example .env
python main.py                    # http://localhost:5000

# Node.js backend
cd internbackend
npm install
cp .env.example .env
node src/db/migrate.js
node src/app.js                   # http://localhost:5000 (same default port)

# Frontend
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

## Quick start (Docker)

```bash
./scripts/up.sh up
./scripts/verify.sh
./scripts/up.sh logs
```

The compose stack spins up Postgres 16, Redis 7, and the unified Docker
image (Python + Node). Migrations are mounted into Postgres initdb so
the schema is created on first boot.

## Quick start (Render free tier)

1. Sign in to https://render.com and click **New → Blueprint**.
2. Point it at this repo. Render reads `render.yaml` and provisions:
   - `skillnova-chatbot` (Python web service)
   - `skillnova-api` (Node web service)
   - `skillnova-db` (managed Postgres 16)
3. Set the `GROQ_API_KEY`, `GEMINI_API_KEY`, or `DEEPSEEK_API_KEY`
   environment variable on the `skillnova-chatbot` service.
4. The Node service automatically learns the chatbot URL via
   `PYTHON_CHAT_URL`, so the WebSocket bridge works out of the box.

## Endpoints

### Python chatbot (`internbackend/main.py`)

| Method | Path | Purpose |
|---|---|---|
| `GET`   | `/` | Liveness |
| `GET`   | `/api/health` | Readiness check (components + uptime + version) |
| `GET`   | `/api/metrics` | Prometheus exposition |
| `GET`   | `/api/session` | New UUID session |
| `POST`  | `/api/chat` | One-shot JSON response |
| `POST`  | `/api/chat/stream` | Real token SSE stream |
| `POST`  | `/api/integrate/chat` | External JSON alias |
| `POST`  | `/api/integrate/stream` | External SSE alias |
| `WS`    | `/api/ws/chat` | WebSocket token stream |
| `POST`  | `/api/feedback` | Record a rating (-1, 0, +1) |
| `GET`   | `/api/admin/stats` | Metrics snapshot (admin token) |
| `GET`   | `/api/admin/recent?limit=N` | Latest N chat turns (admin token) |
| `GET`   | `/api/ai/suggestions` | Frontend-facing chips |
| `GET`   | `/api/ai/capabilities` | Frontend-facing list |
| `GET`   | `/api/ai/welcome-message` | Frontend-facing greeting |
| `POST`  | `/api/ai/chat` | Frontend-facing chat alias |

### Node.js InternOps (`internbackend/src/app.js`)

17 route modules under `/api/*` — see the live Swagger UI at `/docs`.
Plus `/health`, `/health/db`, `/health/full`, `/metrics`, `/fallback`.

## Provider race

Every prompt tries **Gemini → Groq → DeepSeek** in order, with a
per-provider `CircuitBreaker`. If all three fail, the chatbot falls
back to a template-based reply grounded in the closest KB chunk.

For streaming, the same three providers expose an async iterator. The
race is won by the first token; the rest are abandoned.

## Tests

```bash
# Node — fast, no Postgres needed
cd internbackend && npm test
# 12 tests, ~1.3 s

# Python — needs pip install -r requirements.txt
cd internbackend && pytest tests/ -v
```

The Python suite includes `tests/test_units.py` (pure functions) and
`tests/test_app.py` (TestClient-driven integration with the agent
graph monkey-patched). The Node suite covers module wiring, JWT/CSRF,
auth/RBAC, uploads module, and the global error handler.

## CI/CD

`.github/workflows/ci.yml` runs on every push and PR:

| Job | What it does |
|---|---|
| `python` | pip install + compileall + pytest (unit + app) on Python 3.11 |
| `node`   | npm ci + syntax-check every module + Jest unit + docker build |

Both must pass for the build to be green.

## Push helper

```bash
./push.sh <github_token>   # or GITHUB_TOKEN=<token> ./push.sh
```

The token is embedded in the remote URL only for the duration of the
push, then stripped from the local git config.

## Documentation

- Backend details live in [`internbackend/README.md`](internbackend/README.md).
- The chatbot frontend lives in
  [`frontend/src/user/pages/AIAssistant.jsx`](frontend/src/user/pages/AIAssistant.jsx).

## License

MIT. Knowledge base content (about UptoSkills) is owned by Rajat Kumar.