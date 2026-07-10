# SkillNova API Documentation

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with email and password | No |
| POST | `/auth/verify-otp` | Verify OTP for 2FA | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout and revoke token | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | Yes (ADMIN+) |
| GET | `/users/:id` | Get user by ID | Yes |
| POST | `/users` | Create new user | Yes (ADMIN+) |
| PATCH | `/users/:id` | Update user | Yes |
| DELETE | `/users/:id` | Delete user | Yes (ADMIN+) |

### Knowledge Base

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/kb` | List articles | Yes |
| GET | `/kb/:id` | Get article | Yes |
| POST | `/kb` | Create article | Yes (MENTOR+) |
| PATCH | `/kb/:id` | Update article | Yes |
| DELETE | `/kb/:id` | Delete article | Yes (ADMIN+) |

### Reports

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/reports` | List reports | Yes |
| GET | `/reports/:id` | Get report | Yes |
| POST | `/reports` | Create report | Yes |
| PATCH | `/reports/:id` | Update report | Yes |
| DELETE | `/reports/:id` | Delete report | Yes |

### Announcements

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/announcements` | List announcements | Yes |
| POST | `/announcements` | Create announcement | Yes (ADMIN+) |
| PATCH | `/announcements/:id` | Update announcement | Yes (ADMIN+) |
| DELETE | `/announcements/:id` | Delete announcement | Yes (ADMIN+) |

### Projects

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/projects` | List projects | Yes |
| GET | `/projects/:id` | Get project | Yes |
| POST | `/projects` | Create project | Yes (MENTOR+) |
| PATCH | `/projects/:id` | Update project | Yes |
| DELETE | `/projects/:id` | Delete project | Yes (ADMIN+) |

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/projects/:id/tasks` | List tasks | Yes |
| POST | `/projects/:id/tasks` | Create task | Yes (MENTOR+) |
| PATCH | `/tasks/:id` | Update task | Yes |
| DELETE | `/tasks/:id` | Delete task | Yes (MENTOR+) |

### Q&A

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/qa` | List questions | Yes |
| GET | `/qa/:id` | Get question | Yes |
| POST | `/qa` | Create question | Yes |
| POST | `/qa/:id/answers` | Add answer | Yes |
| PATCH | `/qa/:id` | Update question | Yes |
| DELETE | `/qa/:id` | Delete question | Yes (ADMIN+) |

### Skill Gap Analysis

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/skill-gap/metadata` | Get domains and skills | No |
| GET | `/skill-gap/roles` | Get roles for domain | No |
| POST | `/skill-gap/analyze` | Analyze skill gap | No |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/healthz` | Basic health check |
| GET | `/healthz/live` | Liveness probe |
| GET | `/healthz/ready` | Readiness probe |
| GET | `/healthz/disk` | Disk space check |

### Meta

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meta` | API metadata |
| GET | `/meta/version` | Version info |

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "status": 400,
  "details": null,
  "timestamp": "2026-07-02T12:00:00.000Z"
}
```

## Rate Limiting

- Global: 120 requests per minute
- Auth endpoints: 10 requests per 15 minutes
- Custom rate limits per endpoint

## Pagination

List endpoints support pagination:

```
GET /users?page=1&limit=20&sort=createdAt&order=desc
```

Response:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```
