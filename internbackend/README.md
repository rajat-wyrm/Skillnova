# SkillNova Backend

Two backends in one folder:

1. **`/`** — Python AI chatbot (FastAPI + LangGraph) on port 5000
2. **`src/`** — Node.js InternOps platform (Fastify + PostgreSQL) on port 5000 (configurable)

## Python chatbot

```bash
cd internbackend
pip install -r requirements.txt
cp .env.example .env   # fill in at least one LLM key
python main.py
```

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/` | Liveness |
| `GET`  | `/api/health` | Readiness (uptime + component status) |
| `GET`  | `/api/session` | New UUID session |
| `POST` | `/api/chat` | One-shot JSON response |
| `POST` | `/api/chat/stream` | SSE token stream |
| `POST` | `/api/integrate/chat` | External integration JSON |
| `POST` | `/api/integrate/stream` | External integration SSE |
| `GET`  | `/api/ws/chat` | WebSocket placeholder |

### Provider race

Every prompt tries Gemini → Groq → DeepSeek in order, with a per-provider
CircuitBreaker. If all three fail, the chatbot falls back to a
template-based reply grounded in the closest knowledge-base chunk.

### Tests

```bash
pytest tests/ -v
```

The smoke tests monkey-patch the agent graph so they run without any
API key, database, or external service.

## Node.js InternOps

```bash
cd internbackend
npm install
cp .env.example .env   # fill in DATABASE_URL + JWT_SECRET
node src/db/migrate.js # apply migrations
node src/app.js
```

### Endpoints (mounted under `/api`)

`auth`, `users`, `departments`, `hierarchy`, `team`, `attendance`,
`ratings`, `tasks`, `proofs`, `notifications`, `audit`, `uploads`,
`analytics`, `meetings`, `sessions`, `reports`, `reports/export`,
`uptoskills` — plus `/health`, `/health/db`, `/health/full`, and the
Swagger UI at `/docs`.

### Tests

```bash
npm test
```

## Environment variables (shared)

See `internbackend/.env.example` for the full list with defaults.
At minimum, set `DATABASE_URL` (Postgres for the Node side) and one
of `GROQ_API_KEY` / `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` for the
chatbot.