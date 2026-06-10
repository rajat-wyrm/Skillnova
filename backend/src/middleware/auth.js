// ══════════════════════════════════════════════
//  middleware/auth.js
//  FINAL PRODUCTION AUTH MIDDLEWARE
// ══════════════════════════════════════════════

import { verifyToken } from "../utils/jwt.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    // -----------------------------------------
    // VALIDATE HEADER
    // -----------------------------------------
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token format",
      });
    }

    const token = authHeader.slice(7)?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    // -----------------------------------------
    // 🔥 DEMO TOKENS (SAFE)
    // -----------------------------------------
    if (token === "demo-admin-token") {
      req.user = {
        id: "demo-admin",
        email: "admin@skillnova.com",
        role: "admin",
      };
      return next();
    }

    if (token === "demo-user-token") {
      req.user = {
        id: "demo-user",
        email: "user@skillnova.com",
        role: "intern",
      };
      return next();
    }

    // -----------------------------------------
    // 🔐 VERIFY TOKEN
    // -----------------------------------------
    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      // 🔥 EXPIRED TOKEN (STRICT)
      if (err?.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired",
        });
      }

      console.warn("[JWT VERIFY ERROR]", err?.message);
      decoded = null;
    }

    // -----------------------------------------
    // VALIDATE PAYLOAD
    // -----------------------------------------
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token verification failed",
      });
    }

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload",
      });
    }

    // -----------------------------------------
    // NORMALIZE USER
    // -----------------------------------------
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      phone: decoded.phone || null,
      role: decoded.role || "intern",
    };

    // DEV DEBUG (SAFE)
    if (process.env.NODE_ENV !== "production") {
      console.log("[AUTH USER]", req.user);
    }

    return next();

  } catch (err) {
    console.error("[AUTH ERROR]", err?.message);

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};


// ══════════════════════════════════════════════
// 🔥 ROLE BASED ACCESS CONTROL
// ══════════════════════════════════════════════
export const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }

      return next();

    } catch (err) {
      console.error("[ROLE ERROR]", err?.message);

      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};

export default authMiddleware;