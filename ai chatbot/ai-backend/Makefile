# SkillNova AI Chatbot — dev Makefile
#
# Convenience targets for the most common workflows. Everything is
# scoped to this module so it never touches the parent SkillNova code.
#
#   make help
#   make install      # Python venv + deps
#   make run          # uvicorn on :8000
#   make test         # pytest
#   make lint         # ruff
#   make widget-dev   # vite dev server on :5174
#   make widget-build # vite build -> dist/skillnova-chatbot.js
#   make docker       # build the backend image
#   make clean        # pyc + venv + index caches

PY      ?= python3
PIP     ?= $(PY) -m pip
VENV    ?= .venv
ACT     ?= . $(VENV)/bin/activate

.PHONY: help install run test lint widget-dev widget-build docker clean

help:
	@echo "Common targets:"
	@echo "  make install       install Python deps into $(VENV)"
	@echo "  make run           start the FastAPI server on :8000"
	@echo "  make test          run pytest"
	@echo "  make lint          run ruff"
	@echo "  make widget-dev    start the Vite dev server on :5174"
	@echo "  make widget-build  build the widget bundle"
	@echo "  make docker        build the backend container image"
	@echo "  make clean         remove build / cache artefacts"

install:
	@test -d $(VENV) || $(PY) -m venv $(VENV)
	$(ACT) && $(PIP) install --upgrade pip
	$(ACT) && $(PIP) install -r requirements.txt

run:
	$(ACT) && $(PY) main.py

test:
	$(ACT) && $(PY) -m pytest --maxfail=1 --tb=short

lint:
	$(ACT) && $(PY) -m ruff check .

widget-dev:
	cd ../ai-frontend && npm install && npm run dev

widget-build:
	cd ../ai-frontend && npm install && npm run build

docker:
	docker build -t skillnova-ai-chatbot:latest .

clean:
	rm -rf $(VENV) .pytest_cache .ruff_cache __pycache__ */__pycache__ */*/__pycache__ faiss_index logs/*.log
