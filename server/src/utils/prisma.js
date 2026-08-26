// ════════════════════════════════════════════════════════════
//  Prisma Client Singleton (prevents connection storms in dev)
// ════════════════════════════════════════════════════════════
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__skillnovaPrisma ??
  new PrismaClient({
    log: config.isProd
      ? ['error', 'warn']
      : [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  });

if (!config.isProd) {
  globalForPrisma.__skillnovaPrisma = prisma;
  prisma.$on('query', (e) => {
    logger.debug({ ms: e.duration, query: e.query }, 'prisma:query');
  });
  prisma.$on('warn', (e) => logger.warn(e, 'prisma:warn'));
  prisma.$on('error', (e) => logger.error(e, 'prisma:error'));
}

function assertDatabaseUrl() {
  if (!config.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not configured. Create server/.env and set DATABASE_URL to a PostgreSQL connection string.',
    );
  }
  if (!/^postgres(?:ql)?:\/\//.test(config.databaseUrl)) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
  }
}

export async function connectDB() {
  try {
    assertDatabaseUrl();
    await prisma.$connect();
    logger.info('✅  Database connected');
  } catch (err) {
    logger.fatal({ err }, '❌  Database connection failed');
    throw err;
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
}

export default prisma;
