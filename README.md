# SkillNova

Two backends in one repo, plus the chatbot frontend in `frontend/`.

- **Python AI chatbot** — `internbackend/main.py` (FastAPI + LangGraph,
  multi-provider LLM race, KB fallback, SSE streaming)
- **Node.js InternOps** — `internbackend/src/app.js` (Fastify +
  PostgreSQL, RBAC, audit, file uploads, real-time notifications)
- **Chatbot UI** — `frontend/src/AIAssistant.jsx`

## Quick start

```bash
# Python chatbot
cd internbackend
pip install -r requirements.txt
cp .env.example .env
python main.py           # http://localhost:5000

# Node.js backend
cd internbackend
npm install
cp .env.example .env
node src/db/migrate.js
node src/app.js          # http://localhost:5000 (same default port)

# Frontend
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## Documentation

- Backend details, endpoint tables, and test commands live in
  [`internbackend/README.md`](internbackend/README.md).
- The chatbot UI is documented inline in
  [`frontend/src/AIAssistant.jsx`](frontend/src/AIAssistant.jsx).

## CI

`.github/workflows/ci.yml` runs:
- Python compile-check + pytest against Python 3.11
- Node.js syntax-check every module + Jest tests (if any) against Node 20

Both jobs use a Postgres service container for the Node side.