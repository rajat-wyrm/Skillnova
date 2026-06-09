// ══════════════════════════════════════════════
//  routes/qa.js
//  Production-safe QA Module (AI-powered Q&A logs)
// ══════════════════════════════════════════════

import express from "express";
import prisma from "../utils/prisma.js";
import authMiddleware from "../middleware/auth.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";

const router = express.Router();

// CREATE QA ENTRY (log question + answer)
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { question, answer, confidence } = req.body || {};

    if (!question || !answer) {
      return sendError(res, "Question and answer are required", 400);
    }

    const qa = await prisma.qA.create({
      data: {
        question,
        answer,
        confidence: confidence ?? 0,
        userId,
      },
    });

    return sendSuccess(res, qa, "QA entry created");
  })
);

// GET USER QA HISTORY
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const qaList = await prisma.qA.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, qaList, "QA history fetched");
  })
);

// DELETE QA ENTRY
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    const qa = await prisma.qA.findUnique({
      where: { id },
    });

    if (!qa || qa.userId !== userId) {
      return sendError(res, "Not authorized", 403);
    }

    await prisma.qA.delete({
      where: { id },
    });

    return sendSuccess(res, null, "QA deleted");
  })
);

export default router;