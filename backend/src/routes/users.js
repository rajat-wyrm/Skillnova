// ══════════════════════════════════════════════
//  routes/users.js
//  Production User Routes (Google + OTP + JWT Safe)
// ══════════════════════════════════════════════

import express from "express";
import prisma from "../utils/prisma.js";
import authMiddleware from "../middleware/auth.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";

const router = express.Router();


// ─────────────────────────────────────────────
// 🧠 GET CURRENT USER (ENHANCED)
// ─────────────────────────────────────────────
router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const email = req.user?.email;
    const phone = req.user?.phone;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    let user = null;

    // 🔍 PRIMARY: FIND BY ID
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } catch (e) {
      console.warn("[USER FETCH ERROR]", e.message);
    }

    // 🔥 FALLBACK: EMAIL (Google login safety)
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    // 🔥 FALLBACK: PHONE (OTP login safety)
    if (!user && phone) {
      user = await prisma.user.findUnique({
        where: { phone },
      });
    }

    // ❌ STILL NOT FOUND
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // 🔥 SAFE RESPONSE (NO PASSWORD / OTP)
    const safeUser = {
      id: user.id,
      name: user.name || "User",
      email: user.email || null,
      phone: user.phone || null,
      role: user.role || "intern",
      createdAt: user.createdAt,
    };

    return sendSuccess(res, safeUser, "User fetched successfully");
  })
);

export default router;