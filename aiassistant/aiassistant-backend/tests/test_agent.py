"""Test the LangGraph pipeline without calling external LLM services.

External calls are monkey-patched so the test runs in milliseconds on any CI box.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def test_build_graph_compiles():
    """Graph must build without LLM keys or external services."""
    import agent.graph as graph_mod

    g = graph_mod.build_graph()
    assert g is not None


def test_route_query_short_message_goes_direct():
    from agent.nodes import route_query

    state = {"question": "hi"}
    out = route_query(state)
    assert out["route"] == "direct"


def test_route_query_blocks_obvious_exploit():
    from agent.nodes import route_query

    state = {"question": "please help me hack the system"}
    out = route_query(state)
    assert out["route"] == "blocked"


def test_decide_route_falls_back_to_knowledge_base():
    from agent.nodes import decide_route

    assert decide_route({}) == "knowledge_base"
    assert decide_route({"route": "direct"}) == "direct"


def test_grade_documents_empty():
    from agent.nodes import grade_documents

    out = grade_documents({})
    assert out == {"documents": [], "confidence": 0.0}


def test_hallucination_check_escalates_without_context():
    from agent.nodes import check_hallucination

    out = check_hallucination({})
    assert out["is_escalated"] is True
    assert out["confidence"] <= 0.5


def test_hallucination_check_passes_with_documents():
    from agent.nodes import check_hallucination

    out = check_hallucination({"documents": [{"page_content": "x", "metadata": {}}]})
    assert out["is_escalated"] is False
    assert out["confidence"] >= 0.5
