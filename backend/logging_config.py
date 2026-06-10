"""
Structured logging configuration for SkillNova.

Features:
  - JSON-formatted log entries for machine parsing
  - Request-ID tracing via contextvars
  - File + console output
  - Per-module loggers (skillnova.agent, skillnova.tools, etc.)
"""

import os
import logging
from contextvars import ContextVar

# Context variable for request-ID tracing across async boundaries
request_id_var: ContextVar[str] = ContextVar("request_id", default="no-request")


class StructuredFormatter(logging.Formatter):
    """JSON-structured log formatter with request-ID tracing."""
    def format(self, record):
        req_id = request_id_var.get("no-request")
        msg = record.getMessage().replace('"', "'")
        return (
            f'{{"ts":"{self.formatTime(record)}",'
            f'"level":"{record.levelname}",'
            f'"request_id":"{req_id}",'
            f'"module":"{record.module}",'
            f'"msg":"{msg}"}}'
        )


def setup_logging():
    """Initialize structured logging with file and console handlers."""
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)

    formatter = StructuredFormatter()

    # File handler
    file_handler = logging.FileHandler("logs/app.log", encoding="utf-8")
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Root logger for all skillnova modules
    root = logging.getLogger("skillnova")
    root.addHandler(file_handler)
    root.addHandler(console_handler)
    root.setLevel(logging.INFO)

    # Avoid duplicate logs if called multiple times
    root.propagate = False

    return root
