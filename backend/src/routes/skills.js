import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get my skills
router.get('/my-skills', authenticate, async (req, res) => {
  try {
    const skills = await prisma.skillTracker.findMany({
      where: { internId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add/Update skill
router.post('/add-skill', authenticate, async (req, res) => {
  try {
    const { skillName, level, progress } = req.body;

    const skill = await prisma.skillTracker.upsert({
      where: { internId_skillName: { internId: req.user.id, skillName } },
      update: { level, progress },
      create: { internId: req.user.id, skillName, level, progress }
    });

    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;