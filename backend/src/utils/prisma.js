// ══════════════════════════════════════════════
//  utils/prisma.js
//  Production-safe Prisma Client (singleton)
// ══════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// prevent multiple instances in dev (nodemon / hot reload)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;