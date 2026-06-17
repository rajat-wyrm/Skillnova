"""
Local embeddings wrapper.

Falls back to a deterministic hashed-bag-of-words embedding when an
external embedding service is unavailable. The output is always a
384-dimensional float vector so the rest of the pipeline can stay
backend-agnostic.

Hugging Face Inference API is used when HUGGINGFACE_API_KEY is set and
EMBEDDING_BACKEND=huggingface. Otherwise the local backend is used.
"""

from __future__ import annotations

import hashlib
import math
import os
from typing import List

DIM = 384


def _tokenize(text: str) -> List[str]:
    return [t.lower() for t in text.split() if t]


def _hash_token(token: str) -> int:
    h = hashlib.sha256(token.encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big")


def _local_embed(text: str) -> List[float]:
    vec = [0.0] * DIM
    tokens = _tokenize(text)
    if not tokens:
        return vec
    for tok in tokens:
        idx = _hash_token(tok) % DIM
        sign = 1.0 if (_hash_token(tok) % 2 == 0) else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a batch of strings. Always returns one vector per input."""
    backend = os.getenv("EMBEDDING_BACKEND", "local").lower()

    if backend == "huggingface":
        try:
            return _huggingface_embed(texts)
        except Exception:
            # Fall through to local on any error.
            pass

    return [_local_embed(t) for t in texts]


def _huggingface_embed(texts: List[str]) -> List[List[float]]:
    import requests

    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not set")

    model = os.getenv("HUGGINGFACE_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"

    res = requests.post(
        url,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"inputs": texts},
        timeout=20,
    )
    res.raise_for_status()
    data = res.json()

    # HF returns a list of lists, one per input. Normalise to fixed DIM.
    out: List[List[float]] = []
    for vec in data:
        if not isinstance(vec, list):
            continue
        if len(vec) >= DIM:
            out.append([float(x) for x in vec[:DIM]])
        else:
            padded = [float(x) for x in vec] + [0.0] * (DIM - len(vec))
            out.append(padded)
    while len(out) < len(texts):
        out.append(_local_embed(texts[len(out)]))
    return out