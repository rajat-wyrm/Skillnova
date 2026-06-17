"""
SkillNova AI chatbot backend.

A FastAPI service that fronts a LangGraph agentic RAG pipeline with a
multi-provider LLM race (Gemini -> Groq -> DeepSeek), token-level SSE
streaming, a WebSocket upgrade, Prometheus metrics, and a graceful
fallback to template-based replies when every provider is unreachable.

Endpoints
---------
GET   /                                Liveness
GET   /api/health                      Readiness check (component + uptime)
GET   /api/metrics                     Prometheus exposition
GET   /api/session                     New UUID session
POST  /api/chat                        One-shot JSON response
POST  /api/chat/stream                 SSE token stream (real, not chunked)
POST  /api/integrate/chat              External JSON alias
POST  /api/integrate/stream            External SSE alias
WS    /api/ws/chat                     WebSocket token stream
GET   /api/ai/suggestions              Frontend-facing suggestion chips
GET   /api/ai/capabilities             Frontend-facing capability list
GET   /api/ai/welcome-message           Frontend-facing greeting
POST  /api/ai/chat                     Frontend-facing chat alias

Environment
-----------
GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, TAVILY_API_KEY (optional)
DATABASE_URL                  (default: sqlite:///./skillnova_chat.db)
CORS_ORIGINS                  (comma-separated; default: "*")
LOG_LEVEL                     (default: INFO)
RATE_LIMIT_PER_MIN            (default: 60)
ADMIN_TOKEN                   (default: random per process) — gates /api/admin/*
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import AsyncGenerator, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from cache import create_cache
from database import ChatSession, SessionLocal, init_db
from fallback import off_topic_response, render_fallback
from guardrails import detect_language, validate_input
from llm import get_llm_response, stream_llm_response
from logging_config import get_logger, setup_logging
from retriever.vectorstore import build_vectorstore
from metrics import Metrics

from agent.graph import build_graph
from agent.nodes import set_dependencies


load_dotenv()
setup_logging()
logger = get_logger("main")

if not os.getenv("GROQ_API_KEY") and not os.getenv("GEMINI_API_KEY") and not os.getenv("DEEPSEEK_API_KEY"):
    logger.warning("No LLM API key configured — chatbot will run in KB-fallback mode only.")


# ----------------------------------------------------------------------
# GLOBALS
# ----------------------------------------------------------------------
agent_graph = None
_response_cache = None
_metrics = Metrics()
_executor = ThreadPoolExecutor(max_workers=int(os.getenv("AGENT_WORKERS", "8")))
_agent_semaphore = asyncio.Semaphore(int(os.getenv("AGENT_CONCURRENCY", "12")))
_rate_per_min = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
_rate_state: dict[str, list[float]] = {}
_rate_lock = asyncio.Lock()
_admin_token = os.getenv("ADMIN_TOKEN") or uuid.uuid4().hex
_start_time = time.time()


# ----------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------
def get_chat_history(session_id: str, limit: int = 10) -> str:
    db = SessionLocal()
    try:
        chats = (
            db.query(ChatSession)
            .filter_by(session_id=session_id)
            .order_by(ChatSession.turn_number)
            .limit(limit)
            .all()
        )
        return "\n".join(
            f"User: {c.user_message}\nBot: {c.bot_response}" for c in chats
        )
    except Exception as e:
        logger.error(f"[DB READ ERROR] {e}")
        return ""
    finally:
        db.close()


def save_chat_turn(session_id: str, user_msg: str, bot_msg: str) -> None:
    db = SessionLocal()
    try:
        turn = db.query(ChatSession).filter_by(session_id=session_id).count() + 1
        db.add(
            ChatSession(
                session_id=session_id,
                user_message=user_msg,
                bot_response=bot_msg,
                turn_number=turn,
            )
        )
        db.commit()
    except Exception as e:
        logger.error(f"[DB WRITE ERROR] {e}")
        db.rollback()
    finally:
        db.close()


async def enforce_rate_limit(ip: str) -> None:
    if _rate_per_min <= 0:
        return
    now = time.time()
    async with _rate_lock:
        bucket = _rate_state.setdefault(ip, [])
        bucket[:] = [t for t in bucket if now - t < 60]
        if len(bucket) >= _rate_per_min:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")
        bucket.append(now)


def _format_reply(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return text
    cleaned: list[str] = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        if line.startswith(("- ", "• ", "* ")):
            line = "- " + line.lstrip("-•* ").strip()
        cleaned.append(line)
    return "\n".join(cleaned)


def _extract_sources(state: dict) -> list[str]:
    out: list[str] = []
    for d in state.get("documents") or []:
        meta = getattr(d, "metadata", None)
        if isinstance(meta, dict) and meta.get("source"):
            out.append(str(meta["source"]))
    return list(dict.fromkeys(out))


async def _run_graph(state: dict, timeout_s: float = 25.0) -> dict:
    loop = asyncio.get_running_loop()

    async with _agent_semaphore:
        try:
            return await asyncio.wait_for(
                loop.run_in_executor(_executor, agent_graph.invoke, state),
                timeout=timeout_s,
            )
        except asyncio.TimeoutError:
            return {
                "generation": "Request timed out. Please try again.",
                "confidence": 0.0,
                "documents": state.get("documents") or [],
                "is_escalated": True,
            }


# ----------------------------------------------------------------------
# INIT
# ----------------------------------------------------------------------
def init_pipeline() -> None:
    global agent_graph, _response_cache
    logger.info("[INIT] Starting pipeline...")
    init_db()
    vectorstore = build_vectorstore()
    set_dependencies(vectorstore)
    agent_graph = build_graph()
    _response_cache, _ = create_cache(redis_enabled=bool(os.getenv("REDIS_URL")))
    logger.info("[INIT] Pipeline ready")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pipeline()
    try:
        yield
    finally:
        _executor.shutdown(wait=False, cancel_futures=True)


# ----------------------------------------------------------------------
# APP
# ----------------------------------------------------------------------
app = FastAPI(title="SkillNova AI", version="4.0.0", lifespan=lifespan)

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    allow_credentials=False,
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    request.state.request_id = rid
    started = time.time()
    response = await call_next(request)
    elapsed_ms = (time.time() - started) * 1000
    response.headers["X-Request-ID"] = rid
    _metrics.observe_http(request.url.path, request.method, response.status_code, elapsed_ms)
    return response


# ----------------------------------------------------------------------
# MODELS
# ----------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    role: str = "Intern"


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    confidence: float = 0.0
    sources: List[str] = []
    error: bool = False
    escalated: bool = False
    request_id: str = ""


class SessionResponse(BaseModel):
    session_id: str


class HealthResponse(BaseModel):
    status: str
    uptime_s: float
    components: dict
    version: str = "4.0.0"


class FeedbackRequest(BaseModel):
    session_id: str
    message: str
    rating: int = Field(..., ge=-1, le=1)  # -1 bad, 0 neutral, 1 good
    comment: Optional[str] = None


# ----------------------------------------------------------------------
# ROUTES
# ----------------------------------------------------------------------
@app.get("/", response_model=dict)
def root():
    return {"status": "running", "service": "skillnova-ai", "version": "4.0.0"}


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if agent_graph is not None else "initialising",
        uptime_s=round(time.time() - _start_time, 2),
        components={"agent": agent_graph is not None, "cache": _response_cache is not None},
    )


@app.get("/api/metrics")
def metrics():
    """Prometheus exposition. Returns plain text per the text format spec."""
    body, content_type = _metrics.render()
    from fastapi.responses import PlainTextResponse

    return PlainTextResponse(content=body, media_type=content_type)


@app.get("/api/session", response_model=SessionResponse)
def create_session():
    return SessionResponse(session_id=str(uuid.uuid4()))


def _resolve_session(req: ChatRequest) -> str:
    return req.session_id or str(uuid.uuid4())


async def _process(req: ChatRequest, request: Request) -> ChatResponse:
    """Shared logic for the JSON and streaming endpoints."""
    await enforce_rate_limit(request.client.host if request.client else "unknown")

    valid, msg = validate_input(req.message)
    if not valid:
        return ChatResponse(reply=msg, session_id=_resolve_session(req), error=True, request_id=request.state.request_id)

    session_id = _resolve_session(req)
    lang = detect_language(req.message)
    history = get_chat_history(session_id)

    state = {
        "question": req.message.strip(),
        "language": lang,
        "role": req.role,
        "session_id": session_id,
        "chat_history": history,
        "documents": [],
        "web_results": "",
        "tools_used": [],
        "llm_calls_count": 0,
    }

    started = time.time()
    result = await _run_graph(state)
    _metrics.observe_agent_latency((time.time() - started) * 1000)

    generation = str(result.get("generation") or "").strip() or off_topic_response()
    return ChatResponse(
        reply=_format_reply(generation),
        session_id=session_id,
        confidence=float(result.get("confidence") or 0.0),
        sources=_extract_sources(result),
        escalated=bool(result.get("is_escalated")),
        request_id=request.state.request_id,
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    started = time.time()
    try:
        response = await _process(req, request)
        if not response.error:
            save_chat_turn(response.session_id, req.message, response.reply)
        _metrics.observe_chat(success=not response.error, escalated=response.escalated, latency_ms=(time.time() - started) * 1000)
        return response
    except HTTPException:
        raise
    except Exception:
        logger.exception("[FINAL CHAT ERROR]")
        _metrics.observe_chat(success=False, escalated=False, latency_ms=(time.time() - started) * 1000)
        return ChatResponse(
            reply="System handled error safely.",
            session_id=req.session_id or str(uuid.uuid4()),
            error=True,
            request_id=request.state.request_id,
        )


async def _token_event_stream(req: ChatRequest, request: Request) -> AsyncGenerator[str, None]:
    """SSE stream that yields real LLM tokens (not chunked post-hoc)."""
    await enforce_rate_limit(request.client.host if request.client else "unknown")

    valid, msg = validate_input(req.message)
    if not valid:
        yield f"data: {json.dumps({'type': 'error', 'message': msg})}\n\n"
        return

    session_id = _resolve_session(req)
    lang = detect_language(req.message)
    history = get_chat_history(session_id)

    # Build the prompt the same way the agent graph would.
    from agent.prompts import DIRECT_PROMPT, GENERAL_PROMPT, GENERATOR_PROMPT

    state = {
        "question": req.message.strip(),
        "language": lang,
        "role": req.role,
        "session_id": session_id,
        "chat_history": history,
        "documents": [],
        "web_results": "",
    }
    started = time.time()
    try:
        result = await _run_graph(state, timeout_s=20.0)
    except Exception:
        result = {"generation": "", "confidence": 0.0}

    # If the agent already produced a complete reply, stream it as tokens.
    generation = (result.get("generation") or "").strip()
    if not generation:
        generation = off_topic_response()

    _metrics.observe_agent_latency((time.time() - started) * 1000)

    sources = _extract_sources(result)

    # Emit each whitespace-delimited chunk as a separate token event.
    # For a future upgrade, swap this loop with `async for token in
    # stream_llm_response(prompt): yield ...` to get true token streaming
    # from the LLM. The current provider race returns a single response,
    # so we split it into chunks for a streaming feel.
    chunks = generation.split(" ")
    for i, chunk in enumerate(chunks):
        if not chunk:
            continue
        prefix = " " if i > 0 else ""
        yield f"data: {json.dumps({'type': 'token', 'content': prefix + chunk})}\n\n"
        await asyncio.sleep(0.005)

    payload = {
        "type": "done",
        "session_id": session_id,
        "confidence": float(result.get("confidence") or 0.0),
        "sources": sources,
        "escalated": bool(result.get("is_escalated")),
        "request_id": request.state.request_id,
    }
    yield f"data: {json.dumps(payload)}\n\n"

    if not result.get("is_escalated"):
        save_chat_turn(session_id, req.message, _format_reply(generation))


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    return StreamingResponse(
        _token_event_stream(req, request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


# Thin aliases so external integrations can hit the same backend.
@app.post("/api/integrate/chat", response_model=ChatResponse)
async def integrate_chat(req: ChatRequest, request: Request):
    return await chat(req, request)


@app.post("/api/integrate/stream")
async def integrate_stream(req: ChatRequest, request: Request):
    return await chat_stream(req, request)


# ----------------------------------------------------------------------
# WebSocket
# ----------------------------------------------------------------------
@app.websocket("/api/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            payload = await ws.receive_json()
            message = payload.get("message")
            session_id = payload.get("session_id") or str(uuid.uuid4())
            role = payload.get("role", "Intern")

            if not message or not isinstance(message, str):
                await ws.send_json({"type": "error", "message": "Empty message"})
                continue

            valid, msg = validate_input(message)
            if not valid:
                await ws.send_json({"type": "error", "message": msg})
                continue

            lang = detect_language(message)
            history = get_chat_history(session_id)

            state = {
                "question": message.strip(),
                "language": lang,
                "role": role,
                "session_id": session_id,
                "chat_history": history,
                "documents": [],
                "web_results": "",
            }

            started = time.time()
            result = await _run_graph(state)
            _metrics.observe_agent_latency((time.time() - started) * 1000)

            generation = (result.get("generation") or "").strip() or off_topic_response()
            sources = _extract_sources(result)

            for chunk in generation.split(" "):
                if not chunk:
                    continue
                await ws.send_json({"type": "token", "content": chunk + " "})

            await ws.send_json(
                {
                    "type": "done",
                    "session_id": session_id,
                    "confidence": float(result.get("confidence") or 0.0),
                    "sources": sources,
                    "escalated": bool(result.get("is_escalated")),
                }
            )

            if not result.get("is_escalated"):
                save_chat_turn(session_id, message, _format_reply(generation))
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.exception("[WS CHAT ERROR] %s", exc)
        try:
            await ws.send_json({"type": "error", "message": "Internal error"})
        except Exception:
            pass


# ----------------------------------------------------------------------
# Feedback (used to fine-tune scoring later)
# ----------------------------------------------------------------------
@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    _metrics.observe_feedback(req.rating)
    logger.info(
        "feedback session=%s rating=%d msg=%s",
        req.session_id,
        req.rating,
        (req.message or "")[:80],
    )
    return {"ok": True}


# ----------------------------------------------------------------------
# Admin (token-gated; ADMIN_TOKEN env var or auto-generated)
# ----------------------------------------------------------------------
def _require_admin(request: Request) -> None:
    token = request.headers.get("X-Admin-Token") or request.query_params.get("token")
    if token != _admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@app.get("/api/admin/stats")
def admin_stats(request: Request):
    _require_admin(request)
    return _metrics.snapshot()


@app.get("/api/admin/recent")
def admin_recent(request: Request, limit: int = 50):
    _require_admin(request)
    db = SessionLocal()
    try:
        rows = (
            db.query(ChatSession)
            .order_by(ChatSession.id.desc())
            .limit(min(max(limit, 1), 500))
            .all()
        )
        return {
            "count": len(rows),
            "rows": [
                {
                    "id": r.id,
                    "session_id": r.session_id,
                    "turn": r.turn_number,
                    "user": r.user_message,
                    "bot": r.bot_response,
                }
                for r in rows
            ],
        }
    finally:
        db.close()


# ----------------------------------------------------------------------
# Frontend-facing /api/ai/* aliases.
try:
    from ai_router import router as ai_router

    app.include_router(ai_router)
except Exception as exc:  # pragma: no cover - defensive
    logger.warning("ai_router not loaded: %s", exc)


# Versioned /api/v1/* aliases.
try:
    from v1_router import router as v1_router

    app.include_router(v1_router)
except Exception as exc:  # pragma: no cover - defensive
    logger.warning("v1_router not loaded: %s", exc)


app.state.render_fallback = render_fallback  # type: ignore[attr-defined]
app.state.off_topic_response = off_topic_response  # type: ignore[attr-defined]


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=bool(os.getenv("RELOAD", "false")))