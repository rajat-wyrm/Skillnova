// ════════════════════════════════════════════════════════════
//  Resume Parser Controller
//  POST /api/v1/resume/parse
//  Accepts a PDF, extracts text, runs Groq structured extraction,
//  returns { skills, education, experience, college, yearOfStudy,
//             department, linkedinUrl } — never writes to the DB.
// ════════════════════════════════════════════════════════════
import fs from 'node:fs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import Groq from 'groq-sdk';

// ── Lazy Groq client (reuses any already-initialised key) ────
let _groq = null;
function getGroq() {
  if (!config.groq.apiKey) throw new Error('GROQ_API_KEY not configured');
  if (!_groq) _groq = new Groq({ apiKey: config.groq.apiKey });
  return _groq;
}

// ── pdf-parse lazy import (CJS interop) ─────────────────────
async function parsePdf(buffer) {
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return data.text || '';
}

// ── Groq structured extraction ───────────────────────────────
const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from the provided resume text.
Return ONLY valid JSON (no markdown, no explanation) with exactly these keys:
{
  "skills": "comma-separated list of technical and soft skills",
  "college": "name of most recent university/college",
  "department": "field of study or academic department",
  "yearOfStudy": "current year of study or graduation year (e.g. '3rd Year' or '2025')",
  "linkedinUrl": "LinkedIn profile URL if present, otherwise empty string",
  "education": "one-line summary of highest qualification",
  "experience": "one-line summary of most relevant work or internship experience"
}
If a field cannot be determined, use an empty string. Never add extra keys.`;

async function extractWithGroq(text) {
  const groq = getGroq();
  const truncated = text.slice(0, 12000); // stay well within token limits
  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `RESUME TEXT:\n\n${truncated}` },
    ],
    temperature: 0.1,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(raw);
}

// ── Controller ───────────────────────────────────────────────
export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No PDF file uploaded');

  const filePath = req.file.path;

  try {
    // 1. Read file buffer
    const buffer = fs.readFileSync(filePath);

    // 2. Extract text from PDF
    let text = '';
    try {
      text = await parsePdf(buffer);
    } catch (pdfErr) {
      logger.warn({ err: pdfErr?.message }, 'resume:pdf-parse-failed');
      throw ApiError.badRequest('Could not read PDF — make sure it contains selectable text (not a scanned image).');
    }

    if (!text || text.trim().length < 50) {
      throw ApiError.badRequest('PDF appears to be empty or image-only. Please upload a text-based PDF.');
    }

    // 3. AI extraction
    let parsed = {};
    try {
      parsed = await extractWithGroq(text);
    } catch (aiErr) {
      logger.warn({ err: aiErr?.message }, 'resume:groq-failed — returning empty extraction');
      // Graceful degradation: return empty fields, let the user fill manually
      parsed = { skills: '', college: '', department: '', yearOfStudy: '', linkedinUrl: '', education: '', experience: '' };
    }

    // Sanitise: only keep known keys, coerce to strings
    const safe = {
      skills:      String(parsed.skills      ?? '').trim(),
      college:     String(parsed.college     ?? '').trim(),
      department:  String(parsed.department  ?? '').trim(),
      yearOfStudy: String(parsed.yearOfStudy ?? '').trim(),
      linkedinUrl: String(parsed.linkedinUrl ?? '').trim(),
      education:   String(parsed.education   ?? '').trim(),
      experience:  String(parsed.experience  ?? '').trim(),
    };

    res.json({ ok: true, parsed: safe });
  } finally {
    // Always clean up the temp file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
});

export default { parseResume };
