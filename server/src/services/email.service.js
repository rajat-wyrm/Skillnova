import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let transporter;

export function isSmtpEnabled() {
  return config.smtp.enabled;
}

function assertSmtpConfiguration() {
  const missing = ['host', 'user', 'pass', 'from'].filter((key) => !config.smtp[key]);
  if (missing.length) {
    logger.error({ missing }, 'email:smtp-configuration-invalid');
    throw new Error('SMTP is not fully configured');
  }
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

function logSendFailure(err) {
  // Keep diagnostics useful without writing credentials, recipients, or reset codes.
  logger.error(
    { errorName: err.name, errorCode: err.code, command: err.command, responseCode: err.responseCode },
    'email:password-reset-send-failed'
  );
}

export async function sendPasswordResetEmail({ to, code }) {
  assertSmtpConfiguration();
  try {
    await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject: 'SkillNova Password Reset Code',
      text: `Hello,\n\nWe received a request to reset your SkillNova password.\n\nYour password reset code is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this password reset, you can safely ignore this email.\n\nRegards,\nSkillNova Team`,
    });
  } catch (err) {
    logSendFailure(err);
    throw new Error('SMTP delivery failed');
  }
}
