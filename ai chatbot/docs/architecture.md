# Architecture — SkillNova AI Chatbot

This document explains how the chatbot module fits into the wider
SkillNova platform **without** modifying the existing Node/Express
backend or React frontend.

## Goals

1. Zero changes to the existing SkillNova code.
2. Fully self-contained Python service with its own Dockerfile.
3. Pluggable into any frontend (we ship a React widget, but a curl
   one-liner works equally well).
4. Production observability — every request gets structured JSON logs
   with a request ID.

## Layout

| Path | Purpose |
| --- | --- |
| `ai-backend/main.py` | FastAPI app, request lifecycle |
| `ai-backend/agent/` | LangGraph nodes + graph definition |
| `ai-backend/retriever/` | FAISS index build + similarity search |
| `ai-backend/tools/web_search.py` | Tavily / DuckDuckGo fallback |
| `ai-backend/llm.py` | Multi-provider LLM calls (circuit-broken) |
| `ai-backend/cache.py` | In-memory + Redis semantic cache |
| `ai-backend/database.py` | SQLAlchemy models + chat persistence |
| `ai-backend/guardrails.py` | Input validation + language detection |
| `ai-backend/logging_config.py` | Structured JSON logger |
| `ai-backend/knowledge_base/` | Plain-text KB with YAML frontmatter |
| `ai-frontend/` | Standalone React widget (Vite) |

## Request lifecycle

```
client → POST /api/chat
    │
    ▼
FastAPI guard (pydantic)
    │
    ▼
guardrails.validate_input()        → 400 / unsafe content
    │
    ▼
language detection
    │
    ▼
semantic cache lookup (Redis | in-memory)
    │  hit → return cached payload
    ▼
build AgentState → asyncio.run_in_executor(agent_graph.invoke)
    │
    ▼
LangGraph:
   router → {direct | general | knowledge_base | web_search | blocked}
        ├─ direct      → LLM, return
        ├─ general     → LLM, return
        ├─ blocked     → safe refusal, return
        ├─ knowledge_base → retrieve → grade → [generate | rewrite → retrieve | web_search]
        │                                  │
        │                                  ▼
        │                          generate → hallucination_check → {pass | escalate}
        └─ web_search           → generate → hallucination_check → {pass | escalate}
    │
    ▼
formatting, sources aggregation
    │
    ▼
cache write + DB write + return ChatResponse
```

## Observability

Every request emits structured JSON to `logs/app.log`:

```json
{"ts":"...","level":"INFO","request_id":"...","module":"agent","msg":"[GRAPH] Executing node: router"}
{"ts":"...","level":"INFO","request_id":"...","module":"retriever","msg":"[RETRIEVE] Retrieved 5 documents"}
{"ts":"...","level":"INFO","request_id":"...","module":"llm","msg":"[LLM RESPONSE] Provider=Groq Latency=412.3ms"}
```

End-to-end latency is logged at the end of every request:

```
[CHAT] 823ms
```

## Failure modes

| Failure | Behaviour |
| --- | --- |
| No LLM key configured | Health endpoint reports `llm_configured=false`; chat returns a 503 with a clear message. |
| LLM provider down | Next provider in chain (Gemini → Groq → DeepSeek) is tried. After N failures the circuit opens for 30s. |
| Vector store missing | Pipeline still serves `direct` / `general` routes; retrieval returns empty. |
| Redis down | Falls back to in-memory cache automatically. |
| Slow LLM | 25s hard timeout per request → friendly timeout reply. |

## Why a separate service?

The SkillNova platform is a React + Node + Postgres monolith optimised
for transactional workloads. Sliding a Python ML stack into it would:

- force a Python runtime into the Node container, OR
- require duplicating auth/CSRF logic in the FastAPI service, OR
- tightly couple the FastAPI service to the Express app.

Instead we expose the chatbot as a standalone API and treat it like
any other upstream the frontend already talks to (e.g. the existing
Groq client in `server/src/ai/assistant.service.js`).
