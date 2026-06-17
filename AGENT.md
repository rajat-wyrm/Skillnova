# LangGraph Agent

The Python chatbot (`internbackend/main.py`) is fronted by an agentic
RAG graph built with LangGraph. This file documents the topology and
every decision branch.

## Graph

```
                     ┌────────────────────┐
                     │       router       │
                     └─────────┬──────────┘
                               │
        ┌──────────────┬───────┼───────────┬───────────────┐
        ▼              ▼       ▼           ▼               ▼
 ┌──────────┐  ┌────────────┐  ┌──────┐ ┌──────────┐  ┌────────────┐
 │ direct   │  │ knowledge  │  │general│ │blocked   │  │ web_search │
 │ response │  │   base     │  │response│ │response  │  │            │
 └────┬─────┘  └──────┬─────┘  └──┬───┘ └────┬─────┘  └──────┬─────┘
      │               │          │          │               │
      ▼               ▼          ▼          ▼               │
   [END]        ┌────────┐     [END]      [END]             │
                │retrieve│                                  │
                └───┬────┘                                  │
                    ▼                                       │
              ┌──────────┐                                  │
              │grade_docs│                                  │
              └────┬─────┘                                  │
                   │                                       │
   ┌───────────────┼───────────────┐                       │
   ▼               ▼               ▼                       │
┌──────┐   ┌────────────┐  ┌────────────┐                  │
│generate│  │rewrite_query│  │ web_search │ ◀─────────────────┘
└───┬───┘  └──────┬──────┘  └─────┬──────┘
    │             │               │
    │             └──────┐        │
    ▼                    ▼        ▼
┌──────────────┐         │
│hallucination│         │
│   check     │         │
└────┬────────┘         │
     │                  │
 ┌───┴────┐             │
 ▼        ▼             │
[END]  ┌─────────┐      │
       │escalate │ ◀────┘
       └────┬────┘
            ▼
          [END]
```

## Nodes

| Node | File | Purpose |
|---|---|---|
| `router` | `agent/nodes.py::route_query` | Classify the query into one of 5 routes via the LLM |
| `direct_response` | `agent/nodes.py::direct_response` | Short reply to greetings and casual talk |
| `general_response` | `agent/nodes.py::general_response` | General knowledge question, no KB lookup |
| `blocked_response` | `agent/nodes.py::blocked_response` | Hard block for jailbreak attempts |
| `retrieve` | `agent/nodes.py::retrieve` | Top-k similarity search against the KB (default k=5) |
| `grade_documents` | `agent/nodes.py::grade_documents` | Confidence scorer over retrieved chunks |
| `rewrite_query` | `agent/nodes.py::rewrite_query` | Lightweight rewrite to broaden the recall |
| `web_search` | `agent/nodes.py::web_search` + `tools/__init__.py` | Tavily (preferred) → DuckDuckGo fallback |
| `generate` | `agent/nodes.py::generate` | Final reply, `ESCALATE_TO_ADMIN` sentinel detection |
| `hallucination_check` | `agent/nodes.py::check_hallucination` | Confidence gate + escalation flag |
| `escalate` | `agent/graph.py::escalate_response` | Hindi / English escalation message |
| `decide_route` | `agent/nodes.py::decide_route` | Conditional edge from router |
| `decide_after_grading` | `agent/nodes.py::decide_after_grading` | generate \| rewrite \| web_search |
| `decide_after_hallucination_check` | `agent/nodes.py::decide_after_hallucination_check` | pass \| escalate |

## Routing table

```
router -->  knowledge_base -> retrieve
          web_search     -> web_search -> generate -> hallucination_check -> {END | escalate -> END}
          direct         -> direct_response -> END
          general        -> general_response -> END
          blocked        -> blocked_response -> END
```

## State

`AgentState` is a `TypedDict, total=False` so partial updates never
crash. The fields:

```
question, language, role, chat_history, session_id
documents, web_results
route, query_rewrite_count, doc_relevance
tools_used, llm_calls_count
generation, confidence, is_escalated
```

## Why LangGraph?

- Built-in support for **conditional edges** (route, grade, hallucination)
- **Cyclic edges** for query rewrite (max 3 hops before forced web search)
- **Streaming** hooks for the SSE endpoint
- **State checkpointing** for free if we later add a persistence layer

## Failure modes

1. **All LLM providers fail**: the generator returns an empty string,
   `is_escalated=true` is set, the escalation node produces a polite
   "I couldn't verify my answer" message in Hindi or English.
2. **KB returns nothing useful**: the grade step routes the query to
   the rewrite node, which (after up to 3 attempts) escalates to the
   web search node.
3. **Web search also returns nothing**: the generate node still runs
   with the empty context, returns the hallucination-check fallback.
4. **The user message is empty or too long**: caught at the FastAPI
   layer (`validate_input`) before the agent graph is even invoked.

## Tuning knobs (env vars)

| Var | Default | Effect |
|---|---|---|
| `AGENT_WORKERS` | 8 | ThreadPoolExecutor size for graph invocation |
| `AGENT_CONCURRENCY` | 12 | asyncio.Semaphore that caps in-flight graph runs |
| `RATE_LIMIT_PER_MIN` | 60 | Per-IP sliding-window limit |
| `LOG_LEVEL` | INFO | Standard Python logging levels |