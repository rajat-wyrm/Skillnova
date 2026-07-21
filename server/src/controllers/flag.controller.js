import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create a flag (Mentor only)
export const createFlag = async (req, res) => {
  try {
    const { internId, type, reason } = req.body;
    const mentorId = req.user.id;

    const flag = await prisma.flag.create({
      data: {
        internId,
        mentorId,
        type,
        reason,
      },
      include: {
        intern: { select: { name: true, email: true } },
        mentor: { select: { name: true } },
      },
    });

    res.status(201).json({ success: true, flag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all flags (Admin/Super Admin)
export const getAllFlags = async (req, res) => {
  try {
    const flags = await prisma.flag.findMany({
      include: {
        intern: { select: { name: true, email: true, department: true } },
        mentor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get flags for mentor's interns only (Mentor)
export const getMyFlags = async (req, res) => {
  try {
    const mentorId = req.user.id;

    const flags = await prisma.flag.findMany({
      where: { mentorId },
      include: {
        intern: { select: { name: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resolve a flag (Mentor only)
export const resolveFlag = async (req, res) => {
  try {
    const { id } = req.params;

    const flag = await prisma.flag.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    res.json({ success: true, flag });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a flag (Mentor only)
export const deleteFlag = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.flag.delete({ where: { id } });

    res.json({ success: true, message: 'Flag deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get flags raised on the logged-in intern
export const getMyFlagsAsIntern = async (req, res) => {
  try {
    const internId = req.user.id;

    const flags = await prisma.flag.findMany({
      where: { 
        internId,
        status: 'ACTIVE'
      },
      include: {
        mentor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};