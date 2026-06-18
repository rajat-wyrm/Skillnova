"""Test LLM provider fallback logic without making network calls."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import llm  # noqa: E402
from llm import CircuitBreaker, RateLimiter  # noqa: E402


def test_circuit_breaker_opens_after_failures():
    cb = CircuitBreaker(failure_threshold=2, recovery_timeout=60)
    assert cb.can_execute()
    cb.record_failure()
    assert cb.can_execute()
    cb.record_failure()
    assert not cb.can_execute()


def test_circuit_breaker_recovery():
    """After the recovery timeout the breaker moves to half-open."""
    import time

    cb = CircuitBreaker(failure_threshold=1, recovery_timeout=0.05)
    cb.record_failure()
    # Sleep past the recovery window.
    time.sleep(0.1)
    assert cb.can_execute() is True
    assert cb.state in {"half_open", "closed"}


def test_circuit_breaker_success_resets():
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    assert cb.can_execute()


def test_rate_limiter_enforces_interval():
    import time

    rl = RateLimiter(min_interval=0.05)
    t0 = time.time()
    rl.wait()
    rl.wait()
    elapsed = time.time() - t0
    assert elapsed >= 0.05


def test_get_llm_response_returns_fallback_when_no_keys(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    out = llm.get_llm_response("hi")
    assert "unavailable" in out.lower()
