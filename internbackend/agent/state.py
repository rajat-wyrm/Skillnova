"""
State definition for the SkillNova Agentic RAG pipeline.

Production-safe version:
- All fields are optional (total=False) to prevent runtime crashes
- Compatible with LangGraph dynamic state updates
- Supports RAG, web search, routing, and observability
"""

from typing import TypedDict, List, Optional
from langchain_core.documents import Document


class AgentState(TypedDict, total=False):
    """
    Shared state across all nodes in the agentic RAG graph.

    Designed for:
    - Safe execution (no KeyError crashes)
    - Flexible node updates
    - Production-grade observability
    """

    # ── Input Context ─────────────────────────
    question: str                       # User query
    language: str                       # "en" / "hi"
    role: str                           # "Intern" / "Admin"
    chat_history: str                   # Previous conversation context
    session_id: str                     # Unique session ID

    # ── Retrieval Context ─────────────────────
    documents: List[Document]           # Retrieved documents (FAISS)
    web_results: str                    # Web search fallback content

    # ── Routing & Control ─────────────────────
    route: str                          # "knowledge_base" | "web_search" | "direct" | "general"
    query_rewrite_count: int            # Prevent infinite rewrite loops
    doc_relevance: str                  # "relevant" | "irrelevant"

    # ── Tooling & Observability ──────────────
    tools_used: List[str]               # ["faiss", "web_search"]
    llm_calls_count: int                # Number of LLM calls in request

    # ── Output ───────────────────────────────
    generation: Optional[str]           # Final response
    confidence: float                   # Confidence score (0.0 → 1.0)
    is_escalated: bool                  # Escalation flag