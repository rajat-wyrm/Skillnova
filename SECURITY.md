# Security Policy

## Reporting a vulnerability

Email **rajatkumar7861813@gmail.com** with the subject `[security] SkillNova`.
Do **not** open a public GitHub issue for security bugs.

Include:

1. Description of the issue and reproduction steps
2. Affected component (Python chatbot / Node InternOps / frontend)
3. Version or commit SHA
4. Any proof-of-concept code

I will acknowledge within **48 hours** and aim to ship a fix within
**7 days** for high-severity issues.

## Security model

| Layer | What's protected | How |
|---|---|---|
| Auth (Node) | JWT access + refresh tokens, argon2 hashing, brute-force lockout | `src/middleware/auth.js`, `src/middleware/bruteForce.js` |
| CSRF | Double-submit token on every state-changing request | `src/middleware/csrf.js` |
| CORS | Configurable origin allowlist | `app.js` via `CORS_ORIGIN` |
| Rate limit | 1000 req/min/IP on Node, configurable per-IP on Python | `@fastify/rate-limit`, `enforce_rate_limit()` |
| Input | Length + blocklist on chatbot, HTML escape on Node sanitize hook | `guardrails.py`, `sanitize.js` |
| Uploads | MIME allowlist + UUID filenames + size cap | `src/modules/uploads/routes.js` |
| Headers | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | helmet + `next.config.mjs` |

## What this project does NOT do

- No multi-tenant isolation beyond RBAC role checks
- No end-to-end encryption at rest (Postgres is plaintext)
- No audit log signing (audit rows can be edited by a DB admin)
- No SSO / SAML / OAuth2 provider support
- No MFA on the admin login

If you need any of the above, open an issue and label it `security`.

## Out of scope

- The bundled **knowledge base** in `internbackend/knowledge_base/`
  describes UptoSkills policies; treat it as documentation, not a
  source of truth for any compliance audit.
- The **/api/feedback** endpoint accepts free-form comments; do not
  route sensitive data through it without a separate agreement.