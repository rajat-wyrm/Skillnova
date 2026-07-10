// ════════════════════════════════════════════════════════════
//  Auth Routes
// ════════════════════════════════════════════════════════════
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import * as googleAuth from '../controllers/googleAuth.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { config } from '../config/index.js';

const router = Router();

// Rate limit: 10 login attempts per 15-minute window.
// standardHeaders: true sends RateLimit-* headers per IETF draft-ietf-httpapi-ratelimit-headers.
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [SUPER_ADMIN, ADMIN, MENTOR, INTERN]
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 step:
 *                   type: string
 *                   enum: [otp_required]
 *                 challengeToken:
 *                   type: string
 *                 devCode:
 *                   type: string
 *                   description: OTP code in development mode only
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

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

// ── Google OAuth ─────────────────────────────────────────
router.get('/google/status', googleAuth.status);
router.get('/google', googleAuth.start);
router.get('/google/callback', googleAuth.callback);

export default router;
