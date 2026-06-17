#!/usr/bin/env bash
# One-command local bring-up for Skillnova.
# Starts Postgres + Redis + the unified Docker image via docker-compose.
# Idempotent: re-running just restarts the containers.
#
# Usage: ./scripts/up.sh [stop|logs|down]

set -euo pipefail

ACTION="${1:-up}"

cd "$(dirname "$0")/.."

case "$ACTION" in
  up)
    docker compose up -d --build
    echo
    echo "Stack is up. Tail logs with: ./scripts/up.sh logs"
    ;;
  stop)
    docker compose stop
    ;;
  down)
    docker compose down
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  *)
    echo "Usage: $0 [up|stop|down|logs]"
    exit 1
    ;;
esac