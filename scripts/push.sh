# ════════════════════════════════════════════════════════════
#  Git push helper for SkillNova
# ════════════════════════════════════════════════════════════
#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/rajat-wyrm/Skillnova.git}"
BRANCH="${BRANCH:-main}"
MSG="${MSG:-feat: production-ready SkillNova (backend + refactored frontend)}"

if [[ -n "${TOKEN:-}" ]]; then
  AUTHED_URL="https://x-access-token:${TOKEN}@${REPO_URL#https://}"
else
  AUTHED_URL="$REPO_URL"
fi

echo "🔧  Initialising repo (if needed)…"
if [[ ! -d .git ]]; then
  git init -b "$BRANCH"
  git remote add origin "$AUTHED_URL"
else
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "$AUTHED_URL"
  fi
fi

git config user.name  "SkillNova Bot"
git config user.email "bot@skillnova.local"

echo "📦  Adding files…"
git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit."
else
  echo "💾  Committing…"
  git commit -m "$MSG"
fi

echo "🚀  Pushing to $REPO_URL ($BRANCH)…"
git push -u origin "$BRANCH" --force-with-lease || git push -u origin "$BRANCH"
echo "✅  Done."
