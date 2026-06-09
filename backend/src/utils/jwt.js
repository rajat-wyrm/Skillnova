// ══════════════════════════════════════════════
//  utils/jwt.js
//  FINAL PRODUCTION JWT HANDLER (EMAIL + GOOGLE + OTP)
// ══════════════════════════════════════════════

import jwt from "jsonwebtoken";

// CONFIG
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// OPTIONAL (for stronger security)
const JWT_ISSUER = "skillnova";
const JWT_AUDIENCE = "skillnova-users";

// VALIDATE SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}


// ─────────────────────────────────────────────
// 🔑 GENERATE TOKEN (ENHANCED)
// ─────────────────────────────────────────────
export const generateToken = (payload = {}) => {
  try {
    if (!payload || typeof payload !== "object") return null;

    const tokenPayload = {
      id: payload.id,
      email: payload.email || null,
      phone: payload.phone || null,
      role: payload.role || "intern",
    };

    return jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

  } catch (err) {
    console.error("[JWT GENERATE ERROR]", err?.message);
    return null;
  }
};


// ─────────────────────────────────────────────
// 🔐 VERIFY TOKEN (STRICT + SAFE)
// ─────────────────────────────────────────────
export const verifyToken = (token) => {
  try {
    if (!token || typeof token !== "string") return null;

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // 🔥 VALIDATE CORE FIELDS
    if (!decoded?.id) return null;

    return {
      id: decoded.id,
      email: decoded.email || null,
      phone: decoded.phone || null,
      role: decoded.role || "intern",
    };

  } catch (err) {
    // 🔥 IMPORTANT: distinguish errors
    if (err.name === "TokenExpiredError") {
      throw err; // handled in middleware
    }

    console.warn("[JWT VERIFY FAILED]", err?.message);
    return null;
  }
};


// ─────────────────────────────────────────────
// 🔍 DECODE TOKEN (NO VERIFY)
// ─────────────────────────────────────────────
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== "string") return null;

    const decoded = jwt.decode(token);

    if (!decoded) return null;

    return {
      id: decoded.id,
      email: decoded.email || null,
      phone: decoded.phone || null,
      role: decoded.role || "intern",
    };

  } catch (err) {
    console.warn("[JWT DECODE ERROR]", err?.message);
    return null;
  }
};