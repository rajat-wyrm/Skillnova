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

const JSON_FIELDS = new Set(['tags', 'embedding', 'meta', 'value', 'events', 'payload', 'typePrefs']);

function serialize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(serialize);
  }
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (JSON_FIELDS.has(key) && val !== null && val !== undefined) {
      if (typeof val === 'string') {
        result[key] = val;
      } else {
        result[key] = JSON.stringify(val);
      }
    } else {
      result[key] = serialize(val);
    }
  }
  return result;
}

function deserialize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deserialize);
  }
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (JSON_FIELDS.has(key) && typeof val === 'string') {
      try {
        result[key] = JSON.parse(val);
      } catch {
        result[key] = val;
      }
    } else {
      result[key] = deserialize(val);
    }
  }
  return result;
}

prisma.$use(async (params, next) => {
  if (params.args) {
    if (params.args.data) {
      params.args.data = serialize(params.args.data);
    }
    if (params.args.create) {
      params.args.create = serialize(params.args.create);
    }
    if (params.args.update) {
      params.args.update = serialize(params.args.update);
    }
  }
  const result = await next(params);
  return deserialize(result);
});

export async function connectDB() {
  try {
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
