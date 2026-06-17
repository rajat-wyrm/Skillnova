# Architecture

A bird's-eye view of the two backends, the frontend, and the data
flows between them.

```
┌────────────────────────────────────────────────────────────────────┐
│                          Browser / mobile                          │
│                                                                    │
│   ┌──────────────────────┐        ┌──────────────────────────┐   │
│   │  React 19 + Vite SPA │        │  widget (vanilla JS)      │   │
│   │  src/user/pages/     │        │  inline HTML embed        │   │
│   │    AIAssistant.jsx   │        │                          │   │
│   └──────────┬───────────┘        └──────────────┬───────────┘   │
└──────────────┼──────────────────────────────────────┼─────────────┘
               │ HTTPS                                │ HTTPS
               │ /api/ai/*  (chat, suggest, ...)       │ /api/integrate/*
               ▼                                      ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Python chatbot (FastAPI)                      │
│                                                                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ guardrails │  │ LangGraph    │  │ LLM race     │  │ fallback │ │
│  │            │─▶│ (agent/)     │─▶│ (Gemini,     │─▶│ (KB)     │ │
│  │            │  │ router,      │  │  Groq,       │  │          │ │
│  │            │  │  retrieve,   │  │  DeepSeek)   │  │          │ │
│  │            │  │  generate,   │  │              │  │          │ │
│  │            │  │  hallucinate │  │              │  │          │ │
│  └────────────┘  └──────┬───────┘  └──────┬───────┘  └──────────┘ │
│                         │              │                          │
│                         ▼              ▼                          │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  cache     │  │ embeddings  │  │  tools      │                 │
│  │ (memory or │  │ (local 384d │  │ (Tavily +   │                 │
│  │  Redis)    │  │  or HF)     │  │  DuckDuckGo)│                 │
│  └────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                    │
│  /api/chat        /api/chat/stream  /api/ws/chat  /api/metrics   │
│  /api/feedback    /api/admin/*      /api/ai/*      /api/health    │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ Postgres (chat_sessions, ...)
                           ▼
                ┌──────────────────────┐
                │ Postgres 16          │
                │ chat_history, users, │
                │ departments, ...     │
                └──────────┬───────────┘
                           ▲
                           │
┌──────────────────────────┴─────────────────────────────────────────┐
│                    Node InternOps (Fastify)                        │
│                                                                    │
│  /api/auth   /api/users   /api/departments   /api/hierarchy        │
│  /api/team   /api/attendance /api/ratings /api/tasks /api/proofs   │
│  /api/notifications /api/audit /api/uploads /api/analytics         │
│  /api/meetings /api/sessions /api/reports /api/uptoskills          │
│  /api/ws/chat   /health /health/db /health/full /metrics /docs    │
│                                                                    │
│  middleware: auth(JWT) · rbac · ownership · bruteForce · csrf     │
│              sanitize · directManager · websocket                 │
│                                                                    │
│  Same Postgres schema; chat_history is shared with Python service  │
└────────────────────────────────────────────────────────────────────┘
```

## Data flow for a single chat turn

1. **Frontend** posts `{ message, session_id? }` to `/api/chat`.
2. **FastAPI guardrails** validate length and reject jailbreak attempts.
3. **Agent graph** runs the LangGraph pipeline (router → retrieve → grade → generate → hallucinate).
4. **LLM race** tries Gemini → Groq → DeepSeek. First success wins.
5. If every provider fails, the **fallback module** produces a template reply grounded in the closest KB chunk.
6. **SQLAlchemy** persists the turn in `chat_sessions`.
7. **FastAPI** returns the JSON response with `X-Request-ID`, `confidence`, `sources`, `escalated`.

The streaming variant (4a) is identical except step 4 fans out through `stream_llm_response()` and the response is delivered as SSE tokens.

## Cross-service wiring

- The Node `/api/ws/chat` route is a thin bridge that forwards chat messages to the Python service's `/api/chat/stream` endpoint and relays tokens back through the WebSocket.
- The Node service receives the Python URL via the `PYTHON_CHAT_URL` env var (Render injects this automatically when using `fromService.hostUrl` in `render.yaml`).
- Both services share the same Postgres schema. The Python service writes to `chat_sessions`; the Node service reads/writes `chat_history` plus all the operational tables.