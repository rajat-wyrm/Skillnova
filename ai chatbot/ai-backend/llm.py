"""SkillNova AI Chatbot — LLM provider package.

Exposes a single ``get_llm_response(prompt)`` entry point that walks a
chain of providers in priority order:

    Gemini → Groq → DeepSeek

Each provider is wrapped in a circuit breaker so that a single bad
provider can't take down the whole service.
"""
from __future__ import annotations

import logging
import os
import threading
import time

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("skillnova.llm")


# ─────────────────────────────────────────────────────────────────────
# Circuit breaker
# ─────────────────────────────────────────────────────────────────────
class CircuitBreaker:
    """Simple circuit breaker — open after N failures, half-open after T."""

    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 30) -> None:
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"
        self._lock = threading.Lock()

    def record_failure(self) -> None:
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "open"

    def record_success(self) -> None:
        with self._lock:
            self.failure_count = 0
            self.state = "closed"

    def can_execute(self) -> bool:
        with self._lock:
            if self.state == "closed":
                return True
            if self.state == "open":
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = "half_open"
                    return True
                return False
            return True


gemini_cb = CircuitBreaker()
groq_cb = CircuitBreaker()
deepseek_cb = CircuitBreaker()


# ─────────────────────────────────────────────────────────────────────
# Rate limiter (process-wide — protects free-tier quotas)
# ─────────────────────────────────────────────────────────────────────
class RateLimiter:
    def __init__(self, min_interval: float = 0.2) -> None:
        self.min_interval = min_interval
        self.last_call = 0.0
        self._lock = threading.Lock()

    def wait(self) -> None:
        with self._lock:
            now = time.time()
            gap = now - self.last_call
            if gap < self.min_interval:
                time.sleep(self.min_interval - gap)
            self.last_call = time.time()


rate_limiter = RateLimiter()


# ─────────────────────────────────────────────────────────────────────
# Providers
# ─────────────────────────────────────────────────────────────────────
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _call_gemini(prompt: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not gemini_cb.can_execute():
        return None
    try:
        rate_limiter.wait()
        res = requests.post(
            f"{GEMINI_URL}?key={api_key}",
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=20,
        )
        if res.status_code != 200:
            gemini_cb.record_failure()
            return None
        data = res.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        )
        if not text:
            return None
        gemini_cb.record_success()
        return text.strip()
    except Exception as exc:
        logger.error("[GEMINI ERROR] %s", exc)
        gemini_cb.record_failure()
        return None


def _call_groq(prompt: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not groq_cb.can_execute():
        return None
    try:
        from langchain_groq import ChatGroq  # local import — optional dep at boot

        llm = ChatGroq(
            api_key=api_key,
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )
        res = llm.invoke(prompt)
        if hasattr(res, "content"):
            groq_cb.record_success()
            return res.content.strip()
        return str(res)
    except Exception as exc:
        logger.error("[GROQ ERROR] %s", exc)
        groq_cb.record_failure()
        return None


def _call_deepseek(prompt: str):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    if not api_key or not deepseek_cb.can_execute():
        return None
    try:
        rate_limiter.wait()
        res = requests.post(
            f"{base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
            timeout=25,
        )
        if res.status_code != 200:
            deepseek_cb.record_failure()
            return None
        data = res.json()
        text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content")
        )
        if not text:
            return None
        deepseek_cb.record_success()
        return text.strip()
    except Exception as exc:
        logger.error("[DEEPSEEK ERROR] %s", exc)
        deepseek_cb.record_failure()
        return None


# ─────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────
def get_llm_response(prompt: str) -> str:
    """Return text from the first provider that answers, else a fallback."""

    # 1. Gemini
    res = _call_gemini(prompt)
    if res:
        return res
    logger.warning("[LLM] Gemini unavailable → Groq")

    # 2. Groq
    res = _call_groq(prompt)
    if res:
        return res
    logger.warning("[LLM] Groq unavailable → DeepSeek")

    # 3. DeepSeek
    res = _call_deepseek(prompt)
    if res:
        return res
    logger.error("[LLM] All providers failed")

    return "AI service unavailable. Try again later."


__all__ = [
    "CircuitBreaker",
    "RateLimiter",
    "gemini_cb",
    "groq_cb",
    "deepseek_cb",
    "rate_limiter",
    "get_llm_response",
]
