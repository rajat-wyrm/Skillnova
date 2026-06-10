"""
Production-grade caching layer for SkillNova

Fixes:
- No Redis KEYS (uses SCAN)
- Redis URL from env
- Safe fallbacks
- Better performance
"""

import time
import hashlib
import json
import logging
import os
import numpy as np
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger("skillnova.cache")


# -----------------------------------------------
# EMBEDDING (shared lazy loader)
# -----------------------------------------------
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings


# -----------------------------------------------
# IN-MEMORY CACHE (fallback)
# -----------------------------------------------
class InMemorySemanticCache:
    def __init__(self, similarity_threshold=0.92, max_entries=500, ttl_seconds=43200):
        self.threshold = similarity_threshold
        self.max_entries = max_entries
        self.ttl = ttl_seconds
        self.cache = []

    def get(self, query: str, route: str = ""):
        if not self.cache:
            return None

        emb = get_embeddings()
        query_vec = np.array(emb.embed_query(query))
        now = time.time()

        best_score, best_entry = 0.0, None

        for vec, response, ts, _ in self.cache:
            if now - ts > self.ttl:
                continue

            score = float(np.dot(query_vec, vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-8
            ))

            if score > best_score:
                best_score = score
                best_entry = response

        if best_score >= self.threshold:
            logger.info(f"[CACHE] HIT (memory) score={best_score:.3f}")
            return best_entry

        return None

    def put(self, query: str, response: dict, route: str = "knowledge_base"):
        if route == "web_search":
            return

        emb = get_embeddings()
        vec = np.array(emb.embed_query(query))

        self.cache.append((vec, response, time.time(), route))

        if len(self.cache) > self.max_entries:
            self.cache = self.cache[-self.max_entries:]

        logger.info("[CACHE] PUT (memory)")


# -----------------------------------------------
# REDIS CACHE (production)
# -----------------------------------------------
class RedisSemanticCache:
    def __init__(self, redis_client, similarity_threshold=0.92, ttl_seconds=43200):
        self.redis = redis_client
        self.threshold = similarity_threshold
        self.ttl = ttl_seconds
        self.prefix = "skillnova:cache:"

    def get(self, query: str, route: str = ""):
        try:
            emb = get_embeddings()
            query_vec = np.array(emb.embed_query(query), dtype=np.float32)

            best_score, best_response = 0.0, None

            cursor = 0
            while True:
                cursor, keys = self.redis.scan(cursor, match=f"{self.prefix}*")

                for key in keys:
                    cached = self.redis.hgetall(key)
                    if not cached:
                        continue

                    vec = np.frombuffer(cached[b"embedding"], dtype=np.float32)

                    score = float(np.dot(query_vec, vec) / (
                        np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-8
                    ))

                    if score > best_score:
                        best_score = score
                        best_response = json.loads(cached[b"response"])

                if cursor == 0:
                    break

            if best_score >= self.threshold:
                logger.info(f"[CACHE] HIT (redis) score={best_score:.3f}")
                return best_response

        except Exception as e:
            logger.warning(f"[CACHE] Redis GET error: {e}")

        return None

    def put(self, query: str, response: dict, route: str = "knowledge_base"):
        if route == "web_search":
            return

        try:
            emb = get_embeddings()
            vec = np.array(emb.embed_query(query), dtype=np.float32)

            query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]
            key = f"{self.prefix}{query_hash}"

            ttl = 86400 if route in ("direct", "general") else self.ttl

            self.redis.hset(key, mapping={
                "embedding": vec.tobytes(),
                "response": json.dumps(response),
                "route": route,
                "ts": str(time.time())
            })

            self.redis.expire(key, ttl)

            logger.info(f"[CACHE] PUT (redis) ttl={ttl}")

        except Exception as e:
            logger.warning(f"[CACHE] Redis PUT error: {e}")


# -----------------------------------------------
# TOOL CACHE
# -----------------------------------------------
class ToolResultCache:
    def __init__(self, redis_client=None, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl
        self.memory = {}
        self.prefix = "skillnova:tool:"

    def get(self, query: str):
        key = hashlib.sha256(query.encode()).hexdigest()[:16]

        if self.redis:
            try:
                data = self.redis.get(self.prefix + key)
                return json.loads(data) if data else None
            except:
                return None

        entry = self.memory.get(key)
        if entry and time.time() - entry["ts"] < self.ttl:
            return entry["data"]

        return None

    def put(self, query: str, result: dict):
        key = hashlib.sha256(query.encode()).hexdigest()[:16]

        if self.redis:
            try:
                self.redis.setex(self.prefix + key, self.ttl, json.dumps(result))
                return
            except:
                pass

        self.memory[key] = {"data": result, "ts": time.time()}


# -----------------------------------------------
# FACTORY
# -----------------------------------------------
def create_cache(redis_enabled=True):
    if redis_enabled:
        try:
            import redis

            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

            client = redis.from_url(
                redis_url,
                decode_responses=False,
                socket_connect_timeout=2,
                socket_timeout=2,
            )

            client.ping()

            logger.info("[CACHE] Redis connected")

            return (
                RedisSemanticCache(client),
                ToolResultCache(redis_client=client),
            )

        except Exception as e:
            logger.warning(f"[CACHE] Redis unavailable: {e}")

    logger.info("[CACHE] Using in-memory fallback")

    return (
        InMemorySemanticCache(),
        ToolResultCache(),
    )