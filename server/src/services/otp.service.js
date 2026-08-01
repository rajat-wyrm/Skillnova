// ════════════════════════════════════════════════════════════
//  OTP Service — Generate, store, verify, and send OTP
// ════════════════════════════════════════════════════════════
import crypto from "node:crypto";
import prisma from "../utils/prisma.js";
import { hashPassword } from "../utils/auth.js";
import { sendEmail } from "./email.service.js";
import { logger } from "../utils/logger.js";
import { verifyPassword } from "../utils/auth.js";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random 6-digit OTP
 */
export function generateOtp(length = OTP_LENGTH) {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, "0");
}

/**
 * Create & send OTP for signup/login
 * @param {string} email - Email address
 * @param {string} purpose - 'signup' | 'login' | 'reset_password'
 * @returns {Promise<{code: string, expiresAt: Date, message: string}>}
 */
export async function createAndSendOtp(email, purpose = "signup") {
  try {
    // Generate OTP
    const code = generateOtp();
    const codeHash = hashPassword(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Clean old OTPs for this email/purpose
    await prisma.otpChallenge.deleteMany({
      where: {
        email,
        purpose,
        expiresAt: { lt: new Date() },
      },
    });

    // Store OTP hash in DB
    const otpRecord = await prisma.otpChallenge.create({
      data: {
        email,
        purpose,
        codeHash,
        expiresAt,
      },
    });

    // Send OTP via email
    await sendOtpEmail(email, code, purpose);

    logger.info(`OTP created for ${email} (${purpose})`, {
      otpId: otpRecord.id,
    });

    return {
      code, // return actual code only for dev; in prod, never log this
      expiresAt,
      message: `OTP sent to ${email}`,
    };
  } catch (err) {
    logger.error("Failed to create/send OTP", {
      email,
      purpose,
      error: err.message,
    });
    throw err;
  }
}

/**
 * Verify OTP code
 * @param {string} email - Email address
 * @param {string} code - OTP code to verify
 * @param {string} purpose - 'signup' | 'login' | 'reset_password'
 * @returns {Promise<boolean>}
 */
export async function verifyOtp(email, code, purpose = "signup") {
  try {
    // Find latest OTP for this email/purpose
    const otpRecord = await prisma.otpChallenge.findFirst({
      where: {
        email,
        purpose,
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      logger.warn(`No valid OTP found for ${email} (${purpose})`);
      return false;
    }

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      await prisma.otpChallenge.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      });
      logger.warn(`Max OTP attempts exceeded for ${email}`);
      return false;
    }

    // Compare OTP codes
    const isValid = await compareOtp(code, otpRecord.codeHash);

    if (!isValid) {
      // Increment attempts
      await prisma.otpChallenge.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      logger.warn(`Invalid OTP attempt for ${email}`, {
        attempt: otpRecord.attempts + 1,
      });
      return false;
    }

    // Mark as consumed
    await prisma.otpChallenge.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    logger.info(`OTP verified successfully for ${email} (${purpose})`);
    return true;
  } catch (err) {
    logger.error("Failed to verify OTP", {
      email,
      purpose,
      error: err.message,
    });
    return false;
  }
}

/**
 * Compare plain OTP with hash
 * (Using crypto for timing-safe comparison)
 */
async function compareOtp(plain, hash) {
  const crypto_module = await import("crypto");
  const plainHash = crypto_module.default
    .createHash("sha256")
    .update(plain)
    .digest("hex");
  return crypto
    .timingSafeEqual(Buffer.from(plainHash), Buffer.from(hash))
    .valueOf();
}

/**
 * Send OTP email
 */
async function sendOtpEmail(email, code, purpose) {
  const purposeLabels = {
    signup: "Sign Up",
    login: "Sign In",
    reset_password: "Reset Password",
  };

  const subject = `Your SkillNova ${purposeLabels[purpose] || "OTP"} Code`;
  const html = `
    <h2>SkillNova ${purposeLabels[purpose]} Code</h2>
    <p>Your one-time password (OTP) is:</p>
    <h1 style="font-size: 2.5em; letter-spacing: 2px; margin: 20px 0;">${code}</h1>
    <p>This code expires in 10 minutes.</p>
    <p style="color: #999; font-size: 0.9em;">
      If you didn't request this, please ignore this email or contact support.
    </p>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your OTP code is: ${code}. This code expires in 10 minutes.`,
  });
}

/**
 * Clean up expired OTPs (run periodically)
 */
export async function cleanupExpiredOtps() {
  try {
    const result = await prisma.otpChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    logger.info(`Cleaned up ${result.count} expired OTP records`);
    return result.count;
  } catch (err) {
    logger.error("Failed to cleanup expired OTPs", { error: err.message });
  }
}
