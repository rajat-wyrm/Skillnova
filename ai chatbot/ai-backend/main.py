# ─────────────────────────────────────────────────────────────────────
# SkillNova AI Chatbot — Python backend
#
# Agentic Retrieval-Augmented Generation (RAG) service that ships
# alongside the SkillNova platform. Drop-in module: no changes to the
# existing SkillNova frontend or Node/Express backend are required.
#
#   python main.py                # dev (auto-reload)
#   uvicorn main:app --reload     # dev (uvicorn)
#   docker compose up             # production
#
#   pytest                        # run tests
#   ruff check .                  # lint
# ─────────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agent.graph import build_graph
from agent.nodes import set_dependencies
from cache import create_cache
from database import ChatSession, SessionLocal
from guardrails import detect_language, validate_input
from logging_config import setup_logging
from retriever.vectorstore import build_vectorstore

# ─────────────────────────────────────────────────────────────────────
# Boot
# ─────────────────────────────────────────────────────────────────────
load_dotenv()
setup_logging()
logger = logging.getLogger("skillnova.main")

if not (os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY")):
    # Don't crash startup — health & session endpoints must still work.
    # Chat requests will fail gracefully with a clear error message.
    logger.warning(
        "[BOOT] No LLM provider key configured (set GROQ_API_KEY or GEMINI_API_KEY)."
    )

# ─────────────────────────────────────────────────────────────────────
# Globals — initialised in lifespan()
# ─────────────────────────────────────────────────────────────────────
agent_graph = None
_response_cache = None
_executor = ThreadPoolExecutor(max_workers=8)
_agent_semaphore = asyncio.Semaphore(12)


# ─────────────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────────────
def get_chat_history(session_id: str) -> str:
    db = None
    try:
        db = SessionLocal()
        chats = (
            db.query(ChatSession)
            .filter_by(session_id=session_id)
            .order_by(ChatSession.turn_number)
            .limit(10)
            .all()
        )
        return "\n".join(
            f"User: {c.user_message}\nBot: {c.bot_response}" for c in chats
        )
    except Exception as exc:  # pragma: no cover — defensive
        logger.error("[DB READ ERROR] %s", exc)
        return ""
    finally:
        if db is not None:
            db.close()


def save_chat_turn(session_id: str, user_msg: str, bot_msg: str) -> None:
    db = None
    try:
        db = SessionLocal()
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
    except Exception as exc:  # pragma: no cover — defensive
        logger.error("[DB WRITE ERROR] %s", exc)
    finally:
        if db is not None:
            db.close()


# ─────────────────────────────────────────────────────────────────────
# Init
# ─────────────────────────────────────────────────────────────────────
def init_pipeline() -> None:
    """Build the FAISS index + LangGraph once at startup."""
    global agent_graph, _response_cache

    logger.info("[INIT] Starting pipeline…")

    vectorstore = build_vectorstore()
    set_dependencies(vectorstore)

    agent_graph = build_graph()

    _response_cache, _ = create_cache(redis_enabled=bool(os.getenv("REDIS_URL")))

    logger.info("[INIT] Pipeline ready")


# ─────────────────────────────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pipeline()
    yield


app = FastAPI(
    title="SkillNova AI",
    version="1.0.0",
    description="Agentic RAG chatbot that ships alongside the SkillNova platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────────────
# Routes — liveness / session
# ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "running", "service": "skillnova-ai-chatbot"}


@app.get("/api/session")
def create_session():
    return {"session_id": str(uuid.uuid4())}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "llm_configured": bool(
            os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY")
        ),
        "cache_ready": _response_cache is not None,
        "graph_ready": agent_graph is not None,
    }


# ─────────────────────────────────────────────────────────────────────
# Chat — hardened & idempotent
# ─────────────────────────────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if agent_graph is None:
        raise HTTPException(status_code=503, detail="Pipeline not ready")

    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Empty message")

    session_id = req.session_id or str(uuid.uuid4())
    start = time.time()

    # Guardrails
    valid, guard_msg = validate_input(message)
    if not valid:
        return ChatResponse(reply=guard_msg, session_id=session_id, error=True)

    language = detect_language(message) or "en"

    # Cache lookup
    cache_key = f"{message}:{language}"
    if _response_cache is not None:
        try:
            cached = _response_cache.get(cache_key)
            if cached:
                return ChatResponse(**cached)
        except Exception:  # pragma: no cover
            logger.warning("[CACHE READ FAILED]")

    # Build state for the agentic graph
    state = {
        "question": message,
        "language": language,
        "role": req.role,
        "session_id": session_id,
        "chat_history": get_chat_history(session_id),
        "documents": [],
        "web_results": "",
        "tools_used": [],
        "llm_calls_count": 0,
    }

    # Run the graph under a hard timeout + concurrency cap.
    try:
        async with asyncio.timeout(25):
            async with _agent_semaphore:
                loop = asyncio.get_running_loop()
                raw_result = await loop.run_in_executor(
                    _executor, agent_graph.invoke, state
                )
    except asyncio.TimeoutError:
        return ChatResponse(
            reply="Request timed out.", session_id=session_id, error=True
        )
    except Exception:
        logger.exception("[FINAL CHAT ERROR]")
        return ChatResponse(
            reply="System handled error safely.",
            session_id=session_id,
            error=True,
        )

    result = raw_result if isinstance(raw_result, dict) else {}
    reply = str(result.get("generation") or "No response generated.").strip()
    confidence = float(result.get("confidence") or 0.0)

    # Format bullet points safely (don't break empty replies)
    if reply:
        reply = (
            reply.replace("•", "\n•")
            .replace("- ", "\n- ")
        )
        reply = "\n".join(line.strip() for line in reply.split("\n") if line.strip())

    sources: list[str] = []
    docs = result.get("documents") or []
    if isinstance(docs, list):
        for d in docs:
            try:
                src = getattr(d, "metadata", {}).get("source")
                if src:
                    sources.append(src)
            except Exception:
                continue

    response_data = {
        "reply": reply or "No response generated.",
        "session_id": session_id,
        "confidence": confidence,
        "sources": sorted(set(sources)),
        "error": False,
    }

    # Cache + persist (best-effort)
    if _response_cache is not None:
        try:
            _response_cache.set(cache_key, response_data, ttl=300)
        except Exception:  # pragma: no cover
            logger.warning("[CACHE WRITE FAILED]")
    save_chat_turn(session_id, message, response_data["reply"])

    logger.info("[CHAT] %dms", int((time.time() - start) * 1000))
    return ChatResponse(**response_data)


# ─────────────────────────────────────────────────────────────────────
# Chat — Server-Sent Events stream
# ─────────────────────────────────────────────────────────────────────
@app.post("/api/chat/stream")
async def stream_chat(req: ChatRequest):
    if agent_graph is None:
        raise HTTPException(status_code=503, detail="Pipeline not ready")

    async def event_generator():
        message = req.message.strip()
        session_id = req.session_id or str(uuid.uuid4())

        if not message:
            yield {"event": "error", "data": "Empty message"}
            return

        valid, guard_msg = validate_input(message)
        if not valid:
            yield {"event": "error", "data": guard_msg}
            return

        language = detect_language(message) or "en"
        state = {
            "question": message,
            "language": language,
            "role": req.role,
            "session_id": session_id,
            "chat_history": get_chat_history(session_id),
            "documents": [],
            "web_results": "",
            "tools_used": [],
            "llm_calls_count": 0,
        }

        try:
            loop = asyncio.get_running_loop()
            raw_result = await loop.run_in_executor(
                _executor, agent_graph.invoke, state
            )
            result = raw_result if isinstance(raw_result, dict) else {}
            reply = str(result.get("generation") or "No response generated.")
        except Exception as exc:
            logger.exception("[STREAM ERROR]")
            yield {"event": "error", "data": str(exc)}
            return

        for word in reply.split():
            yield {"event": "message", "data": word}
            await asyncio.sleep(0.05)

        save_chat_turn(session_id, message, reply)
        yield {"event": "done", "data": "completed"}

    return EventSourceResponse(event_generator())


# ─────────────────────────────────────────────────────────────────────
# Entrypoint
# ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("SKILLNOVA_AI_HOST", "0.0.0.0"),
        port=int(os.getenv("SKILLNOVA_AI_PORT", "8000")),
        reload=True,
    )
