import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';


 const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
export async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetLink = `${config.appUrl}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: `"SkillNova" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Reset your SkillNova password',
      html: `
        <p>You requested a password reset for your SkillNova account.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });
    logger.info({ toEmail }, 'email:password-reset-sent');
  } catch (err) {
    logger.error({ err }, 'email:password-reset-failed');
    throw err;
  }
}