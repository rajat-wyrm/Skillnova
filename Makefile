# SkillNova developer shortcuts.
# Run `make help` for the list.

PYTHON       ?= python3
PIP          ?= $(PYTHON) -m pip
NPM          ?= npm
DOCKER       ?= docker
COMPOSE      ?= $(DOCKER) compose

BACKEND_DIR  := internbackend
PY_PORT      ?= 5000
NODE_PORT    ?= 5000

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install both backends' dependencies
	cd $(BACKEND_DIR) && $(NPM) install
	$(PIP) install --user -r $(BACKEND_DIR)/requirements.txt

.PHONY: dev-py
dev-py: ## Run the Python chatbot in dev mode (hot reload via --reload)
	cd $(BACKEND_DIR) && PORT=$(PY_PORT) RELOAD=true $(PYTHON) main.py

.PHONY: dev-node
dev-node: ## Run the Node backend with --watch
	cd $(BACKEND_DIR) && PORT=$(NODE_PORT) $(NPM) run dev

.PHONY: dev-frontend
dev-frontend: ## Run the Vite frontend
	cd frontend && $(NPM) run dev

.PHONY: up
up: ## Bring the docker-compose stack up
	$(COMPOSE) up -d --build

.PHONY: down
down: ## Tear the docker-compose stack down
	$(COMPOSE) down

.PHONY: logs
logs: ## Tail docker-compose logs
	$(COMPOSE) logs -f --tail=100

.PHONY: migrate
migrate: ## Apply Postgres migrations
	cd $(BACKEND_DIR) && node src/db/migrate.js

.PHONY: seed
seed: ## Seed the admin user
	cd $(BACKEND_DIR) && node seeds/seed.js

.PHONY: test-py
test-py: ## Run Python tests
	cd $(BACKEND_DIR) && DATABASE_URL=sqlite:///:memory: pytest tests/ -v

.PHONY: test-node
test-node: ## Run Node tests
	cd $(BACKEND_DIR) && DATABASE_URL=postgres://x@y/z NODE_ENV=test $(NPM) test

.PHONY: test
test: test-py test-node ## Run all tests

.PHONY: build-frontend
build-frontend: ## Production build the Vite frontend
	cd frontend && $(NPM) run build

.PHONY: build-images
build-images: ## Build both Docker images
	$(DOCKER) build -f Dockerfile         -t skillnova-api     .
	$(DOCKER) build -f Dockerfile.python  -t skillnova-chatbot .
	$(DOCKER) build -f Dockerfile.node     -t skillnova-node    .

.PHONY: verify
verify: ## Curl every public endpoint on both backends
	./scripts/verify.sh $(NODE_PORT) $(PY_PORT)

.PHONY: push
push: ## Push to GitHub (usage: make push TOKEN=ghp_xxx)
	@if [ -z "$(TOKEN)" ]; then echo "Usage: make push TOKEN=ghp_xxx"; exit 1; fi
	./push.sh $(TOKEN)

.PHONY: clean
clean: ## Remove build artefacts
	rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/.next $(BACKEND_DIR)/coverage
	rm -rf frontend/node_modules frontend/dist
	find . -type d -name __pycache__ -prune -exec rm -rf {} +

.PHONY: smoke
smoke: ## Boot the stack, curl every endpoint, kill
	$(COMPOSE) up -d --build
	./scripts/verify.sh $(NODE_PORT) $(PY_PORT)
	$(COMPOSE) down