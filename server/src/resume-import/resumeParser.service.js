// ════════════════════════════════════════════════════════════
//  Resume Import — parser service
//  Isolated feature module: PDF text extraction + AI structuring.
//  Reuses the project's existing Groq client/config — does NOT
//  create a second AI provider integration.
// ════════════════════════════════════════════════════════════
import Groq from 'groq-sdk';
import { PDFParse } from 'pdf-parse';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

let client = null;
function getClient() {
  if (!config.groq.apiKey) throw new Error('GROQ_API_KEY not configured');
  if (!client) client = new Groq({ apiKey: config.groq.apiKey });
  return client;
}

const MAX_RESUME_CHARS = 12000; // keep prompt small/cheap; resumes rarely exceed this

const EXTRACTION_SYSTEM_PROMPT = `You extract structured profile data from raw resume text for the SkillNova intern platform.

Return ONLY a single JSON object — no markdown, no commentary, no code fences — matching exactly this shape:
{
  "skills": ["string", ...],
  "education": [
    { "institution": "string", "degree": "string", "field": "string", "startYear": "string", "endYear": "string" }
  ],
  "experience": [
    { "company": "string", "title": "string", "startDate": "string", "endDate": "string", "description": "string" }
  ]
}

Rules:
- Only include information explicitly present in the resume text. Never invent facts.
- "skills" should be a flat, de-duplicated list of technical/professional skills (no soft-skill essays).
- Dates: preserve the format found in the resume (e.g. "2021", "Jan 2022", "Present"). If unclear, use an empty string.
- If a whole section (education or experience) is absent from the resume, return an empty array for it.
- If nothing usable is found at all, return {"skills": [], "education": [], "experience": []}.
- Output MUST be valid JSON parseable by JSON.parse. No trailing commas, no comments.`;

/**
 * Extract raw text from an uploaded PDF buffer.
 */
export async function extractPdfText(buffer) {
  try {
    const parser = new PDFParse({});
    await parser.load(buffer);
    const text = (parser.getText() || '').trim();
    if (!text) {
      throw ApiError.badRequest('Could not read any text from this PDF. It may be a scanned image without a text layer.');
    }
    return text.slice(0, MAX_RESUME_CHARS);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.warn({ err }, 'resume-import: PDF parsing failed');
    throw ApiError.badRequest('This file could not be read as a PDF. Please upload a valid, non-corrupted PDF resume.');
  }
}

/**
 * Ask the AI model to turn resume text into structured profile fields.
 * Never writes to the database — callers are responsible for presenting
 * this as an editable preview before anything is saved.
 */
export async function extractStructuredProfile(resumeText) {
  let raw;
  try {
    const groq = getClient();
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: resumeText },
      ],
    });
    raw = completion.choices?.[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    logger.error({ err }, 'resume-import: AI extraction request failed');
    throw ApiError.badRequest('The resume parser is temporarily unavailable. Please try again shortly, or fill in your profile manually.');
  }

  const parsed = safeParseJson(raw);
  if (!parsed) {
    throw ApiError.badRequest("We couldn't understand this resume's content. Try a different PDF or fill in your profile manually.");
  }
  return normalizeExtraction(parsed);
}

function safeParseJson(raw) {
  if (!raw) return null;
  // Strip accidental code fences if the model adds them despite instructions.
  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/gim, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeExtraction(parsed) {
  const skills = Array.isArray(parsed.skills)
    ? [...new Set(parsed.skills.map((s) => String(s).trim()).filter(Boolean))].slice(0, 60)
    : [];

  const education = Array.isArray(parsed.education)
    ? parsed.education.slice(0, 20).map((e) => ({
        institution: str(e?.institution),
        degree: str(e?.degree),
        field: str(e?.field),
        startYear: str(e?.startYear),
        endYear: str(e?.endYear),
      })).filter((e) => e.institution || e.degree || e.field)
    : [];

  const experience = Array.isArray(parsed.experience)
    ? parsed.experience.slice(0, 20).map((e) => ({
        company: str(e?.company),
        title: str(e?.title),
        startDate: str(e?.startDate),
        endDate: str(e?.endDate),
        description: str(e?.description).slice(0, 600),
      })).filter((e) => e.company || e.title)
    : [];

  return { skills, education, experience };
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default { extractPdfText, extractStructuredProfile };
