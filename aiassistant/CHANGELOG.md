# Changelog

All notable changes to the SkillNova AIAssistant module are documented
here. Format follows [Keep a Changelog](https://keepachangelog.com).

## [1.0.0] - 2026-06-18

### Added

- New `aiassistant/` module that ships the **AIAssistant** chatbot as
  a fully self-contained service. No files in `server/`, `src/`, or
  any other existing SkillNova location are modified.
- `aiassistant-backend/` — FastAPI gateway, LangGraph pipeline, FAISS
  retriever, multi-provider LLM chain (Gemini → Groq → DeepSeek) with
  circuit breakers, Tavily/DDG web search, in-memory + Redis semantic
  cache, SQLite/Postgres persistence, structured JSON logging.
  Exposes `/api/aiassistant/{session,health,chat,chat/stream}`.
- `aiassistant-widget/` — standalone React widget (Vite, React 19)
  that builds to a single IIFE bundle and can be dropped into any
  HTML page. Detects the current user's role from the SkillNova auth
  store so the AIAssistant tailors answers to whoever is logged in.
- `aiassistant-backend/knowledge_base/` — eleven intern-policy
  documents with YAML frontmatter (source, topic, importance,
  last_updated).
- `docs/architecture.md` and `docs/operations.md`.
- `.github/workflows/aiassistant.yml` — CI with ruff, pytest, vite
  lint/build and a docker buildx job. Runs only on changes inside
  `aiassistant/**` so the main `ci.yml` is untouched.
- `docker-compose.yml` at the module root for a one-shot full stack.

### Fixed

- `agent/nodes.py` was importing the `web_search` *module* instead of
  the function, which would have crashed the graph the first time a
  query fell through to the web-search branch. Corrected to
  `from tools.web_search import web_search as web_search_tool` with a
  comment so the bug doesn't regress.
- `main.py` previously raised on startup when no LLM key was set,
  breaking even health probes. Now it logs a warning and exposes
  `llm_configured=false` from `/api/aiassistant/health`.
- Dead duplicate code after an early `return` in `main.py` removed.

### Security

- `chat_logs.db`, `*.log` and `.env` are matched by `.gitignore`.
- `.env.example` ships placeholders only; no real keys are ever
  committed.

### CI

- The new workflow is independent of the existing `ci.yml`. The
  SkillNova lint/test/build pipeline keeps running exactly as it did
  before this change.
