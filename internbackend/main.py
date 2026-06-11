import os
import uuid
import time
import asyncio
import logging
from typing import Optional, List
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import SessionLocal, ChatSession
from retriever.vectorstore import build_vectorstore
from agent.nodes import set_dependencies
from agent.graph import build_graph
from guardrails import validate_input, detect_language
from cache import create_cache
from logging_config import setup_logging

# -----------------------------------------------
# ENV + LOGGING
# -----------------------------------------------
load_dotenv()
setup_logging()
logger = logging.getLogger("skillnova.main")

# safer env check
if not os.getenv("GROQ_API_KEY") and not os.getenv("GEMINI_API_KEY"):
    raise ValueError("No LLM API key found (GROQ or GEMINI required)")

# -----------------------------------------------
# GLOBALS
# -----------------------------------------------
agent_graph = None
_response_cache = None
_executor = ThreadPoolExecutor(max_workers=8)
_agent_semaphore = asyncio.Semaphore(12)

# -----------------------------------------------
# DB HELPERS (UPGRADED SAFE)
# -----------------------------------------------
def get_chat_history(session_id: str) -> str:
    db = None
    try:
        db = SessionLocal()
        chats = db.query(ChatSession)\
            .filter_by(session_id=session_id)\
            .order_by(ChatSession.turn_number)\
            .limit(10)\
            .all()

        return "\n".join([
            f"User: {c.user_message}\nBot: {c.bot_response}"
            for c in chats
        ])
    except Exception as e:
        logger.error(f"[DB READ ERROR] {e}")
        return ""
    finally:
        if db:
            db.close()


def save_chat_turn(session_id: str, user_msg: str, bot_msg: str):
    db = None
    try:
        db = SessionLocal()

        turn = db.query(ChatSession)\
            .filter_by(session_id=session_id)\
            .count() + 1

        db.add(ChatSession(
            session_id=session_id,
            user_message=user_msg,
            bot_response=bot_msg,
            turn_number=turn
        ))
        db.commit()

    except Exception as e:
        logger.error(f"[DB WRITE ERROR] {e}")
    finally:
        if db:
            db.close()


# -----------------------------------------------
# INIT
# -----------------------------------------------
def init_pipeline():
    global agent_graph, _response_cache

    logger.info("[INIT] Starting pipeline...")

    vectorstore = build_vectorstore()
    set_dependencies(vectorstore)

    agent_graph = build_graph()

    _response_cache, _ = create_cache(redis_enabled=False)

    logger.info("[INIT] Pipeline ready")


# -----------------------------------------------
# FASTAPI
# -----------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pipeline()
    yield


app = FastAPI(title="SkillNova AI", version="PRODUCTION", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------
# MODELS
# -----------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    role: str = "Intern"


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    confidence: float = 0.0
    sources: List[str] = []
    error: bool = False


# -----------------------------------------------
# ROUTES
# -----------------------------------------------
@app.get("/")
def root():
    return {"status": "running"}


@app.get("/api/session")
def create_session():
    return {"session_id": str(uuid.uuid4())}


# -----------------------------------------------
# CHAT (FULLY HARDENED + OPTIMIZED)
# -----------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):

    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    session_id = req.session_id or str(uuid.uuid4())

    try:
        start = time.time()

        # ---------------- GUARDRAILS ----------------
        valid, msg = validate_input(req.message)
        if not valid:
            return ChatResponse(reply=msg, session_id=session_id, error=True)

        lang = detect_language(req.message) or "en"

        # ---------------- CACHE ----------------
        cache_key = f"{req.message}:{lang}"
        if _response_cache:
            try:
                cached = _response_cache.get(cache_key)
                if cached:
                    return ChatResponse(**cached)
            except Exception:
                logger.warning("[CACHE READ FAILED]")

        # ---------------- HISTORY ----------------
        history = get_chat_history(session_id)

        # ---------------- STATE ----------------
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

        # ---------------- GRAPH EXECUTION ----------------
        try:
            async with asyncio.timeout(25):
                async with _agent_semaphore:
                    loop = asyncio.get_running_loop()
                    raw_result = await loop.run_in_executor(
                        _executor,
                        agent_graph.invoke,
                        state
                    )
        except asyncio.TimeoutError:
            return ChatResponse(
                reply="Request timed out.",
                session_id=session_id,
                error=True
            )

        # ---------------- SAFE RESULT ----------------
        result = raw_result if isinstance(raw_result, dict) else {}

        reply = str(result.get("generation") or "No response generated.")
        confidence = float(result.get("confidence") or 0.0)

        # 🔥 FORMAT ENHANCER (IMPORTANT)
        reply = reply.strip()
        reply = reply.replace("•", "\n•")
        reply = reply.replace("- ", "\n- ")
        reply = "\n".join([line.strip() for line in reply.split("\n") if line.strip()])

        # ---------------- SOURCES ----------------
        sources = []
        docs = result.get("documents")

        if isinstance(docs, list):
            for d in docs:
                try:
                    if hasattr(d, "metadata") and isinstance(d.metadata, dict):
                        src = d.metadata.get("source")
                        if src:
                            sources.append(src)
                except Exception:
                    continue

        response_data = {
            "reply": reply,
            "session_id": session_id,
            "confidence": confidence,
            "sources": list(set(sources)),
            "error": False
        }

        # ---------------- CACHE SAVE ----------------
        if _response_cache:
            try:
                _response_cache.set(cache_key, response_data, ttl=300)
            except Exception:
                logger.warning("[CACHE WRITE FAILED]")

        # ---------------- DB SAVE ----------------
        save_chat_turn(session_id, req.message, reply)

        logger.info(f"[CHAT] {int((time.time()-start)*1000)}ms")

        return ChatResponse(**response_data)

    except Exception:
        logger.exception("[FINAL CHAT ERROR]")

        return ChatResponse(
            reply="System handled error safely.",
            session_id=session_id,
            error=True
        )

        # ---------------- GRAPH EXECUTION ----------------
        try:
            async with asyncio.timeout(25):
                async with _agent_semaphore:
                    loop = asyncio.get_running_loop()
                    raw_result = await loop.run_in_executor(
                        _executor,
                        agent_graph.invoke,
                        state
                    )
        except asyncio.TimeoutError:
            return ChatResponse(
                reply="Request timed out.",
                session_id=session_id,
                error=True
            )

        # ---------------- SAFE RESULT ----------------
        result = raw_result if isinstance(raw_result, dict) else {}

        reply = str(result.get("generation") or "No response generated.")
        confidence = float(result.get("confidence") or 0.0)

        # enforce structured formatting safety
        if len(reply.split("\n")) > 8:
            reply = "\n".join(reply.split("\n")[:6])

        # ---------------- SAFE SOURCES ----------------
        sources = []
        docs = result.get("documents")

        if isinstance(docs, list):
            for d in docs:
                try:
                    if hasattr(d, "metadata") and isinstance(d.metadata, dict):
                        src = d.metadata.get("source")
                        if src:
                            sources.append(src)
                except Exception:
                    continue

        response_data = {
            "reply": reply.strip(),
            "session_id": session_id,
            "confidence": confidence,
            "sources": list(set(sources)),
            "error": False
        }

        # ---------------- CACHE SAVE ----------------
        if _response_cache:
            try:
                _response_cache.set(cache_key, response_data, ttl=300)
            except Exception:
                logger.warning("[CACHE WRITE FAILED]")

        # ---------------- DB SAVE ----------------
        save_chat_turn(session_id, req.message, reply)

        logger.info(f"[CHAT] {int((time.time()-start)*1000)}ms")

        return ChatResponse(**response_data)

    except Exception:
        logger.exception("[FINAL CHAT ERROR]")

        return ChatResponse(
            reply="System handled error safely.",
            session_id=session_id,
            error=True
        )


# -----------------------------------------------
# HEALTH
# -----------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


# -----------------------------------------------
# RUN
# -----------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True)