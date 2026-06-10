import logging
from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.nodes import (
    route_query,
    direct_response,
    general_response,
    blocked_response,
    retrieve,
    grade_documents,
    rewrite_query,
    web_search,
    generate,
    check_hallucination,
    decide_route,
    decide_after_grading,
    decide_after_hallucination_check,
)

logger = logging.getLogger("skillnova.graph")


# -----------------------------------------------
# SAFE NODE WRAPPER
# -----------------------------------------------
def safe_node(node_func, node_name):
    def wrapper(state: AgentState):
        try:
            logger.info(f"[GRAPH] Executing node: {node_name}")
            return node_func(state)
        except Exception as e:
            logger.error(f"[GRAPH ERROR] Node '{node_name}' failed: {e}")
            return {
                "generation": "Something went wrong. Please try again.",
                "is_escalated": True,
                "confidence": 0.0,
            }
    return wrapper


# -----------------------------------------------
# ESCALATION HANDLER (SAFE)
# -----------------------------------------------
def escalate_response(state: AgentState) -> dict:
    try:
        lang = state.get("language", "en")

        if lang == "hi":
            msg = "मैं अपने उत्तर को सत्यापित नहीं कर सका। इसे एडमिन टीम को भेजा जा रहा है।"
        else:
            msg = "I couldn't verify my answer. Escalating to the admin team."

        return {
            "generation": msg,
            "is_escalated": True,
            "confidence": 0.0,
        }

    except Exception as e:
        logger.error(f"[ESCALATE ERROR] {e}")
        return {
            "generation": "System escalation triggered.",
            "is_escalated": True,
            "confidence": 0.0,
        }


# -----------------------------------------------
# BUILD GRAPH
# -----------------------------------------------
def build_graph():
    workflow = StateGraph(AgentState)

    # ---------------- NODES ----------------
    workflow.add_node("router", safe_node(route_query, "router"))

    workflow.add_node("direct_response", safe_node(direct_response, "direct"))
    workflow.add_node("general_response", safe_node(general_response, "general"))
    workflow.add_node("blocked_response", safe_node(blocked_response, "blocked"))

    workflow.add_node("retrieve", safe_node(retrieve, "retrieve"))
    workflow.add_node("grade_docs", safe_node(grade_documents, "grade_docs"))
    workflow.add_node("rewrite", safe_node(rewrite_query, "rewrite"))

    workflow.add_node("web_search", safe_node(web_search, "web_search"))
    workflow.add_node("generate", safe_node(generate, "generate"))

    workflow.add_node("hallucination_check", safe_node(check_hallucination, "hallucination"))

    # 🔥 FIX: wrapped escalate
    workflow.add_node("escalate", safe_node(escalate_response, "escalate"))

    # ---------------- ENTRY ----------------
    workflow.set_entry_point("router")

    # ---------------- ROUTING ----------------
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

    # ---------------- DIRECT FLOWS ----------------
    workflow.add_edge("direct_response", END)
    workflow.add_edge("general_response", END)
    workflow.add_edge("blocked_response", END)

    # ---------------- RAG FLOW ----------------
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

    # ---------------- GENERATION ----------------
    workflow.add_edge("generate", "hallucination_check")

    workflow.add_conditional_edges(
        "hallucination_check",
        decide_after_hallucination_check,
        {
            "pass": END,
            "escalate": "escalate",
        },
    )

    workflow.add_edge("escalate", END)

    # ---------------- COMPILE ----------------
    app = workflow.compile()

    logger.info("[GRAPH] Agentic RAG graph compiled successfully")

    return app