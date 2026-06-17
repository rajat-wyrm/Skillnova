"""
Centralised logging configuration.

Single place to format, filter and route logs for the entire SkillNova
backend. Importable from any module via:

    from logging_config import setup_logging, get_logger

The default level honours the LOG_LEVEL env var (default INFO) and
emits a compact, single-line format that is easy to grep in production.
"""

from __future__ import annotations

import logging
import os
import sys


_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
_DATEFMT = "%Y-%m-%dT%H:%M:%S%z"

_RESERVED = {"skillnova"}


def setup_logging(level: str | None = None) -> None:
    """Configure the root logger. Idempotent — safe to call multiple times."""
    log_level = (level or os.getenv("LOG_LEVEL") or "INFO").upper()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_FORMAT, datefmt=_DATEFMT))

    root = logging.getLogger()
    # Clear any pre-existing handlers (uvicorn installs its own; we want ours
    # to be the source of truth when running `python main.py`).
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    # Quiet down noisy third-party loggers unless the user explicitly wants them.
    if log_level != "DEBUG":
        for noisy in ("httpx", "httpcore", "urllib3", "asyncio"):
            logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger namespaced under the `skillnova` tree."""
    if not name.startswith("skillnova"):
        name = f"skillnova.{name}" if name else "skillnova"
    return logging.getLogger(name)