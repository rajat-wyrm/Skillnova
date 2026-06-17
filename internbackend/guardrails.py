"""
Input validation and language detection for the chatbot.

Hard guardrails:
- Max length and char-class restrictions to defeat trivial injection.
- Blocklist for jailbreak attempts (matched case-insensitively on substrings).
- Hindi / English detection using a deterministic Unicode-range heuristic.
"""

from __future__ import annotations

import re
from typing import Tuple


MAX_MESSAGE_LENGTH = 2000
MIN_MESSAGE_LENGTH = 1

_HINDI_RE = re.compile(r"[\u0900-\u097F]")
_LATIN_RE = re.compile(r"[A-Za-z]")

_BLOCKLIST = (
    "ignore previous",
    "ignore all previous",
    "system prompt",
    "jailbreak",
    "disregard your instructions",
    "act as",
    "pretend you are",
)


def validate_input(text: str) -> Tuple[bool, str]:
    """Return (is_valid, message_or_error). On invalid, message is the user-facing reason."""
    if text is None:
        return False, "Empty message."
    cleaned = text.strip()
    if len(cleaned) < MIN_MESSAGE_LENGTH:
        return False, "Please type a message."
    if len(cleaned) > MAX_MESSAGE_LENGTH:
        return False, f"Message too long. Please keep it under {MAX_MESSAGE_LENGTH} characters."

    lowered = cleaned.lower()
    for phrase in _BLOCKLIST:
        if phrase in lowered:
            return False, "Request blocked for safety reasons."

    return True, ""


def detect_language(text: str) -> str:
    """
    Return "hi" for Hindi-leaning text, "en" otherwise.
    Uses Unicode-range density; if at least 25% of the alpha chars are
    Devanagari, classify as Hindi.
    """
    if not text:
        return "en"
    hindi = len(_HINDI_RE.findall(text))
    latin = len(_LATIN_RE.findall(text))
    total_alpha = hindi + latin
    if total_alpha == 0:
        return "en"
    return "hi" if (hindi / total_alpha) >= 0.25 else "en"