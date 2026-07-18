# SkillNova AI Chatbot — System Design Report

## 1. Executive Summary

SkillNova's AI chatbot has been redesigned from a basic RAG pipeline into a **production-grade Agentic RAG system** using LangGraph. The new system can reason about queries, self-correct retrieval failures, fall back to web search, detect hallucinations, and evaluate itself with quantitative metrics.

**Key improvements over the original:**
- Linear pipeline → Dynamic agent graph with loops and branches
- Blind retrieval → Graded retrieval with relevance scoring
- Single attempt → Self-correcting query rewrite loop
- No fallback → Web search fallback (Tavily + DuckDuckGo)
- No validation → Hallucination detection + evaluation loop
- In-memory storage → Persistent SQLite (chat logs, sessions, escalations)
- No metrics → RAGAS evaluation pipeline + full observability
- No tool protocol → MCP (Model Context Protocol) servers

---

## 2. System Architecture

```
User → FastAPI → MCP Context Layer → Agent Graph → Response + Metrics
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Direct Response       Knowledge Base          Web Search
                    │                     │                     │
                    │              ┌──────┴──────┐              │
                    │              ▼             ▼              │
                    │          Retrieve    Rewrite (loop)       │
                    │              │             │              │
                    │              ▼             │              │
                    │          Grade Docs ───────┘              │
                    │              │                            │
                    └──────────────┼────────────────────────────┘
                                   ▼
                              Generate
                                   │
                                   ▼
                         Hallucination Check
                              │        │
                           grounded  hallucinated
                              │        │
                             END    Escalate → END
```

### Component Map

| Component | Location | Purpose |
|-----------|----------|---------|
| API Layer | `main.py` | HTTP routing, MCP context assembly, persistence |
| Agent Orchestrator | `agent/` | LangGraph state machine (9 nodes) |
| Retriever | `retriever/` | FAISS vector search with metadata filtering |
| LLM Provider | `llm/` | Swappable LLM factory (Groq/Gemini/OpenAI) |
| Tools | `tools/` | Web search with standardized output |
| MCP Servers | `mcp_servers/` | Knowledge Base + User Data MCP servers |
| Evaluation | `evaluation/` | RAGAS metrics + comparison suite |
| Database | `database.py` | SQLite: chat_logs, escalations, sessions |
| Knowledge Base | `knowledge_base/` | 9 documents with YAML metadata |

---

## 3. MCP Context Layer Design

Every request flows through a structured **MCP Context** (implemented as `AgentState`):

```python
MCP_Context = {
    # Query Context
    "question": "user's question",
    "language": "en",
    "role": "Intern",
    "chat_history": "recent conversation",
    
    # Knowledge Context (populated by retriever)
    "documents": [Document(page_content, metadata={source, topic, importance})],
    "web_results": "structured search results",
    
    # Tool Context & Observability
    "tools_used": ["faiss", "web_search"],
    "llm_calls_count": 3,
    "confidence": 0.85,
    
    # Control Signals
    "route": "knowledge_base",
    "query_rewrite_count": 0,
    "doc_relevance": "relevant",
    
    # Output
    "generation": "final answer",
    "is_escalated": false
}
```

**Why MCP-style context matters:**
- Structured envelope ensures every component gets exactly what it needs
- Observability fields (tools_used, llm_calls, confidence) enable analytics
- Control signals enable dynamic routing decisions
- Same structure flows through all 9 graph nodes

---

## 4. Agent Workflow (LangGraph)

### Node Descriptions

| # | Node | LLM Calls | Purpose |
|---|------|-----------|---------|
| 1 | `route_query` | 0-1 | Hybrid router: rule-based (free) → LLM (fallback) |
| 2 | `direct_response` | 1 | Handle greetings without retrieval |
| 3 | `retrieve` | 0 | FAISS similarity search (4 chunks) |
| 4 | `grade_documents` | 1 | Batch grade ALL docs in ONE call |
| 5 | `rewrite_query` | 1 | Rewrite poor-performing queries |
| 6 | `web_search` | 0 | Tavily/DuckDuckGo fallback |
| 7 | `generate` | 1 | Generate answer with self-validation |
| 8 | `hallucination_check` | 1 | Verify answer is grounded in context |
| 9 | `escalate` | 0 | Override with escalation message |

### LLM Call Budget

| Route | Calls | Path |
|-------|-------|------|
| Greeting | 1 | route(0) → direct(1) |
| KB (obvious) | 3-4 | route(0) → retrieve → grade(1) → generate(1) → halluc_check(1) |
| KB (ambiguous) | 4-5 | route(1) → retrieve → grade(1) → generate(1) → halluc_check(1) |
| KB (with retry) | 4-5 | route → retrieve → grade → rewrite(1) → retrieve → grade(1) → generate(1) → halluc_check(1) |
| Web search | 3 | route(1) → web_search → generate(1) → halluc_check(1) |

**Target: 2-4 LLM calls per query** (vs 5-7 in naive implementations)

### Optimization Strategies

1. **Hybrid Routing:** Rule-based catches ~30% of queries at zero LLM cost
2. **Batch Grading:** 1 call grades ALL documents (not 1 per doc)
3. **Merged Self-Validation:** Generation prompt includes grounding instructions
4. **Max 1 Rewrite:** Saves an LLM call vs allowing 2-3 retries
5. **Rate Limiting:** 0.3s between calls prevents Groq throttling

---

## 5. Knowledge Base Design

### Document Metadata (YAML Frontmatter)

Every knowledge base document includes structured metadata:

```yaml
---
source: Attendance_Policy.txt
topic: Attendance
importance: high
last_updated: 2026-03-15
author: HR Department
---
```

**Why metadata matters:**
- Enables topic-aware retrieval filtering
- Source attribution in answers
- Importance-based ranking potential
- Audit trail (author, last updated)

### Document Inventory

| Document | Topic | Importance |
|----------|-------|------------|
| Attendance_Policy.txt | Attendance | High |
| Weekly_Report_Guidelines.txt | Reports | High |
| Intern_Performance_Evaluation.txt | Evaluation | High |
| Internship_Guidelines.txt | Guidelines | High |
| Meeting_Scheduling_Process.txt | Meeting | Medium |
| Task_Validation_Rules.txt | Tasks | High |
| DSA_Practice_Guide.txt | DSA | Medium |
| Platform_Features.txt | Platform | High |
| FAQ.txt | General | High |

---

## 6. Evaluation Results

### Evaluation Strategy

| Phase | LLM | Purpose |
|-------|-----|---------|
| Dev | Groq (Llama 3.1) | Fast iteration, free tier |
| Final | OpenAI (GPT-4o-mini) | Higher accuracy for final scores |

### Metrics

| Metric | What It Measures |
|--------|-----------------|
| **Faithfulness** | Is the answer grounded in retrieved context? |
| **Answer Relevancy** | Does the answer address the question? |
| **Context Precision** | Were the retrieved docs relevant? |
| **Context Recall** | Did we retrieve all needed info? |
| **Avg Confidence** | Pipeline's self-reported confidence |
| **Avg Latency** | End-to-end response time |
| **Avg LLM Calls** | LLM invocations per query |

### Running Evaluation

```bash
# Dev evaluation (Groq — fast, free)
python evaluation/evaluate.py

# Final evaluation (OpenAI — higher accuracy)
python evaluation/evaluate.py --final

# Before/After comparison (Basic RAG vs Agentic RAG)
python evaluation/evaluate.py --compare

# Quick smoke test (first 5 questions)
python evaluation/evaluate.py --limit 5
```

---

## 7. MCP Server Integration

### Knowledge Base Server
```bash
python mcp_servers/knowledge_server.py
```

**Tools:**
- `search_knowledge_base(query, max_results)` — Vector similarity search
- `list_topics()` — All available KB documents
- `get_document(filename)` — Full document content

**Resources:**
- `knowledge://topics` — Overview of all topics with summaries

### User Data Server
```bash
python mcp_servers/user_server.py
```

**Tools:**
- `get_intern_info(name)` — Intern profile lookup
- `get_escalated_queries(status)` — View admin escalation queue
- `get_chat_analytics()` — Topic distribution and query volumes

**Resources:**
- `system://status` — System configuration overview

---

## 8. Data Persistence

### SQLite Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `chat_logs` | Every interaction | prompt, response, route, tools_used, latency_ms, confidence |
| `escalations` | Admin queue | query, status, admin_reply, timestamps |
| `chat_sessions` | Conversational memory | user_message, bot_response, turn_number |

### Observability Fields (chat_logs)

| Field | Type | Example |
|-------|------|---------|
| `route_taken` | String | "knowledge_base" |
| `tools_used` | String | "faiss,web_search" |
| `latency_ms` | Integer | 2340 |
| `llm_calls_count` | Integer | 3 |
| `confidence` | Float | 0.85 |
| `docs_retrieved` | Integer | 4 |

---

## 9. Standardized Tool Output

All tools return the same structure:

```python
{
    "result": "formatted text content",
    "source": "tavily" | "duckduckgo" | "faiss",
    "confidence": 0.85  # 0.0 to 1.0
}
```

**Why standardize:**
- Agent doesn't need to know which tool was used
- Confidence scores enable quality-based decisions
- Source attribution for answer transparency

---

## 10. Trade-offs & Design Decisions

| Decision | Alternative | Why We Chose This |
|----------|-------------|-------------------|
| LangGraph over LangChain chains | LangChain chains can't loop | Self-correction requires cycles |
| Batch grading over per-doc | Per-doc grading = 4x more LLM calls | 1 call for all docs saves budget |
| Merged self-validation | Separate hallucination check | Saves 1 LLM call per query |
| FAISS over Chroma/Pinecone | Chroma needs server, Pinecone needs API | FAISS is local, fast, zero config |
| SQLite over Postgres | Postgres needs infrastructure | SQLite is zero-config, sufficient for scale |
| Tavily+DDG dual search | Single search provider | Resilience: if one fails, other works |
| Rule-based + LLM routing | LLM-only routing | Saves ~30% of routing LLM calls |
| Max 1 rewrite | Multiple rewrites | Diminishing returns after 1 rewrite |

---

## 11. API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main chat (returns reply, confidence, sources) |
| `/api/unanswered` | GET | List escalated queries |
| `/api/unanswered/reply` | POST | Admin reply to escalation |
| `/api/analytics/chatbot` | GET | Topic distribution |
| `/api/analytics/performance` | GET | Latency, confidence, LLM call stats |
| `/api/health` | GET | System status and feature list |

---

## 12. How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure API keys in .env
GROQ_API_KEY=your_key
TAVILY_API_KEY=your_key

# 3. Start the backend
python main.py
# → http://localhost:8000

# 4. Run evaluation
python evaluation/evaluate.py --compare

# 5. Start MCP servers (optional)
python mcp_servers/knowledge_server.py
python mcp_servers/user_server.py
```
