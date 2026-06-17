"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

function getSecret(name) {
  const value = config.jwt[name];
  if (!value) {
    throw new Error(`JWT secret for ${name} is not configured`);
  }
  return value;
}

function generateAccessToken(payload) {
  return jwt.sign(payload, getSecret("accessSecret"), {
    expiresIn: config.jwt.accessExpiry,
    issuer: "skillnova",
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, getSecret("refreshSecret"), {
    expiresIn: config.jwt.refreshExpiry,
    issuer: "skillnova",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getSecret("accessSecret"), { issuer: "skillnova" });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret("refreshSecret"), { issuer: "skillnova" });
}

/**
 * Hash a refresh token for storage. We use SHA-256 (not bcrypt) because
 * the token is already a 128-bit cryptographically random secret — we
 * just need a fixed-length, fast comparison key.
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};