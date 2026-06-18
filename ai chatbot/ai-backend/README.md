# SkillNova AI Chatbot — Python backend

Production-grade Agentic RAG chatbot. Ships as a standalone service alongside
the SkillNova platform — the existing Node/Express backend and React frontend
do **not** need any changes to consume it.

---

## What it does

- Routes each user query to the right pipeline (direct, knowledge base, web search, …)
- Retrieves relevant chunks from a FAISS index over the `knowledge_base/` text files
- Re-ranks and grades them (keyword overlap + dynamic confidence)
- Generates an answer with Gemini → Groq → DeepSeek (automatic fallback)
- Streams tokens over Server-Sent Events
- Caches responses (in-memory or Redis) and persists chat turns in SQLite / Postgres
- Enforces guardrails: input length, prompt injection, XSS, jailbreak, …
- Detects Hindi vs English and answers accordingly
- Logs every step in structured JSON with a request ID

## Stack

| Concern | Choice |
| --- | --- |
| API | FastAPI + Uvicorn |
| Streaming | sse-starlette |
| Agent | LangGraph |
| LLM | Gemini / Groq / DeepSeek (circuit-broken) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector store | FAISS (CPU) |
| Web search | Tavily → DuckDuckGo |
| Cache | In-memory or Redis |
| DB | SQLAlchemy (SQLite default, Postgres optional) |
| Tests | pytest |
| Lint | ruff |

---

## Quick start

```bash
# 1. Configure
cp .env.example .env
$EDITOR .env                  # add at least one LLM key

# 2. Install
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. Run
python main.py                # http://localhost:8000/docs
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Service status |
| GET | `/api/session` | Create a session id |
| GET | `/api/health` | Liveness + boot status |
| POST | `/api/chat` | Synchronous chat |
| POST | `/api/chat/stream` | Server-Sent Events stream |

### `POST /api/chat`

```bash
curl -X POST http://localhost:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is the attendance policy?", "session_id":"abc"}'
```

```json
{
  "reply": "Interns must maintain at least ...",
  "session_id": "abc",
  "confidence": 0.83,
  "sources": ["Attendance_Policy.txt"],
  "error": false
}
```

---

## Tests & lint

```bash
pytest          # unit tests, no LLM keys required
ruff check .    # lint
```

Both run in CI on every push.

## Docker

```bash
docker build -t skillnova-ai-chatbot .
docker run --rm -p 8000:8000 --env-file .env skillnova-ai-chatbot
```

## Adding knowledge

Drop new `.txt` files into `knowledge_base/` with YAML frontmatter:

```yaml
---
source: NewPolicy.txt
topic: Policies
importance: high
last_updated: 2026-06-01
---

Body of the document goes here …
```

The next service start will re-index the knowledge base automatically.
