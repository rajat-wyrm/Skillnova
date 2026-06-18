// ════════════════════════════════════════════════════════════
//  Role-Based Access Control (RBAC)
//  Granular permission matrix + middleware helpers
// ════════════════════════════════════════════════════════════

// ── Permissions catalogue ─────────────────────────────────
export const PERMISSIONS = {
  // Users
  'users:read':       ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'users:create':     ['SUPER_ADMIN', 'ADMIN'],
  'users:update':     ['SUPER_ADMIN', 'ADMIN'],
  'users:delete':     ['SUPER_ADMIN'],
  'users:role:change':['SUPER_ADMIN'],

  // Reports
  'reports:read':     ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'reports:create':   ['INTERN', 'MENTOR'],
  'reports:update':   ['INTERN', 'MENTOR', 'ADMIN', 'SUPER_ADMIN'],
  'reports:review':   ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'reports:delete':   ['SUPER_ADMIN', 'ADMIN'],

  // Knowledge Base
  'kb:read':          ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'kb:create':        ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'kb:update':        ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'kb:verify':        ['SUPER_ADMIN', 'ADMIN'],
  'kb:delete':        ['SUPER_ADMIN', 'ADMIN'],

  // Announcements
  'announcements:read':    ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'announcements:create':  ['SUPER_ADMIN', 'ADMIN'],
  'announcements:update':  ['SUPER_ADMIN', 'ADMIN'],
  'announcements:delete':  ['SUPER_ADMIN', 'ADMIN'],

  // Attendance
  'attendance:read':       ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'attendance:mark':       ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'attendance:self':       ['INTERN', 'MENTOR', 'ADMIN', 'SUPER_ADMIN'],

  // Projects & Tasks
  'projects:read':   ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'projects:create': ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'projects:update': ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'projects:delete': ['SUPER_ADMIN', 'ADMIN'],

  'tasks:read':      ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'tasks:create':    ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],
  'tasks:update':    ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'tasks:delete':    ['SUPER_ADMIN', 'ADMIN', 'MENTOR'],

  // Q&A
  'qa:read':         ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'qa:create':       ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'qa:update':       ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],
  'qa:delete':       ['SUPER_ADMIN', 'ADMIN'],

  // AI Assistant
  'ai:use':          ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'INTERN'],

  // Settings & Audit
  'settings:read':   ['SUPER_ADMIN', 'ADMIN'],
  'settings:update': ['SUPER_ADMIN'],
  'audit:read':      ['SUPER_ADMIN'],
};

// ── Helpers ───────────────────────────────────────────────
export function roleHasPermission(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function userHasAllPermissions(user, perms) {
  return perms.every((p) => roleHasPermission(user.role, p));
}

export function userHasAnyPermission(user, perms) {
  return perms.some((p) => roleHasPermission(user.role, p));
}

// ── Middleware factories ──────────────────────────────────
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roleHasPermission(req.user.role, permission)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Missing permission: ${permission}`,
      required: permission,
      yourRole: req.user.role,
    });
  }
  next();
};

export const requireAnyPermission = (...perms) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!userHasAnyPermission(req.user, perms)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Missing one of: ${perms.join(', ')}`,
      requiredAny: perms,
      yourRole: req.user.role,
    });
  }
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Required role: ${roles.join(' or ')}`,
      requiredRoles: roles,
      yourRole: req.user.role,
    });
  }
  next();
};

export const requireOwnershipOrAdmin = (getOwnerId) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') return next();
  const ownerId = await getOwnerId(req);
  if (ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Not the owner of this resource' });
  }
  next();
};

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MENTOR: 2,
  INTERN: 1,
};

export const roleAtLeast = (role, minRole) =>
  ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];

export default {
  PERMISSIONS,
  requirePermission,
  requireRole,
  requireAnyPermission,
  requireOwnershipOrAdmin,
  roleHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  roleAtLeast,
  ROLE_HIERARCHY,
};
