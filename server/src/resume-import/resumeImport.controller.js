// ════════════════════════════════════════════════════════════
//  Resume Import — controller
//  POST /resume-import/parse  → returns an editable preview
//  Never saves to the user's profile itself; the client must
//  submit a confirmed merge via the existing PATCH /users/:id.
// ════════════════════════════════════════════════════════════
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { audit } from '../services/audit.service.js';
import { extractPdfText, extractStructuredProfile } from './resumeParser.service.js';

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No resume file uploaded.');
  if (req.file.mimetype !== 'application/pdf') {
    throw ApiError.badRequest('Only PDF resumes are supported.');
  }

  const text = await extractPdfText(req.file.buffer);
  const extracted = await extractStructuredProfile(text);

  await audit({
    userId: req.user.id,
    action: 'profile.resume_import.parse',
    resource: 'user',
    resourceId: req.user.id,
    req,
  }).catch(() => null); // audit failures should never block the preview response

  res.json({
    preview: extracted,
    meta: {
      fileName: req.file.originalname,
      sizeBytes: req.file.size,
      parsedAt: new Date().toISOString(),
    },
  });
});

export default { parseResume };
