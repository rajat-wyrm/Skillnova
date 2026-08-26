// ════════════════════════════════════════════════════════════
//  Resume Import — API client
// ════════════════════════════════════════════════════════════
import api from '../../../lib/api';

export const RESUME_MAX_BYTES = 8 * 1024 * 1024; // must match server/src/resume-import/resumeUpload.middleware.js

/**
 * Uploads a resume PDF and returns an AI-parsed preview:
 * { preview: { skills, education, experience }, meta }
 * This NEVER saves anything to the user's profile — the caller
 * must separately confirm and PATCH /users/:id.
 */
export async function parseResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const { data } = await api.post('/resume-import/parse', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export default { parseResume, RESUME_MAX_BYTES };
