"""LangGraph pipeline definition for the SkillNova AIAssistant.

The graph is intentionally compact and dependency-free at import time —
``build_graph()`` returns a compiled StateGraph that ``main.py`` invokes.
"""
from __future__ import annotations

import logging

from langgraph.graph import END, StateGraph

from agent.nodes import (
    blocked_response,
    check_hallucination,
    decide_after_grading,
    decide_after_hallucination_check,
    decide_route,
    direct_response,
    general_response,
    generate,
    grade_documents,
    retrieve,
    rewrite_query,
    route_query,
    web_search,
)
from agent.state import AgentState

logger = logging.getLogger("aiassistant.graph")


def safe_node(node_func, node_name):
    """Wrap a node so a single failure can't crash the whole run."""

    def wrapper(state: AgentState):
        try:
            logger.info("[GRAPH] Executing node: %s", node_name)
            return node_func(state)
        except Exception as exc:
            logger.error("[GRAPH ERROR] Node '%s' failed: %s", node_name, exc)
            return {
                "generation": "Something went wrong. Please try again.",
                "is_escalated": True,
                "confidence": 0.0,
            }

    return wrapper


def escalate_response(state: AgentState) -> dict:
    """Build a friendly escalation message in the user's language."""
    try:
        lang = state.get("language", "en")
        if lang == "hi":
            msg = (
                "मैं अपने उत्तर को सत्यापित नहीं कर सका। "
                "इसे एडमिन टीम को भेजा जा रहा है।"
            )
        else:
            msg = "I couldn't verify my answer. Escalating to the admin team."
        return {"generation": msg, "is_escalated": True, "confidence": 0.0}
    except Exception as exc:
        logger.error("[ESCALATE ERROR] %s", exc)
        return {
            "generation": "System escalation triggered.",
            "is_escalated": True,
            "confidence": 0.0,
        }


def build_graph():
    """Compile and return the agentic RAG graph."""
    workflow = StateGraph(AgentState)

    # Nodes
    workflow.add_node("router", safe_node(route_query, "router"))
    workflow.add_node("direct_response", safe_node(direct_response, "direct"))
    workflow.add_node("general_response", safe_node(general_response, "general"))
    workflow.add_node("blocked_response", safe_node(blocked_response, "blocked"))
    workflow.add_node("retrieve", safe_node(retrieve, "retrieve"))
    workflow.add_node("grade_docs", safe_node(grade_documents, "grade_docs"))
    workflow.add_node("rewrite", safe_node(rewrite_query, "rewrite"))
    workflow.add_node("web_search", safe_node(web_search, "web_search"))
    workflow.add_node("generate", safe_node(generate, "generate"))
    workflow.add_node(
        "hallucination_check", safe_node(check_hallucination, "hallucination")
    )
    workflow.add_node("escalate", safe_node(escalate_response, "escalate"))

    # Entry
    workflow.set_entry_point("router")

    # Conditional routing
    workflow.add_conditional_edges(
        "router",
        decide_route,
        {
            "knowledge_base": "retrieve",
            "web_search": "web_search",
            "direct": "direct_response",
            "general": "general_response",
            "blocked": "blocked_response",
        },
    )

    # Direct / general / blocked paths end here
    workflow.add_edge("direct_response", END)
    workflow.add_edge("general_response", END)
    workflow.add_edge("blocked_response", END)

    # RAG flow
    workflow.add_edge("retrieve", "grade_docs")
    workflow.add_conditional_edges(
        "grade_docs",
        decide_after_grading,
        {
            "generate": "generate",
            "rewrite": "rewrite",
            "web_search": "web_search",
        },
    )
    workflow.add_edge("rewrite", "retrieve")
    workflow.add_edge("web_search", "generate")

    # Generation → hallucination gate → end / escalate
    workflow.add_edge("generate", "hallucination_check")
    workflow.add_conditional_edges(
        "hallucination_check",
        decide_after_hallucination_check,
        {"pass": END, "escalate": "escalate"},
    )
    workflow.add_edge("escalate", END)

    app = workflow.compile()
    logger.info("[GRAPH] Agentic RAG graph compiled successfully")
    return app
