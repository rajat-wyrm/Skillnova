# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Mobile                         │
│                                                                 │
│   ┌───────────────────────┐     ┌──────────────────────────┐   │
│   │  React 19 + Vite SPA  │     │  AI Assistant Widget      │   │
│   │  src/user/pages/      │     │  inline HTML embed        │   │
│   │    Dashboard.jsx      │     │                          │   │
│   │    SkillGap.jsx       │     │                          │   │
│   └──────────┬────────────┘     └──────────────┬───────────┘   │
└──────────────┼──────────────────────────────────┼───────────────┘
               │ HTTPS                            │ HTTPS
               │ /api/v1/*                        │ /api/v1/*
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Express.js API (Node 20)                      │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth      │  │   Users      │  │   Reports    │           │
│  │  JWT+CSRF   │  │   RBAC       │  │   CRUD       │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   KB        │  │   Projects   │  │   Q&A        │           │
│  │  Articles   │  │   Kanban     │  │   Forum      │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Skill Gap  │  │   Files      │  │   Analytics  │           │
│  │  Analyzer   │  │   Uploads    │  │   Dashboard  │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│                                                                 │
│  Middleware: auth · rbac · csrf · rate-limit · etag · cache     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ PostgreSQL  │ │   Redis     │ │  Socket.io  │
    │  (Neon)     │ │  (Upstash)  │ │  WebSocket  │
    │             │ │  L2 Cache   │ │  Real-time  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## Data Flow

### Authentication Flow

```
1. User submits credentials
2. Backend validates with Prisma
3. JWT access token (15min) + refresh token (7d) issued
4. Tokens stored in httpOnly cookies
5. CSRF double-submit cookie set
6. Frontend stores session in localStorage
```

### Real-time Updates

```
1. Client connects via Socket.io
2. JWT verified in socket middleware
3. User joins role-based room (role:ADMIN)
4. Server emits events on state changes
5. Client receives and updates UI
```

### Skill Gap Analysis

```
1. User enters skills + selects role
2. Backend loads roles.csv + courses.json
3. Fuzzy matching with alias expansion
4. Weighted readiness calculation
5. Cross-role comparison
6. Course recommendations
```

## Component Architecture

### Backend Modules

| Module | Responsibility |
|--------|---------------|
| `auth/` | JWT, CSRF, 2FA, Google OAuth |
| `users/` | User CRUD, RBAC |
| `kb/` | Knowledge base articles |
| `reports/` | Intern reports, reviews |
| `projects/` | Project management, Kanban |
| `qa/` | Q&A forum |
| `announcements/` | System announcements |
| `attendance/` | Attendance tracking |
| `analytics/` | Dashboard metrics |
| `files/` | File uploads, signed URLs |
| `skill-gap/` | Career readiness analysis |

### Frontend Structure

```
src/
├── admin/          # Admin panel pages
├── user/           # Intern dashboard pages
├── mentor/         # Mentor views
├── shared/         # Common components
│   ├── components/ # UI components
│   ├── hooks/      # Custom hooks
│   └── services/   # API clients
├── lib/            # Core utilities
│   ├── api.js      # Axios client
│   ├── auth.js     # Auth store (Zustand)
│   └── socket.js   # Socket.io client
└── routes/         # Route definitions
```

## Security Architecture

### Authentication Layers

1. **JWT Access Token** (15min) - Short-lived, for API access
2. **Refresh Token** (7d) - Long-lived, stored in httpOnly cookie
3. **CSRF Token** - Double-submit cookie pattern
4. **Session ID** - Server-side session validation

### Authorization Matrix

| Resource | SUPER_ADMIN | ADMIN | MENTOR | INTERN |
|----------|-------------|-------|--------|--------|
| Users | CRUD | CRU | R | R (self) |
| Reports | CRUD | CRU | CR | CRU |
| KB | CRUD | CRUD | CRU | R |
| Projects | CRUD | CRUD | CRU | R |
| Tasks | CRUD | CRUD | CRUD | RU |
| Settings | RU | R | - | - |

### Rate Limiting

- Global: 120 req/min
- Auth: 10 req/15min
- Per-endpoint configurable

## Performance Architecture

### Caching Strategy

```
Request → L1 (LRU in-memory) → L2 (Redis) → Database
           ↓ hit                ↓ hit
        Return cached        Return cached
           ↓ miss               ↓ miss
        Check L2             Query DB
```

### Real-time Optimization

- Socket.io rooms for selective broadcasting
- Event deduplication
- Connection pooling
- Heartbeat monitoring

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Render    │
│  (Frontend) │     │  (Backend)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
          ┌──────┴──────┐
          │   Neon DB   │
          │  (Postgres) │
          └──────┬──────┘
                 │
          ┌──────┴──────┐
          │   Upstash   │
          │   (Redis)   │
          └─────────────┘
```

## Monitoring

### Health Checks

- `/healthz` - Basic liveness
- `/healthz/live` - Process alive
- `/healthz/ready` - Dependencies ready
- `/healthz/disk` - Disk writable

### Metrics

- Request count and latency
- Error rates
- Cache hit/miss ratio
- Socket connections
- Memory usage

## Scaling Considerations

### Horizontal Scaling

- Stateless API (JWT auth)
- Redis for shared state
- Socket.io adapter for multi-instance

### Vertical Scaling

- Connection pooling (20 max)
- LRU cache (2000 entries)
- Request coalescing
- ETag-based 304s
