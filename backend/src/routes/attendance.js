import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Mark attendance
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { internId, status, remarks } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Only mentors/admins can mark attendance
    if (req.user.role !== 'MENTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const attendance = await prisma.attendance.upsert({
      where: { internId_date: { internId, date: new Date(today) } },
      update: { status, remarks, updatedAt: new Date() },
      create: { internId, date: new Date(today), status, remarks }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ATTENDANCE_MARKED',
        resource: `Attendance for ${internId}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await prisma.attendance.upsert({
      where: { internId_date: { internId: req.user.id, date: new Date(today) } },
      update: { 
        checkInTime: new Date(),
        status: 'PRESENT'
      },
      create: { 
        internId: req.user.id, 
        date: new Date(today), 
        status: 'PRESENT',
        checkInTime: new Date()
      }
    });

    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await prisma.attendance.update({
      where: { internId_date: { internId: req.user.id, date: new Date(today) } },
      data: { checkOutTime: new Date() }
    });

    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance summary for intern
router.get('/summary/:internId', authenticate, async (req, res) => {
  try {
    const { internId } = req.params;
    const now = new Date();

    const summary = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        internId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      },
      _count: true
    });

    const total = summary.reduce((acc, s) => acc + s._count, 0);
    const present = summary.find(s => s.status === 'PRESENT')?._count || 0;
    const percentage = total > 0 ? (present / total * 100).toFixed(2) : 0;

    res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      totalDays: total,
      present,
      percentage,
      breakdown: summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all attendance (for mentors/admins)
router.get('/all', authenticate, authorize(['MENTOR', 'ADMIN']), async (req, res) => {
  try {
    const { date, status, internId } = req.query;
    
    const attendance = await prisma.attendance.findMany({
      where: {
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
        ...(internId && { internId })
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request leave
router.post('/request', authenticate, async (req, res) => {
  try {
    const { type, reason, startDate, endDate } = req.body;

    const request = await prisma.attendanceRequest.create({
      data: {
        internId: req.user.id,
        type,
        reason,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'PENDING'
      }
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject leave request
router.patch('/request/:id', authenticate, authorize(['MENTOR', 'ADMIN']), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const request = await prisma.attendanceRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedBy: req.user.id,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      }
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;