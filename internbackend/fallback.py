"""
Template-based fallback responses when every LLM provider fails.

Keeps the chatbot responsive even when the upstream models are
unreachable. The reply is grounded in the closest knowledge-base chunk
when one exists; otherwise we return a calm "we are experiencing
issues" message.
"""

from __future__ import annotations

from typing import List

from retriever.vectorstore import Document


_INTENT_HINTS = {
    "attendance": "attendance, leave, present/absent, or the meeting calendar",
    "task": "task submission, validation rules, or proof uploads",
    "report": "weekly reports, templates, and submission deadlines",
    "evaluation": "ratings, performance evaluation criteria, and feedback timelines",
    "meeting": "meeting scheduling, agendas, and follow-up notes",
    "policy": "the latest internship, attendance, or platform policy",
    "platform": "SkillNova platform features and how to use them",
}


def _pick_intent(text: str) -> str | None:
    lowered = text.lower()
    for intent in _INTENT_HINTS:
        if intent in lowered:
            return intent
    return None


def render_fallback(query: str, docs: List[Document] | None = None) -> str:
    """
    Build a polite, grounded fallback reply.

    Priority:
    1. Use the best matching KB chunk (when one was retrieved).
    2. Mention the most likely intent so the user knows what to ask next.
    3. Fall back to a generic "we are having issues" note.
    """
    if docs:
        best = max(docs, key=lambda d: getattr(d, "score", 0.0) or 0.0)
        snippet = best.text.strip().replace("\n", " ")
        if len(snippet) > 400:
            snippet = snippet[:400].rsplit(" ", 1)[0] + "..."
        return (
            "Our AI models are temporarily unavailable, "
            f"but here is what we know from {best.source}:\n\n{snippet}\n\n"
            "If this is not what you needed, please email the admin team."
        )

    intent = _pick_intent(query)
    if intent:
        return (
            "Our AI models are temporarily unavailable. "
            f"If your question is about {_INTENT_HINTS[intent]}, "
            "please try again in a few minutes or email the admin team."
        )

    return (
        "Our AI models are temporarily unavailable. "
        "Please try again in a moment or contact the admin team for urgent questions."
    )


def off_topic_response() -> str:
    return (
        "I'm SkillNova AI, your intern support assistant. "
        "I can help with tasks, attendance, reports, meetings, evaluations, "
        "and platform questions. Could you rephrase your question in that context?"
    )