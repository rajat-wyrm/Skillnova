// ════════════════════════════════════════════════════════════
//  Auth Routes
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { config } from '../config/index.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(true),
});

const otpSchema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().trim().min(4).max(10),
  useTotp: z.boolean().optional(),
});

router.post('/login', loginLimiter, validate(loginSchema), auth.login);
router.post('/verify-otp', loginLimiter, validate(otpSchema), auth.verifyOtp);
router.post('/refresh', auth.refresh);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, requireAuth, auth.me);
router.post('/2fa/setup', authenticate, requireAuth, auth.setupTotp);
router.post(
  '/2fa/enable',
  authenticate,
  requireAuth,
  validate(z.object({ code: z.string().trim().length(6) })),
  auth.enableTotp
);

export default router;
