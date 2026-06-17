"""Pytest bootstrap — exposes the parent directory on sys.path so the unit
tests can do ``from cache import create_cache`` without packaging internbackend.

This is intentionally only used in tests; production imports go through the
real Python package layout under ``internbackend/``.
"""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))
