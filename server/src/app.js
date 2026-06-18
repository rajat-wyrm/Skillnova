// ════════════════════════════════════════════════════════════
//  Express App
// ════════════════════════════════════════════════════════════
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { ApiError } from './utils/ApiError.js';
import { authenticate, csrfProtection } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import apiRoutes from './routes/api.routes.js';
import kbRoutes from './routes/kb.routes.js';

const app = express();

// Trust proxy (so req.ip and X-Forwarded-For work behind nginx/cloudflare)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// Gzip
app.use(compression());

// CORS — explicit allow-list
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.corsOrigin.includes(origin)) return cb(null, true);
      cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Logging
if (!config.isProd) app.use(morgan('dev'));

// Global rate limit
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/healthz',
  })
);

// Auth middleware (populates req.user)
app.use(authenticate);

// ── Health & version ──────────────────────────────────────
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    service: 'skillnova-api',
    env: config.env,
    time: new Date().toISOString(),
  });
});

app.get('/api/v1/meta', (_req, res) => {
  res.json({
    name: 'SkillNova API',
    version: '1.0.0',
    docs: '/api/v1/docs',
    company: 'UptoSkills',
  });
});

// ── Auth routes (no CSRF — uses OTP second factor) ───────
app.use('/api/v1/auth', authRoutes);

// ── Authenticated routes (CSRF enforced for state-changing) ──
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/kb', kbRoutes);
app.use('/api/v1', csrfProtection, apiRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Centralised error handler ────────────────────────────
app.use((err, req, res, _next) => {
  if (err instanceof ApiError) {
    logger.warn({ status: err.status, path: req.originalUrl, msg: err.message }, 'api:error');
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  // CORS error from upstream
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // Body parse error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Unknown
  logger.error({ err, path: req.originalUrl }, 'api:unhandled-error');
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.headers['x-request-id'] ?? undefined,
  });
});

export default app;
