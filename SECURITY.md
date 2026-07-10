# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within SkillNova, please send an email to rajatkumar7861813@gmail.com. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include

When reporting a vulnerability, please include:

1. Type of vulnerability (e.g., SQL injection, XSS, CSRF, etc.)
2. Full paths of source file(s) related to the vulnerability
3. The location of the affected source code (tag/branch/commit or direct URL)
4. Any special configuration required to reproduce the issue
5. Step-by-step instructions to reproduce the issue
6. Proof-of-concept or exploit code (if possible)
7. Impact of the issue, including how an attacker might exploit it

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix release**: Depends on severity, typically within 2 weeks

## Security Best Practices

### Authentication

- JWT tokens with short-lived access tokens (15 minutes)
- Refresh tokens stored in httpOnly cookies
- CSRF protection via double-submit cookie pattern
- Rate limiting on authentication endpoints
- Account lockout after 5 failed attempts

### Authorization

- Role-Based Access Control (RBAC) with 4 roles
- Permission-based access control for fine-grained operations
- Ownership verification for resource access

### Data Protection

- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest
- HTTPS enforced in production
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM

### Infrastructure

- Security headers via Helmet.js
- CORS configured with explicit allow-list
- Rate limiting to prevent abuse
- Request size limits
- Audit logging for all privileged operations

## Acknowledgments

We would like to thank all security researchers who responsibly disclose vulnerabilities to us.
