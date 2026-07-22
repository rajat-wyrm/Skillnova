"""Test the web-search tool failure paths without network access."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def test_web_search_returns_unavailable_when_no_provider(monkeypatch):
    """Both providers disabled -> a friendly 'unavailable' payload."""
    monkeypatch.setattr("tools.web_search.tavily_circuit", _BrokenCircuit())
    monkeypatch.setattr("tools.web_search.ddg_circuit", _BrokenCircuit())

    from tools import web_search

    out = web_search.web_search("anything", max_results=1)
    assert out["source"] == "unavailable"
    assert out["confidence"] == 0.0
    assert "unavailable" in out["result"].lower()


def test_duckduckgo_search_handles_empty_results(monkeypatch):
    """A DDGS that returns no hits should produce a safe empty payload."""
    class _FakeDDGS:
        def __enter__(self):
            return self

        def __exit__(self, *_exc):
            return False

        def text(self, *_args, **_kwargs):
            return []

    monkeypatch.setattr("tools.web_search.tavily_circuit", _BrokenCircuit())

    import duckduckgo_search  # noqa: F401 — make sure dep is importable
    monkeypatch.setattr("duckduckgo_search.DDGS", _FakeDDGS)
    from tools import web_search

    out = web_search._duckduckgo_search("nothing", max_results=3)
    assert out["source"] == "duckduckgo"
    assert out["confidence"] == 0.0
    assert "no web results" in out["result"].lower()


class _BrokenCircuit:
    state = "open"

    def can_execute(self) -> bool:  # noqa: D401
        return False

    def record_failure(self) -> None:
        pass

    def record_success(self) -> None:
        pass
