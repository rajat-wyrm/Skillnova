// ══════════════════════════════════════════════
//  routes/ai.js
//  Production-safe AI Bridge (Node → FastAPI)
// ══════════════════════════════════════════════

import express from "express";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/api/chat";
const TIMEOUT = Number(process.env.AI_TIMEOUT) || 25000;

// 🔥 NEW: BASIC RATE LIMIT (PER REQUEST MEMORY)
const requestMap = new Map();

// Safe timeout wrapper
const fetchWithTimeout = async (url, options) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
};


// 🔥 APPLY AUTH MIDDLEWARE
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, session_id, role } = req.body || {};
    const userId = req.user?.id;

    // 🔥 NEW: RATE LIMIT (5 req / 10 sec)
    const now = Date.now();
    const userRequests = requestMap.get(userId) || [];

    const filtered = userRequests.filter((t) => now - t < 10000);

    if (filtered.length >= 5) {
      return res.status(429).json({
        reply: "Too many requests. Slow down.",
        error: true,
      });
    }

    filtered.push(now);
    requestMap.set(userId, filtered);

    // VALIDATION (UNCHANGED)
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Invalid message",
        error: true,
      });
    }

    // 🔥 NEW: CLEAN INPUT
    const cleanMessage = message.trim().slice(0, 1000);

    const response = await fetchWithTimeout(FASTAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: cleanMessage,
        session_id: session_id || null,
        role: role || req.user?.role || "Intern",
        user_id: userId, // 🔥 NEW (TRACEABILITY)
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));

    return res.json({
      reply:
        typeof data?.reply === "string"
          ? data.reply
          : "No response generated.",
      session_id: data?.session_id || null,
      confidence:
        typeof data?.confidence === "number" ? data.confidence : 0,
      sources: Array.isArray(data?.sources) ? data.sources : [],
      error: data?.error ?? false,
    });

  } catch (err) {
    const isTimeout = err.name === "AbortError";

    console.error("[AI ERROR]", isTimeout ? "Timeout" : err?.message);

    return res.status(500).json({
      reply: isTimeout
        ? "AI service timeout. Try again."
        : "AI service unavailable.",
      error: true,
    });
  }
});

export default router;