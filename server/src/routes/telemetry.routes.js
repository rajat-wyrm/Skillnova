import { Router } from 'express';
import telemetryController from '../controllers/telemetry.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// These routes need authentication
router.use(authenticate);

router.post('/heartbeat', telemetryController.heartbeat);
router.post('/page-event', telemetryController.pageEvent);
router.post('/end-session', telemetryController.endSession);

export default router;
