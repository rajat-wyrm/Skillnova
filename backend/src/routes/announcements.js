// ══════════════════════════════════════════════
//  routes/announcements.js
//  Production-safe Announcements Module
// ══════════════════════════════════════════════

import express from "express";
import prisma from "../utils/prisma.js";
import authMiddleware from "../middleware/auth.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";

const router = express.Router();

// CREATE ANNOUNCEMENT (ADMIN ONLY)
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, content } = req.body || {};

    if (user.role !== "admin") {
      return sendError(res, "Admin only", 403);
    }

    if (!title || !content) {
      return sendError(res, "Title and content required", 400);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        createdBy: user.id,
      },
    });

    return sendSuccess(res, announcement, "Announcement created");
  })
);

// GET ALL ANNOUNCEMENTS
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, announcements, "Announcements fetched");
  })
);

// DELETE ANNOUNCEMENT (ADMIN ONLY)
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "admin") {
      return sendError(res, "Admin only", 403);
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return sendSuccess(res, null, "Announcement deleted");
  })
);

export default router;