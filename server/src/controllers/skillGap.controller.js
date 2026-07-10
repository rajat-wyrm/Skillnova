import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as skillGap from '../services/skillGap.service.js';

export const metadata = asyncHandler(async (_req, res) => {
  res.json(skillGap.getMetadata());
});

export const roles = asyncHandler(async (req, res) => {
  const { domain } = req.query;
  if (!domain) throw ApiError.badRequest('domain query param required');
  res.json({ roles: skillGap.getRoles(domain) });
});

export const analyze = asyncHandler(async (req, res) => {
  const { skills, domain, role } = req.body;
  if (!Array.isArray(skills) || skills.length === 0) throw ApiError.badRequest('skills array required');
  if (!domain || !role) throw ApiError.badRequest('domain and role required');
  const result = skillGap.analyze(skills, domain, role);
  res.json(result);
});
