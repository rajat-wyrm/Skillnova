# SkillNova Community Backend Design

## Overview

This document outlines the complete backend architecture for the SkillNova Community features, including database schema, API endpoints, and service implementations.

---

## Database Schema

### Core Tables

#### 1. **CommunityTag**
Represents tags/categories for discussions and projects (e.g., "React", "UI/UX").

```prisma
model CommunityTag {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?  // hex color for UI
  memberCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Use Cases:**
- Filter discussions by tag
- Display popular tags on community dashboard
- Tag-based recommendations

---

#### 2. **CommunityTopic**
Main categories/topics for discussions (React, UI/UX Design, Career & Jobs).

```prisma
model CommunityTopic {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?
  memberCount Int      @default(0)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Features:**
- Browse discussions by topic
- Display topic suggestions
- Organize community into logical sections

---

#### 3. **DiscussionPost**
Main discussion/forum posts with support for different types (Discussion, Question, Feedback, Showcase).

```prisma
enum DiscussionType {
  DISCUSSION    // Regular discussion
  QUESTION      // Q&A style
  FEEDBACK      // Code/project feedback
  SHOWCASE      // Project showcase
}

model DiscussionPost {
  id             String         @id @default(cuid())
  title          String
  body           String         // markdown/rich text
  type           DiscussionType
  authorId       String         // User.id
  topicId        String         // CommunityTopic.id
  tagIds         String[]       // array of tag IDs
  isHot          Boolean        // Hot badge (trending)
  isPinned       Boolean        // Pinned by admin
  views          Int            // view count
  upvoteCount    Int            // like count
  replyCount     Int            // number of replies
  isAnswered     Boolean        // for Q&A type
  acceptedReplyId String?       // accepted answer (Q&A)
  createdAt      DateTime
  updatedAt      DateTime
}
```

**Features:**
- Multiple discussion types (forum, Q&A, feedback, showcase)
- Tagging system for categorization
- View tracking and hot/trending detection
- Reply aggregation

---

#### 4. **DiscussionReply**
Comments/replies on discussion posts with mention support.

```prisma
model DiscussionReply {
  id           String
  postId       String         // DiscussionPost.id
  authorId     String         // User.id
  body         String         // markdown/rich text
  isAnswer     Boolean        // marked as accepted answer
  upvoteCount  Int            // like count
  createdAt    DateTime
  updatedAt    DateTime
}
```

**Features:**
- Threaded replies
- Answer marking (for Q&A)
- User mentions (@user)
- Edit/delete by author

---

#### 5. **DiscussionUpvote**
Likes/upvotes on posts and replies (prevents duplicates via unique constraint).

```prisma
model DiscussionUpvote {
  id        String
  userId    String         // User.id
  postId    String?        // DiscussionPost.id (optional)
  replyId   String?        // DiscussionReply.id (optional)
  createdAt DateTime
  
  @@unique([userId, postId])
  @@unique([userId, replyId])
}
```

**Features:**
- One upvote per user per post/reply
- Atomic increment/decrement
- No duplicate votes

---

#### 6. **CommunityProject**
Community project showcase with demo/repo links.

```prisma
model CommunityProject {
  id          String
  title       String
  description String?
  type        String         // e.g., "Productivity app"
  authorId    String         // User.id
  tagIds      String[]
  gradient    String?        // CSS gradient for UI
  icon        String?        // emoji
  demoUrl     String?        // live demo link
  repoUrl     String?        // GitHub repo link
  likeCount   Int
  viewCount   Int
  createdAt   DateTime
  updatedAt   DateTime
}
```

**Features:**
- Rich project metadata
- Links to demo and repository
- Like/view tracking
- Gradient styling for UI

---

#### 7. **CommunityProjectLike**
Likes on community projects (prevents duplicates).

```prisma
model CommunityProjectLike {
  id        String
  userId    String
  projectId String
  createdAt DateTime
  
  @@unique([userId, projectId])
}
```

---

#### 8. **UserMention**
Track mentions of users in discussion replies for notifications.

```prisma
model UserMention {
  id      String
  userId  String         // User.id (mentioned user)
  replyId String         // DiscussionReply.id
  createdAt DateTime
  
  @@unique([userId, replyId])
}
```

**Features:**
- Track who mentioned whom
- Send notifications
- Prevent duplicate mentions

---

#### 9. **CommunityBadge**
Achievements/badges for reputation (First Post, Expert, Helpful, etc.).

```prisma
model CommunityBadge {
  id          String
  name        String   @unique
  description String?
  icon        String?  // emoji or image URL
  color       String?
  requirement String?  // criteria description
  createdAt   DateTime
  updatedAt   DateTime
}
```

**Predefined Badges:**
- 🚀 First Post - Created first discussion
- 🤝 Helpful - 10 replies marked helpful
- ⭐ Expert - 1000+ community points
- 👨‍🏫 Mentor - Helped 50+ members
- ❤️ Popular - Project got 100+ likes

---

#### 10. **UserBadge**
User-earned badges (join table).

```prisma
model UserBadge {
  id        String
  userId    String         // User.id
  badgeId   String         // CommunityBadge.id
  earnedAt  DateTime @default(now())
  
  @@unique([userId, badgeId])
}
```

---

#### 11. **UserCommunityStats**
Community reputation and statistics per user.

```prisma
model UserCommunityStats {
  id               String   @id @default(cuid())
  userId           String   @unique
  discussionCount  Int      @default(0)
  replyCount       Int      @default(0)
  upvoteCount      Int      @default(0)
  pointsEarned     Int      @default(0)
  badgeCount       Int      @default(0)
  helpfulCount     Int      @default(0)
  lastActivityAt   DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Metrics:**
- Discussion count (total posts created)
- Reply count (total comments/replies)
- Upvote count (likes received)
- Points earned (reputation points)
- Badge count (achievements)
- Helpful count (marked as helpful)
- Last activity timestamp

---

## API Endpoints

### Base URL
```
/api/v1/community
```

### Authentication
All endpoints require authentication (`req.user` must be populated).

---

### Discussions

#### List Discussions
```
GET /api/v1/community/discussions
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `sort` (enum: "latest", "trending", "mostReplies", default: "latest")
- `topic` (string, topicId filter)
- `tag` (string, tagId filter)
- `search` (string, full-text search)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "title": "How do I make a responsive navigation bar?",
      "body": "markdown content...",
      "type": "QUESTION",
      "views": 150,
      "upvoteCount": 42,
      "replyCount": 18,
      "isHot": true,
      "isPinned": false,
      "createdAt": "2026-07-18T10:30:00Z",
      "author": {
        "id": "userId",
        "name": "Aarav S.",
        "avatarUrl": "..."
      },
      "topic": {
        "id": "topicId",
        "name": "Frontend",
        "slug": "frontend"
      },
      "tags": [
        { "id": "tagId", "name": "css", "color": "#ff6d34" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

#### Create Discussion
```
POST /api/v1/community/discussions
```

**Body:**
```json
{
  "title": "How do I make a responsive navigation bar?",
  "body": "I'm trying to...",
  "type": "QUESTION",
  "topicId": "topicId",
  "tagIds": ["tagId1", "tagId2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* discussion object */ }
}
```

---

#### Get Discussion by ID
```
GET /api/v1/community/discussions/:id
```

**Response includes:**
- Full discussion object
- First 5 replies (with author info)
- Current user's upvote status
- Related discussions

---

#### Update Discussion
```
PATCH /api/v1/community/discussions/:id
```

**Body:**
```json
{
  "title": "Updated title",
  "body": "Updated content",
  "tagIds": ["newTagId"]
}
```

**Note:** Only author can update.

---

#### Delete Discussion
```
DELETE /api/v1/community/discussions/:id
```

**Note:** Only author can delete. Updates user stats accordingly.

---

### Discussion Replies

#### Create Reply
```
POST /api/v1/community/discussions/:postId/replies
```

**Body:**
```json
{
  "body": "Here's my answer...",
  "isAnswer": false,
  "mentions": ["userId1", "userId2"]
}
```

**Side Effects:**
- Updates post replyCount
- Increments user replyCount stat
- Sends notifications to mentioned users
- Notifies post author

---

#### List Replies
```
GET /api/v1/community/discussions/:postId/replies
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `sort` (enum: "latest", "trending")

---

#### Update Reply
```
PATCH /api/v1/community/discussions/replies/:replyId
```

**Body:**
```json
{
  "body": "Updated reply...",
  "isAnswer": true
}
```

---

#### Delete Reply
```
DELETE /api/v1/community/discussions/replies/:replyId
```

---

### Upvotes/Likes

#### Upvote Discussion
```
POST /api/v1/community/discussions/:postId/upvote
```

**Response:**
```json
{ "success": true, "message": "Upvoted" }
```

---

#### Remove Discussion Upvote
```
DELETE /api/v1/community/discussions/:postId/upvote
```

---

#### Upvote Reply
```
POST /api/v1/community/discussions/replies/:replyId/upvote
```

---

#### Remove Reply Upvote
```
DELETE /api/v1/community/discussions/replies/:replyId/upvote
```

---

### Topics

#### List Topics
```
GET /api/v1/community/topics
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "topicId",
      "name": "React",
      "slug": "react",
      "description": "React framework...",
      "icon": "⚛️",
      "memberCount": 1800
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### Get Topic by ID
```
GET /api/v1/community/topics/:id
```

**Response includes:**
- Topic details
- Recent discussions
- Related tags

---

### Tags

#### List Tags
```
GET /api/v1/community/tags
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tagId",
      "name": "react",
      "slug": "react",
      "description": "React framework",
      "color": "#7c3aed",
      "memberCount": 450
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Community Projects

#### List Projects
```
GET /api/v1/community/projects
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `sort` (enum: "latest", "popular")
- `tag` (string, optional)

---

#### Create Project
```
POST /api/v1/community/projects
```

**Body:**
```json
{
  "title": "FocusFlow",
  "description": "Productivity app for task management",
  "type": "Productivity app",
  "tagIds": ["tagId1"],
  "gradient": "linear-gradient(135deg, #ff6d34, #f59e0b)",
  "icon": "F",
  "demoUrl": "https://focusflow.demo.com",
  "repoUrl": "https://github.com/user/focusflow"
}
```

---

#### Get Project by ID
```
GET /api/v1/community/projects/:id
```

**Side Effect:** Increments viewCount.

---

#### Update Project
```
PATCH /api/v1/community/projects/:id
```

**Note:** Only author can update.

---

#### Delete Project
```
DELETE /api/v1/community/projects/:id
```

**Note:** Only author can delete.

---

### Project Likes

#### Like Project
```
POST /api/v1/community/projects/:projectId/like
```

---

#### Remove Like
```
DELETE /api/v1/community/projects/:projectId/like
```

---

### Badges & Stats

#### List Available Badges
```
GET /api/v1/community/badges
```

---

#### Get User's Badges
```
GET /api/v1/community/user/badges
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "badgeId",
      "name": "First Post",
      "icon": "🚀",
      "color": "#ff6d34",
      "earnedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

#### Get User Community Stats (Current User)
```
GET /api/v1/community/user/community-stats
```

---

#### Get User Community Stats (By User ID)
```
GET /api/v1/community/user/:userId/community-stats
```

---

### Leaderboard

#### Get Leaderboard
```
GET /api/v1/community/leaderboard
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `period` (enum: "week", "month", "all", default: "month")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "userId",
      "name": "Aarav S.",
      "avatarUrl": "...",
      "communityStats": {
        "pointsEarned": 450,
        "discussionCount": 12,
        "replyCount": 48,
        "badgeCount": 4
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Trending

#### Get Trending Discussions
```
GET /api/v1/community/trending
```

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)

**Criteria:**
- Created within last 7 days
- Sorted by hot badge first, then upvotes
- Hot badge: 10+ replies AND 20+ upvotes in 24h

---

## Service Functions

### Community Service (`services/community.service.js`)

#### Award Badge
```javascript
await awardBadge(userId, badgeId);
```

#### Update User Stats
```javascript
await updateUserStats(userId, {
  discussionCount: 5,
  replyCount: 12,
  pointsEarned: 100,
});
```

#### Get Reputation Level
```javascript
const level = getReputationLevel(500); // Returns: "Contributor"
```

**Levels:**
- 1000+: Expert
- 500+: Contributor
- 200+: Helper
- 50+: Participant
- 0+: Newcomer

#### Mark Hot Discussions
```javascript
await markHotDiscussions();
```

Runs periodically to identify trending discussions.

#### Search Discussions
```javascript
const { results, total, hasMore } = await searchDiscussions('responsive navigation', {
  limit: 20,
  offset: 0,
  topicId: 'topicId',
});
```

#### Initialize Community
```javascript
await initializeBadges();
await initializeTopics();
await initializeTags();
```

---

## Database Migrations

Run migrations to create the community tables:

```bash
npm run prisma:migrate -- --name add-community-features
```

Or push schema directly:

```bash
npm run prisma:push
```

---

## Caching Strategy

- Cache invalidation on create/update/delete operations
- Cache keys:
  - `discussions:p{page}:l{limit}:s{sort}:t{topic}:tg{tag}:q{search}`
  - `community:discussions`
  - `community:trending`
  - `community:topics`
  - `community:tags`

---

## Error Handling

All endpoints return proper error responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Discussion not found"
  }
}
```

**Common Status Codes:**
- `201`: Created
- `400`: Bad Request (validation error)
- `403`: Forbidden (unauthorized action)
- `404`: Not Found
- `409`: Conflict (e.g., already upvoted)

---

## Future Enhancements

1. **Real-time Updates**
   - Socket.io integration for live discussion updates
   - Real-time notification delivery

2. **Advanced Search**
   - Full-text search with Elasticsearch
   - Vector search for semantic similarity

3. **Recommendations**
   - Content-based recommendations
   - Collaborative filtering

4. **Moderation**
   - Report/flag system
   - Content moderation queue
   - Auto-flagging spam/abuse

5. **Analytics**
   - Discussion engagement metrics
   - User activity tracking
   - Community health dashboard

6. **Gamification**
   - Streaks (consecutive days active)
   - Achievement milestones
   - Reward systems

---

## Testing

Example test cases:

```javascript
// Create discussion
POST /api/v1/community/discussions
Body: { title: "...", body: "...", topicId, tagIds }

// Verify reply count increments
GET /api/v1/community/discussions/:id
Expect: replyCount = 1

// Verify upvote unique constraint
POST /api/v1/community/discussions/:id/upvote (twice)
Expect: 400 error on second attempt

// Verify user stats update
GET /api/v1/community/user/community-stats
Expect: discussionCount = 1
```

---

## Integration Notes

- Integrated with existing User authentication
- Leverages Prisma ORM and PostgreSQL
- Uses Redis for caching
- Audit logging via `services/audit.service.js`
- Notifications via `services/notification.service.js`

---

## File Structure

```
server/src/
├── routes/
│   └── community.routes.js          # API endpoints
├── controllers/
│   └── community.controller.js       # Request handlers
├── services/
│   └── community.service.js          # Business logic
├── prisma/
│   └── schema.prisma                 # Database schema (updated)
└── app.js                            # App configuration (updated)
```

---

**Last Updated:** July 18, 2026
**Version:** 1.0
**Status:** Ready for Development
