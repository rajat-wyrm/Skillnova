import { Groq } from 'groq-sdk';
import prisma from '../utils/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let groq = null;
if (config.groq.apiKey) {
  groq = new Groq({ apiKey: config.groq.apiKey });
}

// Smart Mock Fallback review logic if Groq API key is unconfigured
function getMockReview(code, language, _focus = []) {
  const lines = code.split('\n');
  const comments = [];
  let score = 9;
  let summary = 'Overall, this is solid and clean code. Nice structure and readability.';

  // Scan lines for common issues
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // Check 1: var usage
    if (/\bvar\b/.test(lineText)) {
      comments.push({
        line: lineNum,
        type: 'warning',
        text: 'Avoid using "var". Prefer "const" for constants and "let" for block-scoped variables to prevent hoisting bugs.',
      });
      score = Math.max(5, score - 1);
      summary = 'The code is functional but contains outdated syntax (like using "var") and a few quality improvements can be made.';
    }

    // Check 2: console.log
    if (/\bconsole\.log\b/.test(lineText)) {
      comments.push({
        line: lineNum,
        type: 'info',
        text: 'Clean up production logs: "console.log" is fine for local debugging, but should be removed or replaced by a logger service in production code.',
      });
    }

    // Check 3: dangerous innerHTML in JS
    if (['javascript', 'typescript', 'react'].includes(language.toLowerCase()) && /innerHTML\s*=/.test(lineText)) {
      comments.push({
        line: lineNum,
        type: 'error',
        text: 'Security Risk: Directly assigning to "innerHTML" is vulnerable to Cross-Site Scripting (XSS) attacks. Use "textContent" or safe DOM sanitization libraries.',
      });
      score = Math.max(4, score - 2);
      summary = 'Security alert: Found direct "innerHTML" usage which poses an XSS vulnerability. Please address this issue immediately.';
    }

    // Check 4: empty try-catch blocks
    if (/catch\s*\(\w*\)\s*\{\s*\}/.test(lineText) || (lineText.includes('catch') && lineText.trim().endsWith('{}'))) {
      comments.push({
        line: lineNum,
        type: 'warning',
        text: 'Swallowing errors: This empty catch block silently ignores exceptions. Always log or handle errors so you can debug issues later.',
      });
      score = Math.max(6, score - 1);
    }
  });

  return {
    score,
    summary,
    comments,
  };
}

export const createCodeReview = asyncHandler(async (req, res) => {
  const { title, language, code, focus = [] } = req.body;
  if (!title) throw ApiError.badRequest('Title is required');
  if (!language) throw ApiError.badRequest('Language is required');
  if (!code) throw ApiError.badRequest('Code snippet is required');

  let reviewResult;

  if (groq) {
    try {
      const prompt = `
        You are a highly experienced Lead Software Engineer, Architect, and Mentor.
        Conduct a thorough code review on the following ${language} code snippet.
        
        Focus areas requested by the user: ${focus.join(', ') || 'General review (correctness, safety, security, performance, readability)'}.

        Review the code step-by-step and identify:
        - Security vulnerabilities (XSS, SQL injection, secrets, etc.)
        - Performance bottlenecks or resource leaks
        - Bad practices (hoisting, bad naming, silent catch blocks)
        - Clean code recommendations
        
        Provide a line-by-line list of comments. Each comment MUST point to the exact 1-indexed line number in the code snippet.

        Here is the code to review:
        \`\`\`${language}
        ${code}
        \`\`\`

        You MUST respond ONLY with a valid JSON object matching the following schema. Do not output markdown packaging, preambles, or postambles:
        {
          "score": 8, // A score out of 10
          "summary": "High-level summary of strengths and weaknesses.",
          "comments": [
            {
              "line": 12, // The 1-indexed line number where the issue exists
              "type": "error", // "error" (severe bug/security risk), "warning" (bad practice/warnings), "info" (clean code tips)
              "text": "Detailed, friendly mentoring comment explaining the issue and how to resolve it."
            }
          ]
        }
      `;

      const completion = await groq.chat.completions.create({
        model: config.groq.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      reviewResult = {
        score: Number(parsed.score) || 7,
        summary: parsed.summary || 'AI Review completed successfully.',
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      };
    } catch (err) {
      logger.warn({ err }, 'codeReview:groq-api-failed-falling-back');
      reviewResult = getMockReview(code, language, focus);
    }
  } else {
    reviewResult = getMockReview(code, language, focus);
  }

  // Save the code review in the database
  const review = await prisma.codeReview.create({
    data: {
      userId: req.user.id,
      title,
      language,
      code,
      score: reviewResult.score,
      summary: reviewResult.summary,
      comments: reviewResult.comments,
    },
  });

  res.status(201).json(review);
});

export const getCodeReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.codeReview.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: reviews });
});

export const getCodeReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await prisma.codeReview.findUnique({
    where: { id },
  });

  if (!review) throw ApiError.notFound('Code review not found');
  if (review.userId !== req.user.id) throw ApiError.forbidden('You are not authorized to view this review');

  res.json(review);
});
