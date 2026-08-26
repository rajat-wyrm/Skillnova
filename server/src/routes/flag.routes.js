import express from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { createFlag, getAllFlags, getMyFlags, resolveFlag, deleteFlag, getMyFlagsAsIntern } from '../controllers/flag.controller.js';

const router = express.Router();

// Role check helpers
const requireMentor = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  if (!['MENTOR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return next(ApiError.forbidden('Mentor access required'));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
};

// All routes require authentication
router.use(authenticate, requireAuth);
router.get('/my-alerts', requireAuth, getMyFlagsAsIntern);

// Mentor routes
router.post('/', requireMentor, createFlag);
router.get('/my-flags', requireMentor, getMyFlags);
router.patch('/:id/resolve', requireMentor, resolveFlag);
router.delete('/:id', requireMentor, deleteFlag);

// Admin / Super Admin routes
router.get('/', requireAdmin, getAllFlags);

export default router;