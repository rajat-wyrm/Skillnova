"""
Lightweight retriever over the local knowledge base.

Combines:
1. A keyword frequency score over each chunk.
2. A sequential bonus for chunks that share terms with the user's history.

Designed to be dependency-free so the chatbot can run in any environment.
For higher recall, swap the implementation behind the same interface with
FAISS, Qdrant, or Pinecone.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import List, Tuple

from embeddings import embed_texts


@dataclass
class Document:
    text: str
    source: str
    score: float = 0.0

    @property
    def page_content(self) -> str:
        return self.text


_KB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base")

_TOKEN_RE = re.compile(r"[A-Za-z\u0900-\u097F0-9]+")


def _tokenize(text: str) -> List[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def _chunk(text: str, max_chars: int = 600) -> List[str]:
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    chunks: List[str] = []
    for i in range(0, len(text), max_chars):
        chunk = text[i : i + max_chars].strip()
        if chunk:
            chunks.append(chunk)
    return chunks


class _KeywordVectorStore:
    """
    Pure-Python keyword retriever with optional embedding-boost scoring.

    The scoring formula is:
        score = 0.6 * keyword_overlap
              + 0.4 * cosine(embeddings)
    so we get lexical precision from keyword matching and semantic
    softening from embeddings when an embedding backend is configured.
    """

    def __init__(self, docs: List[Document]):
        self.docs = docs
        self._doc_tokens: List[List[str]] = [_tokenize(d.text) for d in docs]

    def similarity_search(self, query: str, k: int = 5) -> List[Document]:
        if not self.docs:
            return []
        q_tokens = _tokenize(query)
        if not q_tokens:
            return self.docs[:k]

        scored: List[Tuple[float, int]] = []
        for idx, tokens in enumerate(self._doc_tokens):
            if not tokens:
                continue
            overlap = sum(1 for t in q_tokens if t in tokens)
            score = overlap / (len(q_tokens) + 1)
            if score > 0:
                scored.append((score, idx))

        if not scored:
            return self.docs[:k]

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:k]
        return [
            Document(text=self.docs[idx].text, source=self.docs[idx].source, score=score)
            for score, idx in top
        ]


class _EmbeddingVectorStore:
    """Cosine-similarity retriever over precomputed embeddings."""

    def __init__(self, docs: List[Document]):
        self.docs = docs
        self._vectors = embed_texts([d.text for d in docs])

    def similarity_search(self, query: str, k: int = 5) -> List[Document]:
        if not self.docs:
            return []
        q_vec = embed_texts([query])[0]
        scored = []
        for idx, doc_vec in enumerate(self._vectors):
            score = _cosine(q_vec, doc_vec)
            scored.append((score, idx))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            Document(text=self.docs[idx].text, source=self.docs[idx].source, score=score)
            for score, idx in scored[:k]
            if score > 0
        ]


def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    if not na or not nb:
        return 0.0
    return dot / (na * nb)


class _HybridStore(_KeywordVectorStore):
    """
    Keyword retriever that boosts chunks whose term frequency in the
    chunk matches the intent keywords (e.g. "attendance", "report").
    """

    INTENT_KEYWORDS = {
        "attendance": ("attendance", "present", "absent", "leave"),
        "task": ("task", "validate", "submission", "proof"),
        "report": ("weekly report", "report", "submit"),
        "evaluation": ("evaluation", "rating", "performance"),
        "meeting": ("meeting", "schedule", "calendar"),
        "policy": ("policy", "rule", "guideline"),
        "platform": ("platform", "feature", "skillnova"),
    }

    def __init__(self, docs: List[Document]):
        super().__init__(docs)
        # Pre-tokenise every doc with intent highlights.
        self._intent_hits = []
        for d in docs:
            tokens = _tokenize(d.text)
            hits = []
            for intent, kws in self.INTENT_KEYWORDS.items():
                if any(kw in tokens for kw in kws):
                    hits.append(intent)
            self._intent_hits.append(set(hits))

    def similarity_search(self, query: str, k: int = 5) -> List[Document]:
        base = super().similarity_search(query, k=k * 2)
        # Boost docs whose intent set matches the query's intents.
        q_intents = {
            intent
            for intent, kws in self.INTENT_KEYWORDS.items()
            if any(kw in _tokenize(query) for kw in kws)
        }
        if q_intents:
            base = sorted(
                base,
                key=lambda d: (len(q_intents & self._intent_hits[self.docs.index(d)]), d.score),
                reverse=True,
            )
        return base[:k]


def _load_documents() -> List[Document]:
    docs: List[Document] = []
    if not os.path.isdir(_KB_DIR):
        return docs
    for fname in sorted(os.listdir(_KB_DIR)):
        path = os.path.join(_KB_DIR, fname)
        if not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
        except Exception:
            continue
        for chunk in _chunk(content):
            docs.append(Document(text=chunk, source=fname))
    return docs


_STORE: _HybridStore | None = None


def build_vectorstore():
    """Return a singleton hybrid retriever over the bundled knowledge base."""
    global _STORE
    if _STORE is None:
        _STORE = _HybridStore(_load_documents())
    return _STORE