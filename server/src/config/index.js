import 'dotenv/config';
import crypto from 'node:crypto';

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_SECRET', 'CSRF_SECRET'];
const isProd = process.env.NODE_ENV === 'production';
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  if (isProd) {
    console.error(`[config] Missing required env var(s): ${missing.join(', ')}`);
    process.exit(1);
  }
  // Dev / test: warn loudly and substitute placeholders so unit tests can
  // run without a populated .env file. Production servers always set these.
  console.warn(`[config] Missing env var(s) substituted with random placeholders: ${missing.join(', ')}`);
  for (const k of missing) {
    process.env[k] = `dev-${k.toLowerCase()}-${crypto.randomBytes(12).toString('hex')}`;
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),

  databaseUrl: process.env.DATABASE_URL,
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    secret: process.env.JWT_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
    otpTtl: process.env.OTP_TTL || '10m',
    twoFaTtl: process.env.TWOFA_TTL || '10m',
  },

  csrf: {
    secret: process.env.CSRF_SECRET,
  },

  apiKey: process.env.API_KEY,

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  },

  logLevel: process.env.LOG_LEVEL || 'info',
  isProd: process.env.NODE_ENV === 'production',
};

export default config;
