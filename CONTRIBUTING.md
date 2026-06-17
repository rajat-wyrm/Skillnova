# Contributing to Skillnova

Thank you for your interest in making Skillnova better. This guide will get you from
`git clone` to a green PR in under fifteen minutes.

---

## Table of contents

1. [Code of conduct](#code-of-conduct)
2. [Project layout](#project-layout)
3. [One-command setup](#one-command-setup)
4. [Day-to-day workflow](#day-to-day-workflow)
5. [Commit & PR conventions](#commit--pr-conventions)
6. [Testing](#testing)
7. [Style guide](#style-guide)
8. [Release process](#release-process)
9. [Getting help](#getting-help)

---

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating
you agree to uphold it. Report unacceptable behaviour to **rajatkumar7861813@gmail.com**.

## Project layout

```
Skillnova/
├── internbackend/          # Python FastAPI chatbot + Node.js Fastify API
│   ├── main.py             # Python entrypoint (Uvicorn ASGI)
│   ├── ai_router.py        # /api/ai/* aliases for React frontend
│   ├── v1_router.py        # /api/v1/* versioned surface
│   ├── llm/                # Streaming LLM providers (Gemini / Groq / DeepSeek)
│   ├── agent/              # LangGraph state-machine agent
│   ├── retriever/          # Intent classifier + vector retriever
│   ├── src/                # Node.js Fastify application
│   ├── tests/              # Pytest + Jest tests
│   └── scripts/            # setup.sh, verify.sh, cli.py
├── sdk/js/                 # Zero-dependency JavaScript client
├── docker-compose.yml      # Postgres + Redis + both services
├── Dockerfile              # Combined image (both services)
├── Dockerfile.python       # Chatbot-only image
├── Dockerfile.node         # API-only image
├── render.yaml             # One-click Render deploy
├── ARCHITECTURE.md         # Bird's-eye system diagram
├── AGENT.md                # LangGraph topology
└── .github/workflows/      # CI, release, stale, label-sync, dependabot
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a visual map of how the pieces fit together.

## One-command setup

Prerequisites: **Node 20+**, **Python 3.11+**, **Docker** (optional, for Postgres + Redis),
**Git 2.30+**.

```bash
git clone https://github.com/rajat-wyrm/Skillnova.git
cd Skillnova
./internbackend/scripts/setup.sh
```

The script will:

1. Create `.env` files from `.env.example` if missing.
2. Install Python dependencies into a `.venv`.
3. Install Node dependencies.
4. Spin up Postgres + Redis via Docker (skipped if Docker is absent).
5. Run migrations.
6. Run the test suites and print a ✅ / ❌ summary.

Re-run it any time to repair the environment.

## Day-to-day workflow

```bash
# 1. Create a branch from an up-to-date main
git checkout main && git pull
git checkout -b feat/<short-kebab-name>

# 2. Make changes + add tests
# ... edit files ...

# 3. Run pre-commit checks
./internbackend/scripts/pre-commit.sh   # format + lint + tests

# 4. Push and open a PR
git push -u origin HEAD
gh pr create --fill   # or use the GitHub web UI
```

### Local development servers

```bash
# Python chatbot (Uvicorn, hot-reload)
cd internbackend
uvicorn main:app --reload --port 8000

# Node API (Fastify, hot-reload via nodemon)
cd internbackend
npm run dev

# Frontend (Vite) — when developing locally against a real API
cd client
npm run dev
```

The Node service proxies AI requests to the Python service on `:8000` by default
(`PYTHON_AI_URL`).

## Commit & PR conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit
message MUST start with one of:

| Prefix       | When to use                                       |
|--------------|---------------------------------------------------|
| `feat:`      | New user-visible feature                          |
| `fix:`       | Bug fix                                           |
| `docs:`      | Documentation only                                |
| `refactor:`  | Code change that neither fixes a bug nor adds feature |
| `perf:`      | Performance improvement                           |
| `test:`      | Adding or correcting tests                        |
| `build:`     | Build, CI, Docker, dependencies                   |
| `chore:`     | Tooling, config, housekeeping                     |
| `revert:`    | Reverts a previous commit                         |

A scope is encouraged: `feat(api): add /api/v1/health`. Keep the subject ≤72 chars,
imperative mood, no trailing period.

### Branch naming

`<type>/<short-kebab-name>` — for example `feat/streaming-tokens`, `fix/csrf-regression`.

### PR rules

1. Title uses the same Conventional Commit prefix as the squashed merge commit.
2. Body references the issue it closes (`Closes #123`).
3. All CI checks are green.
4. At least one approving review from a CODEOWNER.
5. Branch is up to date with `main`.

## Testing

### Python (pytest)

```bash
cd internbackend
pytest tests/ -v                       # everything
pytest tests/test_units.py -v          # unit tests only, no DB
pytest tests/test_app.py -v            # app + smoke tests
pytest --cov=. tests/                  # coverage
```

Tests are designed to run without any external API keys. They monkey-patch the LLM
graph to return canned responses.

### Node (jest)

```bash
cd internbackend
npm test                              # unit tests
npm run test:watch                    # watch mode
```

CI runs both suites against a real Postgres 16 instance.

### End-to-end smoke

```bash
./internbackend/scripts/verify.sh http://localhost:8000   # Python
./internbackend/scripts/verify.sh http://localhost:3000   # Node
```

## Style guide

| Language | Tool                | Config                                  |
|----------|---------------------|-----------------------------------------|
| Python   | Black + Ruff        | `pyproject.toml` (line-length 100)       |
| JavaScript| ESLint + Prettier  | `.eslintrc.cjs`, `.prettierrc`          |

Run formatters before committing:

```bash
black internbackend
ruff check --fix internbackend
npm run lint --prefix internbackend
```

## Release process

1. Bump version in `internbackend/package.json` (semver).
2. Add a section to `CHANGELOG.md`.
3. Merge to `main` with a `release:` commit OR push a `vX.Y.Z` tag.
4. `.github/workflows/release.yml` will:
   - Build and push Docker images tagged `X.Y.Z` and `latest`.
   - Create a GitHub release with auto-generated notes.

## Getting help

- Read [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for the most common failure modes.
- Open an issue using the **bug** or **feature** template.
- For security issues, follow [`SECURITY.md`](SECURITY.md) — **do not** open a public issue.

---

Happy hacking! 🚀
