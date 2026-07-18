import time
import logging
from agent.state import AgentState
from llm import get_llm_response
from tools import web_search as web_search_tool

from agent.prompts import (
    ROUTER_PROMPT,
    GENERATOR_PROMPT,
    DIRECT_PROMPT,
    GENERAL_PROMPT,
)

logger = logging.getLogger("skillnova.agent")

_vectorstore = None
_rate_limiter = None


# -----------------------------------------------
# DEPENDENCY INJECTION
# -----------------------------------------------
def set_dependencies(vs, model=None, limiter=None):
    global _vectorstore, _rate_limiter
    _vectorstore = vs
    _rate_limiter = limiter


# -----------------------------------------------
# SAFE LLM CALL (STABLE)
# -----------------------------------------------
def _call_llm(prompt: str) -> str:
    try:
        if _rate_limiter:
            _rate_limiter.wait()

        response = get_llm_response(prompt)

        if not isinstance(response, str) or not response.strip():
            return ""

        return response.strip()

    except Exception:
        logger.exception("[LLM ERROR]")
        return ""


# -----------------------------------------------
# TIMED CALL
# -----------------------------------------------
def _timed_call(name, func, *args, **kwargs):
    start = time.time()
    try:
        result = func(*args, **kwargs)
        latency = int((time.time() - start) * 1000)
        logger.info(f"[{name}] {latency}ms")
        return result, latency
    except Exception as e:
        logger.error(f"[{name} ERROR] {e}")
        return None, 0


# -----------------------------------------------
# OUTPUT FILTER (SAFE)
# -----------------------------------------------
BLOCKLIST = [
    "system:", "ignore previous", "as an ai",
    "i cannot help with", "i'm just an ai"
]


def _filter_output(text):
    if not isinstance(text, str):
        return "Something went wrong.", 0.0

    if any(b in text.lower() for b in BLOCKLIST):
        return "Something went wrong. Please rephrase.", 0.0

    return text.strip(), -1.0


# -----------------------------------------------
# SMART FORMATTER (OPTIONAL)
# -----------------------------------------------
def _format_response(text: str) -> str:
    try:
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        if not lines:
            return "No valid response generated."

        formatted = []

        for line in lines:
            clean = line.lstrip("-•1234567890. ").strip()

            if len(clean) > 120:
                formatted.append(clean)
            else:
                formatted.append(f"• {clean}")

        return "\n".join(formatted)

    except Exception:
        return text


# -----------------------------------------------
# ROUTER
# -----------------------------------------------
def route_query(state: AgentState) -> dict:
    q = state.get("question", "")

    if any(x in q.lower() for x in ["hack", "bypass", "exploit"]):
        return {"route": "blocked"}

    if len(q.strip()) < 10:
        return {"route": "direct"}

    prompt = ROUTER_PROMPT.format(question=q)
    route = _call_llm(prompt).lower().strip()

    if route not in ["direct", "knowledge_base", "web_search", "general"]:
        route = "knowledge_base"

    return {"route": route}


# -----------------------------------------------
# 🔥 QUERY REWRITER (REQUIRED BY GRAPH)
# -----------------------------------------------
def rewrite_query(state: AgentState) -> dict:
    try:
        question = state.get("question", "")

        if not question:
            return {"question": ""}

        # Keep it lightweight (no over-processing)
        rewritten = question.strip()

        # Optional improvement (safe)
        if len(rewritten) > 150:
            rewritten = rewritten[:150]

        return {
            "question": rewritten
        }

    except Exception:
        return {
            "question": state.get("question", "")
        }

# -----------------------------------------------
# DIRECT RESPONSE
# -----------------------------------------------
def direct_response(state: AgentState) -> dict:
    prompt = DIRECT_PROMPT.format(
        question=state.get("question", ""),
        language=state.get("language", "en")
    )

    reply = _call_llm(prompt)
    reply, _ = _filter_output(reply)

    return {
        "generation": reply,
        "confidence": 1.0,
        "is_escalated": False
    }


# -----------------------------------------------
# GENERAL RESPONSE
# -----------------------------------------------
def general_response(state: AgentState) -> dict:
    prompt = GENERAL_PROMPT.format(
        question=state.get("question", ""),
        language=state.get("language", "en")
    )

    reply = _call_llm(prompt)
    reply, conf = _filter_output(reply)

    return {
        "generation": reply,
        "confidence": 0.85 if conf < 0 else conf,
        "is_escalated": False
    }


# -----------------------------------------------
# BLOCKED RESPONSE
# -----------------------------------------------
def blocked_response(state: AgentState) -> dict:
    return {
        "generation": "Request blocked for safety reasons.",
        "confidence": 1.0,
        "is_escalated": False
    }


# -----------------------------------------------
# RETRIEVE
# -----------------------------------------------
def retrieve(state: AgentState) -> dict:
    if not _vectorstore:
        return {"documents": []}

    docs, _ = _timed_call(
        "faiss",
        _vectorstore.similarity_search,
        state.get("question", ""),
        k=5
    )

    return {"documents": docs or []}


# -----------------------------------------------
# 🔥 GRADE DOCUMENTS (FIXED — REQUIRED)
# -----------------------------------------------
def grade_documents(state: AgentState) -> dict:
    docs = state.get("documents") or []

    if not docs:
        return {
            "documents": [],
            "confidence": 0.0
        }

    return {
        "documents": docs,
        "confidence": 0.75
    }


# -----------------------------------------------
# WEB SEARCH
# -----------------------------------------------
def web_search(state: AgentState) -> dict:
    result, _ = _timed_call(
        "web",
        web_search_tool,
        state.get("question", ""),
        max_results=3
    )

    if not isinstance(result, dict):
        return {"web_results": "", "confidence": 0.0}

    return {
        "web_results": result.get("result", ""),
        "confidence": result.get("confidence", 0.6)
    }


# -----------------------------------------------
# 🔥 GENERATE (FINAL CORE)
# -----------------------------------------------
def generate(state: AgentState) -> dict:
    try:
        context = ""

        if state.get("documents"):
            context = "\n\n".join([d.page_content for d in state["documents"]])
        elif state.get("web_results"):
            context = state["web_results"]

        prompt = GENERATOR_PROMPT.format(
            context=context,
            question=state.get("question", ""),
            language=state.get("language", "en"),
        )

        answer = _call_llm(prompt)

        if not answer:
            return {
                "generation": "Unable to generate response.",
                "confidence": 0.0,
                "is_escalated": True
            }

        if "ESCALATE_TO_ADMIN" in answer:
            return {
                "generation": "This requires admin assistance.",
                "confidence": 0.2,
                "is_escalated": True
            }

        answer, conf = _filter_output(answer)

        return {
            "generation": answer,
            "confidence": conf if conf >= 0 else 0.8,
            "is_escalated": False
        }

    except Exception:
        logger.exception("[GENERATE ERROR]")
        return {
            "generation": "Generation failed.",
            "confidence": 0.0,
            "is_escalated": True
        }


# -----------------------------------------------
# HALLUCINATION CHECK
# -----------------------------------------------
def check_hallucination(state: AgentState) -> dict:
    try:
        if state.get("documents") or state.get("web_results"):
            return {
                "confidence": max(state.get("confidence", 0.7), 0.5),
                "is_escalated": False
            }

        return {
            "confidence": 0.1,
            "is_escalated": True
        }

    except Exception:
        return {
            "confidence": 0.0,
            "is_escalated": True
        }


# -----------------------------------------------
# DECISION LOGIC
# -----------------------------------------------
def decide_route(state: AgentState) -> str:
    return state.get("route", "knowledge_base")


def decide_after_grading(state: AgentState) -> str:
    if state.get("documents"):
        return "generate"
    return "web_search"


def decide_after_hallucination_check(state: AgentState) -> str:
    if state.get("is_escalated"):
        return "escalate"

    return "pass"