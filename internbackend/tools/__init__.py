import os
import logging
import threading
from llm import CircuitBreaker

logger = logging.getLogger("skillnova.tools")

# -----------------------------------------------
# CIRCUIT BREAKERS (FIXED)
# -----------------------------------------------
tavily_circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
ddg_circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=30)


# -----------------------------------------------
# TIMEOUT WRAPPER
# -----------------------------------------------
def _run_with_timeout(func, args, timeout_sec):
    result = [None]
    exception = [None]

    def target():
        try:
            result[0] = func(*args)
        except Exception as e:
            exception[0] = e

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout=timeout_sec)

    if thread.is_alive():
        logger.warning(f"[TIMEOUT] {timeout_sec}s exceeded")
        return None

    if exception[0]:
        raise exception[0]

    return result[0]


# -----------------------------------------------
# TAVILY SEARCH
# -----------------------------------------------
def _tavily_search(query: str, max_results: int = 3) -> dict:
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

    parts = []
    scores = []

    if response.get("answer"):
        parts.append(f"[Summary]: {response['answer']}")

    for r in response.get("results", []):
        source = r.get("url", "N/A")
        content = r.get("content", "")
        score = r.get("score", 0)

        scores.append(score)
        parts.append(f"[Source: {source}] (score: {score:.2f})\n{content}")

    avg_score = sum(scores) / len(scores) if scores else 0.5

    return {
        "result": "\n\n".join(parts) if parts else "No results found.",
        "source": "tavily",
        "confidence": round(min(avg_score, 1.0), 2),
    }


# -----------------------------------------------
# DUCKDUCKGO SEARCH
# -----------------------------------------------
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

    formatted = []
    for r in results:
        source = r.get("href", "N/A")
        body = r.get("body", "")
        formatted.append(f"[Source: {source}]\n{body}")

    return {
        "result": "\n\n".join(formatted),
        "source": "duckduckgo",
        "confidence": 0.5,
    }


# -----------------------------------------------
# MAIN WEB SEARCH
# -----------------------------------------------
def web_search(query: str, max_results: int = 3) -> dict:

    # ---- TAVILY ----
    if tavily_circuit.can_execute():
        try:
            output = _run_with_timeout(
                _tavily_search,
                (query, max_results),
                timeout_sec=4
            )

            if output:
                tavily_circuit.record_success()
                return output

            tavily_circuit.record_failure()

        except Exception as e:
            tavily_circuit.record_failure()
            logger.warning(f"[TAVILY ERROR] {e}")

    # ---- DUCKDUCKGO ----
    if ddg_circuit.can_execute():
        try:
            output = _run_with_timeout(
                _duckduckgo_search,
                (query, max_results),
                timeout_sec=2
            )

            if output:
                ddg_circuit.record_success()
                return output

            ddg_circuit.record_failure()

        except Exception as e:
            ddg_circuit.record_failure()
            logger.warning(f"[DDG ERROR] {e}")

    # ---- FALLBACK ----
    logger.error("[WEB SEARCH FAILED]")

    return {
        "result": "Web search unavailable.",
        "source": "unavailable",
        "confidence": 0.0,
    }