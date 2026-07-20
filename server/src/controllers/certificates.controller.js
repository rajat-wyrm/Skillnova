// ════════════════════════════════════════════════════════════
//  Certificates Controller
// ════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { UPLOAD_DIR_PATH } from '../utils/upload.js';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.service.js';
import { notify } from '../services/notification.service.js';


export const list = asyncHandler(async (req, res) => {
  const where = req.user.role === 'INTERN' ? { userId: req.user.id } : {};
  if (req.query.userId && req.user.role !== 'INTERN') where.userId = req.query.userId;

  const items = await prisma.certificate.findMany({
    where,
    orderBy: { issuedAt: 'desc' },
    include: { fileAsset: true },
  });
  res.json({ items });
});

// Generates a PDF certificate, stores it as a FileAsset, links it to the Certificate row
export const generate = asyncHandler(async (req, res) => {
  const { feedbackId } = req.body;

  const feedback = await prisma.mentorFeedback.findUnique({
    where: { id: feedbackId },
    include: { intern: true },
  });
  if (!feedback) throw ApiError.notFound('Feedback not found');
  if (feedback.completionStatus !== 'COMPLETED') {
    throw ApiError.badRequest('Certificate can only be issued once internship is marked COMPLETED');
  }

  const existing = await prisma.certificate.findUnique({ where: { feedbackId } });
  if (existing) throw ApiError.badRequest('Certificate already issued for this feedback');

  // --- Render PDF ---
  const filename = `certificate-${feedback.internId}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR_PATH, filename);
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(28).text('Certificate of Completion', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`This certifies that`, { align: 'center' });
  doc.fontSize(22).text(feedback.intern.name, { align: 'center' });
  doc.fontSize(14).text(
    `has successfully completed the internship program.`,
    { align: 'center' }
  );
  doc.moveDown();
  doc.fontSize(12).text(`Rating: ${feedback.rating}/5`, { align: 'center' });
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const stats = fs.statSync(filePath);
  const fileAsset = await prisma.fileAsset.create({
    data: {
      filename,
      originalName: filename,
      mimeType: 'application/pdf',
      size: stats.size,
      storage: 'local',
      path: filename,
      uploaderId: req.user.id,
      visibility: 'public',
      checksum: '', // TODO: compute real checksum, mirror files.controller.js
    },
  });

  const certificate = await prisma.certificate.create({
    data: {
      userId: feedback.internId,
      feedbackId: feedback.id,
      role: req.body.role || 'Intern',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      fileAssetId: fileAsset.id,
    },
  });

  await audit(req.user.id, 'certificate:generate', { targetId: certificate.id });
  await notify(feedback.internId, {
    type: 'CERTIFICATE_ISSUED',
    title: 'Your certificate is ready',
    body: 'Your internship completion certificate has been generated.',
    link: `/certificates/${certificate.id}`,
  });

  res.status(201).json({ certificate });
});

export const getById = asyncHandler(async (req, res) => {
  const id = req.validatedParams.id;
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { fileAsset: true },
  });
  if (!certificate) throw ApiError.notFound();

  const isOwn = certificate.userId === req.user.id;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  if (!isOwn && !isAdmin) throw ApiError.forbidden();

  res.json({ certificate });
});