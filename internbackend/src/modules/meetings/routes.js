const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');
const { createAuditLog, extractRequestInfo } = require('../../utils/audit');
const { z } = require('zod');

async function routes(fastify) {
  // List meetings (hierarchy-aware)
  fastify.get('/', { preHandler: [auth] }, async (req) => {
    const { from, to } = req.query;
    const pool = require('../../config/db');
    const deptRes = await pool.query('SELECT department_id FROM users WHERE id=$1', [req.user.id]);
    const departmentId = deptRes.rows[0]?.department_id || null;
    return repo.listMeetings({
      userId: req.user.id,
      departmentId: req.user.role !== 'INTERN' ? departmentId : null,
      fromDate: from,
      toDate: to,
    });
  });

  // Get single meeting
  fastify.get('/:id', { preHandler: [auth] }, async (req, reply) => {
    const meeting = await repo.getMeetingById(req.params.id);
    if (!meeting) return reply.status(404).send({ error: 'Meeting not found' });
    const isCreator = meeting.created_by === req.user.id;
    const isAttendee = await require('../../config/db').query(
      'SELECT 1 FROM meeting_attendees WHERE meeting_id=$1 AND user_id=$2', [meeting.id, req.user.id]
    ).then(r => r.rowCount > 0);
    if (!isCreator && !isAttendee && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    const attendees = await repo.getAttendees(meeting.id);
    return { ...meeting, attendees };
  });

  // Create meeting
  fastify.post('/', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL')] }, async (req, reply) => {
    const schema = z.object({
      title: z.string().min(3),
      description: z.string().optional(),
      meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      departmentId: z.string().uuid().optional(),
      attendeeIds: z.array(z.string().uuid()).optional()
    });
    const data = schema.parse(req.body);
    const meeting = await repo.createMeeting({
      ...data,
      createdBy: req.user.id,
    });
    if (data.attendeeIds) {
      for (const uid of data.attendeeIds) {
        await repo.addAttendee(meeting.id, uid);
      }
    }
    await createAuditLog({ userId: req.user.id, action: 'MEETING_CREATED', resourceType: 'meeting', resourceId: meeting.id, ...extractRequestInfo(req) });
    return reply.status(201).send(meeting);
  });

  // Update meeting
  fastify.patch('/:id', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL')] }, async (req, reply) => {
    const meeting = await repo.getMeetingById(req.params.id);
    if (!meeting) return reply.status(404).send({ error: 'Not found' });
    if (meeting.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only creator or admin can update' });
    }
    const updated = await repo.updateMeeting(req.params.id, req.body);
    return updated;
  });

  // Delete meeting (soft)
  fastify.delete('/:id', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL')] }, async (req, reply) => {
    const meeting = await repo.getMeetingById(req.params.id);
    if (!meeting) return reply.status(404).send({ error: 'Not found' });
    if (meeting.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only creator or admin' });
    }
    await repo.softDeleteMeeting(req.params.id);
    await createAuditLog({ userId: req.user.id, action: 'MEETING_DELETED', resourceType: 'meeting', resourceId: meeting.id, ...extractRequestInfo(req) });
    return { message: 'Meeting deleted' };
  });

  // Add attendee
  fastify.post('/:id/attendees', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL','CAPTAIN')] }, async (req, reply) => {
    const meeting = await repo.getMeetingById(req.params.id);
    if (!meeting) return reply.status(404).send({ error: 'Not found' });
    const { userId } = req.body;
    if (meeting.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only creator can add attendees' });
    }
    await repo.addAttendee(req.params.id, userId);
    return { message: 'Attendee added' };
  });

  // Remove attendee
  fastify.delete('/:id/attendees/:userId', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL','CAPTAIN')] }, async (req, reply) => {
    const meeting = await repo.getMeetingById(req.params.id);
    if (!meeting) return reply.status(404).send({ error: 'Not found' });
    if (meeting.created_by !== req.user.id && req.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only creator or admin' });
    }
    await repo.removeAttendee(req.params.id, req.params.userId);
    return { message: 'Attendee removed' };
  });
}

module.exports = routes;