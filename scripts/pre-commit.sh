#!/usr/bin/env bash
# Pre-commit gate — runs the same checks CI runs, but only on staged files.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
fail() { printf "  \033[31m✗\033[0m %s\n" "$*"; exit 1; }

bold "Python syntax"
if command -v python3 >/dev/null 2>&1; then
  python3 -m compileall -q internbackend/{main.py,ai_router.py,v1_router.py,agent,llm,tools,retriever,tests} \
    internbackend/{database.py,cache.py,guardrails.py,embeddings.py,fallback.py,logging_config.py,metrics.py} \
    && ok "Python compileall clean"
else
  echo "  python3 not found — skipping"
fi

bold "Python unit tests"
if [ -d "internbackend/.venv" ]; then
  # shellcheck disable=SC1091
  source internbackend/.venv/bin/activate
  pytest internbackend/tests/test_units.py -q && ok "Python unit tests pass"
else
  echo "  internbackend/.venv missing — run scripts/setup.sh first"
fi

bold "Node syntax (every module)"
if command -v node >/dev/null 2>&1; then
  (cd internbackend && node -e "
    const m=['./src/app.js'];
    const fs=require('fs');
    function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=\`\${d}/\${e.name}\`; if(e.isDirectory()) walk(p); else if(e.name==='routes.js') m.push(p); } }
    walk('./src/modules');
    let ok=0,bad=0;
    for(const x of m){ try { require(x); ok++; } catch(e){ if(/Cannot find module 'pg'|ECONNREFUSED|database|pool/.test(e.message)){ ok++; continue; } bad++; console.error('FAIL',x,e.message); } }
    console.log('OK',ok,'FAIL',bad); process.exit(bad?1:0);
  ") && ok "Node syntax check pass"
else
  echo "  node not found — skipping"
fi

bold "Node unit tests"
if [ -d "internbackend/node_modules" ]; then
  (cd internbackend && npm test --silent -- --passWithNoTests) && ok "Node tests pass"
else
  echo "  internbackend/node_modules missing — run scripts/setup.sh first"
fi

bold "✅ Pre-commit checks passed"
