# API Contract Checklist

Based on: SkillNova Frontend Upgrade Report

Generated on: May 15, 2026

---

# 1. Purpose

This checklist defines the required backend API contracts needed to fully support the upgraded SkillNova frontend architecture.

The frontend has already transitioned into a modular, service-driven structure.

---

# 2. Global API Requirements

## Base Requirements

- All APIs should return JSON responses
- All protected endpoints must support token authentication
- Error responses should use a consistent structure
- APIs should support pagination where large datasets exist

## Standard Success Response

```json
{
  "success": true,
  "data": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "message": "Readable error message",
  "errors": []
}
```

---

# 3. Authentication API Checklist

## Required Endpoints

- [ ] POST `/auth/login`
- [ ] POST `/auth/verify-otp`
- [ ] POST `/auth/verify-2fa`
- [ ] POST `/auth/logout`
- [ ] GET `/auth/me`

## Requirements

- [ ] Return role information
- [ ] Return token/session data
- [ ] Handle pending verification states
- [ ] Support persistent authentication

---

# 4. User Management API Checklist

## Required Endpoints

- [ ] GET `/users`
- [ ] GET `/users/:id`
- [ ] POST `/users`
- [ ] PATCH `/users/:id`
- [ ] DELETE `/users/:id`

## Required Features

- [ ] Role update support
- [ ] Status update support
- [ ] Search/filter support
- [ ] Pagination support

---

# 5. Intern Management API Checklist

## Required Endpoints

- [ ] GET `/interns`
- [ ] POST `/interns`
- [ ] PATCH `/interns/:id`
- [ ] PATCH `/interns/:id/attendance`
- [ ] PATCH `/interns/:id/status`

---

# 6. Announcements API Checklist

## Required Endpoints

- [ ] GET `/announcements`
- [ ] POST `/announcements`
- [ ] PATCH `/announcements/:id`
- [ ] DELETE `/announcements/:id`

## User Preference Endpoints

- [ ] GET `/users/preferences/announcement-pins`
- [ ] POST `/users/preferences/announcement-pins`
- [ ] DELETE `/users/preferences/announcement-pins/:id`

---

# 7. Knowledge Base API Checklist

## Required Endpoints

- [ ] GET `/knowledge/articles`
- [ ] GET `/knowledge/articles/:id`
- [ ] POST `/knowledge/articles`
- [ ] PATCH `/knowledge/articles/:id`
- [ ] DELETE `/knowledge/articles/:id`
- [ ] POST `/knowledge/articles/:id/feedback`

---

# 8. Reports API Checklist

## Required Endpoints

- [ ] GET `/reports`
- [ ] POST `/reports`
- [ ] PATCH `/reports/:id`
- [ ] PATCH `/reports/:id/approve`
- [ ] GET `/reports/:id/download`

## File Upload Requirements

- [ ] Multipart upload support
- [ ] File metadata handling
- [ ] Secure storage
- [ ] Download URL generation

---

# 9. Dashboard & Analytics API Checklist

## Dashboard

- [ ] GET `/admin/dashboard/summary`
- [ ] GET `/app/dashboard/summary`

## Analytics

- [ ] GET `/admin/analytics/summary`
- [ ] GET `/app/analytics/summary`

---

# 10. AI Assistant API Checklist

## Required Endpoints

- [ ] GET `/ai/bootstrap`
- [ ] GET `/ai/capabilities`
- [ ] GET `/ai/suggestions`
- [ ] GET `/ai/welcome-message`
- [ ] POST `/ai/chat`

---

# 11. QA System API Checklist

## Required Endpoints

- [ ] GET `/qa/questions`
- [ ] POST `/qa/questions`
- [ ] PATCH `/qa/questions/:id/upvote`
- [ ] POST `/qa/questions/:id/answers`

---

# 12. Notifications API Checklist

## Required Endpoints

- [ ] GET `/notifications`
- [ ] PATCH `/notifications/:id/read`
- [ ] PATCH `/notifications/read-all`

---

# 13. Settings API Checklist

## Required Endpoints

- [ ] GET `/settings/admin`
- [ ] PATCH `/settings/admin`
- [ ] GET `/settings/user`
- [ ] PATCH `/settings/user`
- [ ] DELETE `/users/me`

---

# 14. Security Checklist

- [ ] JWT/session validation
- [ ] Role-based authorization
- [ ] Input validation
- [ ] File upload validation
- [ ] HTTPS-only deployment
- [ ] Token expiration handling

---

# 15. Migration Priority Checklist

## Phase 1 — Critical

- [ ] Fix auth service wiring
- [ ] Stabilize API contract structure
- [ ] Finalize mock vs real backend mode

## Phase 2 — Persistence

- [ ] Replace QA local storage
- [ ] Replace announcement pin local storage
- [ ] Add notification persistence

## Phase 3 — File Workflows

- [ ] Implement report uploads
- [ ] Implement secure downloads

## Phase 4 — Optimization

- [ ] Move analytics aggregation server-side
- [ ] Move dashboard aggregation server-side

## Phase 5 — Cleanup

- [ ] Remove legacy mock data
- [ ] Remove unused AuthGate flow

---

# 16. Final Validation Checklist

- [ ] All frontend pages connected to real APIs
- [ ] No production reliance on local storage
- [ ] File uploads operational
- [ ] Auth persistence stable
- [ ] Security validation completed
- [ ] API documentation completed

---

# 17. Final Notes

The upgraded SkillNova frontend already establishes a scalable and maintainable architecture. The remaining work is primarily backend contract completion, persistence stabilization, and removal of transitional mock infrastructure.
