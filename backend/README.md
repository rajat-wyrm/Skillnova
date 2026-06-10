# SkillNova — Production-Grade Agentic AI Chatbot

A state-of-the-art **Agentic RAG (Retrieval-Augmented Generation)** assistant for the SkillNova internship platform. This system is designed for high reliability, security, and extreme responsiveness.

## 🚀 Key Features

*   **Intelligent Routing**: Uses a 5-way hybrid router (deterministic + LLM) to dispatch queries to `Knowledge Base`, `Web Search`, `General Knowledge`, or `Safety Guardrails`.
*   **Self-Correcting RAG**: Implements LangGraph nodes for document grading, query rewriting, and hallucination checks.
*   **Production Guardrails**: Regex and LLM-based input validation to block SQLi, XSS, and Prompt Injection attacks.
*   **Performance Layer**: Semantic caching (Redis-backed with in-memory fallback) for sub-200ms response times on common queries.
*   **Resilience**: Integrated `CircuitBreakers` and `Exponential Backoff` for all external tool/LLM dependencies.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Llama 3.1 8B (via Groq) |
| **Embeddings** | HuggingFace `all-MiniLM-L6-v2` (local) |
| **Vector Store** | FAISS |
| **Orchestration** | LangGraph (Stateful Agents) |
| **Backend** | FastAPI + SQLAlchemy (SQLite) |
| **Frontend** | React + Vite + TailwindCSS |

## 📂 Project Structure

```text
skillnova/
├── backend/                   # Hardened AI Server
│   ├── main.py                # Core API + Agent Orchestration
│   ├── agent/                 # LangGraph logic (nodes, state, prompts)
│   ├── guardrails.py          # Input/Output security validation
│   ├── cache.py               # Semantic Caching (Redis/In-memory)
│   ├── database.py            # SQLite schema (Logs, Escalations, History)
│   ├── tools/                 # Tool layer (Tavily, DDG, Circuit Breakers)
│   ├── knowledge_base/        # PDF/Text sources for RAG
│   └── requirements.txt       # Optimized production dependencies
│
└── skillnova/                 # Modular Frontend
    └── src/
        ├── shared/            # Chat widget with Markdown & Voice support
        ├── user/              # Dashboard integration
        └── admin/             # Analytics & Escalation Management
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier works)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
First run downloads the embedding model (~80MB) — takes a minute.

### 2. Frontend

```bash
cd skillnova

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message, get AI response |
| `GET` | `/api/unanswered` | Get escalated queries (admin) |
| `POST` | `/api/unanswered/reply` | Reply to escalated query (admin) |
| `GET` | `/api/analytics/chatbot` | Chat topic distribution data |

## Team

**AI Chatbot Team** — Responsible for the RAG pipeline, LLM integration, chatbot widget, and admin escalation workflow.
