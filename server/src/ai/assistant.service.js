// ════════════════════════════════════════════════════════════
//  AI Assistant — Groq-powered chat with retrieval grounding
//  + structured outputs (action chips) + tool-use
// ════════════════════════════════════════════════════════════
import Groq from 'groq-sdk';
import { config } from '../config/index.js';
import { UPTOSKILLS_KB } from './uptoskills.kb.js';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

let client = null;
function getClient() {
  if (!config.groq.apiKey) throw new Error('GROQ_API_KEY not configured');
  if (!client) client = new Groq({ apiKey: config.groq.apiKey });
  return client;
}

const BASE_SYSTEM_PROMPT = `You are SkillNova AI — a friendly, sharp assistant for the UptoSkills intern platform.

You have THREE information sources, in priority order:
1. The UPTOSKILLS KNOWLEDGE BASE (below) — authoritative for company, program, report, attendance, mentorship and code-of-conduct questions.
2. LIVE PLATFORM DATA (below) — recent KB articles, announcements, the user's own reports.
3. General knowledge — only when 1 & 2 don't apply.

CRITICAL BEHAVIOUR RULES:
- Be concise (3-6 sentences). Use markdown only when helpful.
- Always reference the specific knowledge-base section or live-data field you used.
- If the user asks for something outside your scope (legal, medical), politely decline and route to support@uptoskills.com.
- Never invent facts about UptoSkills programs, policies or numbers. If unsure, say "I don't have that information, but I'll route it to your mentor."
- Use the user's name when known.
- Answer in the user's language if they wrote in a non-English language.
- When you suggest an action the user can take in the app, include a "suggested_actions" JSON block at the END of your reply using this exact schema:
  <actions>[{"label":"...","action":"navigate","path":"/path"}]</actions>

=== UPTOSKILLS KNOWLEDGE BASE ===
${kbToPrompt()}
`;

function kbToPrompt() {
  const kb = UPTOSKILLS_KB;
  return `
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

async function buildMessages({ user, history, userMessage }) {
  const live = await fetchLiveData(user);
  const livePrompt = `
=== LIVE PLATFORM DATA ===
Recent Knowledge Base articles:
${live.recentArticles.map((a) => `- "${a.title}" — ${a.excerpt ?? 'No excerpt'}`).join('\n')}

Recent announcements:
${live.recentAnnouncements.map((a) => `- [${a.priority}] ${a.title}: ${a.body.slice(0, 240)}`).join('\n')}

User's recent reports:
${live.myReports.map((r) => `- "${r.title}" — status=${r.status}, score=${r.score ?? 'n/a'}`).join('\n')}
`;
  return [
    { role: 'system', content: BASE_SYSTEM_PROMPT + livePrompt },
    ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];
}

// ── Local KB fallback (when Groq unavailable) ─────────────
function localFallback(question) {
  const kb = UPTOSKILLS_KB;
  const q = (question || '').toLowerCase();
  const reply = (() => {
    if (q.includes('report')) return `Weekly reports are due **every Friday 6:00 PM IST**. ${kb.reports.tips[0]}`;
    if (q.includes('attend')) return kb.attendance.policy;
    if (q.includes('mentor') || q.includes('meeting')) return `${kb.mentorship.cadence}, agenda: ${kb.mentorship.agenda.join(', ')}.`;
    if (q.includes('code of conduct') || q.includes('conduct')) return kb.code_of_conduct.map((c, i) => `${i + 1}. ${c}`).join('\n');
    if (q.includes('contact') || q.includes('email') || q.includes('phone')) return `Reach UptoSkills at ${kb.company.contact.email} or ${kb.company.contact.phone}.`;
    if (q.includes('project') || q.includes('task')) return 'Open the **Project Flow** page to see your roadmap and current sprint. Tasks are managed in the **Tasks** section of your dashboard.';
    if (q.includes('task') || q.includes('todo')) return 'You can view and update your tasks in the **Tasks** page. Mark them as DONE once completed.';
    const faq = kb.faqs.find((f) => q.includes(f.q.toLowerCase().slice(0, 12)));
    if (faq) return faq.a;
    return `I'm currently running in fallback mode (the Groq API key is invalid). However, I can still help from the UptoSkills knowledge base — try asking about reports, attendance, mentorship, tasks, projects or the code of conduct.`;
  })();
  return `${reply}\n\n<actions>[{"label":"Open Dashboard","action":"navigate","path":"/dashboard"},{"label":"View Knowledge Base","action":"navigate","path":"/knowledge"}]</actions>`;
}

function extractActions(text) {
  const m = text?.match(/<actions>(.*?)<\/actions>/s);
  if (!m) return { reply: text || '', actions: [] };
  try {
    const actions = JSON.parse(m[1]);
    return { reply: text.replace(m[0], '').trim(), actions: Array.isArray(actions) ? actions : [] };
  } catch {
    return { reply: text.replace(m[0], '').trim(), actions: [] };
  }
}

// ── Public API ───────────────────────────────────────────
export async function chatCompletion({ user, history, userMessage }) {
  try {
    const groq = getClient();
    const messages = await buildMessages({ user, history, userMessage });
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
      top_p: 0.95,
    });
    const text = completion.choices?.[0]?.message?.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
    const { reply, actions } = extractActions(text);
    return { reply, actions, model: completion.model, tokens: completion.usage?.total_tokens };
  } catch (err) {
    logger.warn({ err: err?.message }, 'ai:groq-failed — using local fallback');
    const text = localFallback(userMessage);
    const { reply, actions } = extractActions(text);
    return { reply, actions, model: 'fallback', tokens: null };
  }
}

export async function* chatCompletionStream({ user, history, userMessage }) {
  try {
    const groq = getClient();
    const messages = await buildMessages({ user, history, userMessage });
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
      await new Promise((r) => setTimeout(r, 8));
    }
  }
}

export async function suggestFollowUps(lastUserMessage) {
  try {
    const groq = getClient();
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Suggest 3 concise follow-up questions (max 8 words each). Return JSON: {"suggestions":["...","...","..."]}',
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
    return ['How do I submit a report?', 'What is the attendance policy?', 'Tell me about mentorship'];
  }
}

export default { chatCompletion, chatCompletionStream, suggestFollowUps, UPTOSKILLS_KB, extractActions };
