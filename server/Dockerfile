# ════════════════════════════════════════════════════════════
#  SkillNova API — production Dockerfile
# ════════════════════════════════════════════════════════════
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ── Install deps ──────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ── Build ─────────────────────────────────────────────────
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npx prisma generate

# ── Runtime ───────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 4000
USER node
CMD ["node", "src/index.js"]
