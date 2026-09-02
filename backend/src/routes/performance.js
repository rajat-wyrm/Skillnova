import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get performance reviews for intern
router.get('/reviews', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { internId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create performance review (mentor only)
router.post('/reviews', authenticate, authorize(['MENTOR', 'ADMIN']), async (req, res) => {
  try {
    const { internId, month, year, rating, technical, communication, teamwork, attendance, feedback } = req.body;

    const review = await prisma.performanceReview.create({
      data: {
        internId,
        mentorId: req.user.id,
        month,
        year,
        rating,
        technical,
        communication,
        teamwork,
        attendance,
        feedback
      }
    });

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;