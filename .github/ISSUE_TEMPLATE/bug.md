---
name: Bug report
about: Report a reproducible issue
title: "[bug] "
labels: ["bug"]
assignees: []
---

## Description

A clear and concise description of what the bug is.

## Reproduction

1. `pip install -r internbackend/requirements.txt`
2. `python internbackend/main.py`
3. `curl -X POST http://localhost:5000/api/chat -d '{...}'`
4. See error

## Expected behaviour

What you expected to happen.

## Actual behaviour

What actually happened. Include the full traceback if there is one.

```text
Paste server log here
```

## Environment

- Python version: [e.g. 3.11.10]
- Node version: [e.g. 20.18.0]
- OS: [e.g. Arch Linux, Ubuntu 24.04]
- Deployment: [e.g. local, Docker, Render]

## Affected component

- [ ] Python chatbot (`internbackend/main.py`)
- [ ] Node InternOps (`internbackend/src/app.js`)
- [ ] Frontend (`frontend/src/`)
- [ ] SDK (`sdk/`)
- [ ] Docs
- [ ] CI
- [ ] Other (please specify)

## Severity

- [ ] Blocker — service is unusable
- [ ] High — major feature broken
- [ ] Medium — feature degraded
- [ ] Low — cosmetic / nice-to-have

## Additional context

Anything else that might help (screenshots, related PRs, similar issues).