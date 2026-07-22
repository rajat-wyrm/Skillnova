"""Test the FastAPI app surface.

We do **not** exercise the full agent graph here — only the HTTP surface
that does not require an LLM key.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _client():
    """Build a TestClient; skips full pipeline init for isolated tests."""
    from fastapi.testclient import TestClient

    # Import the app without triggering init_pipeline.
    import main as main_mod

    # Force pipeline to be a no-op for these tests.
    main_mod.init_pipeline = lambda: None  # type: ignore[assignment]

    from main import app

    return TestClient(app)


def test_root_returns_running():
    client = _client()
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "running"


def test_health_endpoint_shape():
    client = _client()
    res = client.get("/api/aiassistant/health")
    assert res.status_code == 200
    body = res.json()
    assert "llm_configured" in body
    assert "cache_ready" in body


def test_session_returns_uuid():
    client = _client()
    res = client.get("/api/aiassistant/session")
    assert res.status_code == 200
    body = res.json()
    assert "session_id" in body
    assert len(body["session_id"]) >= 8


def test_chat_empty_message_rejected():
    client = _client()
    res = client.post("/api/aiassistant/chat", json={"message": ""})
    assert res.status_code == 422  # pydantic validation
