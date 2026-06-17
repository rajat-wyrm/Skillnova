"""
Streaming variant of the LLM provider race.

Returns an async iterator of strings instead of a single string. Each
provider is tried in order; the first one that yields a token wins and
the rest are abandoned. The interface is uniform so the agent layer
can swap in a non-streaming fallback without changing call sites.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import AsyncIterator, Optional

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("skillnova.stream")


# ---------------------------------------------------------------------------
# CIRCUIT BREAKER (kept here for backwards compatibility)
# ---------------------------------------------------------------------------
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 30) -> None:
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"  # closed | open | half_open

    def record_failure(self) -> None:
        self.failure_count += 1
        import time as _t

        self.last_failure_time = _t.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

    def record_success(self) -> None:
        self.failure_count = 0
        self.state = "closed"

    def can_execute(self) -> bool:
        if self.state == "closed":
            return True
        if self.state == "open":
            import time as _t

            if _t.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half_open"
                return True
            return False
        return True


_gemini_cb = CircuitBreaker()
_groq_cb = CircuitBreaker()
_deepseek_cb = CircuitBreaker()


# ---------------------------------------------------------------------------
# PROVIDER STREAMERS — yield raw chunks.
# ---------------------------------------------------------------------------
async def _gemini_stream(prompt: str) -> AsyncIterator[str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not _gemini_cb.can_execute():
        return
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
    }
    try:
        # Run blocking requests in a thread so the event loop stays free.
        def fetch():
            return requests.post(
                f"{url}?key={api_key}",
                json=payload,
                timeout=30,
                stream=True,
            )

        response = await asyncio.to_thread(fetch)
        if response.status_code != 200:
            _gemini_cb.record_failure()
            return
        for line in response.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8") if isinstance(line, bytes) else line)
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text")
                )
                if text:
                    _gemini_cb.record_success()
                    yield text
            except (json.JSONDecodeError, KeyError, IndexError):
                continue
    except Exception as exc:
        _gemini_cb.record_failure()
        logger.warning("[GEMINI STREAM ERROR] %s", exc)


async def _groq_stream(prompt: str) -> AsyncIterator[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not _groq_cb.can_execute():
        return
    try:
        from langchain_groq import ChatGroq

        llm = ChatGroq(api_key=api_key, model="llama-3.1-8b-instant", temperature=0.3, streaming=True)

        def invoke():
            return llm.stream(prompt)

        iterator = await asyncio.to_thread(invoke)
        for chunk in iterator:
            text = getattr(chunk, "content", None)
            if text:
                _groq_cb.record_success()
                yield text
    except Exception as exc:
        _groq_cb.record_failure()
        logger.warning("[GROQ STREAM ERROR] %s", exc)


async def _deepseek_stream(prompt: str) -> AsyncIterator[str]:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    if not api_key or not _deepseek_cb.can_execute():
        return
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "stream": True,
    }

    def fetch():
        return requests.post(
            f"{base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
            stream=True,
        )

    try:
        response = await asyncio.to_thread(fetch)
        if response.status_code != 200:
            _deepseek_cb.record_failure()
            return
        for line in response.iter_lines():
            if not line:
                continue
            text = line.decode("utf-8") if isinstance(line, bytes) else line
            if text.startswith("data: "):
                payload = text[6:].strip()
                if payload == "[DONE]":
                    break
                try:
                    data = json.loads(payload)
                    delta = (
                        data.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content")
                    )
                    if delta:
                        _deepseek_cb.record_success()
                        yield delta
                except json.JSONDecodeError:
                    continue
    except Exception as exc:
        _deepseek_cb.record_failure()
        logger.warning("[DEEPSEEK STREAM ERROR] %s", exc)


# ---------------------------------------------------------------------------
# UNIFIED ENTRY: race Gemini -> Groq -> DeepSeek; first token wins.
# ---------------------------------------------------------------------------
async def stream_llm_response(prompt: str) -> AsyncIterator[str]:
    for streamer in (_gemini_stream, _groq_stream, _deepseek_stream):
        try:
            emitted = False
            async for token in streamer(prompt):
                emitted = True
                yield token
            if emitted:
                return
        except Exception as exc:
            logger.warning("[STREAM PROVIDER FAILED] %s", exc)
            continue
    logger.error("[STREAM] All providers failed")


# ---------------------------------------------------------------------------
# NON-STREAMING (kept for the JSON endpoint).
# ---------------------------------------------------------------------------
def get_llm_response(prompt: str) -> str:
    """Blocking call used by /api/chat and the agent graph."""
    import time as _t

    # 1. Gemini
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and _gemini_cb.can_execute():
            response = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
                },
                params={"key": api_key},
                timeout=30,
            )
            if response.status_code == 200:
                data = response.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text")
                )
                if text:
                    _gemini_cb.record_success()
                    return text.strip()
            _gemini_cb.record_failure()
    except Exception as exc:
        _gemini_cb.record_failure()
        logger.warning("[GEMINI ERROR] %s", exc)

    # 2. Groq
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key and _groq_cb.can_execute():
            from langchain_groq import ChatGroq

            llm = ChatGroq(api_key=api_key, model="llama-3.1-8b-instant", temperature=0.3)
            response = llm.invoke(prompt)
            text = getattr(response, "content", None) or str(response)
            _groq_cb.record_success()
            return text.strip()
    except Exception as exc:
        _groq_cb.record_failure()
        logger.warning("[GROQ ERROR] %s", exc)

    # 3. DeepSeek
    try:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        if api_key and _deepseek_cb.can_execute():
            response = requests.post(
                f"{base_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
                timeout=30,
            )
            if response.status_code == 200:
                data = response.json()
                text = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content")
                )
                if text:
                    _deepseek_cb.record_success()
                    return text.strip()
            _deepseek_cb.record_failure()
    except Exception as exc:
        _deepseek_cb.record_failure()
        logger.warning("[DEEPSEEK ERROR] %s", exc)

    logger.error("[LLM] All providers failed")
    return ""


__all__ = [
    "CircuitBreaker",
    "get_llm_response",
    "stream_llm_response",
]