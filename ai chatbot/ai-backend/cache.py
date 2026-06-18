"""
Caching layer for the SkillNova AI Chatbot.

Two backends:

- ``InMemorySemanticCache`` — embedded fallback. Uses cosine similarity over
  HuggingFace embeddings; bounded LRU.
- ``RedisSemanticCache``      — production. Stores embeddings + responses in
  Redis hashes; never uses ``KEYS`` (uses ``SCAN`` instead).

A ``ToolResultCache`` is also provided for caching tool outputs.

The factory ``create_cache(redis_enabled=...)`` automatically chooses the
backend based on the ``REDIS_URL`` env var.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from typing import Optional

import numpy as np

logger = logging.getLogger("skillnova.cache")


# ─────────────────────────────────────────────────────────────────────
# Embedding (lazy singleton)
# ─────────────────────────────────────────────────────────────────────
_embeddings = None


def get_embeddings():
    """Return a process-wide HuggingFace embeddings instance."""
    global _embeddings
    if _embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings


# ─────────────────────────────────────────────────────────────────────
# In-memory semantic cache
# ─────────────────────────────────────────────────────────────────────
class InMemorySemanticCache:
    def __init__(
        self,
        similarity_threshold: float = 0.92,
        max_entries: int = 500,
        ttl_seconds: int = 43200,
    ) -> None:
        self.threshold = similarity_threshold
        self.max_entries = max_entries
        self.ttl = ttl_seconds
        self.cache: list = []

    def get(self, query: str, route: str = "") -> Optional[dict]:
        if not self.cache:
            return None

        emb = get_embeddings()
        query_vec = np.array(emb.embed_query(query), dtype=np.float32)
        now = time.time()

        best_score, best_entry = 0.0, None
        for vec, response, ts, _route in self.cache:
            if now - ts > self.ttl:
                continue
            denom = np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-8
            score = float(np.dot(query_vec, vec) / denom)
            if score > best_score:
                best_score, best_entry = score, response

        if best_score >= self.threshold:
            logger.info("[CACHE] HIT (memory) score=%.3f", best_score)
            return best_entry
        return None

    def put(self, query: str, response: dict, route: str = "knowledge_base") -> None:
        if route == "web_search":
            return

        emb = get_embeddings()
        vec = np.array(emb.embed_query(query), dtype=np.float32)
        self.cache.append((vec, response, time.time(), route))
        if len(self.cache) > self.max_entries:
            self.cache = self.cache[-self.max_entries :]
        logger.info("[CACHE] PUT (memory)")


# ─────────────────────────────────────────────────────────────────────
# Redis semantic cache
# ─────────────────────────────────────────────────────────────────────
class RedisSemanticCache:
    def __init__(
        self,
        redis_client,
        similarity_threshold: float = 0.92,
        ttl_seconds: int = 43200,
    ) -> None:
        self.redis = redis_client
        self.threshold = similarity_threshold
        self.ttl = ttl_seconds
        self.prefix = "skillnova:cache:"

    def get(self, query: str, route: str = "") -> Optional[dict]:
        try:
            emb = get_embeddings()
            query_vec = np.array(emb.embed_query(query), dtype=np.float32)

            best_score, best_response = 0.0, None

            cursor = 0
            while True:
                cursor, keys = self.redis.scan(cursor=cursor, match=f"{self.prefix}*")
                for key in keys:
                    cached = self.redis.hgetall(key)
                    if not cached:
                        continue
                    vec = np.frombuffer(cached[b"embedding"], dtype=np.float32)
                    denom = np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-8
                    score = float(np.dot(query_vec, vec) / denom)
                    if score > best_score:
                        best_score, best_response = score, json.loads(cached[b"response"])
                if cursor == 0:
                    break

            if best_score >= self.threshold:
                logger.info("[CACHE] HIT (redis) score=%.3f", best_score)
                return best_response
        except Exception as exc:
            logger.warning("[CACHE] Redis GET error: %s", exc)
        return None

    def put(self, query: str, response: dict, route: str = "knowledge_base") -> None:
        if route == "web_search":
            return
        try:
            emb = get_embeddings()
            vec = np.array(emb.embed_query(query), dtype=np.float32)

            query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]
            key = f"{self.prefix}{query_hash}"

            ttl = 86400 if route in ("direct", "general") else self.ttl
            self.redis.hset(
                key,
                mapping={
                    "embedding": vec.tobytes(),
                    "response": json.dumps(response),
                    "route": route,
                    "ts": str(time.time()),
                },
            )
            self.redis.expire(key, ttl)
            logger.info("[CACHE] PUT (redis) ttl=%d", ttl)
        except Exception as exc:
            logger.warning("[CACHE] Redis PUT error: %s", exc)


# ─────────────────────────────────────────────────────────────────────
# Tool result cache
# ─────────────────────────────────────────────────────────────────────
class ToolResultCache:
    def __init__(self, redis_client=None, ttl: int = 3600) -> None:
        self.redis = redis_client
        self.ttl = ttl
        self.memory: dict = {}
        self.prefix = "skillnova:tool:"

    def get(self, query: str) -> Optional[dict]:
        key = hashlib.sha256(query.encode()).hexdigest()[:16]
        if self.redis:
            try:
                data = self.redis.get(self.prefix + key)
                return json.loads(data) if data else None
            except Exception:
                return None
        entry = self.memory.get(key)
        if entry and time.time() - entry["ts"] < self.ttl:
            return entry["data"]
        return None

    def put(self, query: str, result: dict) -> None:
        key = hashlib.sha256(query.encode()).hexdigest()[:16]
        if self.redis:
            try:
                self.redis.setex(
                    self.prefix + key, self.ttl, json.dumps(result)
                )
                return
            except Exception:
                pass
        self.memory[key] = {"data": result, "ts": time.time()}


# ─────────────────────────────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────────────────────────────
def create_cache(redis_enabled: bool = True):
    """Return ``(response_cache, tool_cache)``.

    Falls back to the in-memory cache automatically when Redis is
    unavailable or ``redis_enabled`` is False.
    """
    if redis_enabled:
        try:
            import redis  # local import — optional dependency at runtime

            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            client = redis.from_url(
                redis_url,
                decode_responses=False,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            client.ping()
            logger.info("[CACHE] Redis connected at %s", redis_url)
            return RedisSemanticCache(client), ToolResultCache(redis_client=client)
        except Exception as exc:
            logger.warning("[CACHE] Redis unavailable: %s — using memory", exc)

    logger.info("[CACHE] Using in-memory fallback")
    return InMemorySemanticCache(), ToolResultCache()
