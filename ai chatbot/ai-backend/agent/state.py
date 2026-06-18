"""SkillNova AI Chatbot — agentic RAG state."""
from __future__ import annotations

from typing import TypedDict

from langchain_core.documents import Document


class AgentState(TypedDict, total=False):
    """Shared mutable state for the LangGraph pipeline.

    ``total=False`` keeps every field optional so partial updates from
    LangGraph nodes never crash the run.
    """

    # ── Input Context ────────────────────────────────────────────────
    question: str
    language: str
    role: str
    chat_history: str
    session_id: str

    # ── Retrieval Context ────────────────────────────────────────────
    documents: list[Document]
    web_results: str

    # ── Routing & Control ────────────────────────────────────────────
    route: str
    query_rewrite_count: int
    doc_relevance: str

    # ── Tooling & Observability ──────────────────────────────────────
    tools_used: list[str]
    llm_calls_count: int

    # ── Output ───────────────────────────────────────────────────────
    generation: str | None
    confidence: float
    is_escalated: bool
