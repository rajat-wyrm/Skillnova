import pino from 'pino';
import { config } from '../config/index.js';

const options = {
  level: config.logLevel,
  base: { service: 'skillnova-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
      '*.twoFactorSecret',
      '*.codeHash',
    ],
    censor: '[REDACTED]',
  },
};

if (!config.isProd) {
  options.transport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  };
}

export const logger = pino(options);

export default logger;
