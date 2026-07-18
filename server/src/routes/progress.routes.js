import express from "express";
import { getMyProgress } from "../controllers/progress.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET logged-in user's progress
router.get("/", authenticate, getMyProgress);

export default router;