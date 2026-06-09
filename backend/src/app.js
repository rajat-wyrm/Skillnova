// ══════════════════════════════════════════════
//  app.js
//  Production-ready Express App (Full Routing)
// ══════════════════════════════════════════════

import express from "express";
import cors from "cors";

// ROUTES
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import qaRoutes from "./routes/qa.js";
import reportRoutes from "./routes/reports.js";
import announcementRoutes from "./routes/announcements.js";
import articleRoutes from "./routes/articles.js";
// MIDDLEWARE
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// CORE MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ROUTE MOUNTING
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/articles", articleRoutes);
// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "Node backend running" });
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;