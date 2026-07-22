// ════════════════════════════════════════════════════════════
//  Resume Import — routes
//  Mounted at /api/v1/resume-import
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../utils/cache.js';
import { resumeUpload } from './resumeUpload.middleware.js';
import * as resumeImport from './resumeImport.controller.js';

const router = Router();
router.use(authenticate, requireAuth);

// Rate-limited like the general file upload route: parsing is the
// expensive step here (PDF text extraction + one AI call).
router.post(
  '/parse',
  rateLimitMiddleware({ name: 'resume-import', windowSec: 60, max: 10 }),
  resumeUpload.single('resume'),
  resumeImport.parseResume
);

export default router;
