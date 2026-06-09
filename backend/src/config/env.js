// ══════════════════════════════════════════════
//  config/env.js
//  FINAL PRODUCTION ENV CONFIG (FULL SYSTEM)
// ══════════════════════════════════════════════

import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────
// 🔥 REQUIRED ENV VARIABLES
// ─────────────────────────────────────────────
const requiredEnv = [
  "JWT_SECRET",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
}

// ─────────────────────────────────────────────
// 🔧 HELPERS
// ─────────────────────────────────────────────
const toNumber = (val, def) => {
  const n = Number(val);
  return isNaN(n) ? def : n;
};

const toBool = (val, def = false) => {
  if (val === undefined) return def;
  return val === "true" || val === true;
};

// ─────────────────────────────────────────────
// 🔐 CONFIG OBJECT
// ─────────────────────────────────────────────
const env = {
  // CORE
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toNumber(process.env.PORT, 5000),

  // AUTH
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // DATABASE
  DATABASE_URL: process.env.DATABASE_URL,

  // GOOGLE AUTH
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // OTP (OPTIONAL BUT IMPORTANT)
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || null,

  // AI SERVICE
  FASTAPI_URL:
    process.env.FASTAPI_URL || "http://localhost:8000/api/chat",
  AI_TIMEOUT: toNumber(process.env.AI_TIMEOUT, 25000),

  // FEATURE FLAGS (FUTURE SAFE)
  ENABLE_AI: toBool(process.env.ENABLE_AI, true),
  ENABLE_OTP: toBool(process.env.ENABLE_OTP, true),
};

// ─────────────────────────────────────────────
// 🔍 SAFE LOG (DEV ONLY)
// ─────────────────────────────────────────────
if (env.NODE_ENV !== "production") {
  console.log("[ENV LOADED]", {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    AI: env.ENABLE_AI,
    OTP: env.ENABLE_OTP,
  });
}

export default env;