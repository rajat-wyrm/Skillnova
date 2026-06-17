# Changelog

All notable changes to SkillNova. Dates in YYYY-MM-DD.

## Unreleased

### Added
- HMAC request signing middleware for external integrations
- Prometheus metrics on both backends (`/api/metrics` Python, `/metrics` Node)
- /api/v1/ versioned API aliases
- /api/admin/stats + /api/admin/recent admin endpoints (token-gated)
- /api/feedback endpoint for ratings (-1, 0, +1)
- WebSocket bridge at /api/ws/chat (Python) and /api/ws/chat (Node)
- Real token streaming on /api/chat/stream
- Zero-dependency JS SDK at sdk/js/skillnova.js
- Python CLI at scripts/cli.py + ./skillnova wrapper
- /status HTML dashboard with auto-refresh
- Dockerfile.python for chatbot-only deploys
- docker-compose.yml with Postgres 16 + Redis 7
- render.yaml one-click deploy blueprint
- Comprehensive docs: SECURITY.md, EXAMPLES.md, TROUBLESHOOTING.md,
  AGENT.md, ARCHITECTURE.md
- Parametrised Python test suite (40+ cases)
- Node unit + middleware test suite (12 tests)

## 1.0.0 — 2026-03

Initial public release.