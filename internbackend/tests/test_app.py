"""Integration-style tests for the FastAPI app that need a Postgres.

These tests exercise the real HTTP surface end-to-end with the agent
graph monkey-patched so they do not require an LLM key. The DB calls
are routed through the SQLite in-memory fallback so they run anywhere.

Run with: pytest tests/test_app.py -v
"""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest


@pytest.fixture(scope="module", autouse=True)
def _env():
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
    os.environ.setdefault("ADMIN_TOKEN", "test-admin-token")


@pytest.fixture(scope="module")
def client():
    fake_state = {
        "generation": "This is a grounded answer with details.",
        "confidence": 0.92,
        "documents": [],
        "is_escalated": False,
    }

    with patch("main.agent_graph") as graph:
        graph.invoke.return_value = fake_state
        with patch("main.init_pipeline"):
            from main import app
            from fastapi.testclient import TestClient

            with TestClient(app) as c:
                yield c


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "running"


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "initialising")
    assert "uptime_s" in body
    assert "components" in body
    assert body["version"] == "4.0.0"


def test_metrics_prometheus(client):
    # Drive some traffic so the metrics are non-empty.
    client.get("/api/session")
    client.post("/api/chat", json={"message": "hello"})

    r = client.get("/api/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
    body = r.text
    assert "skillnova_http_requests_total" in body
    assert "skillnova_uptime_seconds" in body
    assert "skillnova_build_info" in body


def test_admin_stats_requires_token(client):
    r = client.get("/api/admin/stats")
    assert r.status_code == 401


def test_admin_stats_with_token(client):
    r = client.get("/api/admin/stats", headers={"X-Admin-Token": "test-admin-token"})
    assert r.status_code == 200
    body = r.json()
    assert body["version"] == "4.0.0"
    assert "uptime_s" in body


def test_feedback_endpoint(client):
    r = client.post(
        "/api/feedback",
        json={"session_id": "s1", "message": "thanks", "rating": 1},
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_stream_emits_token_and_done(client):
    with client.stream("POST", "/api/chat/stream", json={"message": "Tell me about tasks."}) as r:
        assert r.status_code == 200
        chunks = list(r.iter_lines())
        assert any('"type": "token"' in line for line in chunks)
        assert any('"type": "done"' in line for line in chunks)


def test_chat_returns_request_id(client):
    r = client.post("/api/chat", json={"message": "hello there"})
    assert r.status_code == 200
    body = r.json()
    assert body["request_id"]
    assert "X-Request-ID" in r.headers or "x-request-id" in r.headers


def test_chat_session_creation(client):
    r = client.post("/api/chat", json={"message": "Hi"})
    body = r.json()
    # Session should be present even when not supplied.
    assert body["session_id"]


def test_ai_router_suggestions(client):
    r = client.get("/api/ai/suggestions")
    assert r.status_code == 200
    body = r.json()
    assert "data" in body and len(body["data"]) >= 4


def test_ai_router_capabilities(client):
    r = client.get("/api/ai/capabilities")
    assert r.status_code == 200
    assert len(r.json()["data"]) >= 4


def test_ai_router_welcome_message(client):
    r = client.get("/api/ai/welcome-message")
    assert r.status_code == 200
    assert r.json()["message"]


def test_ai_router_chat(client):
    r = client.post("/api/ai/chat", json={"message": "How do I submit a task?"})
    assert r.status_code == 200
    assert r.json()["reply"]