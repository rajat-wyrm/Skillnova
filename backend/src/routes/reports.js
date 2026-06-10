// ══════════════════════════════════════════════
//  routes/reports.js
//  Production-safe Reports Module (Upload + Fetch)
// ══════════════════════════════════════════════

import express from "express";
import multer from "multer";
import path from "path";
import prisma from "../utils/prisma.js";
import authMiddleware from "../middleware/auth.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";

const router = express.Router();

// FILE STORAGE CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/reports");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// UPLOAD REPORT
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const file = req.file;
    const { title } = req.body || {};

    if (!file) {
      return sendError(res, "File required", 400);
    }

    const report = await prisma.report.create({
      data: {
        title: title || file.originalname,
        fileUrl: file.path,
        userId,
      },
    });

    return sendSuccess(res, report, "Report uploaded");
  })
);

// GET USER REPORTS
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, reports, "Reports fetched");
  })
);

// DELETE REPORT
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report || report.userId !== userId) {
      return sendError(res, "Not authorized", 403);
    }

    await prisma.report.delete({
      where: { id },
    });

    return sendSuccess(res, null, "Report deleted");
  })
);

export default router;