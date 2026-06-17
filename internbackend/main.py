"""
SkillNova AI chatbot backend.

A FastAPI service that fronts a LangGraph agentic RAG pipeline with a
multi-provider LLM race (Gemini -> Groq -> DeepSeek) and a graceful
fallback to template-based replies.

Endpoints
---------
GET  /                        Liveness
GET  /api/health              Readiness check
GET  /api/session             New UUID session
POST /api/chat                One-shot JSON response
POST /api/chat/stream         Server-Sent Events token stream
POST /api/integrate/chat      External integration endpoint
POST /api/integrate/stream    External integration streaming
GET  /api/ws/chat             WebSocket upgrade (placeholder)

Environment
-----------
GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, TAVILY_API_KEY (optional)
DATABASE_URL                  (default: sqlite:///./skillnova_chat.db)
CORS_ORIGINS                  (comma-separated; default: "*")
LOG_LEVEL                     (default: INFO)
RATE_LIMIT_PER_MIN            (default: 60)
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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from cache import create_cache
from database import ChatSession, SessionLocal, init_db
from fallback import off_topic_response, render_fallback
from guardrails import detect_language, validate_input
from llm import get_llm_response
from logging_config import get_logger, setup_logging
from retriever.vectorstore import build_vectorstore

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
_executor = ThreadPoolExecutor(max_workers=int(os.getenv("AGENT_WORKERS", "8")))
_agent_semaphore = asyncio.Semaphore(int(os.getenv("AGENT_CONCURRENCY", "12")))
_rate_per_min = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
_rate_state: dict[str, list[float]] = {}
_rate_lock = asyncio.Lock()


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
        turn = (
            db.query(ChatSession).filter_by(session_id=session_id).count() + 1
        )
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
    """Sliding-window per-IP rate limit. Raises HTTPException when exceeded."""
    if _rate_per_min <= 0:
        return
    now = time.time()
    async with _rate_lock:
        bucket = _rate_state.setdefault(ip, [])
        # Drop entries older than 60s.
        bucket[:] = [t for t in bucket if now - t < 60]
        if len(bucket) >= _rate_per_min:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")
        bucket.append(now)


def _format_reply(text: str) -> str:
    """Tidy LLM output into a consistent shape (no Markdown injection of garbled bullets)."""
    text = (text or "").strip()
    if not text:
        return text
    cleaned: list[str] = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        # Promote bare dashes or bullets to a consistent shape.
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
app = FastAPI(title="SkillNova AI", version="3.0.0", lifespan=lifespan)


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
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
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


_start_time = time.time()


# ----------------------------------------------------------------------
# ROUTES
# ----------------------------------------------------------------------
@app.get("/", response_model=dict)
def root():
    return {"status": "running", "service": "skillnova-ai", "version": "3.0.0"}


@app.get("/api/session", response_model=SessionResponse)
def create_session():
    return SessionResponse(session_id=str(uuid.uuid4()))


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if agent_graph is not None else "initialising",
        uptime_s=round(time.time() - _start_time, 2),
        components={
            "agent": agent_graph is not None,
            "cache": _response_cache is not None,
        },
    )


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

    result = await _run_graph(state)
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
    try:
        response = await _process(req, request)
        if not response.error:
            save_chat_turn(response.session_id, req.message, response.reply)
        return response
    except HTTPException:
        raise
    except Exception:
        logger.exception("[FINAL CHAT ERROR]")
        return ChatResponse(
            reply="System handled error safely.",
            session_id=req.session_id or str(uuid.uuid4()),
            error=True,
            request_id=request.state.request_id,
        )


async def _event_stream(req: ChatRequest, request: Request) -> AsyncGenerator[str, None]:
    """SSE stream: emits {type: token} chunks then a {type: done} event."""
    response = await _process(req, request)
    chunk_size = 24
    text = response.reply
    for i in range(0, len(text), chunk_size):
        piece = text[i : i + chunk_size]
        yield f"data: {json.dumps({'type': 'token', 'content': piece})}\n\n"
        await asyncio.sleep(0.01)
    payload = {
        "type": "done",
        "session_id": response.session_id,
        "confidence": response.confidence,
        "sources": response.sources,
        "escalated": response.escalated,
        "request_id": response.request_id,
    }
    yield f"data: {json.dumps(payload)}\n\n"
    if not response.error:
        save_chat_turn(response.session_id, req.message, response.reply)


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    return StreamingResponse(
        _event_stream(req, request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


# Thin aliases so the portfolio's /api/chat proxy can hit the same backend.
@app.post("/api/integrate/chat", response_model=ChatResponse)
async def integrate_chat(req: ChatRequest, request: Request):
    return await chat(req, request)


@app.post("/api/integrate/stream")
async def integrate_stream(req: ChatRequest, request: Request):
    return await chat_stream(req, request)


@app.get("/api/ws/chat")
def ws_chat_placeholder():
    return {"info": "WebSocket upgrade not yet wired; use /api/chat/stream instead."}


# Expose render_fallback + off_topic_response for explicit programmatic use.
app.state.render_fallback = render_fallback  # type: ignore[attr-defined]
app.state.off_topic_response = off_topic_response  # type: ignore[attr-defined]


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=bool(os.getenv("RELOAD", "false")))