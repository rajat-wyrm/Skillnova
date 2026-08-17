// Express app (cleaned)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';

import { config, isCorsOriginAllowed } from './config/index.js';
import { logger } from './utils/logger.js';
import { ApiError } from './utils/ApiError.js';
import prisma from './utils/prisma.js';
import { redis } from './utils/redis.js';
import { authenticate, csrfProtection } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import apiRoutes from './routes/api.routes.js';
import kbRoutes from './routes/kb.routes.js';
import featuresRoutes, { publicApi as publicFeaturesRoutes } from './routes/features.routes.js';
import phase1Routes from './routes/roadmap.routes.js';
import skillGapRoutes from './routes/skillGap.routes.js';
import { etagMiddleware } from './utils/cache.js';
import { requestId } from './middleware/requestId.js';
import resumeImportRoutes from './resume-import/resumeImport.routes.js';
import { UPLOAD_DIR_PATH } from './utils/upload.js';

const app = express();

app.set('trust proxy', 1);

app.use(requestId());
app.use((req, _res, next) => { req.requestId = req.id; next(); });

app.use((_req, res, next) => { res.setHeader('X-API-Version', '1.0.0'); next(); });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());

app.use(cors({
  origin: (origin, cb) => {
    if (isCorsOriginAllowed(origin)) return cb(null, true);
    if (!origin) return cb(null, true);
    if (config.corsOrigin.includes(origin)) return cb(null, true);
    logger.warn({ origin }, 'cors:rejected');
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (!config.isProd) app.use(morgan('dev'));

app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, standardHeaders: true, legacyHeaders: false, skip: (req) => req.path === '/healthz' }));

app.use(authenticate);
app.use(etagMiddleware());

app.use((_req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    if (!res.headersSent) res.setHeader('X-Response-Time', `${Date.now()-start}ms`);
    return originalEnd.apply(this, args);
  };
  next();
});

// Health endpoints
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'skillnova-api', env: config.env, time: new Date().toISOString() });
});

app.get('/healthz/live', (_req, res) => res.status(200).json({ ok: true, check: 'live' }));

app.get('/healthz/ready', async (_req, res) => {
  const checks = { db: false, redis: false };
  try { await prisma.$queryRaw`SELECT 1`; checks.db = true; } catch { }
  try { const pong = await redis.ping(); if (pong) checks.redis = true; } catch { }
  const ok = checks.db && checks.redis;
  res.status(ok ? 200 : 503).json({ ok, checks });
});

app.get('/healthz/disk', (_req, res) => {
  try { fs.accessSync(UPLOAD_DIR_PATH, fs.constants.W_OK); res.json({ ok: true, uploadDir: UPLOAD_DIR_PATH }); }
  catch { res.status(503).json({ ok: false, uploadDir: UPLOAD_DIR_PATH }); }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicFeaturesRoutes);
app.use('/api/v1', featuresRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/kb', kbRoutes);
app.use('/api/v1/skill-gap', skillGapRoutes);
app.use('/api/v1/resume-import', resumeImportRoutes);
app.use('/api/v1', csrfProtection, apiRoutes);
app.use('/api/v1', csrfProtection, phase1Routes);

// 404
app.use((req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`)));

// Error handler
app.use((err, req, res, _next) => {
  if (err instanceof ApiError) {
    logger.warn({ status: err.status, path: req.originalUrl, msg: err.message }, 'api:error');
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.message?.startsWith('CORS')) return res.status(403).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  logger.error({ err, path: req.originalUrl }, 'api:unhandled-error');
  res.status(500).json({ error: 'Internal server error', requestId: req.headers['x-request-id'] ?? undefined, timestamp: new Date().toISOString() });
});

export default app;
