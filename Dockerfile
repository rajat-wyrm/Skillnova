# SkillNova chatbot + Node platform.
# Multi-stage build so the production image ships only runtime deps.

# ----------------------------------------------------------------------
# Stage 1 — install Python deps into a venv
# ----------------------------------------------------------------------
FROM python:3.11-slim AS python-deps

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential gcc \
 && rm -rf /var/lib/apt/lists/*

COPY internbackend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ----------------------------------------------------------------------
# Stage 2 — install Node deps
# ----------------------------------------------------------------------
FROM node:20-alpine AS node-deps

WORKDIR /app

COPY internbackend/package.json internbackend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ----------------------------------------------------------------------
# Stage 3 — runtime
# ----------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy Python venv from stage 1
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Install Node 20 (smaller than copying from node:20-alpine)
RUN apt-get update \
 && apt-get install -y --no-install-recommends nodejs npm \
 && rm -rf /var/lib/apt/lists/*

# Copy Node modules from stage 2
COPY --from=node-deps /app/node_modules ./node_modules

# Copy application source
COPY internbackend/ ./
COPY scripts/ ./scripts/

RUN mkdir -p uploads \
 && useradd --create-home --shell /usr/sbin/nologin skillnova \
 && chown -R skillnova:skillnova /app
USER skillnova

ENV PORT=5000 \
    HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "src/app.js"]