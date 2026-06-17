#!/usr/bin/env bash
# Push the Skillnova repo to GitHub using a token.
# Usage: ./push.sh <github_token>
#   or:  GITHUB_TOKEN=<github_token> ./push.sh
#
# Get a token at https://github.com/settings/tokens (scope: repo).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

TOKEN="${1:-${GITHUB_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "Usage: $0 <github_token>  (or set GITHUB_TOKEN)"
  echo "Get a token at https://github.com/settings/tokens (scope: repo)"
  exit 1
fi

REMOTE="https://x-access-token:${TOKEN}@github.com/rajat-wyrm/Skillnova.git"

git remote set-url origin "https://github.com/rajat-wyrm/Skillnova.git"

echo ">> Pushing to rajat-wyrm/Skillnova:main (force)"
GIT_TERMINAL_PROMPT=0 git push "$REMOTE" main:main --force --no-verify

git remote set-url origin "https://github.com/rajat-wyrm/Skillnova.git"

echo ""
echo ">> Done. Verify the CI pipeline runs:"
echo "   https://github.com/rajat-wyrm/Skillnova/actions"