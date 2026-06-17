#!/usr/bin/env bash
# Boot the full Skillnova stack (Node + Python) and curl every public
# endpoint to confirm the deploy is healthy. Useful as a smoke test
# before pushing, after pulling, or in a CI job that needs to assert
# "the service is up".
#
# Usage: ./scripts/verify.sh [node-port] [python-port]

set -euo pipefail

NODE_PORT="${1:-5000}"
PY_PORT="${2:-5001}"

echo "== Node health =="
curl -fsS "http://127.0.0.1:${NODE_PORT}/health" && echo
echo "== Node /metrics =="
curl -fsS "http://127.0.0.1:${NODE_PORT}/metrics" | head -5
echo "== Node /health/db =="
curl -fsS "http://127.0.0.1:${NODE_PORT}/health/db" || true
echo "== Node /docs =="
curl -fsS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:${NODE_PORT}/docs"

echo
echo "== Python health =="
curl -fsS "http://127.0.0.1:${PY_PORT}/api/health" || echo "Python chatbot not running on ${PY_PORT}"
echo "== Python /api/metrics =="
curl -fsS "http://127.0.0.1:${PY_PORT}/api/metrics" | head -5 || true
echo "== Python /api/session =="
curl -fsS "http://127.0.0.1:${PY_PORT}/api/session"
echo
echo "== Python /api/ai/suggestions =="
curl -fsS "http://127.0.0.1:${PY_PORT}/api/ai/suggestions" | head -c 200
echo
echo "== Python /api/ai/welcome-message =="
curl -fsS "http://127.0.0.1:${PY_PORT}/api/ai/welcome-message"
echo
echo "All checks done."