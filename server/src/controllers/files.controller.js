// ════════════════════════════════════════════════════════════
//  Files Controller — uploads, downloads, presigned URLs
// ════════════════════════════════════════════════════════════
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { UPLOAD_DIR_PATH, UPLOAD_MAX_BYTES } from '../utils/upload.js';
import { config } from '../config/index.js';

const SIGN_SECRET = config.security.fileSignSecret;
if (!SIGN_SECRET && config.isProd) {
  throw new Error('FILE_SIGN_SECRET is required in production');
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SIGN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token, maxAge = 60 * 60 * 1000) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SIGN_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (Date.now() - payload.iat > maxAge) return null;
    return payload;
  } catch { return null; }
}

// POST /files — multipart upload
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  if (req.file.size > UPLOAD_MAX_BYTES) throw ApiError.badRequest('File too large');

  const buf = fs.readFileSync(req.file.path);
  const checksum = crypto.createHash('sha256').update(buf).digest('hex');

  const asset = await prisma.fileAsset.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storage: 'local',
      path: req.file.filename,
      uploaderId: req.user.id,
      visibility: req.body.visibility || 'private',
      checksum,
    },
  });

  await audit({ userId: req.user.id, action: 'file.upload', resource: 'file', resourceId: asset.id, req });
  res.status(201).json({ file: asset });
});

// GET /files/:id — metadata
export const getFile = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const f = await prisma.fileAsset.findUnique({ where: { id } });
  if (!f) throw ApiError.notFound();
  if (f.visibility === 'private' && f.uploaderId !== req.user.id && !['SUPER_ADMIN','ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  res.json({ file: f });
});

// GET /files/:id/download — stream the file (with optional ?token=...)
export const downloadFile = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const f = await prisma.fileAsset.findUnique({ where: { id } });
  if (!f) throw ApiError.notFound();

  // Accept either an authenticated request or a signed token
  const tokenOk = req.query.token ? verify(req.query.token) : null;
  const isOwner = req.user?.id === f.uploaderId;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role);
  if (!tokenOk && !isOwner && !isAdmin && f.visibility !== 'public') {
    throw ApiError.forbidden();
  }

  const fullPath = path.join(UPLOAD_DIR_PATH, f.path);
  if (!fs.existsSync(fullPath)) throw ApiError.notFound('File missing on disk');

  const contentType = f.mimeType || 'application/octet-stream';
  const disposition = contentType.startsWith('text/') || contentType === 'application/json'
    ? `inline; filename="${encodeURIComponent(f.originalName)}"`
    : `attachment; filename="${encodeURIComponent(f.originalName)}"`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', disposition);
  res.setHeader('Content-Length', f.size);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(fullPath).pipe(res);
});

// GET /files/:id/url?ttl=600 — get a short-lived signed URL
export const signFile = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const ttl = Math.min(Number(req.query.ttl) || 600, 24 * 60 * 60);
  const f = await prisma.fileAsset.findUnique({ where: { id } });
  if (!f) throw ApiError.notFound();
  if (f.uploaderId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  const token = sign({ fid: f.id, uid: req.user.id, iat: Date.now() });
  res.json({
    url: `/api/v1/files/${f.id}/download?token=${token}`,
    expiresIn: ttl,
  });
});

// GET /files — list uploader's files (admin: all)
export const listFiles = asyncHandler(async (req, res) => {
  const where = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role) ? {} : { uploaderId: req.user.id };
  const { page = 1, limit = 20 } = req.validatedQuery ?? {};
  const [items, total] = await Promise.all([
    prisma.fileAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.fileAsset.count({ where }),
  ]);
  res.json({ items, total, page, limit });
});

// DELETE /files/:id
export const deleteFile = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const f = await prisma.fileAsset.findUnique({ where: { id } });
  if (!f) throw ApiError.notFound();
  if (f.uploaderId !== req.user.id && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  const fullPath = path.join(UPLOAD_DIR_PATH, f.path);
  fs.promises.unlink(fullPath).catch(() => null);
  await prisma.fileAsset.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'file.delete', resource: 'file', resourceId: id, req });
  res.json({ ok: true });
});

export default { uploadFile, getFile, downloadFile, signFile, listFiles, deleteFile, sign, verify };
