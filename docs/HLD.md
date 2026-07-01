# SkillNova — High-Level Design

## System Overview

SkillNova is a production-grade intern management platform for UptoSkills. It provides RBAC-protected operations, real-time communication, AI-grounded assistance, and audit logging — all within a single monorepo.

## Architecture Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Nginx / Vite    │────▶│  Express API    │
│  React 19    │     │  Reverse Proxy   │     │  :4000          │
└──────┬──────┘     └──────────────────┘     └────────┬────────┘
       │ WebSocket                                    │
       └──────────────────────────────────────────────┘
                                                     │
                     ┌──────────────────┐     ┌──────┴───────┐
                     │  AI Assistant     │     │  PostgreSQL  │
                     │  FastAPI :8000    │     │  (Prisma)    │
                     │  LangGraph + RAG  │     └──────────────┘
                     └──────────────────┘
```

## Services

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| Frontend | React 19 + Vite 8 | 5273 (dev) / 80 (prod) | SPA with role-based sub-apps |
| API | Express 4 + Prisma 5 | 4000 | Auth, RBAC, CRUD, Socket.io |
| AI Assistant | FastAPI + LangGraph | 8000 | Agentic RAG chatbot |
| Database | PostgreSQL | 5432 | Persistent storage |
| Cache | Redis (Upstash) or in-memory LRU | — | Session + response caching |

## Auth Flow

### Password + OTP (original)
1. POST /auth/login → validates credentials, returns challenge token
2. POST /auth/verify-otp → verifies OTP/TOTP, issues httpOnly cookies

### Google OAuth (added)
1. GET /auth/google → redirects to Google consent screen
2. GET /auth/google/callback → exchanges code, links account by email, issues cookies
3. Frontend hydrates via /auth/me cookie validation

## RBAC Matrix

Four roles: SUPER_ADMIN → ADMIN → MENTOR → INTERN

Fine-grained permissions per resource (users, reports, KB, attendance, projects, tasks, Q&A, AI, files, webhooks, settings, audit).

## Key Design Decisions

- **Monorepo:** Single repo, two runnable artifacts — avoids cross-repo dependency drift
- **Cookie-based sessions:** httpOnly + CSRF double-submit, no localStorage for auth state
- **Stateless auth middleware:** JWT in cookies, session validated against in-memory store
- **AI grounding:** RAG pipeline with FAISS vector store + hallucination gate + escalation
- **No third-party auth:** Direct Google OAuth in Express — no Supabase/Firebase dependency
