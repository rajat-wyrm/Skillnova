#!/usr/bin/env bash
# Skillnova developer bootstrap.
# Safe to re-run; idempotent.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$*"; }
fail() { printf "  \033[31m✗\033[0m %s\n" "$*"; exit 1; }

bold "1/6  System prerequisites"
command -v node  >/dev/null || fail "Node.js not found — install Node 20+ from https://nodejs.org"
command -v npm   >/dev/null || fail "npm not found"
command -v python3 >/dev/null || fail "python3 not found — install Python 3.11+"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
PY_MAJOR="$(python3 -c 'import sys; print(sys.version_info.major)')"
[ "$NODE_MAJOR" -ge 20 ] || warn "Node $NODE_MAJOR detected — recommend 20+"
[ "$PY_MAJOR"  -ge 3 ] || fail "Python 3.11+ required"
ok "node $(node -v), python3 $(python3 -V)"

bold "2/6  Environment files"
for f in internbackend/.env; do
  if [ ! -f "$f" ]; then
    cp "$f.example" "$f"
    ok "created $f from example"
  else
    ok "$f already exists"
  fi
done

bold "3/6  Python virtualenv"
if [ ! -d "internbackend/.venv" ]; then
  python3 -m venv internbackend/.venv
  ok "created internbackend/.venv"
else
  ok "internbackend/.venv exists"
fi
# shellcheck disable=SC1091
source internbackend/.venv/bin/activate
pip install --upgrade pip >/dev/null
pip install -r internbackend/requirements.txt
ok "Python deps installed"

bold "4/6  Node deps"
if [ ! -d "internbackend/node_modules" ]; then
  (cd internbackend && npm ci)
  ok "Node deps installed"
else
  ok "node_modules already present"
fi

bold "5/6  Local services"
if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    docker compose up -d postgres redis
    ok "Postgres + Redis started"
  else
    warn "docker compose plugin not available — skip container start"
  fi
else
  warn "Docker not installed — start Postgres/Redis manually (see ARCHITECTURE.md)"
fi

bold "6/6  Smoke tests"
(cd internbackend && pytest tests/test_units.py -q) && ok "Python unit tests" || warn "Python unit tests failed"
(cd internbackend && npm test --silent -- --passWithNoTests) && ok "Node unit tests"   || warn "Node unit tests failed"

bold "✅ Setup complete"
echo "Next steps:"
echo "  • uvicorn main:app --reload --port 8000      # chatbot"
echo "  • (cd internbackend && npm run dev)          # API"
echo "  • ./internbackend/scripts/verify.sh           # end-to-end smoke"
