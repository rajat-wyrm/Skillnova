"""
Production-grade Guardrails for SkillNova Agentic RAG

Improvements:
- Stronger regex protection
- Input normalization
- Better jailbreak detection
- Safe fallback behavior
- Cleaner language detection
"""

import re
import logging

logger = logging.getLogger("skillnova.guardrails")

# -----------------------------------------------
# CONFIG
# -----------------------------------------------
MAX_MESSAGE_LENGTH = 2000
MIN_MESSAGE_LENGTH = 1

# -----------------------------------------------
# BLOCKED PATTERNS (enhanced)
# -----------------------------------------------
BLOCKED_PATTERNS = [
    # System commands
    r'\b(rm\s+-rf|sudo|chmod|chown|mkfs|dd\s+if=)\b',

    # SQL injection
    r'\b(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b',

    # XSS
    r'<script[\s>]',
    r'javascript:',

    # Prompt injection / jailbreak
    r'ignore\s+(previous|above|all)\s+(instructions?|rules?|prompts?)',
    r'you\s+are\s+(now|no\s+longer)\s+',
    r'pretend\s+(to\s+be|you.re)',
    r'role\s*:\s*(system|admin)',
    r'bypass\s+(safety|filters)',
    r'disable\s+(guardrails|safety)',

    # Data exfiltration attempts
    r'give\s+me\s+(all|full)\s+(data|database)',
]

# Precompile regex for performance
COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]


# -----------------------------------------------
# INPUT VALIDATION
# -----------------------------------------------
def validate_input(message: str) -> tuple:
    """
    Returns:
        (is_valid: bool, error_message: str)
    """

    if not message:
        return False, "Message cannot be empty."

    # Normalize
    stripped = message.strip()

    if len(stripped) < MIN_MESSAGE_LENGTH:
        return False, "Message cannot be empty."

    if len(stripped) > MAX_MESSAGE_LENGTH:
        return False, f"Message too long (max {MAX_MESSAGE_LENGTH} chars)."

    # Check blocked patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(stripped):
            logger.warning(f"[GUARDRAIL] Blocked pattern: {pattern.pattern}")
            return False, "Your message contains restricted or unsafe content."

    return True, ""


# -----------------------------------------------
# LLM SAFETY CLASSIFIER (OPTIONAL)
# -----------------------------------------------
def classify_safety(message: str, llm) -> str:
    """
    Returns: "safe" | "suspicious" | "malicious"
    Only used for advanced filtering.
    """

    try:
        from agent.prompts import SAFETY_CLASSIFIER_PROMPT

        chain = SAFETY_CLASSIFIER_PROMPT | llm
        result = chain.invoke({"message": message}).content.strip().lower()

        if result in ("safe", "suspicious", "malicious"):
            logger.info(f"[SAFETY] {result}")
            return result

        logger.warning(f"[SAFETY] Unexpected result: {result}")
        return "suspicious"

    except Exception as e:
        # Never block user due to LLM failure
        logger.error(f"[SAFETY ERROR] {e}")
        return "safe"


# -----------------------------------------------
# LANGUAGE DETECTION
# -----------------------------------------------
def detect_language(text: str) -> str:
    """
    Returns:
        "en" | "hi" | "other" | "unknown"
    """

    if not text or not text.strip():
        return "unknown"

    # Count scripts
    devanagari = len(re.findall(r'[\u0900-\u097F]', text))
    latin = len(re.findall(r'[a-zA-Z]', text))

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