# SkillNova AI Chatbot

Production-grade Agentic RAG chatbot, integrated as an **opt-in module**
alongside the existing SkillNova platform. The SkillNova Node/Express
backend and React frontend are **not** modified — this folder is fully
self-contained.

```
ai chatbot/
├── ai-backend/       FastAPI + LangGraph + FAISS (Python 3.11)
├── ai-frontend/      Standalone React widget (Vite)
├── docker-compose.yml   One-shot full stack
└── docs/             Architecture notes
```

## Quick start

```bash
cd "ai chatbot"
cp ai-backend/.env.example ai-backend/.env
$EDITOR ai-backend/.env               # add at least one LLM key

docker compose -f "ai chatbot/docker-compose.yml" up --build
# → chatbot API:  http://localhost:8000/docs
# → widget dev:   http://localhost:5174
```

## Architecture

```
                 ┌────────────────────┐
   Browser  ───► │  React widget      │  (ai-frontend/)
                 │  (drop-in bundle)  │
                 └─────────┬──────────┘
                           │  POST /api/chat
                           ▼
                 ┌────────────────────┐
                 │  FastAPI gateway   │  (ai-backend/main.py)
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

- `server/` (existing Express API)
- `src/` (existing React app)
- top-level `docker-compose.yml`, `Dockerfile.frontend`, `nginx.conf`
- top-level `.github/workflows/ci.yml`
- top-level `package.json` / `server/package.json`

A **separate** CI workflow at `.github/workflows/ai-chatbot.yml` builds
and tests only this module.

## API quick reference

```bash
# session
curl -s http://localhost:8000/api/session

# health
curl -s http://localhost:8000/api/health

# chat
curl -X POST http://localhost:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is the attendance policy?","session_id":"sess-1"}'
```

## Tests

```bash
# Python
cd ai-backend && pip install -r requirements.txt && pytest

# Frontend
cd ai-frontend && npm ci && npm run lint && npm run build
```
