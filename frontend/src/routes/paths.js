export const PUBLIC_PATHS = {
  home: "/",
  login: "/login",
  adminOtp: "/verify/admin-otp",
  userTwoFactor: "/verify/user-2fa",
};

export const ADMIN_ROUTES = {
  "admin-dashboard": "/admin/dashboard",
  "admin-users": "/admin/users",
  "admin-management": "/admin/management",
  "admin-knowledge": "/admin/knowledge-base",
  "admin-reports": "/admin/reports",
  "admin-analytics": "/admin/analytics",
  "admin-announcements": "/admin/announcements",
  "admin-settings": "/admin/settings",
};

export const USER_ROUTES = {
  dashboard: "/app/dashboard",
  knowledge: "/app/knowledge-base",
  qa: "/app/qa",
  project_flow: "/app/project-flow",
  reports: "/app/reports",
  assistant: "/app/assistant",
  announcements: "/app/announcements",
  analytics: "/app/analytics",
  profile: "/app/profile",
  settings: "/app/settings",
};

export const getPageIdFromPath = (path, routes, fallbackId) =>
  Object.keys(routes).find(key => routes[key] === path) || fallbackId;

export const getPathFromPageId = (routes, pageId, fallbackPath) =>
  routes[pageId] || fallbackPath;

export const getHomePathForRole = role =>
  role === "admin" ? ADMIN_ROUTES["admin-dashboard"] : USER_ROUTES.dashboard;

export const getVerificationPath = nextStep =>
  nextStep === "admin-otp" ? PUBLIC_PATHS.adminOtp : PUBLIC_PATHS.userTwoFactor;
