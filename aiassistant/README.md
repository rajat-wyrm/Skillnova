# SkillNova AIAssistant

The **AIAssistant** is a production-grade Agentic RAG chatbot, built
as a self-contained module alongside the SkillNova platform. It is
available to **every role** in the system (SUPER_ADMIN, ADMIN, MENTOR,
INTERN) and shows up in the UI as a floating chat bubble backed by a
FastAPI service.

```
aiassistant/
├── aiassistant-backend/      FastAPI + LangGraph + FAISS (Python 3.11)
├── aiassistant-widget/       Drop-in React widget (Vite, IIFE bundle)
├── docker-compose.yml        One-shot full stack
├── docs/                     Architecture notes
└── CHANGELOG.md
```

## Quick start (standalone)

```bash
cd aiassistant
cp aiassistant-backend/.env.example aiassistant-backend/.env
$EDITOR aiassistant-backend/.env                # add at least one LLM key

docker compose -f aiassistant/docker-compose.yml up --build
# → AIAssistant API:  http://localhost:8000/docs
# → widget dev:       http://localhost:5174
```

## Quick start (inside SkillNova)

```bash
# 1. Start the AIAssistant backend
cd aiassistant/aiassistant-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  && $EDITOR .env
python main.py        # http://localhost:8000

# 2. Start the SkillNova frontend — Vite proxies /api/aiassistant
#    to the FastAPI service on port 8000 automatically.
cd ../../
npm install
npm run dev
```

The widget mounts on every page and is visible to all logged-in users.

## Architecture

```
                 ┌────────────────────┐
   Browser  ───► │  React widget      │  (aiassistant-widget/)
                 │  floating bubble   │
                 └─────────┬──────────┘
                           │  POST /api/aiassistant/chat
                           ▼
                 ┌────────────────────┐
                 │  FastAPI gateway   │  (aiassistant-backend/main.py)
                 │  + guardrails      │
                 │  + cache           │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  LangGraph         │  (agent/graph.py)
                 │  router → retrieve │
                 │       → grade      │
                 │       → generate   │
                 └─────────┬──────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       FAISS (KB)    Web search     LLM providers
       HuggingFace   Tavily/DDG     Gemini → Groq → DeepSeek
```

See [`docs/architecture.md`](docs/architecture.md) for details.

## What this does NOT touch

<<<<<<< HEAD
- `server/` (existing Express API)
=======
- `backend/` (existing Express API)
>>>>>>> pradeep/main
- `src/` (existing React app)
- top-level `docker-compose.yml`, `Dockerfile.frontend`, `nginx.conf`
- top-level `.github/workflows/ci.yml`

A **separate** CI workflow at `.github/workflows/aiassistant.yml`
builds and tests only this module.

## API quick reference

```bash
# session
curl -s http://localhost:8000/api/aiassistant/session

# health
curl -s http://localhost:8000/api/aiassistant/health

# chat
curl -X POST http://localhost:8000/api/aiassistant/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is the attendance policy?","session_id":"sess-1","user_role":"INTERN"}'
```

## Tests

```bash
# Python
cd aiassistant/aiassistant-backend && pip install -r requirements.txt && pytest

# Frontend
cd aiassistant/aiassistant-widget && npm ci && npm run lint && npm run build
```
