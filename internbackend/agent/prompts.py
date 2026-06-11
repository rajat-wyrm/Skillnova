from langchain_core.prompts import PromptTemplate


# ─────────────────────────────────────────────
# 1. ROUTER
# ─────────────────────────────────────────────
ROUTER_PROMPT = PromptTemplate(
    template="""Classify the query into ONE category:

- direct → greetings, casual talk
- knowledge_base → internship, policies, tasks, reports, meetings, platform
- general → general knowledge, facts, definitions
- web_search → current events, live data, recent info

Return ONLY one word.

Query: {question}
Category:""",
    input_variables=["question"]
)


# ─────────────────────────────────────────────
# 2. BATCH GRADER
# ─────────────────────────────────────────────
BATCH_GRADER_PROMPT = PromptTemplate(
    template="""Select relevant documents for the question.

Question: {question}

Documents:
{documents_text}

Return document numbers (comma-separated).
If none relevant → NONE

Answer:""",
    input_variables=["question", "documents_text"]
)


# ─────────────────────────────────────────────
# 3. QUERY REWRITER
# ─────────────────────────────────────────────
REWRITER_PROMPT = PromptTemplate(
    template="""Rewrite the query to improve document search.

Focus on:
- internship policies
- tasks
- attendance
- reports
- evaluation

Make it concise and keyword-rich.

Original: {question}
Rewritten:""",
    input_variables=["question"]
)


# ─────────────────────────────────────────────
# 4. GENERATOR (UPGRADED — GPT STYLE)
# ─────────────────────────────────────────────
GENERATOR_PROMPT = PromptTemplate(
    template="""You are SkillNova AI assistant.

STRICT RULES:
- Use ONLY the provided context
- If answer is NOT present → respond EXACTLY: ESCALATE_TO_ADMIN
- Do NOT guess or add external knowledge

OUTPUT FORMAT (MANDATORY):
- Start with 1 short summary line
- Then give a detailed structured explanation
- Use bullet points and short paragraphs
- Use headings if needed
- Explain steps clearly and completely
- Ensure answer is helpful and slightly detailed like ChatGPT

STYLE:
- Professional
- Clear and readable
- No unnecessary repetition
- Balanced detail (not too short, not too long)

Language: {language}

Context:
{context}

Question:
{question}

Answer:
""",
    input_variables=["language", "context", "question"]
)


# ─────────────────────────────────────────────
# 5. DIRECT RESPONSE
# ─────────────────────────────────────────────
DIRECT_PROMPT = PromptTemplate(
    template="""You are a friendly assistant.

Rules:
- Reply naturally
- Keep it short (1–2 lines)
- No explanations unless asked
- Sound human

Language: {language}

User: {question}
Response:""",
    input_variables=["language", "question"]
)


# ─────────────────────────────────────────────
# 6. GENERAL RESPONSE
# ─────────────────────────────────────────────
GENERAL_PROMPT = PromptTemplate(
    template="""Answer clearly and simply.

Rules:
- Use structured explanation
- Use bullets if needed
- Avoid long unstructured paragraphs
- Be easy to understand

Language: {language}

Question: {question}
Answer:""",
    input_variables=["language", "question"]
)


# ─────────────────────────────────────────────
# 7. HALLUCINATION CHECK
# ─────────────────────────────────────────────
HALLUCINATION_CHECK_PROMPT = PromptTemplate(
    template="""Check if answer is fully supported by context.

Context:
{context}

Answer:
{answer}

Respond ONLY:
yes → grounded
no → hallucination

Result:""",
    input_variables=["context", "answer"]
)


# ─────────────────────────────────────────────
# 8. SAFETY CLASSIFIER
# ─────────────────────────────────────────────
SAFETY_CLASSIFIER_PROMPT = PromptTemplate(
    template="""Classify message:

safe / suspicious / malicious

Message: {message}

Answer:""",
    input_variables=["message"]
)