// ════════════════════════════════════════════════════════════
//  SkillNova API — entry point
// ════════════════════════════════════════════════════════════
import http from 'node:http';
import { config } from './config/index.js';
import app from './app.js';
import { connectDB, disconnectDB } from './utils/prisma.js';
import { connectRedis } from './utils/redis.js';
import { createSocketServer } from './sockets/index.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDB();
  await connectRedis();

  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    logger.info(`🚀  SkillNova API listening on http://localhost:${config.port} (${config.env})`);
    logger.info(`📚  Health: http://localhost:${config.port}/healthz`);
    logger.info(`🔐  Auth:   http://localhost:${config.port}/api/v1/auth/login`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully…`);
    httpServer.close(async (err) => {
      if (err) logger.error({ err }, 'shutdown:http-close-failed');
      await disconnectDB().catch(() => {});
      process.exit(err ? 1 : 0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
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
