import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

afterConfig();

function afterConfig() {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(configDir, "../../.env") });
}

const isProd = process.env.NODE_ENV === "production";
const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_SECRET",
  "CSRF_SECRET",
  ...(isProd ? ["FILE_SIGN_SECRET"] : []),
];

const missing = required.filter((key) => !process.env[key]);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const message =
    "[config] Missing DATABASE_URL. Set it in server/.env to a PostgreSQL URL, e.g. postgresql://user:password@host:5432/skillnova";
  if (isProd) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

if (databaseUrl && !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  const message = "[config] DATABASE_URL must start with postgresql:// or postgres://";
  if (isProd) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

if (missing.length) {
  if (isProd) {
    console.error(`[config] Missing required env var(s): ${missing.join(", ")}`);
    console.error("Copy server/.env.example to server/.env and fill in real values.");
    process.exit(1);
  }

  console.warn(
    `[config] Missing env var(s) substituted with random placeholders: ${missing.join(", ")}`,
  );
  for (const key of missing) {
    process.env[key] = `dev-${key.toLowerCase()}-${crypto.randomBytes(12).toString("hex")}`;
  }
}

if (!process.env.GROQ_API_KEY) {
  console.warn('[config] GROQ_API_KEY not configured. AI assistant requests will fall back to the local knowledge base.');
}

if (!isProd) {
  const weakSecrets = required.filter((key) => {
    const value = process.env[key];
    return value && value.length < 32;
  });
  if (weakSecrets.length) {
    console.warn(
      `[config] WARNING: Short secret(s) (< 32 chars): ${weakSecrets.join(", ")}. OK for dev, not for production.`,
    );
  }
}

function parseTtl(value, fallback) {
  if (!value) return fallback;
  return /^\d+$/.test(value) ? Number(value) : value;
}

function isPrivateHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  appUrl: process.env.APP_URL || "http://localhost:5173",
  frontendUrl: process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    secret: process.env.JWT_SECRET,
    accessTtl: parseTtl(process.env.ACCESS_TOKEN_TTL, "15m"),
    refreshTtl: parseTtl(process.env.REFRESH_TOKEN_TTL, "7d"),
    otpTtl: parseTtl(process.env.OTP_TTL, "10m"),
    twoFaTtl: parseTtl(process.env.TWOFA_TTL, "10m"),
  },
  csrf: { secret: process.env.CSRF_SECRET },
  apiKey: process.env.API_KEY,
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    enabled: process.env.GOOGLE_OAUTH_ENABLED === "true",
    callbackUrl:
      (process.env.BACKEND_URL || process.env.APP_URL || "http://localhost:4000") +
      "/api/v1/auth/google/callback",
  },
  security: {
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
    otpHashRounds: Number(process.env.OTP_HASH_ROUNDS) || 8,
    maxFailedAttempts: Number(process.env.ACCOUNT_LOCK_THRESHOLD) || 5,
    lockDurationMs: Number(process.env.ACCOUNT_LOCK_DURATION_MS) || 15 * 60 * 1000,
    refreshCookieMaxAge:
      Number(process.env.REFRESH_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    accessCookieMaxAge: Number(process.env.ACCESS_COOKIE_MAX_AGE) || 15 * 60 * 1000,
    csrfCookieMaxAge: Number(process.env.CSRF_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000,
    pendingSessionTtlSeconds: Number(process.env.PENDING_SESSION_TTL) || 15 * 60,
    totpIssuer: process.env.TOTP_ISSUER || "SkillNova",
    fileSignSecret: process.env.FILE_SIGN_SECRET,
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || "dev",
    from: process.env.EMAIL_FROM || "noreply@skillnova.com",
    smtp: {
      host: process.env.SMTP_HOST || "localhost",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    },
    sendgrid: { apiKey: process.env.SENDGRID_API_KEY || "" },
  },
  logLevel: process.env.LOG_LEVEL || "info",
  isProd,
};

export function isCorsOriginAllowed(origin) {
  if (!origin) return true;
  if (config.corsOrigin.includes(origin)) return true;
  if (config.isProd) return false;
  try {
    const { protocol, hostname } = new URL(origin);
    return ["http:", "https:"].includes(protocol) && isPrivateHost(hostname);
  } catch {
    return false;
  }
}

export default config;
