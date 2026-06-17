"""
Tiny Prometheus-compatible metrics module.

No external deps. Tracks:
- skillnova_http_requests_total{path,method,status}
- skillnova_http_request_duration_ms{path,method}
- skillnova_chat_total{outcome,escalated}
- skillnova_chat_latency_ms
- skillnova_agent_latency_ms
- skillnova_feedback_total{rating}
- skillnova_build_info{version}

Single-process (the FastAPI app runs one process by default).
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Tuple


class Metrics:
    """Lightweight in-memory counter + histogram."""

    def __init__(self, version: str = "4.0.0") -> None:
        self.version = version
        self._http_count: dict[tuple[str, str, int], int] = defaultdict(int)
        self._http_duration_ms: dict[tuple[str, str], list[float]] = defaultdict(list)
        self._chat_count: dict[tuple[str, str], int] = defaultdict(int)
        self._chat_latency_ms: list[float] = []
        self._agent_latency_ms: list[float] = []
        self._feedback: dict[str, int] = defaultdict(int)
        self._started = time.time()

    # --- observability ------------------------------------------------
    def observe_http(self, path: str, method: str, status: int, duration_ms: float) -> None:
        # Normalise dynamic path segments so /api/chat/<uuid> rolls up.
        norm = self._normalise_path(path)
        self._http_count[(norm, method, status)] += 1
        self._http_duration_ms[(norm, method)].append(duration_ms)
        # Keep at most the last 500 samples per path/method pair.
        if len(self._http_duration_ms[(norm, method)]) > 500:
            self._http_duration_ms[(norm, method)] = self._http_duration_ms[(norm, method)][-500:]

    def observe_chat(self, success: bool, escalated: bool, latency_ms: float) -> None:
        outcome = "ok" if success and not escalated else "error" if not success else "escalated"
        self._chat_count[(outcome, str(escalated))] += 1
        self._chat_latency_ms.append(latency_ms)
        if len(self._chat_latency_ms) > 1000:
            self._chat_latency_ms = self._chat_latency_ms[-1000:]

    def observe_agent_latency(self, latency_ms: float) -> None:
        self._agent_latency_ms.append(latency_ms)
        if len(self._agent_latency_ms) > 1000:
            self._agent_latency_ms = self._agent_latency_ms[-1000:]

    def observe_feedback(self, rating: int) -> None:
        key = {-1: "bad", 0: "neutral", 1: "good"}.get(rating, "unknown")
        self._feedback[key] += 1

    # --- helpers ------------------------------------------------------
    def _normalise_path(self, path: str) -> str:
        if not path:
            return "/"
        if path.startswith("/api/chat/") and len(path) > len("/api/chat/"):
            return "/api/chat/{id}"
        if path.startswith("/uploads/"):
            return "/uploads/{file}"
        return path

    @staticmethod
    def _percentile(samples: list[float], q: float) -> float:
        if not samples:
            return 0.0
        s = sorted(samples)
        idx = max(0, min(len(s) - 1, int(round(q * (len(s) - 1)))))
        return s[idx]

    # --- rendering ----------------------------------------------------
    def render(self) -> Tuple[str, str]:
        lines: list[str] = []

        # Build info
        lines.append("# HELP skillnova_build_info Static build information")
        lines.append("# TYPE skillnova_build_info gauge")
        lines.append(f'skillnova_build_info{{version="{self.version}"}} 1')

        # Uptime
        lines.append("# HELP skillnova_uptime_seconds Process uptime in seconds")
        lines.append("# TYPE skillnova_uptime_seconds gauge")
        lines.append(f"skillnova_uptime_seconds {time.time() - self._started:.2f}")

        # HTTP requests
        lines.append("# HELP skillnova_http_requests_total Count of HTTP requests")
        lines.append("# TYPE skillnova_http_requests_total counter")
        for (path, method, status), count in sorted(self._http_count.items()):
            lines.append(
                f'skillnova_http_requests_total{{path="{path}",method="{method}",status="{status}"}} {count}'
            )

        # HTTP duration (p50, p95, p99)
        lines.append("# HELP skillnova_http_request_duration_ms HTTP request duration in milliseconds")
        lines.append("# TYPE skillnova_http_request_duration_ms summary")
        for (path, method), samples in sorted(self._http_duration_ms.items()):
            for q in (0.5, 0.95, 0.99):
                lines.append(
                    f'skillnova_http_request_duration_ms{{path="{path}",method="{method}",quantile="{q}"}} '
                    f"{self._percentile(samples, q):.2f}"
                )

        # Chat totals
        lines.append("# HELP skillnova_chat_total Count of chat attempts")
        lines.append("# TYPE skillnova_chat_total counter")
        for (outcome, escalated), count in sorted(self._chat_count.items()):
            lines.append(
                f'skillnova_chat_total{{outcome="{outcome}",escalated="{escalated}"}} {count}'
            )

        # Chat latency
        lines.append("# HELP skillnova_chat_latency_ms Chat completion latency in ms")
        lines.append("# TYPE skillnova_chat_latency_ms summary")
        for q in (0.5, 0.95, 0.99):
            lines.append(
                f"skillnova_chat_latency_ms{{quantile=\"{q}\"}} {self._percentile(self._chat_latency_ms, q):.2f}"
            )

        # Agent latency
        lines.append("# HELP skillnova_agent_latency_ms LangGraph execution latency in ms")
        lines.append("# TYPE skillnova_agent_latency_ms summary")
        for q in (0.5, 0.95, 0.99):
            lines.append(
                f"skillnova_agent_latency_ms{{quantile=\"{q}\"}} "
                f"{self._percentile(self._agent_latency_ms, q):.2f}"
            )

        # Feedback
        lines.append("# HELP skillnova_feedback_total Count of user feedback")
        lines.append("# TYPE skillnova_feedback_total counter")
        for rating, count in sorted(self._feedback.items()):
            lines.append(f'skillnova_feedback_total{{rating="{rating}"}} {count}')

        return "\n".join(lines) + "\n", "text/plain; version=0.0.4; charset=utf-8"

    def snapshot(self) -> dict:
        """Return a JSON-friendly snapshot for /api/admin/stats."""
        return {
            "version": self.version,
            "uptime_s": round(time.time() - self._started, 2),
            "http": {
                f"{path}|{method}|{status}": count
                for (path, method, status), count in sorted(self._http_count.items())
            },
            "chat": {
                f"{outcome}|{escalated}": count
                for (outcome, escalated), count in sorted(self._chat_count.items())
            },
            "chat_latency_p50_ms": round(self._percentile(self._chat_latency_ms, 0.5), 2),
            "chat_latency_p95_ms": round(self._percentile(self._chat_latency_ms, 0.95), 2),
            "chat_latency_p99_ms": round(self._percentile(self._chat_latency_ms, 0.99), 2),
            "agent_latency_p50_ms": round(self._percentile(self._agent_latency_ms, 0.5), 2),
            "agent_latency_p95_ms": round(self._percentile(self._agent_latency_ms, 0.95), 2),
            "agent_latency_p99_ms": round(self._percentile(self._agent_latency_ms, 0.99), 2),
            "feedback": dict(self._feedback),
        }