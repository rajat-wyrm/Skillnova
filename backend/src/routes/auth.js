// ══════════════════════════════════════════════
//  routes/auth.js
//  FINAL PRODUCTION AUTH (EMAIL + GOOGLE + OTP)
// ══════════════════════════════════════════════

import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/http.js";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

// 🔥 GOOGLE CLIENT (SECURE)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ---------------------------------------------
// REGISTER
// ---------------------------------------------
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return sendError(res, "All fields are required", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return sendError(res, "User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "intern",
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(res, { token, user });
  })
);


// ---------------------------------------------
// LOGIN
// ---------------------------------------------
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return sendError(res, "Email and password required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendError(res, "User not found. Please register.", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(res, { token, user });
  })
);


// ---------------------------------------------
// 🔥 GOOGLE LOGIN (FIXED PRODUCTION)
// ---------------------------------------------
router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      return sendError(res, "Google credential missing", 400);
    }

    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      return sendError(res, "Invalid Google token", 401);
    }

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name || "Google User";

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: "google-auth",
          role: "intern",
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(res, { token, user });
  })
);


// ---------------------------------------------
// 🔥 SEND OTP
// ---------------------------------------------
router.post(
  "/send-otp",
  asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      return sendError(res, "Valid phone required", 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: { phone, role: "intern" },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    try {
      await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          route: "otp",
          variables_values: otp,
          numbers: phone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
          },
        }
      );
    } catch (e) {
      console.warn("SMS failed");
    }

    return sendSuccess(res, {}, "OTP sent");
  })
);


// ---------------------------------------------
// 🔥 VERIFY OTP
// ---------------------------------------------
router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) return sendError(res, "User not found", 404);

    if (user.otpCode !== otp) {
      return sendError(res, "Invalid OTP", 400);
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return sendError(res, "OTP expired", 400);
    }

    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    return sendSuccess(res, { token, user });
  })
);

export default router;