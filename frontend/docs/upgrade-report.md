# SkillNova Frontend Upgrade Report

Generated on: May 15, 2026

## 1. Executive Summary

This report compares the original assignment source tree in `frontend/Original Assignment/src` with the current main source tree in `frontend/src`.

The upgrade is not a cosmetic refresh only. The current implementation introduces a new application shell, route-aware navigation, modular API services, centralized authentication state, shared loading/error primitives, lazy-loaded page bundles, and page-by-page migration away from direct hardcoded data usage.

At a structural level:

- Original assignment source files: `39`
- Current main source files: `68`
- New source files added in current version: `29`
- Original-only page removed/replaced: `user/pages/Meetings.jsx` replaced by `user/pages/AIAssistant.jsx`
- Common files retained but changed: `30`

This means the current codebase is an architectural upgrade, not just a refactor of isolated pages.

## 2. Comparison Baseline

### 2.1 Original assignment characteristics

The original assignment source was primarily a UI-first prototype.

Key characteristics:

- Authentication was handled in `src/AuthGate.jsx` using local component state.
- Admin and user apps switched pages using local `useState` rather than URL-based routing.
- Shared data was largely pulled from `src/shared/utils/constants.js`.
- Several pages performed mutations directly in component state.
- Loading, error, and empty states were mostly absent.
- Backend contracts were either missing or implied rather than expressed in code.
- A number of behaviors were static or UI-only, especially notifications, Q&A, assistant behavior, and reports.

### 2.2 Current implementation characteristics

The current source introduces a backend-oriented frontend structure.

Key characteristics:

- Application boot now flows through `src/app/AppRoot.jsx`.
- Authentication state is centralized in `src/shared/store/auth-context.jsx`.
- URL-based navigation is handled via `src/routes/AppRouter.jsx`, `src/routes/router.js`, and `src/routes/paths.js`.
- Shared API access is modularized under `src/shared/services/api/`.
- Request handling is centralized in `src/shared/services/api/request.js`.
- Shared UX primitives exist for loaders, empty states, error states, and skeletons.
- Admin and user pages now follow a much more consistent fetch-normalize-render pattern.
- Lazy loading is now used for route-level and page-level chunk splitting.

## 3. Major Changes Made

### 3.1 Application bootstrapping changed from `AuthGate` to `AppRoot + AuthProvider + AppRouter`

Original:

- `src/main.jsx` rendered `AuthGate` directly.
- `src/AuthGate.jsx` handled login, OTP, 2FA, and app switching using local state only.

Current:

- `src/main.jsx` now renders `src/app/AppRoot.jsx`.
- `AppRoot` wraps the app with `ErrorBoundary`, `AuthProvider`, and `AppRouter`.
- `AppRouter` determines which screen should render based on auth state and pathname.

Why this was changed:

- The original flow was not route-aware.
- Refreshing the browser or opening a deep link would not preserve application location cleanly.
- Authentication logic was trapped inside one component instead of being reusable and stateful across the app.

Improvement delivered:

- Centralized authentication lifecycle.
- Cleaner separation of boot, auth state, and route rendering.
- Better support for protected screens and verification steps.
- Stronger base for backend session integration.

### 3.2 Navigation moved from in-component page switching to URL-based routing

Original:

- `src/admin/App.jsx` and `src/user/App.jsx` used `useState` page keys.
- The active page existed only in memory.
- There was no real URL contract per page.

Current:

- `src/routes/paths.js` defines public, admin, and user paths.
- `src/routes/router.js` provides `navigate`, `Redirect`, and `usePathname`.
- `src/admin/App.jsx` and `src/user/App.jsx` now resolve the page from the current path.

Why this was changed:

- State-only page switching blocks deep linking, browser navigation, and route-level protection.
- It also makes team collaboration harder because page ownership is implicit rather than path-based.

Improvement delivered:

- Stable URLs for admin and user screens.
- Easier testing and debugging.
- Better compatibility with real auth and future backend redirects.
- Clear route ownership for teams and maintainers.

### 3.3 A modular service layer was introduced

Original:

- No dedicated API layer existed in the original assignment source tree.
- Hardcoded constants were consumed directly in pages.
- Data loading logic, if any, lived near the UI.

Current:

New API/service modules were introduced:

- `src/shared/services/api/request.js`
- `src/shared/services/api/authApi.js`
- `src/shared/services/api/usersApi.js`
- `src/shared/services/api/internsApi.js`
- `src/shared/services/api/announcementsApi.js`
- `src/shared/services/api/knowledgeApi.js`
- `src/shared/services/api/reportsApi.js`
- `src/shared/services/api/analyticsApi.js`
- `src/shared/services/api/dashboardApi.js`
- `src/shared/services/api/settingsApi.js`
- `src/shared/services/api/assistantApi.js`
- `src/shared/services/api/qaApi.js`
- `src/shared/services/api/insightsHelpers.js`

Why this was changed:

- The original version had no consistent integration boundary between pages and backend data.
- Without a service layer, backend adoption would require rewriting UI components repeatedly.

Improvement delivered:

- All major data domains now have named service entrypoints.
- Backend contracts are now visible in one place.
- Page components are less coupled to raw response shapes.
- The team has a clear location for future endpoint expansion.

### 3.4 Shared request handling was centralized

Original:

- No shared fetch wrapper existed in the original assignment source tree.

Current:

- `src/shared/services/api/request.js` centralizes base URL handling, auth header injection, JSON parsing, and error normalization.

Why this was changed:

- Repeating `fetch` logic across pages causes inconsistent behavior.
- Frontend/backend integration failures are harder to debug without a single transport layer.

Improvement delivered:

- Consistent request behavior.
- Uniform error construction.
- Detection of HTML fallback responses and malformed JSON.
- Single location for transport-level enhancements.

### 3.5 Authentication logic was upgraded from purely local flow to persisted context-driven state

Original:

- Login state existed only inside `AuthGate`.
- OTP and 2FA transitions were purely local screen changes.

Current:

- `src/shared/store/auth-context.jsx` now hydrates saved auth state and pending verification state.
- Verification and logout behavior are centralized.
- `src/modules/auth/AuthScreens.jsx` provides route-level auth screen wrappers.

Why this was changed:

- A real app needs session hydration, pending challenge state, and guarded rendering.
- Local-only auth flow cannot scale to backend session contracts.

Improvement delivered:

- Better auth orchestration.
- Cleaner role protection.
- Reusable login and verification flows.
- One source of truth for auth status.

### 3.6 Error/loading/empty UX was standardized

Original:

- Most pages rendered immediately from hardcoded values.
- There was very little handling for async failure or empty results.

Current:

- Shared state components were added in `src/shared/components/AppState.jsx`.
- Shared page skeletons were added in `src/shared/components/PageSkeletons.jsx`.
- `src/shared/components/ErrorBoundary.jsx` provides top-level failure containment.
- Many pages now have page-level loading, error, and empty branches.

Why this was changed:

- Backend-driven pages need resilient intermediate states.
- Without standard handling, every page invents its own loading/error UX.

Improvement delivered:

- Consistent app behavior during fetches and failures.
- Better perceived quality.
- A repeatable implementation pattern for contributors.

### 3.7 Code splitting and lazy loading were added

Original:

- Admin and user pages were imported eagerly.
- Entire app sections were bundled together.

Current:

- `AppRouter`, `admin/App.jsx`, and `user/App.jsx` now use `React.lazy` and `Suspense`.
- Matching page skeletons are used as lazy-load fallbacks.

Why this was changed:

- Large eager bundles slowed initial load and produced build-size warnings.

Improvement delivered:

- Smaller initial bundle.
- Page-level chunking.
- More scalable page loading strategy.

### 3.8 `Meetings` was re-scoped into `AI Assistant`

Original:

- `src/user/pages/Meetings.jsx` was a locally simulated assistant/chat-like page.

Current:

- The page was renamed and re-scoped as `src/user/pages/AIAssistant.jsx`.
- It now uses `assistantApi.js` and `/ai/...` namespaced endpoints.

Why this was changed:

- The original page purpose no longer matched its name.
- The feature needed a backend-facing service boundary.

Improvement delivered:

- Clearer feature ownership.
- Better API naming contract.
- More realistic assistant bootstrap and chat flow.

## 4. Why Significant Changes Were Made

### 4.1 To remove direct page dependence on hardcoded mock data

The original implementation used `MOCK_USERS`, `MOCK_INTERNS`, `MOCK_REPORTS`, `MOCK_ANNOUNCEMENTS`, and `MOCK_ARTICLES` from `shared/utils/constants.js` as primary data sources.

This created several problems:

- No backend contract existed.
- UI testing could not expose response-shape issues.
- Page logic was tightly coupled to one ideal local structure.
- Real loading and failure behavior was invisible.

The upgrade moved many pages to service-driven loading with normalization helpers so the UI can remain stable even when backend payloads differ slightly.

### 4.2 To preserve UI while changing data ownership

A key pattern in the upgraded codebase is: keep the original page layout and visual style, but swap out the source of truth from local arrays to API-backed services.

This reduced risk because:

- UI regressions stayed smaller.
- Intern work could be reviewed per page.
- The frontend API contract could evolve without throwing away working layouts.

### 4.3 To introduce reusable workflow patterns for a larger team

The current code establishes repeatable page behavior:

- call service function
- normalize response
- set loading/error/ready state
- render shared fallback state or actual content

This is especially important for junior-heavy teams, because it reduces architectural improvisation.

## 5. Architectural and Workflow Differences Introduced

### 5.1 New architecture layers

Original layers were mostly:

- page components
- shared UI
- hardcoded constants

Current layers are:

- app boot layer: `app/`
- route layer: `routes/`
- auth module wrapper layer: `modules/auth/`
- shared config layer: `shared/config/`
- shared state layer: `shared/store/`
- shared transport and API layer: `shared/services/` and `shared/services/api/`
- shared fallback UX layer: `shared/components/AppState.jsx` and `PageSkeletons.jsx`

### 5.2 New contributor workflow

The upgraded project encourages a workflow of:

1. add or update a service method in `shared/services/api/`
2. normalize incoming payloads close to the service layer
3. keep UI components focused on rendering and interaction
4. use shared loading/error/empty states
5. keep route ownership explicit

This is a major workflow change from editing hardcoded arrays directly inside pages.

### 5.3 Frontend aggregation as an interim backend contract strategy

Pages like dashboard and analytics now use service aggregators that collect multiple lower-level responses and shape them into one UI-ready payload.

Examples:

- `getAdminDashboardData()`
- `getUserDashboardData()`
- `getAdminAnalyticsData()`
- `getUserAnalyticsData()`

This is not the final ideal backend architecture, but it is a strong interim strategy because it decouples page layout from raw endpoint fragmentation.

## 6. Refactoring and Restructuring by Area

### 6.1 Routing

Added:

- `src/routes/AppRouter.jsx`
- `src/routes/router.js`
- `src/routes/paths.js`

Refactor effect:

- path-based navigation replaced page-state-only navigation
- protected route logic added
- verification-route support added

### 6.2 App shell and boot

Added:

- `src/app/AppRoot.jsx`
- `src/shared/components/ErrorBoundary.jsx`

Refactor effect:

- app boot now composes error boundary, auth provider, and route renderer

### 6.3 State management

Added:

- `src/shared/store/auth-context.jsx`

Refactor effect:

- auth/session state moved out of view components
- hydration and pending verification state became reusable

### 6.4 Services and API layer

Added:

- modular files under `src/shared/services/api/`
- `src/shared/services/httpClient.js`
- `src/shared/services/storage.js`
- `src/shared/services/mockDatabase.js`

Refactor effect:

- API concerns separated from rendering logic
- data-domain ownership is clearer
- transport and fallback logic are centralized

### 6.5 Components and shared UI

Added:

- `src/shared/components/AppState.jsx`
- `src/shared/components/PageSkeletons.jsx`

Updated significantly:

- `src/shared/components/UI.jsx`
- admin/user headers, sidebars, and layouts

Refactor effect:

- common fallback UI standardized
- confirmation modal support introduced
- notifications moved away from hardcoded lists
- lazy-load fallbacks now match page shapes

### 6.6 Auth module wrappers

Added:

- `src/modules/auth/AuthScreens.jsx`

Refactor effect:

- route-friendly wrappers around login, OTP, and 2FA screens
- login flow is now context-driven instead of directly bound to `AuthGate`

### 6.7 Page-level refactors

Representative examples:

- `admin/pages/AdminPanel.jsx`
  - original: local `MOCK_USERS`, component-only mutations, `window.confirm`
  - current: backend-style CRUD methods, confirmation modal, feedback state, normalization, loading/error branches
- `user/pages/AIAssistant.jsx`
  - original page equivalent `Meetings.jsx`: local suggestions and fake delayed chat reply
  - current: assistant bootstrap service, namespaced AI contract, send action errors, loading/error states
- `admin/pages/KnowledgeBase.jsx` and `user/pages/KnowledgeBase.jsx`
  - original: article arrays from constants
  - current: service-driven load plus article normalization
- `admin/pages/Reports.jsx` and `user/pages/Reports.jsx`
  - original: static report cards
  - current: endpoint-backed list/create/approve flows

## 7. UI-Preserving Backend Integration Already Implemented

The upgrade intentionally preserved much of the original visual layout while replacing how data flows into the UI.

Implemented examples:

### 7.1 Admin user management

Current service-backed actions exist for:

- fetch users
- create user
- update role/status
- terminate user
- delete user

Files:

- `src/admin/pages/AdminPanel.jsx`
- `src/shared/services/api/usersApi.js`

### 7.2 Intern management

Current service-backed actions exist for:

- fetch interns
- create intern
- update attendance
- update status

Files:

- `src/admin/pages/Management.jsx`
- `src/shared/services/api/internsApi.js`

### 7.3 Knowledge base

Current service-backed actions exist for:

- admin article list/create/update/delete
- user article list
- user article feedback submission

Files:

- `src/admin/pages/KnowledgeBase.jsx`
- `src/user/pages/KnowledgeBase.jsx`
- `src/shared/services/api/knowledgeApi.js`

### 7.4 Announcements

Current service-backed actions exist for:

- fetch announcements
- create/update/delete admin announcements
- user announcement feed consumption

Files:

- `src/admin/pages/Announcements.jsx`
- `src/user/pages/Announcements.jsx`
- `src/shared/services/api/announcementsApi.js`

### 7.5 Reports

Current service-backed actions exist for:

- fetch admin reports
- approve admin reports
- fetch user reports
- create user reports
- derive project flow from reports

Files:

- `src/admin/pages/Reports.jsx`
- `src/user/pages/Reports.jsx`
- `src/user/pages/ProjectFlow.jsx`
- `src/shared/services/api/reportsApi.js`

### 7.6 Settings

Current service-backed actions exist for:

- fetch admin settings
- update admin settings
- reset admin user data
- delete admin platform
- fetch user settings
- update user settings
- deactivate/delete current user

Files:

- `src/admin/pages/Settings.jsx`
- `src/user/pages/Settings.jsx`
- `src/shared/services/api/settingsApi.js`
- `src/shared/services/api/usersApi.js`

### 7.7 AI assistant

Current service-backed actions exist for:

- fetch AI suggestions
- fetch capabilities
- fetch welcome message
- send assistant chat message
- aggregate bootstrap state

Files:

- `src/user/pages/AIAssistant.jsx`
- `src/shared/services/api/assistantApi.js`

### 7.8 Profile and notifications

Current service-backed actions exist for:

- fetch current user
- update current user
- fetch announcement-driven notification lists in headers

Files:

- `src/user/pages/Profile.jsx`
- `src/admin/components/Header.jsx`
- `src/user/components/Header.jsx`

## 8. Current Gaps and Limitations in Backend Integration

The codebase is significantly improved, but it is not fully backend-complete yet.

### 8.1 Auth context is not fully wired for real backend mode

This is the most important remaining architectural gap.

Problem:

- `auth-context.jsx` uses `api.auth.login`, `api.auth.verifyAdminOtp`, `api.auth.verifyUserTwoFactor`, and `api.auth.logout`.
- In `src/shared/services/api/index.js`, when `env.useMockApi` is `false`, `api.auth` becomes a placeholder object from `createHttpPlaceholder("auth")`.
- That placeholder does not expose `login`, `verifyAdminOtp`, `verifyUserTwoFactor`, or `logout`.

Impact:

- Full backend auth mode will break unless `api.auth` is connected to real implementations.

### 8.2 QA is still local-storage based

Problem:

- `src/shared/services/api/qaApi.js` still reads and writes discussion questions to local storage.
- It seeds frontend-only default questions.

Impact:

- QA is not backend-integrated.
- Data is device-local and not multi-user consistent.

### 8.3 User announcement pinning is still local-storage based

Problem:

- `getUserAnnouncementPins()` and `setUserAnnouncementPin()` store pinned IDs in local storage.

Impact:

- Pins are not server-backed.
- They do not sync across devices or sessions.

### 8.4 Auth fallback and token persistence remain mixed with demo behavior

Problem:

- `authApi.js` includes demo users, fallback challenge flows, local token mirroring, and fallback auth users.
- This is useful for demos but not final backend mode.

Impact:

- Real backend behavior and fallback/demo behavior are still interwoven.

### 8.5 Legacy mock infrastructure still exists

Examples:

- `src/shared/utils/constants.js` still contains large `MOCK_*` datasets.
- `src/shared/services/mockDatabase.js` still exists.
- `createMockUsersApi()` still exists in `usersApi.js`.

Impact:

- The codebase still carries legacy fallback systems that should be retired once backend adoption is complete.

### 8.6 Dashboard and analytics remain frontend-aggregated

Problem:

- Dashboard and analytics data are currently built by combining multiple lower-level responses in the frontend.
- `dashboardApi.js` and `analyticsApi.js` use helper-driven aggregation instead of dedicated backend summary endpoints.

Impact:

- Multiple page loads can trigger multiple requests.
- The frontend owns business aggregation logic that ideally belongs to the backend.

### 8.7 User report upload is not yet a real file-upload flow

Problem:

- `createUserReport()` currently sends JSON payloads only.
- The UI still indicates that file upload wiring is pending.

Impact:

- Report submission is not yet a full multipart/file-backed workflow.

### 8.8 Some header actions are still UI-only

Examples:

- user header "Mark all read" is visual only
- header search bars are currently UI-only

Impact:

- These controls still need backend or cross-page integration if they are expected to be functional features.

### 8.9 Legacy `AuthGate.jsx` still exists

Problem:

- `src/AuthGate.jsx` remains in the source tree, but `main.jsx` now renders `AppRoot` instead.

Impact:

- This can confuse contributors because it is no longer the active application entry path.

## 9. Recommended Roadmap for Complete Backend Adaptation

This roadmap assumes the current modular structure should be preserved and extended, not replaced.

### Phase 1. Stabilize the service contract

Goal:

- ensure every active page uses one stable API contract
- eliminate broken mock/real-mode switching

Required work:

- replace `api.auth` placeholder behavior in `src/shared/services/api/index.js` with real auth method wiring
- decide whether `api.users` should remain at all or be removed in favor of direct `usersApi` imports
- finalize `env.useMockApi` behavior and default strategy for development vs backend mode
- document all current endpoint assumptions from the modular API files

Recommended order:

1. `authApi.js`
2. `index.js`
3. `auth-context.jsx`
4. `request.js`

### Phase 2. Replace remaining frontend-local fallbacks

Goal:

- remove device-local persistence from user-facing features that should be server-backed

Required work:

- replace local-storage QA methods with backend endpoints
- replace announcement pin storage with backend user preference endpoints
- replace demo auth fallback flows with environment-gated or removed demo mode
- decide whether `mockDatabase.js` and `createMockUsersApi()` should be removed or isolated into a true dev-only mock layer

Missing or needed fetch/mutation methods:

- `getQaQuestions()` real backend implementation
- `createQaQuestion()` real backend implementation
- `upvoteQaQuestion()` real backend implementation
- `getUserAnnouncementPins()` backend implementation
- `setUserAnnouncementPin()` backend implementation
- notification read-state methods if required

Recommended order:

1. QA
2. announcement pins
3. notification read state
4. legacy mock cleanup

### Phase 3. Complete report and file workflow integration

Goal:

- upgrade report handling from metadata-only to actual uploaded artifact handling

Required work:

- add multipart or signed-upload support for user report submission
- add backend file URL generation and access control
- wire download buttons to actual file endpoints
- add file metadata normalization in report services

Missing or needed methods:

- upload-capable `createUserReport()`
- optional `getReportDownloadUrl(id)` or equivalent
- optional admin-side report attachment metadata support

Recommended order:

1. backend file contract definition
2. request helper support for multipart/FormData
3. user report submission update
4. admin review/download alignment

### Phase 4. Move frontend-derived analytics into backend summaries where appropriate

Goal:

- reduce frontend aggregation complexity
- make analytics and dashboard payloads cheaper and more stable

Required work:

- decide which current helper-built payloads should become dedicated backend summary endpoints
- keep the existing frontend shape, but move derivation server-side

Recommended endpoint evolution:

- `/admin/dashboard/summary`
- `/app/dashboard/summary`
- `/admin/analytics/summary`
- `/app/analytics/summary`

Why this order matters:

- page UIs are already stable
- only data sourcing should change
- current service functions can remain as adapters over new backend summary endpoints

### Phase 5. Remove remaining hardcoded legacy values

Goal:

- make the frontend fully contract-driven

Targets to remove or isolate:

- `MOCK_*` exports from `shared/utils/constants.js`
- demo auth users in `authApi.js` and `mockAuthUsers.js`
- local fallback question seeds in `qaApi.js`
- mock user database logic in `mockDatabase.js`
- stale `AuthGate.jsx` if no longer needed for reference

Recommended strategy:

- move any required demo-only fixtures into a dedicated `dev-only` mock folder or separate seed mechanism
- keep production code paths free of data fixtures

### Phase 6. Standardize component-to-service integration

Goal:

- make every page follow one repeatable async pattern

Recommended page pattern:

1. import service methods only from `shared/services/api/`
2. normalize at service/helper level where possible
3. keep page-level `loading`, `error`, and `ready` states explicit
4. use shared `AppState` and `PageSkeletons` primitives
5. keep mutations isolated in named handlers with action-level feedback

This pattern is already visible in pages like:

- `admin/pages/AdminPanel.jsx`
- `admin/pages/Reports.jsx`
- `user/pages/Profile.jsx`
- `user/pages/AIAssistant.jsx`

### Phase 7. Improve error and loading behavior further

Current state is much better than the original assignment, but further improvements are still possible.

Recommended next improvements:

- add action-level loading indicators consistently to all mutation buttons
- add success toast or feedback consistency across all pages
- ensure all page-level loaders use the shared skeleton system only
- standardize retry button styling and placement
- add request cancellation or stale-request protection for long-lived pages where appropriate

## 10. Recommended Implementation Order

The following order is recommended for full backend adaptation:

1. Fix real auth wiring in `api/index.js` and `auth-context.jsx`
2. Finalize environment strategy for mock vs real backend mode
3. Replace QA local-storage service with real backend endpoints
4. Replace announcement pin local-storage behavior with real user preference endpoints
5. Implement real report file upload and download flow
6. Add notification read-state endpoints if notifications are expected to persist
7. Move dashboard and analytics aggregation server-side where feasible
8. Remove legacy mock infrastructure from production paths
9. Remove or archive unused legacy entry files like `AuthGate.jsx`

## 11. Final Assessment

The current implementation is a strong transitional architecture between a static frontend assignment and a backend-driven application.

It already solves the biggest frontend-side problems from the original version:

- route-less navigation
- hardcoded page data
- missing API boundaries
- duplicated async handling patterns
- lack of loading/error UX
- oversized eager page bundles

However, the project is not yet fully backend-adapted. The largest remaining blockers are:

- auth real-mode wiring
- QA persistence
- announcement pin persistence
- report file upload handling
- retirement of legacy mock infrastructure

Once those gaps are addressed, the current codebase should be able to serve as a clean production-ready frontend foundation rather than a transitional hybrid.
