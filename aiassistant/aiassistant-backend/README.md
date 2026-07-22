# SkillNova AIAssistant — Python backend

Production-grade Agentic RAG chatbot. Exposed as a standalone FastAPI
service that powers the **AIAssistant** UI inside the SkillNova
platform — available to every role (SUPER_ADMIN, ADMIN, MENTOR,
INTERN).

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
| GET | `/api/aiassistant/session` | Create a session id |
| GET | `/api/aiassistant/health` | Liveness + boot status |
| POST | `/api/aiassistant/chat` | Synchronous chat |
| POST | `/api/aiassistant/chat/stream` | Server-Sent Events stream |

### `POST /api/aiassistant/chat`

```bash
curl -X POST http://localhost:8000/api/aiassistant/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is the attendance policy?", "session_id":"abc", "user_role":"INTERN"}'
```

```json
{
  "reply": "Interns must maintain at least ...",
  "session_id": "abc",
  "confidence": 0.83,
  "sources": ["Attendance_Policy.txt"],
  "error": false,
  "assistant": "AIAssistant"
}
```

`user_role` is one of `SUPER_ADMIN`, `ADMIN`, `MENTOR`, `INTERN` and
is forwarded to the LLM so the answer can be tailored to the asker
(an intern asking about payroll will get a different response than an
admin asking the same thing).

---

## Tests & lint

```bash
pytest          # unit tests, no LLM keys required
ruff check .    # lint
```

Both run in CI on every push.

## Docker

```bash
docker build -t skillnova-aiassistant .
docker run --rm -p 8000:8000 --env-file .env skillnova-aiassistant
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
