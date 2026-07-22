"""Prompt templates used across the LangGraph pipeline."""
from __future__ import annotations

from langchain_core.prompts import PromptTemplate

# ─────────────────────────────────────────────────────────────────────
# 1. Router
# ─────────────────────────────────────────────────────────────────────
ROUTER_PROMPT = PromptTemplate(
    template=(
        "Classify the query into ONE category:\n"
        "- direct → greetings, casual talk\n"
        "- knowledge_base → internship, policies, tasks, reports, meetings, platform\n"
        "- general → general knowledge, facts, definitions\n"
        "- web_search → current events, live data, recent info\n\n"
        "Return ONLY one word.\n\n"
        "Query: {question}\n"
        "Category:"
    ),
    input_variables=["question"],
)


# ─────────────────────────────────────────────────────────────────────
# 2. Batch grader
# ─────────────────────────────────────────────────────────────────────
BATCH_GRADER_PROMPT = PromptTemplate(
    template=(
        "Select relevant documents for the question.\n\n"
        "Question: {question}\n\n"
        "Documents:\n{documents_text}\n\n"
        "Return document numbers (comma-separated).\n"
        "If none relevant → NONE\n\n"
        "Answer:"
    ),
    input_variables=["question", "documents_text"],
)


# ─────────────────────────────────────────────────────────────────────
# 3. Query rewriter
# ─────────────────────────────────────────────────────────────────────
REWRITER_PROMPT = PromptTemplate(
    template=(
        "Rewrite the query to improve document search.\n\n"
        "Focus on: internship policies, tasks, attendance, reports, evaluation.\n"
        "Make it concise and keyword-rich.\n\n"
        "Original: {question}\n"
        "Rewritten:"
    ),
    input_variables=["question"],
)


# ─────────────────────────────────────────────────────────────────────
# 4. Generator
# ─────────────────────────────────────────────────────────────────────
GENERATOR_PROMPT = PromptTemplate(
    template=(
        "You are the SkillNova AI assistant.\n\n"
        "STRICT RULES:\n"
        "- Use ONLY the provided context.\n"
        "- If the answer is NOT present, respond EXACTLY: ESCALATE_TO_ADMIN\n"
        "- Do NOT guess or add external knowledge.\n\n"
        "OUTPUT FORMAT (MANDATORY):\n"
        "- Start with one short summary line.\n"
        "- Then a detailed structured explanation.\n"
        "- Use bullet points and short paragraphs.\n"
        "- Use headings when helpful.\n\n"
        "Language: {language}\n\n"
        "Context:\n{context}\n\n"
        "Question:\n{question}\n\n"
        "Answer:"
    ),
    input_variables=["language", "context", "question"],
)


# ─────────────────────────────────────────────────────────────────────
# 5. Direct response (greetings / small talk)
# ─────────────────────────────────────────────────────────────────────
DIRECT_PROMPT = PromptTemplate(
    template=(
        "You are a friendly assistant.\n\n"
        "Rules:\n"
        "- Reply naturally.\n"
        "- Keep it short (1–2 lines).\n"
        "- No explanations unless asked.\n"
        "- Sound human.\n\n"
        "Language: {language}\n\n"
        "User: {question}\n"
        "Response:"
    ),
    input_variables=["language", "question"],
)


# ─────────────────────────────────────────────────────────────────────
# 6. General response (general knowledge)
# ─────────────────────────────────────────────────────────────────────
GENERAL_PROMPT = PromptTemplate(
    template=(
        "Answer clearly and simply.\n\n"
        "Rules:\n"
        "- Use structured explanation.\n"
        "- Use bullets if needed.\n"
        "- Avoid long unstructured paragraphs.\n\n"
        "Language: {language}\n\n"
        "Question: {question}\n"
        "Answer:"
    ),
    input_variables=["language", "question"],
)


# ─────────────────────────────────────────────────────────────────────
# 7. Hallucination check
# ─────────────────────────────────────────────────────────────────────
HALLUCINATION_CHECK_PROMPT = PromptTemplate(
    template=(
        "Check if the answer is fully supported by the context.\n\n"
        "Context:\n{context}\n\n"
        "Answer:\n{answer}\n\n"
        "Respond ONLY:\n"
        "yes → grounded\n"
        "no → hallucination\n\n"
        "Result:"
    ),
    input_variables=["context", "answer"],
)


# ─────────────────────────────────────────────────────────────────────
# 8. Safety classifier
# ─────────────────────────────────────────────────────────────────────
SAFETY_CLASSIFIER_PROMPT = PromptTemplate(
    template=(
        "Classify the message:\n\n"
        "safe / suspicious / malicious\n\n"
        "Message: {message}\n\n"
        "Answer:"
    ),
    input_variables=["message"],
)
