"""Structured logging for the SkillNova AI Chatbot backend.

Provides:
- JSON-formatted log records with request-ID tracing
- File + console handlers, no duplicate logs on re-init
"""
from __future__ import annotations

import logging
import os
from contextvars import ContextVar

# Context variable — request-ID tracing across async boundaries.
request_id_var: ContextVar[str] = ContextVar("request_id", default="no-request")


class StructuredFormatter(logging.Formatter):
    """JSON log formatter that includes the current request ID."""

    def format(self, record: logging.LogRecord) -> str:
        req_id = request_id_var.get("no-request")
        msg = record.getMessage().replace('"', "'")
        return (
            f'{{"ts":"{self.formatTime(record)}",'
            f'"level":"{record.levelname}",'
            f'"request_id":"{req_id}",'
            f'"module":"{record.module}",'
            f'"msg":"{msg}"}}'
        )


def setup_logging() -> logging.Logger:
    """Configure the root ``skillnova`` logger.

    Creates ``logs/`` and ``logs/app.log`` if missing. Idempotent — safe to
    call multiple times (handlers are deduped by the ``skillnova`` namespace
    not propagating to root).
    """
    os.makedirs("logs", exist_ok=True)

    formatter = StructuredFormatter()

    file_handler = logging.FileHandler("logs/app.log", encoding="utf-8")
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    root = logging.getLogger("skillnova")
    # Avoid duplicate handlers on repeated init (tests, reload, etc.)
    if not root.handlers:
        root.addHandler(file_handler)
        root.addHandler(console_handler)
    root.setLevel(logging.INFO)
    root.propagate = False
    return root
