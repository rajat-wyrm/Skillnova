// ════════════════════════════════════════════════════════════
//  Email Service — Send emails via SMTP
// ════════════════════════════════════════════════════════════
import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

let transporter = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  if (config.email.provider === "smtp") {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });
  } else if (config.email.provider === "sendgrid") {
    // Using SendGrid if available
    transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: config.email.sendgrid.apiKey,
      },
    });
  } else if (config.email.provider === "dev") {
    // Development mode: log to console
    logger.warn("Using development email mode - emails will be logged only");
    transporter = null;
  }

  return transporter;
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.from - Sender email (optional, defaults to config)
 * @returns {Promise<Object>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = config.email.from,
  cc = null,
  bcc = null,
}) {
  try {
    // Dev mode: log only
    if (config.email.provider === "dev" || !getTransporter()) {
      logger.info("📧 [DEV] Email would be sent:", {
        to,
        subject,
        from,
        htmlLength: html?.length,
      });
      return { messageId: "dev-" + Date.now() };
    }

    const mailOptions = {
      from,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ""), // Strip HTML if no plain text
      cc,
      bcc,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info("📧 Email sent successfully", {
      to,
      subject,
      messageId: info.messageId,
    });

    return info;
  } catch (err) {
    logger.error("❌ Failed to send email", {
      to,
      subject,
      error: err.message,
    });
    throw err;
  }
}

/**
 * Send bulk emails
 */
export async function sendEmailBulk(recipients, emailOptions) {
  return Promise.allSettled(
    recipients.map((to) => sendEmail({ ...emailOptions, to })),
  );
}

/**
 * Send welcome email for new intern signup
 */
export async function sendWelcomeEmail(email, name) {
  const html = `
    <h2>Welcome to SkillNova, ${name}! 🎉</h2>
    <p>Your account has been created successfully.</p>
    <p>You can now:</p>
    <ul>
      <li>Complete your profile</li>
      <li>View assigned projects and tasks</li>
      <li>Collaborate with mentors and peers</li>
      <li>Track your progress</li>
    </ul>
    <p>
      <a href="${config.appUrl}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Go to Dashboard
      </a>
    </p>
    <p style="color: #999; font-size: 0.9em;">
      Questions? Contact support at ${config.email.from}
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to SkillNova!",
    html,
    text: `Welcome to SkillNova, ${name}! Your account is ready. Visit ${config.appUrl}/dashboard to get started.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetLink) {
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
    </p>
    <p>Or copy this link: ${resetLink}</p>
    <p style="color: #999; font-size: 0.9em;">
      This link expires in 1 hour. If you didn't request this, ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your SkillNova Password",
    html,
    text: `Click here to reset your password: ${resetLink}`,
  });
}

/**
 * Verify transporter is working (health check)
 */
export async function verifyTransporter() {
  try {
    if (!getTransporter()) {
      logger.warn("Email transporter not configured (dev mode)");
      return true;
    }
    await transporter.verify();
    logger.info("✅ Email transporter verified");
    return true;
  } catch (err) {
    logger.error("❌ Email transporter verification failed", {
      error: err.message,
    });
    return false;
  }
}
