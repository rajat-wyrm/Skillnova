import { Router } from 'express';
import * as gamificationController from '../controllers/gamification.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAuth);

router.get('/status', gamificationController.getStatus);
router.get('/badges', gamificationController.getAllBadges);

export default router;
