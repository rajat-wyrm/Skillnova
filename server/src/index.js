// ════════════════════════════════════════════════════════════
//  SkillNova API — entry point
// ════════════════════════════════════════════════════════════
import http from 'node:http';
import { config } from './config/index.js';
import app from './app.js';
import { connectDB, disconnectDB } from './utils/prisma.js';
import prisma from './utils/prisma.js';
import { connectRedis, redis } from './utils/redis.js';
import { createSocketServer } from './sockets/index.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDB();

  // Verify database schema is up to date
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅  Database connection verified');
  } catch (err) {
    logger.fatal({ err }, 'Database schema check failed — run prisma migrate');
    process.exit(1);
  }

  await connectRedis();

  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    logger.info(`🚀  SkillNova API listening on http://localhost:${config.port} (${config.env})`);
    logger.info(`📚  Health: http://localhost:${config.port}/healthz`);
    logger.info(`🔐  Auth:   http://localhost:${config.port}/api/v1/auth/login`);

    setInterval(() => {
      const mem = process.memoryUsage();
      logger.debug({ rss: Math.round(mem.rss / 1024 / 1024) + 'MB', heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB' }, 'process:memory');
    }, 60_000).unref();
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully…`);

    // 1. Stop accepting new connections
    httpServer.close(() => {
      logger.info('HTTP server stopped accepting new connections');
    });

    // 2. Wait briefly for in-flight requests to drain, then close resources
    setTimeout(async () => {
      try {
        await redis.disconnect?.();
        await disconnectDB();
        logger.info('Database connection closed');
      } catch (err) {
        logger.error({ err }, 'Error closing database connection');
      }
      process.exit(0);
    }, 5_000);

    // 3. Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Shutdown timed out, forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'bootstrap-failed');
  process.exit(1);
});
