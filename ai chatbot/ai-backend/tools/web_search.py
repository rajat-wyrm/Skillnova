"""Web search tool for the SkillNova AI Chatbot.

Uses Tavily when ``TAVILY_API_KEY`` is set; falls back to DuckDuckGo.
Both providers are wrapped in a circuit breaker so that a single bad
provider can't take down the agent.
"""
from __future__ import annotations

import logging
import threading
import time
from typing import Optional

from llm import CircuitBreaker

logger = logging.getLogger("skillnova.tools")

tavily_circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
ddg_circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)


def _run_with_timeout(func, args, timeout_sec: float) -> Optional[object]:
    """Run ``func(*args)`` in a daemon thread with a hard timeout."""
    result: list = [None]
    exception: list = [None]

    def target():
        try:
            result[0] = func(*args)
        except Exception as exc:  # pragma: no cover — defensive
            exception[0] = exc

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout=timeout_sec)
    if thread.is_alive():
        logger.warning("[TIMEOUT] %ss exceeded", timeout_sec)
        return None
    if exception[0]:
        raise exception[0]
    return result[0]


def _tavily_search(query: str, max_results: int = 3) -> dict:
    import os

    from tavily import TavilyClient

    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY not set")

    client = TavilyClient(api_key=api_key)
    response = client.search(
        query=query,
        max_results=max_results,
        search_depth="basic",
        include_answer=True,
    )

    parts: list[str] = []
    scores: list[float] = []

    if response.get("answer"):
        parts.append(f"[Summary]: {response['answer']}")

    for r in response.get("results", []):
        source = r.get("url", "N/A")
        content = r.get("content", "")
        score = float(r.get("score", 0))
        scores.append(score)
        parts.append(f"[Source: {source}] (score: {score:.2f})\n{content}")

    avg_score = sum(scores) / len(scores) if scores else 0.5
    return {
        "result": "\n\n".join(parts) if parts else "No results found.",
        "source": "tavily",
        "confidence": round(min(avg_score, 1.0), 2),
    }


def _duckduckgo_search(query: str, max_results: int = 3) -> dict:
    from duckduckgo_search import DDGS

    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=max_results))

    if not results:
        return {
            "result": "No web results found.",
            "source": "duckduckgo",
            "confidence": 0.0,
        }

    formatted = [
        f"[Source: {r.get('href', 'N/A')}]\n{r.get('body', '')}"
        for r in results
    ]
    return {
        "result": "\n\n".join(formatted),
        "source": "duckduckgo",
        "confidence": 0.5,
    }


def web_search(query: str, max_results: int = 3) -> dict:
    """Try Tavily first, fall back to DuckDuckGo, finally return empty."""
    # Tavily
    if tavily_circuit.can_execute():
        try:
            output = _run_with_timeout(
                _tavily_search, (query, max_results), timeout_sec=4
            )
            if output:
                tavily_circuit.record_success()
                return output
            tavily_circuit.record_failure()
        except Exception as exc:
            tavily_circuit.record_failure()
            logger.warning("[TAVILY ERROR] %s", exc)

    # DuckDuckGo
    if ddg_circuit.can_execute():
        try:
            output = _run_with_timeout(
                _duckduckgo_search, (query, max_results), timeout_sec=2
            )
            if output:
                ddg_circuit.record_success()
                return output
            ddg_circuit.record_failure()
        except Exception as exc:
            ddg_circuit.record_failure()
            logger.warning("[DDG ERROR] %s", exc)

    logger.error("[WEB SEARCH FAILED]")
    return {
        "result": "Web search unavailable.",
        "source": "unavailable",
        "confidence": 0.0,
    }
