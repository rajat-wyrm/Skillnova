// ══════════════════════════════════════════════
//  routes/articles.js
//  Production-safe Articles / Knowledge Base Module
// ══════════════════════════════════════════════

import express from "express";
import prisma from "../utils/prisma.js";
import authMiddleware from "../middleware/auth.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";

const router = express.Router();

// CREATE ARTICLE (ADMIN ONLY)
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

    const article = await prisma.article.create({
      data: {
        title,
        content,
        createdBy: user.id,
      },
    });

    return sendSuccess(res, article, "Article created");
  })
);

// GET ALL ARTICLES
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, articles, "Articles fetched");
  })
);

// GET SINGLE ARTICLE
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return sendError(res, "Article not found", 404);
    }

    return sendSuccess(res, article, "Article fetched");
  })
);

// DELETE ARTICLE (ADMIN ONLY)
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "admin") {
      return sendError(res, "Admin only", 403);
    }

    await prisma.article.delete({
      where: { id },
    });

    return sendSuccess(res, null, "Article deleted");
  })
);

export default router;