"""
Guardrails for the SkillNova AI Chatbot.

- Input validation: length, blocked patterns (injection, jailbreak, XSS, …)
- Optional LLM safety classifier (kept for advanced filtering)
- Lightweight language detection (Latin / Devanagari)
"""
from __future__ import annotations

import logging
import re

logger = logging.getLogger("skillnova.guardrails")

MAX_MESSAGE_LENGTH = 2000
MIN_MESSAGE_LENGTH = 1

BLOCKED_PATTERNS = [
    # System commands
    r"\b(rm\s+-rf|sudo|chmod|chown|mkfs|dd\s+if=)\b",
    # SQL primitives
    r"\b(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b",
    # XSS
    r"<script[\s>]",
    r"javascript:",
    # Prompt injection / jailbreak
    r"ignore\s+(previous|above|all)\s+(instructions?|rules?|prompts?)",
    r"you\s+are\s+(now|no\s+longer)\s+",
    r"pretend\s+(to\s+be|you.re)",
    r"role\s*:\s*(system|admin)",
    r"bypass\s+(safety|filters)",
    r"disable\s+(guardrails|safety)",
    # Data exfiltration
    r"give\s+me\s+(all|full)\s+(data|database)",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]


def validate_input(message: str) -> tuple[bool, str]:
    """Return ``(is_valid, error_message)``.

    On success the message is valid and the second element is empty.
    """
    if not message:
        return False, "Message cannot be empty."

    stripped = message.strip()
    if len(stripped) < MIN_MESSAGE_LENGTH:
        return False, "Message cannot be empty."
    if len(stripped) > MAX_MESSAGE_LENGTH:
        return False, f"Message too long (max {MAX_MESSAGE_LENGTH} chars)."

    for pattern in COMPILED_PATTERNS:
        if pattern.search(stripped):
            logger.warning("[GUARDRAIL] Blocked pattern: %s", pattern.pattern)
            return False, "Your message contains restricted or unsafe content."

    return True, ""


def classify_safety(message: str, llm) -> str:
    """Use an LLM to classify a message as ``safe`` / ``suspicious`` / ``malicious``.

    Always returns a valid value — LLM failures degrade to ``safe`` so
    that the chatbot is not blocked by transient outages.
    """
    try:
        from agent.prompts import SAFETY_CLASSIFIER_PROMPT

        chain = SAFETY_CLASSIFIER_PROMPT | llm
        result = chain.invoke({"message": message}).content.strip().lower()
        if result in ("safe", "suspicious", "malicious"):
            logger.info("[SAFETY] %s", result)
            return result
        logger.warning("[SAFETY] Unexpected result: %s", result)
        return "suspicious"
    except Exception as exc:
        logger.error("[SAFETY ERROR] %s", exc)
        return "safe"


def detect_language(text: str) -> str:
    """Detect Hindi (``hi``), English (``en``), or other.

    Returns ``unknown`` for empty input.
    """
    if not text or not text.strip():
        return "unknown"

    devanagari = len(re.findall(r"[\u0900-\u097F]", text))
    latin = len(re.findall(r"[a-zA-Z]", text))
    total = devanagari + latin
    if total == 0:
        return "unknown"

    dev_ratio = devanagari / total
    lat_ratio = latin / total
    if dev_ratio > 0.3:
        return "hi"
    if lat_ratio > 0.5:
        return "en"
    return "other"
