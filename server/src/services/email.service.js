/* eslint-disable no-console */
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let transporter = null;

// Initialize Nodemailer transporter if configuration exists
if (config.email.smtpHost && config.email.smtpUser && config.email.smtpPass) {
  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPass,
    },
  });
}

/**
 * Dispatches an email to the recipient. Falls back to console output if SMTP config is missing.
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject line
 * @param {string} options.text Text version of the email
 * @param {string} options.html HTML version of the email
 * @returns {Promise<boolean>} Resolves to true on success
 */
export async function sendEmail({ to, subject, text, html }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.security.totpIssuer || 'SkillNova'}" <${config.email.fromEmail}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info({ to, subject }, 'email:sent-smtp-success');
      return true;
    } catch (err) {
      logger.error({ err, to, subject }, 'email:sent-smtp-failed');
      // Do not throw; fall back to terminal logging so flow doesn't break
    }
  }

  // --- Console Logging Fallback for Development ---
  const line = '═'.repeat(60);
  console.log(`\n${line}`);
  console.log(`✉️  [EMAIL FALLBACK LOGGER]`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body:    ${text || 'HTML Content only'}`);
  console.log(`${line}\n`);

  logger.info({ to, subject }, 'email:sent-console-fallback-logged');
  return true;
}

/**
 * Sends a password reset OTP code email.
 * @param {string} email
 * @param {string} code
 */
export async function sendResetPasswordOtp(email, code) {
  const subject = 'Reset Your SkillNova Password';
  const text = `Your password reset verification code is: ${code}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ff6d34;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the verification code below to complete the reset process:</p>
      <div style="background: #f7fafc; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #ff6d34;">${code}</span>
      </div>
      <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0;">This is an automated email from SkillNova. Please do not reply.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, text, html });
}

export default { sendEmail, sendResetPasswordOtp };
