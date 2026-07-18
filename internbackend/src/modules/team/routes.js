const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const ownership = require('../../middleware/ownership');
const repo = require('./repository');
const { createAuditLog, extractRequestInfo } = require('../../utils/audit');
const { checkHierarchyAccess } = require('../../utils/hierarchy');
const { z } = require('zod');

// Roles that manage a team (Interns have no reports).
const MANAGER_ROLES = ['ADMIN', 'SENIOR_TL', 'TL', 'CAPTAIN'];
// Hierarchy levels — a manager may add any member ranked below themselves.
const ROLE_RANK = { ADMIN: 4, SENIOR_TL: 3, TL: 2, CAPTAIN: 1, INTERN: 0 };

const detailFields = {
  full_name: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  college: z.string().max(255).optional(),
  course: z.string().max(255).optional(),
  year_of_study: z.string().max(50).optional(),
  position: z.string().max(255).optional(),
  joining_date: z.string().max(20).optional(),
  internship_status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'TERMINATED']).optional(),
  location: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
};

const updateSchema = z.object(detailFields);
const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SENIOR_TL', 'TL', 'CAPTAIN', 'INTERN']),
  manager_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  ...detailFields,
});

function toCsv(rows) {
  const cols = ['full_name', 'email', 'role', 'department_name', 'phone', 'location',
    'college', 'course', 'position', 'joining_date', 'internship_status'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

async function routes(fastify) {
  // List everyone in the requester's team, with details + performance summary.
  fastify.get('/members', { preHandler: [auth, rbac(...MANAGER_ROLES)] }, async (req) => {
    return repo.getTeamMembers(req.user.id);
  });

  // Export the requester's team as CSV.
  fastify.get('/members/export', { preHandler: [auth, rbac(...MANAGER_ROLES)] }, async (req, reply) => {
    const members = await repo.getTeamMembers(req.user.id);
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="team-members.csv"');
    return toCsv(members);
  });

  // Add a new member under the requester (or a sub-manager in their team).
  fastify.post('/members', { preHandler: [auth, rbac(...MANAGER_ROLES)] }, async (req, reply) => {
    const data = createSchema.parse(req.body);

    // Default the manager to the requester; otherwise it must be inside their team.
    const managerId = data.manager_id || req.user.id;
    if (managerId !== req.user.id && req.user.role !== 'ADMIN') {
      const inTeam = await checkHierarchyAccess(req.user.id, managerId);
      if (!inTeam) return reply.status(403).send({ error: 'Chosen manager is not in your team' });
    }
    const managerRole = managerId === req.user.id ? req.user.role : await repo.getUserRole(managerId);
    if (!managerRole) return reply.status(400).send({ error: 'Manager not found' });
    if (ROLE_RANK[data.role] === undefined || ROLE_RANK[data.role] >= ROLE_RANK[managerRole]) {
      return reply.status(400).send({ error: `You can only add members below your own role (${managerRole})` });
    }
    if (await repo.emailExists(data.email)) {
      return reply.status(409).send({ error: 'A user with this email already exists' });
    }

    const member = await repo.createMember({ ...data, manager_id: managerId });
    await createAuditLog({
      userId: req.user.id,
      action: 'MEMBER_CREATED',
      resourceType: 'user',
      resourceId: member.id,
      newValue: { email: member.email, role: member.role },
      ...extractRequestInfo(req),
    });
    return reply.status(201).send(member);
  });

  // Single member's full detail (must be inside the requester's hierarchy).
  fastify.get('/members/:id', { preHandler: [auth, rbac(...MANAGER_ROLES), ownership('id')] }, async (req, reply) => {
    const member = await repo.getMemberById(req.params.id);
    return member || reply.status(404).send({ error: 'Member not found' });
  });

  // Attendance + ratings history for a member.
  fastify.get('/members/:id/history', { preHandler: [auth, rbac(...MANAGER_ROLES), ownership('id')] }, async (req) => {
    return repo.getMemberHistory(req.params.id);
  });

  // Update a member's detail fields (within hierarchy), with audit trail.
  fastify.patch('/members/:id', { preHandler: [auth, rbac(...MANAGER_ROLES), ownership('id')] }, async (req, reply) => {
    const data = updateSchema.parse(req.body);
    const before = await repo.getMemberById(req.params.id);
    if (!before) return reply.status(404).send({ error: 'Member not found' });
    const after = await repo.updateMember(req.params.id, data);
    await createAuditLog({
      userId: req.user.id,
      action: 'MEMBER_DETAILS_UPDATED',
      resourceType: 'user',
      resourceId: req.params.id,
      oldValue: before,
      newValue: after,
      ...extractRequestInfo(req),
    });
    return after;
  });

  // Suspend / activate a member (within hierarchy).
  fastify.patch('/members/:id/status', { preHandler: [auth, rbac(...MANAGER_ROLES), ownership('id')] }, async (req, reply) => {
    const { suspended } = z.object({ suspended: z.boolean() }).parse(req.body);
    const member = await repo.setMemberStatus(req.params.id, suspended);
    if (!member) return reply.status(404).send({ error: 'Member not found' });
    await createAuditLog({
      userId: req.user.id,
      action: suspended ? 'MEMBER_SUSPENDED' : 'MEMBER_ACTIVATED',
      resourceType: 'user',
      resourceId: req.params.id,
      ...extractRequestInfo(req),
    });
    return member;
  });
}

module.exports = routes;
