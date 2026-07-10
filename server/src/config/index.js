import 'dotenv/config';
import crypto from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';
const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_SECRET', 'CSRF_SECRET', ...(isProd ? ['FILE_SIGN_SECRET'] : [])];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  if (isProd) {
    console.error('\n[config] FATAL: Missing required environment variable(s):');
    missing.forEach((k) => console.error(`  - ${k}`));
    console.error('\nCopy server/.env.example to server/.env and fill in real values.');
    console.error('Generate secrets with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"\n');
    process.exit(1);
  }
  // Dev / test: warn loudly and substitute placeholders so unit tests can
  // run without a populated .env file. Production servers always set these.
  console.warn(`[config] Missing env var(s) substituted with random placeholders: ${missing.join(', ')}`);
  for (const k of missing) {
    process.env[k] = `dev-${k.toLowerCase()}-${crypto.randomBytes(12).toString('hex')}`;
  }
}

// Validate DATABASE_URL format
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  if (isProd) {
    console.error('[config] FATAL: DATABASE_URL must start with postgres:// or postgresql://');
    process.exit(1);
  }
  console.warn('[config] WARNING: DATABASE_URL should start with postgres:// or postgresql://');
}

// Warn about weak secrets in dev
if (!isProd) {
  const weakSecrets = required.filter((k) => {
    const v = process.env[k];
    return v && v.length < 32;
  });
  if (weakSecrets.length) {
    console.warn(`[config] WARNING: Short secret(s) (< 32 chars): ${weakSecrets.join(', ')}. OK for dev, not for production.`);
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
    accessTtl: process.env.ACCESS_TOKEN_TTL
      ? /\D/.test(process.env.ACCESS_TOKEN_TTL)
        ? process.env.ACCESS_TOKEN_TTL
        : Number(process.env.ACCESS_TOKEN_TTL)
      : '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL
      ? /\D/.test(process.env.REFRESH_TOKEN_TTL)
        ? process.env.REFRESH_TOKEN_TTL
        : Number(process.env.REFRESH_TOKEN_TTL)
      : '7d',
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

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
    callbackUrl: (process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:4000') + '/api/v1/auth/google/callback',
  },

  security: {
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
    otpHashRounds: Number(process.env.OTP_HASH_ROUNDS) || 8,
    maxFailedAttempts: Number(process.env.ACCOUNT_LOCK_THRESHOLD) || 5,
    lockDurationMs: Number(process.env.ACCOUNT_LOCK_DURATION_MS) || 15 * 60 * 1000,
    refreshCookieMaxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    accessCookieMaxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 15 * 60 * 1000,
    csrfCookieMaxAge: Number(process.env.CSRF_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
    pendingSessionTtlSeconds: Number(process.env.PENDING_SESSION_TTL) || 15 * 60,
    totpIssuer: process.env.TOTP_ISSUER || 'SkillNova',
    fileSignSecret: process.env.FILE_SIGN_SECRET,
  },

  logLevel: process.env.LOG_LEVEL || 'info',
  isProd: process.env.NODE_ENV === 'production',
};

export default config;
