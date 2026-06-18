"""Test cache layer — pure-Python parts only (no HuggingFace download)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cache import InMemorySemanticCache, ToolResultCache  # noqa: E402


def test_tool_cache_in_memory_round_trip():
    cache = ToolResultCache(redis_client=None, ttl=60)
    assert cache.get("anything") is None
    cache.put("query", {"answer": 42})
    assert cache.get("query") == {"answer": 42}


def test_tool_cache_expires():
    cache = ToolResultCache(redis_client=None, ttl=0)
    cache.put("query", {"answer": 42})
    # TTL of 0 means it's already expired.
    assert cache.get("query") is None


def test_in_memory_cache_skips_web_search():
    cache = InMemorySemanticCache()
    cache.put("any query", {"answer": "ok"}, route="web_search")
    assert cache.cache == []  # never stored
