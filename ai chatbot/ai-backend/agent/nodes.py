"""Agent nodes — the building blocks of the LangGraph pipeline.

Each node is a small, side-effect-free function that takes the current
state and returns a partial update. Observability (latency, provider,
retrieval counts) is logged for every step.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any

from agent.prompts import (
    DIRECT_PROMPT,
    GENERAL_PROMPT,
    GENERATOR_PROMPT,
    ROUTER_PROMPT,
)
from agent.state import AgentState
from llm import get_llm_response
from tools.web_search import web_search as web_search_tool

# Note: do NOT use `from tools import web_search` — that would import the
# submodule, and the node would end up *calling the module object* and
# crashing with 'module is not callable' inside the LangGraph runtime.

logger = logging.getLogger("skillnova.agent")

# Injected at startup by ``main.init_pipeline``.
_vectorstore = None
_rate_limiter = None


# ─────────────────────────────────────────────────────────────────────
# Dependency injection
# ─────────────────────────────────────────────────────────────────────
def set_dependencies(vs, model=None, limiter=None) -> None:
    """Inject the FAISS vector store (and optional rate limiter)."""
    global _vectorstore, _rate_limiter
    _vectorstore = vs
    _rate_limiter = limiter


# ─────────────────────────────────────────────────────────────────────
# LLM helper with observability
# ─────────────────────────────────────────────────────────────────────
def _call_llm(prompt: str) -> str:
    start_time = time.perf_counter()
    provider = "unknown"
    try:
        if _rate_limiter is not None:
            _rate_limiter.wait()

        prompt_chars = len(prompt)
        estimated_prompt_tokens = prompt_chars // 4
        logger.info(
            "[LLM REQUEST] PromptChars=%d EstimatedTokens=%d",
            prompt_chars,
            estimated_prompt_tokens,
        )

        response = get_llm_response(prompt)
        latency_ms = (time.perf_counter() - start_time) * 1000

        if os.getenv("GROQ_API_KEY"):
            provider = "Groq"
        elif os.getenv("GEMINI_API_KEY"):
            provider = "Gemini"

        if not isinstance(response, str) or not response.strip():
            logger.warning(
                "[LLM EMPTY RESPONSE] Provider=%s Latency=%.2fms",
                provider,
                latency_ms,
            )
            return ""

        response = response.strip()
        logger.info(
            "[LLM RESPONSE] Provider=%s Latency=%.2fms ResponseChars=%d",
            provider,
            latency_ms,
            len(response),
        )
        return response
    except Exception:
        latency_ms = (time.perf_counter() - start_time) * 1000
        logger.exception(
            "[LLM ERROR] Provider=%s Latency=%.2fms", provider, latency_ms
        )
        return ""


def _timed_call(name: str, func, *args, **kwargs) -> tuple[Any, float]:
    start = time.time()
    try:
        result = func(*args, **kwargs)
        latency_ms = (time.time() - start) * 1000
        logger.info("[%s] %.2fms", name, latency_ms)
        return result, latency_ms
    except Exception as exc:
        logger.error("[%s ERROR] %s", name, exc)
        return None, 0.0


# ─────────────────────────────────────────────────────────────────────
# Output filter — keeps the system prompt safe from obvious leaks
# ─────────────────────────────────────────────────────────────────────
BLOCKLIST = (
    "system:",
    "ignore previous",
    "as an ai",
    "i cannot help with",
    "i'm just an ai",
)


def _filter_output(text):
    if not isinstance(text, str):
        return "Something went wrong.", 0.0
    if any(b in text.lower() for b in BLOCKLIST):
        return "Something went wrong. Please rephrase.", 0.0
    return text.strip(), -1.0


# ─────────────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────────────
def route_query(state: AgentState) -> dict:
    q = state.get("question", "")
    if any(x in q.lower() for x in ("hack", "bypass", "exploit")):
        return {"route": "blocked"}
    if len(q.strip()) < 10:
        return {"route": "direct"}

    prompt = ROUTER_PROMPT.format(question=q)
    route = _call_llm(prompt).lower().strip()
    if route not in {"direct", "knowledge_base", "web_search", "general"}:
        route = "knowledge_base"
    return {"route": route}


# ─────────────────────────────────────────────────────────────────────
# Query rewriter (single-pass — avoids infinite loops)
# ─────────────────────────────────────────────────────────────────────
def rewrite_query(state: AgentState) -> dict:
    question = state.get("question", "")
    if not question:
        return {"question": ""}
    rewritten = question.strip()
    if len(rewritten) > 150:
        rewritten = rewritten[:150]
    return {"question": rewritten}


# ─────────────────────────────────────────────────────────────────────
# Response nodes
# ─────────────────────────────────────────────────────────────────────
def direct_response(state: AgentState) -> dict:
    prompt = DIRECT_PROMPT.format(
        question=state.get("question", ""),
        language=state.get("language", "en"),
    )
    reply = _call_llm(prompt)
    reply, _ = _filter_output(reply)
    return {"generation": reply, "confidence": 1.0, "is_escalated": False}


def general_response(state: AgentState) -> dict:
    prompt = GENERAL_PROMPT.format(
        question=state.get("question", ""),
        language=state.get("language", "en"),
    )
    reply = _call_llm(prompt)
    reply, conf = _filter_output(reply)
    return {
        "generation": reply,
        "confidence": 0.85 if conf < 0 else conf,
        "is_escalated": False,
    }


def blocked_response(state: AgentState) -> dict:
    return {
        "generation": "Request blocked for safety reasons.",
        "confidence": 1.0,
        "is_escalated": False,
    }


# ─────────────────────────────────────────────────────────────────────
# Retrieval
# ─────────────────────────────────────────────────────────────────────
def retrieve(state: AgentState) -> dict:
    question = state.get("question", "")
    logger.info("[RETRIEVE] Question: %s", question)

    if not _vectorstore:
        logger.warning("[RETRIEVE] Vectorstore not initialised")
        return {"documents": []}

    docs, latency = _timed_call(
        "faiss", _vectorstore.similarity_search, question, k=5
    )
    docs = docs or []
    logger.info(
        "[RETRIEVE] Retrieved %d documents in %.2fms",
        len(docs),
        latency,
    )
    for idx, doc in enumerate(docs):
        preview = doc.page_content[:200].replace("\n", " ")
        logger.info(
            "[DOC %d] Source=%s | Preview=%s",
            idx + 1,
            doc.metadata.get("source", "unknown"),
            preview,
        )
    return {"documents": docs}


# ─────────────────────────────────────────────────────────────────────
# Grader + reranker
# ─────────────────────────────────────────────────────────────────────
def grade_documents(state: AgentState) -> dict:
    docs = state.get("documents") or []
    question = state.get("question", "").lower()

    if not docs:
        return {"documents": [], "confidence": 0.0}

    keywords = set(question.split())
    scored: list[tuple[float, Any]] = []
    for doc in docs:
        content = doc.page_content.lower()
        overlap = sum(1 for word in keywords if word in content)
        score = overlap / max(len(keywords), 1)
        scored.append((score, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    filtered_docs = [doc for score, doc in scored if score > 0.05]
    if not filtered_docs:
        filtered_docs = [doc for _, doc in scored[:2]]

    top_score = scored[0][0] if scored else 0.0
    confidence = min(round(top_score + 0.3, 2), 1.0)

    logger.info(
        "[GRADER] docs_in=%d docs_out=%d confidence=%.2f",
        len(docs),
        len(filtered_docs),
        confidence,
    )
    return {"documents": filtered_docs, "confidence": confidence}


# ─────────────────────────────────────────────────────────────────────
# Web search
# ─────────────────────────────────────────────────────────────────────
def web_search(state: AgentState) -> dict:
    result, _ = _timed_call(
        "web",
        web_search_tool,
        state.get("question", ""),
        max_results=3,
    )
    if not isinstance(result, dict):
        return {"web_results": "", "confidence": 0.0}
    return {
        "web_results": result.get("result", ""),
        "confidence": result.get("confidence", 0.6),
    }


# ─────────────────────────────────────────────────────────────────────
# Generator
# ─────────────────────────────────────────────────────────────────────
def generate(state: AgentState) -> dict:
    try:
        context = ""
        if state.get("documents"):
            context = "\n\n".join(d.page_content for d in state["documents"])
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
                "is_escalated": True,
            }

        if "ESCALATE_TO_ADMIN" in answer:
            logger.warning("[ESCALATION] Model requested admin escalation")
            if context:
                fallback = (
                    "I could not generate a confident AI response, but "
                    "relevant information was retrieved from the knowledge "
                    "base."
                )
                return {
                    "generation": fallback,
                    "confidence": 0.5,
                    "is_escalated": True,
                }
            return {
                "generation": "This request requires admin assistance.",
                "confidence": 0.2,
                "is_escalated": True,
            }

        answer, conf = _filter_output(answer)
        return {
            "generation": answer,
            "confidence": conf if conf >= 0 else 0.8,
            "is_escalated": False,
        }
    except Exception:
        logger.exception("[GENERATE ERROR]")
        return {
            "generation": "Generation failed.",
            "confidence": 0.0,
            "is_escalated": True,
        }


# ─────────────────────────────────────────────────────────────────────
# Hallucination check
# ─────────────────────────────────────────────────────────────────────
def check_hallucination(state: AgentState) -> dict:
    try:
        if state.get("documents") or state.get("web_results"):
            return {
                "confidence": max(state.get("confidence", 0.7), 0.5),
                "is_escalated": False,
            }
        return {"confidence": 0.1, "is_escalated": True}
    except Exception:
        return {"confidence": 0.0, "is_escalated": True}


# ─────────────────────────────────────────────────────────────────────
# Routing decisions
# ─────────────────────────────────────────────────────────────────────
def decide_route(state: AgentState) -> str:
    return state.get("route", "knowledge_base")


def decide_after_grading(state: AgentState) -> str:
    if state.get("documents"):
        return "generate"
    return "web_search"


def decide_after_hallucination_check(state: AgentState) -> str:
    return "escalate" if state.get("is_escalated") else "pass"
