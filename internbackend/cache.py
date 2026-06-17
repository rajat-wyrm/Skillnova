"""
In-memory TTL cache with optional Redis backend.

Falls back to a thread-safe in-memory dict when Redis is not configured
or unavailable. The cache is bounded by `max_entries` to avoid unbounded
memory growth under load.
"""

from __future__ import annotations

import time
from collections import OrderedDict
from threading import Lock
from typing import Any, Tuple


class _MemoryCache:
    def __init__(self, max_entries: int = 1024):
        self._data: "OrderedDict[str, Tuple[Any, float]]" = OrderedDict()
        self._max = max_entries
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at and expires_at < time.time():
                self._data.pop(key, None)
                return None
            # Mark as recently used.
            self._data.move_to_end(key)
            return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expires_at = (time.time() + ttl) if ttl else 0
        with self._lock:
            if key in self._data:
                self._data.move_to_end(key)
            self._data[key] = (value, expires_at)
            while len(self._data) > self._max:
                self._data.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


def create_cache(redis_enabled: bool = False, max_entries: int = 1024) -> Tuple[Any, bool]:
    """
    Build a cache instance.

    Returns a (cache, is_redis) tuple. When `redis_enabled` is True and a
    Redis URL is configured we return a thin Redis wrapper; otherwise we
    fall back to the in-memory implementation.
    """
    if redis_enabled:
        try:
            import os
            import redis

            url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            client = redis.from_url(url, decode_responses=True)
            client.ping()

            class _RedisCache:
                def get(self, key: str):
                    raw = client.get(key)
                    if raw is None:
                        return None
                    try:
                        import json
                        return json.loads(raw)
                    except Exception:
                        return raw

                def set(self, key: str, value, ttl: int | None = None) -> None:
                    import json
                    payload = json.dumps(value, default=str)
                    if ttl:
                        client.setex(key, ttl, payload)
                    else:
                        client.set(key, payload)

                def clear(self) -> None:
                    client.flushdb()

            return _RedisCache(), True

        except Exception:
            # Redis is not available — silently degrade.
            pass

    return _MemoryCache(max_entries=max_entries), False