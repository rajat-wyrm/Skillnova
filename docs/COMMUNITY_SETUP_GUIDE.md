# Community Backend - Quick Setup Guide

## Overview
Complete backend implementation for SkillNova's community features including discussions, projects, badges, and user reputation system.

---

## 🚀 Quick Start

### 1. Run Database Migration

```bash
cd server
npm run prisma:migrate -- --name add-community-features
```

This will:
- Create 11 new database tables
- Add relations to the User model
- Set up indexes for performance

### 2. Verify Installation

```bash
npm run prisma:generate
npm run prisma:studio  # Open Prisma Studio to view schema
```

### 3. Initialize Community Data (Optional)

Add this to your database seed script or run manually:

```javascript
import communityService from '../services/community.service.js';

// Initialize badges, topics, and tags
await communityService.initializeBadges();     // ~5 badges
await communityService.initializeTopics();     // ~5 topics
await communityService.initializeTags();       // ~5 tags
```

### 4. Test the API

```bash
# Start server
npm run dev

# Create a discussion
curl -X POST http://localhost:3000/api/v1/community/discussions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to get started with React?",
    "body": "I am new to React...",
    "type": "QUESTION",
    "topicId": "TOPIC_ID",
    "tagIds": ["TAG_ID"]
  }'

# List discussions
curl -X GET "http://localhost:3000/api/v1/community/discussions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get community stats
curl -X GET http://localhost:3000/api/v1/community/user/community-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 File Structure

```
server/
├── prisma/
│   └── schema.prisma                    ✅ Updated with 11 new models
├── src/
│   ├── app.js                           ✅ Routes registered
│   ├── controllers/
│   │   └── community.controller.js      ✅ 25+ handlers
│   ├── routes/
│   │   └── community.routes.js          ✅ 30+ endpoints
│   └── services/
│       └── community.service.js         ✅ Helper functions
├── docs/
│   └── COMMUNITY_BACKEND_DESIGN.md      ✅ Full documentation
└── README.md
```

---

## 🔑 Key Endpoints

### Discussions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/discussions` | List all discussions |
| POST | `/discussions` | Create discussion |
| GET | `/discussions/:id` | Get discussion details |
| PATCH | `/discussions/:id` | Update discussion |
| DELETE | `/discussions/:id` | Delete discussion |
| POST | `/discussions/:id/upvote` | Like discussion |
| DELETE | `/discussions/:id/upvote` | Remove like |

### Replies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/discussions/:postId/replies` | Add reply |
| GET | `/discussions/:postId/replies` | List replies |
| PATCH | `/discussions/replies/:replyId` | Update reply |
| DELETE | `/discussions/replies/:replyId` | Delete reply |
| POST | `/discussions/replies/:replyId/upvote` | Like reply |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project details |
| PATCH | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/like` | Like project |

### Community Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/topics` | List topics |
| GET | `/tags` | List tags |
| GET | `/badges` | List badges |
| GET | `/user/community-stats` | Get user stats |
| GET | `/leaderboard` | Get user rankings |
| GET | `/trending` | Get trending discussions |

**Base URL:** `/api/v1/community`

**Authentication:** Required (JWT Bearer token)

---

## 📊 Database Schema Summary

### Core Tables (11)
1. **CommunityTag** - Categories/topics for posts
2. **CommunityTopic** - Main discussion categories
3. **DiscussionPost** - Forum discussions with types
4. **DiscussionReply** - Comments/replies
5. **DiscussionUpvote** - Likes on posts/replies
6. **CommunityProject** - Project showcase
7. **CommunityProjectLike** - Likes on projects
8. **UserMention** - User @mentions in replies
9. **CommunityBadge** - Achievement badges
10. **UserBadge** - User-earned badges
11. **UserCommunityStats** - User reputation metrics

### User Model Updates
- `discussions` (1:many) - Posts created by user
- `discussionReplies` (1:many) - Replies by user
- `discussionUpvotes` (1:many) - Likes given by user
- `projects` (1:many) - Projects shared by user
- `projectLikes` (1:many) - Project likes given by user
- `mentions` (1:many) - Times user was mentioned
- `badges` (1:many) - Badges earned by user
- `communityStats` (1:1) - User's community statistics

---

## 🎯 Features Implemented

### Discussion Forum
- ✅ Create/read/update/delete discussions
- ✅ Multiple discussion types (Discussion, Q&A, Feedback, Showcase)
- ✅ Topic and tag-based organization
- ✅ Reply system with threaded comments
- ✅ User mentions and notifications
- ✅ Answer marking for Q&A

### Interaction System
- ✅ Upvote/like system with duplicate prevention
- ✅ View tracking
- ✅ Reply counting
- ✅ Hot/trending detection
- ✅ Pinned discussions (admin)

### Project Showcase
- ✅ Create/read/update/delete projects
- ✅ Project metadata (demo URL, repo URL)
- ✅ Like/view tracking
- ✅ Gradient styling

### Reputation & Gamification
- ✅ User community statistics
- ✅ Point system
- ✅ Badge achievements
- ✅ User leaderboard
- ✅ Reputation levels

### Discovery & Search
- ✅ Trending discussions
- ✅ Topic browsing
- ✅ Tag filtering
- ✅ Full-text search support
- ✅ Related discussions

---

## 🔄 Workflow Examples

### Create and Reply to Discussion

```javascript
// 1. Create discussion
POST /api/v1/community/discussions
{
  "title": "Best practices for React hooks?",
  "body": "I'm learning about React hooks...",
  "type": "QUESTION",
  "topicId": "react-topic-id",
  "tagIds": ["react-tag-id", "hooks-tag-id"]
}

// Response: discussionId

// 2. Add reply with mention
POST /api/v1/community/discussions/{discussionId}/replies
{
  "body": "Great question! Here's what I found...",
  "mentions": ["expert-user-id"],
  "isAnswer": false
}

// 3. Like the reply
POST /api/v1/community/discussions/replies/{replyId}/upvote

// 4. Get updated stats
GET /api/v1/community/user/community-stats
{
  "replyCount": 1,
  "upvoteCount": 1,
  "pointsEarned": 10
}
```

### Project Showcase

```javascript
// 1. Create project
POST /api/v1/community/projects
{
  "title": "TaskMaster - Productivity App",
  "description": "A modern task management app built with React",
  "type": "Productivity app",
  "tagIds": ["react-tag-id"],
  "icon": "✓",
  "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "demoUrl": "https://taskmaster-demo.com",
  "repoUrl": "https://github.com/user/taskmaster"
}

// 2. Get all projects sorted by likes
GET /api/v1/community/projects?sort=popular&limit=20

// 3. Like a project
POST /api/v1/community/projects/{projectId}/like
```

---

## 📝 Caching Strategy

- Discussion lists cached for 15 minutes
- Topics and tags cached separately
- Cache automatically invalidated on create/update/delete
- Redis integration for distributed systems

---

## 🚨 Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User must be owner to update"
  }
}
```

**Common Status Codes:**
- `201`: Resource created
- `400`: Validation error
- `403`: Unauthorized (not owner/admin)
- `404`: Resource not found
- `409`: Conflict (e.g., already upvoted)

---

## 🔐 Authorization

- Create/update/delete: Only resource owner or admin
- Read: Public (if not marked private)
- Admin actions: Require ADMIN role

---

## 🧪 Testing Checklist

- [ ] Run migrations without errors
- [ ] Create a discussion
- [ ] Add replies to discussion
- [ ] Upvote discussion
- [ ] Create a project
- [ ] Like a project
- [ ] Get user community stats
- [ ] Get leaderboard
- [ ] Get trending discussions
- [ ] Search discussions

---

## 📚 Documentation

Full documentation available in:
- **Schema:** `server/prisma/schema.prisma`
- **API Spec:** `docs/COMMUNITY_BACKEND_DESIGN.md`
- **Controllers:** `server/src/controllers/community.controller.js`

---

## 🔌 Integration Notes

- ✅ Integrated with existing User authentication
- ✅ Uses PostgreSQL via Prisma ORM
- ✅ Redis caching for performance
- ✅ Audit logging integration
- ✅ Notification service integration

---

## 🚀 Next Steps

1. **Run migrations**
2. **Initialize community data**
3. **Update frontend to use `/api/v1/community`**
4. **Test all endpoints**
5. **Deploy to production**

---

**Last Updated:** July 18, 2026
**Status:** ✅ Ready for Development
