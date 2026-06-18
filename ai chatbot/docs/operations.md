# AI Chatbot — operations runbook

Common failure modes and how to triage them. Mirrors the structure of
the main SkillNova ops docs so on-call doesn't have to context-switch.

---

## Health endpoint

```
GET /api/health
{
  "status": "ok",
  "llm_configured": true,
  "cache_ready": true,
  "graph_ready": true
}
```

- `llm_configured=false` → no GROQ/GEMINI/DEEPSEEK key in env. Add one
  in `ai-backend/.env` and restart the service. Until then, the chat
  endpoints will return a 503 with a clear error.
- `graph_ready=false` → LangGraph failed to compile (very rare; check
  the application log for the exception trace).
- `cache_ready=false` → cache init crashed; chat will still work
  because cache is best-effort.

## Frequently seen errors

| Symptom | Cause | Fix |
| --- | --- | --- |
| `AI service unavailable. Try again later.` | All three LLM providers failed | Check provider status pages; check `logs/app.log` for `[LLM ERROR]` lines |
| `Request timed out.` | 25s graph timeout hit | Likely a slow LLM or huge web-search results; see `LOGS` below |
| `Your message contains restricted or unsafe content.` | Guardrail regex hit | True positive; relax patterns in `guardrails.py` if it's a false positive |
| HuggingFace `all-MiniLM-L6-v2` 404 on first boot | No outbound network from container | Bake the model into the image (multi-stage `pip install` + `huggingface-cli download`) |
| `429 Too Many Requests` from Gemini | Quota hit on free tier | Set `GEMINI_API_KEY` on a paid project, or let the rate limiter cool off (the global `RateLimiter` enforces 200 ms between calls) |

## Where to look

| Concern | File |
| --- | --- |
| LLM provider chain | `ai-backend/llm.py` |
| Circuit breaker state | `CircuitBreaker.can_execute()` |
| Structured logs | `ai-backend/logs/app.log` (line per JSON record) |
| Request ID | `request_id_var` in `logging_config.py` |
| Guardrail patterns | `BLOCKED_PATTERNS` in `ai-backend/guardrails.py` |
| Cache backend | `create_cache()` in `ai-backend/cache.py` |
| Knowledge base files | `ai-backend/knowledge_base/*.txt` |

## Force a clean re-index

The FAISS index is built in-memory at startup, so a service restart is
enough. To force it, kill the container and start a new one.

If you also need to wipe the SQLite history:

```
rm ai-backend/chat_logs.db
```

The schema is recreated on the next startup (`init_db()` in
`database.py`).

## Scaling notes

- The agent graph runs in a `ThreadPoolExecutor` with 8 workers and
  `_agent_semaphore=12` for in-flight requests. Bump both for higher
  load, but watch the LLM provider quota first.
- The semantic cache is the biggest win — most repeat questions hit
  the cache and skip the LLM entirely.
- For multi-instance deployment, point `REDIS_URL` at a shared Redis;
  the in-memory cache is per-pod.

## Local dev loop

```bash
# Backend
cd "ai chatbot/ai-backend"
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py

# Frontend
cd "ai chatbot/ai-frontend"
npm install
npm run dev
```
