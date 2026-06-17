"""
SkillNova CLI — talk to the chatbot from the terminal.

Usage:
    python -m scripts.cli "How do I submit a task?"
    python -m scripts.cli --stream "Tell me about InternOps."
    python -m scripts.cli --bootstrap
    python -m scripts.cli --health

Requires either SKILLNOVA_URL set or the API on http://localhost:5000.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from urllib import error, request

DEFAULT_URL = os.getenv("SKILLNOVA_URL", "http://localhost:5000")
TIMEOUT = 30


def _url(path: str) -> str:
    return f"{DEFAULT_URL.rstrip('/')}{path}"


def _get_json(path: str) -> dict:
    with request.urlopen(_url(path), timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _post_json(path: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = request.Request(
        _url(path),
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def cmd_health() -> int:
    body = _get_json("/api/health")
    print(json.dumps(body, indent=2))
    return 0


def cmd_bootstrap() -> int:
    body = _get_json("/api/ai/bootstrap") if _url_exists("/api/ai/bootstrap") else {
        "suggestions": _get_json("/api/ai/suggestions"),
        "capabilities": _get_json("/api/ai/capabilities"),
        "welcomeMessage": _get_json("/api/ai/welcome-message").get("message"),
    }
    print(json.dumps(body, indent=2))
    return 0


def _url_exists(path: str) -> bool:
    try:
        with request.urlopen(_url(path), timeout=5):
            return True
    except Exception:
        return False


def cmd_chat(message: str) -> int:
    try:
        body = _post_json("/api/chat", {"message": message})
    except error.HTTPError as exc:
        print(f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='ignore')}", file=sys.stderr)
        return 1
    print(body.get("reply", ""))
    if body.get("sources"):
        print(f"\n[confidence={body['confidence']:.2f} sources={body['sources']}]", file=sys.stderr)
    return 0


async def cmd_stream(message: str) -> int:
    import urllib.request

    data = json.dumps({"message": message}).encode("utf-8")
    req = request.Request(
        _url("/api/chat/stream"),
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT * 4) as resp:
            for raw in resp:
                line = raw.decode("utf-8", errors="ignore").strip()
                if not line.startswith("data: "):
                    continue
                payload = line[6:].strip()
                if not payload:
                    continue
                try:
                    event = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                if event.get("type") == "token":
                    print(event.get("content", ""), end="", flush=True)
                elif event.get("type") == "done":
                    print(
                        f"\n\n[confidence={event.get('confidence', 0):.2f} "
                        f"sources={event.get('sources', [])}]",
                        file=sys.stderr,
                    )
                elif event.get("type") == "error":
                    print(f"\n[error] {event.get('message')}", file=sys.stderr)
                    return 1
    except error.HTTPError as exc:
        print(f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='ignore')}", file=sys.stderr)
        return 1
    print()
    return 0


def main() -> int:
    global DEFAULT_URL

    parser = argparse.ArgumentParser(
        prog="skillnova",
        description="SkillNova AI chatbot CLI",
    )
    parser.add_argument("message", nargs="?", help="Message to send to the chatbot")
    parser.add_argument("--health", action="store_true", help="Show /api/health")
    parser.add_argument("--bootstrap", action="store_true", help="Show suggestions, capabilities, welcome")
    parser.add_argument("--stream", action="store_true", help="Stream tokens as they arrive")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Backend URL (default: {DEFAULT_URL})")
    args = parser.parse_args()

    DEFAULT_URL = args.url

    if args.health:
        return cmd_health()
    if args.bootstrap:
        return cmd_bootstrap()
    if args.stream and args.message:
        return asyncio.run(cmd_stream(args.message))
    if args.message:
        return cmd_chat(args.message)
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())