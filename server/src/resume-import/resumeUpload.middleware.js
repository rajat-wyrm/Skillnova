// ════════════════════════════════════════════════════════════
//  Resume Import — upload middleware
//  Separate multer instance from utils/upload.js on purpose:
//  resumes are parsed in-memory and discarded, never persisted
//  to disk or the FileAsset table, so they don't need the
//  general-purpose file storage pipeline.
// ════════════════════════════════════════════════════════════
import multer from 'multer';

export const RESUME_MAX_BYTES = 8 * 1024 * 1024; // 8 MB is generous for a resume PDF

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are supported for resume import.'));
    }
    cb(null, true);
  },
});

export default resumeUpload;
