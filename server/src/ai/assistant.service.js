// ════════════════════════════════════════════════════════════
//  AI Assistant — Groq-powered chat with retrieval grounding
//  on the UptoSkills KB + live data (reports, articles, etc.).
// ════════════════════════════════════════════════════════════
import Groq from 'groq-sdk';
import { config } from '../config/index.js';
import { UPTOSKILLS_KB } from './uptoskills.kb.js';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

let client = null;
function getClient() {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  if (!client) client = new Groq({ apiKey: config.groq.apiKey });
  return client;
}

const SYSTEM_PROMPT = `You are SkillNova AI, a friendly and highly accurate assistant for the UptoSkills intern platform.

You have THREE sources of information, in this priority order:
1. The **UPTOSKILLS KNOWLEDGE BASE** below — treat this as canonical for company, program, report, attendance, mentorship and code-of-conduct questions.
2. The **LIVE PLATFORM DATA** below — recent KB articles, announcements and the user's own reports.
3. Your general knowledge — only when 1 & 2 don't cover the topic.

Behaviour rules:
- Be concise (3-6 sentences). Use markdown only when helpful.
- Always reference the specific knowledge-base section or live data field you used.
- If the user asks for something outside your scope (e.g. legal or medical advice), politely decline and route them to support@uptoskills.com.
- Never invent facts about UptoSkills programs, policies or numbers. If unsure, say "I don't have that information, but I'll route it to your mentor."
- Use the user's name when you know it.
- Answer in the user's language if they wrote in a non-English language.

${kbToPrompt()}
${liveDataToPrompt()}
`;

// ── KB serialisation ─────────────────────────────────────
function kbToPrompt() {
  const kb = UPTOSKILLS_KB;
  return `
=== UPTOSKILLS KNOWLEDGE BASE ===
Company: ${kb.company.name} (founded ${kb.company.founded})
Mission: ${kb.company.mission}
Programs: ${kb.company.programs.join(', ')}
Contact: ${JSON.stringify(kb.company.contact)}

Platform: ${kb.platform.name} — ${kb.platform.tagline}
Modules: ${kb.platform.modules.join(', ')}

Onboarding:
${kb.onboarding.map((o) => `- ${o.title}: ${o.body}`).join('\n')}

Reports:
- Cadence: ${kb.reports.cadence}, deadline ${kb.reports.deadline}
- Sections: ${kb.reports.sections.join('; ')}
- Tips: ${kb.reports.tips.join(' | ')}

Attendance policy: ${kb.attendance.policy}
Grace minutes: ${kb.attendance.graceMinutes}

Mentorship: ${kb.mentorship.cadence}, agenda: ${kb.mentorship.agenda.join(' / ')}

Code of conduct:
${kb.code_of_conduct.map((c, i) => `${i + 1}. ${c}`).join('\n')}

FAQs:
${kb.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}

Glossary:
${Object.entries(kb.glossary).map(([k, v]) => `${k}: ${v}`).join('\n')}
`;
}

// ── Lightweight live-data injection (per-user) ─────────────
async function fetchLiveData(user) {
  const [recentArticles, recentAnnouncements, myReports] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { title: true, excerpt: true, publishedAt: true },
    }),
    prisma.announcement.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { title: true, body: true, priority: true, publishedAt: true },
    }),
    user
      ? prisma.report.findMany({
          where: { userId: user.id },
          orderBy: { submittedAt: 'desc' },
          take: 5,
          select: { title: true, status: true, score: true, submittedAt: true },
        })
      : Promise.resolve([]),
  ]);

  return { recentArticles, recentAnnouncements, myReports };
}

async function liveDataToPrompt(user) {
  try {
    const data = await fetchLiveData(user);
    return `
=== LIVE PLATFORM DATA ===
Recent Knowledge Base articles:
${data.recentArticles.map((a) => `- "${a.title}" — ${a.excerpt ?? 'No excerpt'}`).join('\n')}

Recent announcements:
${data.recentAnnouncements.map((a) => `- [${a.priority}] ${a.title}: ${a.body.slice(0, 240)}`).join('\n')}

User's recent reports:
${data.myReports.map((r) => `- "${r.title}" — status=${r.status}, score=${r.score ?? 'n/a'}`).join('\n')}
`;
  } catch (err) {
    logger.warn({ err }, 'ai:live-data-failed');
    return '';
  }
}

async function buildMessages({ user, history, userMessage }) {
  const system = SYSTEM_PROMPT.replace(kbToPrompt(), kbToPrompt());
  const live = await liveDataToPrompt(user);
  const finalSystem = system + live;

  const messages = [
    { role: 'system', content: finalSystem },
    ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];
  return messages;
}

// ── Public API ───────────────────────────────────────────
export async function chatCompletion({ user, history, userMessage }) {
  const groq = getClient();
  const messages = await buildMessages({ user, history, userMessage });

  try {
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
      top_p: 0.95,
      stream: false,
    });

    const choice = completion.choices?.[0];
    return {
      reply: choice?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.",
      usage: completion.usage ?? null,
      model: completion.model,
    };
  } catch (err) {
    logger.warn({ err: err?.message }, 'ai:groq-failed — using local fallback');
    return { reply: localFallback(userMessage), usage: null, model: 'fallback' };
  }
}

function localFallback(question) {
  const kb = UPTOSKILLS_KB;
  const q = question.toLowerCase();
  if (q.includes('report')) {
    return `Weekly reports are due **every Friday 6:00 PM IST**. ${kb.reports.tips[0]}`;
  }
  if (q.includes('attend')) {
    return kb.attendance.policy;
  }
  if (q.includes('mentor') || q.includes('meeting')) {
    return `${kb.mentorship.cadence}, agenda: ${kb.mentorship.agenda.join(', ')}.`;
  }
  if (q.includes('code of conduct') || q.includes('conduct')) {
    return kb.code_of_conduct.map((c, i) => `${i + 1}. ${c}`).join('\n');
  }
  if (q.includes('contact') || q.includes('email') || q.includes('phone')) {
    return `Reach UptoSkills at ${kb.company.contact.email} or ${kb.company.contact.phone}.`;
  }
  const faq = kb.faqs.find((f) => q.includes(f.q.toLowerCase().slice(0, 12)));
  if (faq) return faq.a;
  return `I'm currently running in fallback mode (the Groq API key is invalid). However, I can still help from the UptoSkills knowledge base — try asking about reports, attendance, mentorship or the code of conduct.`;
}

// Streaming generator for SSE
export async function* chatCompletionStream({ user, history, userMessage }) {
  const groq = getClient();
  const messages = await buildMessages({ user, history, userMessage });

  try {
    const stream = await groq.chat.completions.create({
      model: config.groq.model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
      top_p: 0.95,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  } catch (err) {
    logger.warn({ err: err?.message }, 'ai:groq-stream-failed — yielding fallback');
    const text = localFallback(userMessage);
    for (const word of text.split(/(\s+)/)) {
      yield word;
      await new Promise((r) => setTimeout(r, 12));
    }
  }
}

// Suggest follow-up prompts based on the last user message
export async function suggestFollowUps(lastUserMessage) {
  try {
    const groq = getClient();
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content:
            'You suggest 3 concise follow-up questions (max 8 words each) based on the user\'s last message. Return JSON: {"suggestions": ["...", "...", "..."]}',
        },
        { role: 'user', content: lastUserMessage },
      ],
      temperature: 0.6,
      max_tokens: 120,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed.suggestions ?? [];
  } catch {
    return [
      'How do I submit a report?',
      'What is the attendance policy?',
      'Tell me about mentorship',
    ];
  }
}

export default {
  chatCompletion,
  chatCompletionStream,
  suggestFollowUps,
  UPTOSKILLS_KB,
};
