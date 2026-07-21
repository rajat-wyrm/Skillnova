# Phase 1 — Learning Roadmap, Achievement Badges, Completion Tracker

This delivers a complete, working Phase 1 slice integrated into your existing
SkillNova codebase. Nothing existing was removed or renamed — only additive
files plus small, surgical edits to `app.js`, the three `App.jsx` routers,
and the three `Sidebar.jsx` nav files.

## New files

**Backend**
- `server/src/services/badge.service.js` — badge rule engine (auto-award on progress change + top-performer ranking)
- `server/src/services/progress.service.js` — computes the 5 completion percentages from existing Task/Attendance/Roadmap/Report data
- `server/src/controllers/roadmap.controller.js`
- `server/src/controllers/badges.controller.js`
- `server/src/controllers/progress.controller.js`
- `server/src/routes/roadmap.routes.js` — all Phase 1 routes, mounted at `/api/v1`

**Frontend**
- `src/user/pages/Roadmap.jsx` — intern's roadmap + completion tracker view
- `src/user/pages/Badges.jsx` — intern's badge showcase
- `src/mentor/pages/RoadmapManage.jsx` — mentor creates/assigns paths, views intern progress
- `src/admin/pages/LearningBadges.jsx` — admin manages badges, views completion leaderboard

## Modified files (small, additive edits only)

- `server/prisma/schema.prisma` — added `LearningPath`, `LearningMilestone`, `RoadmapAssignment`, `MilestoneProgress`, `Badge`, `BadgeAward`, `InternshipProgress` models + back-relations on `User`. No existing model changed.
- `server/src/app.js` — one new import + one new `app.use('/api/v1', csrfProtection, phase1Routes)` line.
- `src/user/App.jsx`, `src/mentor/App.jsx`, `src/admin/App.jsx` — new lazy-loaded page entries.
- `src/user/components/Sidebar.jsx`, `src/mentor/components/Sidebar.jsx`, `src/admin/components/Sidebar.jsx` — new nav items.

## API surface added

```
GET    /api/v1/roadmap                          list paths
POST   /api/v1/roadmap                          create path (MENTOR/ADMIN)
PATCH  /api/v1/roadmap/:id                       update path
DELETE /api/v1/roadmap/:id                       delete path (ADMIN)
POST   /api/v1/roadmap/:id/milestones            add milestone
DELETE /api/v1/roadmap/:id/milestones/:milestoneId
POST   /api/v1/roadmap/:id/assign                assign path to intern
GET    /api/v1/roadmap/mine                      intern's own roadmap
GET    /api/v1/roadmap/user/:userId              a specific intern's roadmap (MENTOR/ADMIN)
PATCH  /api/v1/roadmap/milestones/:milestoneId/complete

GET    /api/v1/badges
POST   /api/v1/badges                            create badge (ADMIN)
PATCH  /api/v1/badges/:id
DELETE /api/v1/badges/:id
GET    /api/v1/badges/mine
GET    /api/v1/badges/user/:userId
POST   /api/v1/badges/:id/award                  manual award (ADMIN)
PATCH  /api/v1/badges/award/:id/showcase         toggle profile visibility
POST   /api/v1/badges/evaluate                   re-run rule engine (ADMIN)

GET    /api/v1/progress/mine
GET    /api/v1/progress/list                     leaderboard (MENTOR/ADMIN)
GET    /api/v1/progress/:userId
POST   /api/v1/progress/:userId/recompute        (ADMIN)
POST   /api/v1/progress/recompute-all            (ADMIN)
```

## How completion % and badges are computed

`InternshipProgress` is recomputed whenever an intern completes a roadmap
milestone (`recomputeProgress` is called at the end of `completeMilestone`).
It's a weighted average of:
- Task completion (35%) — from existing `ProjectTask` (`DONE` / total)
- Attendance (25%) — from existing `Attendance` records
- Learning (20%) — from new `MilestoneProgress` vs. assigned milestones
- Mentor evaluation (20%) — average `score` of `REVIEWED` `Report`s

After each recompute, `badge.service.js` checks every active badge's
`criteria` (e.g. `{"metric":"attendancePct","gte":95}`) and auto-awards any
newly-qualified badge, with a notification via the existing `notify()`
service. `TOP_PERFORMER` badges are evaluated separately (ranking-based, not
per-user), triggered manually from the admin page or on a schedule you set
up (e.g. a weekly cron calling `POST /api/v1/badges/evaluate`).

Task completion and attendance already exist for every intern, so
`overallPct` will show real numbers immediately — no need to wait for the
new roadmap/badge data to populate before this is useful.

## To run this

```bash
cd server
npx prisma migrate dev --name phase1_roadmap_badges_progress
npm run dev          # backend
# in project root, separately:
npm run dev           # frontend
```

The Prisma schema was reviewed by hand for correctness (this sandbox
couldn't reach Prisma's engine-binary CDN to run `prisma validate`), so
please run the migration in your own environment as the first real
verification step, and sanity-check the generated SQL before applying it
to a shared database.

## Suggested next step

Once you've run the migration and clicked through the three new pages,
say the word and I'll move to **Phase 2 (Certificates)**, which builds
directly on `InternshipProgress.finalStatus === 'COMPLETED'` from this
phase.
