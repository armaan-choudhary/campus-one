# CampusOne Backend Orchestration Engine

The **CampusOne Backend** is a high-performance multi-agent orchestration service powered by **LangGraph**, **Groq LLMs** (`openai/gpt-oss-120b`), and **PostgreSQL with pgvector**. It acts as the intelligent single front door for campus-wide inquiries—dynamically classifying intent, querying domain-specific knowledge bases via Max Marginal Relevance (MMR), synthesizing grounded responses with verified citations, and automatically triggering clarification or human handoff when confidence falls below required thresholds.

---

## 🚀 Key Capabilities

- **Structured Intent Routing:** Classifies multi-domain inquiries with confidence scoring and explicit reasoning via Groq JSON Schema outputs (`DepartmentRoute`).
- **Department-Isolated Vector Retrieval:** Dedicated pgvector collections for IT, HR, Finance, and Facilities, preventing cross-domain hallucinations.
- **MMR RAG Search:** Combines semantic similarity with diversity weighting (`k=4, fetch_k=16, lambda_mult=0.7`) using normalized `all-MiniLM-L6-v2` embeddings.
- **Verifiable Institutional Citations:** Extracts exact document names and page numbers directly from vector metadata for source attribution.
- **Confidence-Gated Edge Routing & Intra-Domain Gating:** Routes to specialized domain agents if confidence $\ge 0.75$. If candidate options point to the same department, the system routes directly rather than entering a clarification loop. Multi-department divergence triggers structured clarification (`clarify()`).
- **Conversational Continuation Support:** Recognizes short replies (*"no"*, *"nope"*, *"yes"*, *"not yet"*) in ongoing dialogues and preserves active domain context.
- **Clarification Loop Guard:** When clarification attempts reach max limits, departmental queries escalate to support tickets, while `General` campus and lost belongings inquiries are exempt and receive authoritative next steps directly.
- **Conversational Ticket Escalation:** Detects explicit ticket requests (*"help me raise a ticket for the same"*, *"bro ticket"*, *"ticket"*) and triggers internal ticket creation without thread locks from earlier sessions.
- **Two-Pass Ticket Flow:** Requests a structured conversation summary, raises the ticket with that summary, and delivers the creation receipt on that single turn.
- **Synthesized Final Output & Zero-Emoji Contract:** Formats domain agent responses into concise, student-friendly answers with actionable numbered steps. Emojis are strictly prohibited, and inline keycap numbers are deterministically reformatted into clean Markdown lists.
- **Multi-Session Authenticated Conversations:** Keys LangGraph checkpoint state hierarchically as `thread_id = "{user_id}:{conversation_id}"` with automatic fallback to `{user_id}`, maintaining full isolation between separate inquiries while preventing cross-session message contamination.
- **Self-Service Student Registration:** Supports new student signup via `POST /api/v1/auth/register`, persisting credentials with PBKDF2-HMAC-SHA256 password hashing in PostgreSQL (`campus_users`).
- **LangSmith Tracing & Observability:** Automatically instruments LangChain and LangGraph node executions, MMR searches, and LLM calls when `LANGSMITH_TRACING=true`.
- **FastAPI Chat & Conversation API:** Exposes authenticated conversations through `POST /api/v1/chat`, streaming via SSE (`/stream`), full directory CRUD via `/chat/conversations`, and history reload via `GET /api/v1/chat/history`.
- **Automated Unit Test Suite:** Includes 53 unit tests covering conversation persistence, IDOR isolation, auth, streaming, quick replies, routing, and ticket lifecycle.
- **Synchronized Streamlit Debug Console:** Provides a developer UI with "Sign in" and "Create account" tabs, multi-thread selector, "+ New Inquiry" provisioning, and real-time bidirectional synchronization with the Next.js web application.

---

## 📂 Project Structure

```text
backend/
├── Documents/                # Source institutional PDFs organized by department
│   ├── IT/                   # Campus IT, Wi-Fi, VPN, SSO, account policies
│   ├── HR/                   # Faculty & staff benefits, leave, payroll policies
│   ├── Finance/              # Student tuition, payment schedules, bursar FAQs
│   └── Facilities/           # Dorm maintenance, keycard access, work orders
├── docker-compose.yml        # PostgreSQL 16 + pgvector container definition
├── graph.py                  # LangGraph construction and PostgresSaver checkpoint lifecycle
├── graph_nodes.py            # LangGraph workflow nodes (router, domain agents, clarify, synthesize, respond)
├── graph_state.py            # TypedDict state schemas & Pydantic structured output models
├── index_documents.py        # PDF loading, recursive chunking, and PGVector indexing pipeline
├── knowledge_retrieval.py    # PGVector connection, HuggingFace embeddings, and MMR retrieval helpers
├── Prompts.py                # Departmental prompt templates and system instructions
├── tests/                    # Automated unit test suite (31 tests)
│   ├── test_auth.py          # Hashing, JWT encoding, student registration, RBAC
│   ├── test_clarification.py # Option bounds, intra-domain gating, continuation routing
│   └── test_ticket_lifecycle.py # Ticket flags, conversational triggers, Markdown sanitizer
├── streamlit_app.py          # Developer-only authentication, registration, and routing debug console
├── app/
│   ├── api/v1/endpoints/
│   │   ├── auth.py           # Login, registration, token refresh, and /me endpoints
│   │   └── chat.py           # Authenticated chat execution and history retrieval
│   ├── auth/                 # Auth provider protocol, PostgreSQL MockAuthProvider, and schemas
│   ├── core/config.py        # Settings with Groq, Postgres, and LangSmith configuration
│   └── main.py               # FastAPI entrypoint with LangSmith and graph lifespan hooks
├── requirements.txt          # Python dependencies (LangChain, LangGraph, Groq, PGVector, etc.)
├── test.ipynb                # Interactive notebook for routing & graph evaluation
└── README.md                 # Backend documentation
```

---

## 📦 Vector Collections

| Department | Collection Name | Embedding Model | Search Strategy | Source Directory |
| :--- | :--- | :--- | :--- | :--- |
| **IT Services** | `it_knowledge` | `all-MiniLM-L6-v2` | MMR ($k=4, \lambda=0.7$) | `backend/Documents/IT/` |
| **Human Resources** | `hr_knowledge` | `all-MiniLM-L6-v2` | MMR ($k=4, \lambda=0.7$) | `backend/Documents/HR/` |
| **Finance & Fees** | `finance_knowledge` | `all-MiniLM-L6-v2` | MMR ($k=4, \lambda=0.7$) | `backend/Documents/Finance/` |
| **Facilities & Housing**| `facilities_knowledge`| `all-MiniLM-L6-v2` | MMR ($k=4, \lambda=0.7$) | `backend/Documents/Facilities/` |

---

## 🔄 Orchestration Workflow

```
[User Query]
      │
      ▼
┌──────────────┐
│   router()   │  ── Classifies intent and checks for escalation
└──────┬───────┘
       │
       ├── Ambiguous ───────────────► clarify() ──► respond() ──► END
       │
       ├── Escalation ──────────────► create_ticket()
       │                                  │
       │                                  ▼
       │                              respond()
       │                         (generate ticket summary)
       │                                  │
       │                                  ▼
       │                              create_ticket()
       │                         (raise ticket and assign ID)
       │                                  │
       │                                  ▼
       │                              respond()
       │                         (display confirmation) ──► END
       │
       └── Department Agent ──► synthesize() ──► respond() ──► END

Domain agents use MMR retrieval from the department collection. The selected
document text is retained as `retrieved_chunks` for debugging and inspection.
```

---

## 🛠️ Environment Setup & Installation

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Python 3.10+](https://www.python.org/downloads/)
- [Groq API Key](https://console.groq.com/)

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one
POSTGRES_DB=campus_one
POSTGRES_USER=campus_one
POSTGRES_PASSWORD=campus_one_secret
# Optional observability
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=campus-one
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

Set `LANGSMITH_TRACING=true` and provide a LangSmith API key to trace graph
nodes and LLM calls. Tracing is disabled by default.

### 3. Create Python Virtual Environment
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Start PostgreSQL with pgvector
Launch the local container:
```bash
docker compose up -d
```
Verify the container is healthy:
```bash
docker ps --filter "name=campus-one-postgres"
```

### 5. Ingest Institutional Documents
Place department PDF files into `backend/Documents/<Department>/` and run the indexing script:
```bash
python index_documents.py
```
*This splits PDFs into 1,000-character chunks (150-char overlap), computes vector embeddings via `sentence-transformers/all-MiniLM-L6-v2`, and populates the department collections in PostgreSQL.*

### 6. Start the API

From the repository root, start FastAPI with the backend package on the application path:

```bash
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

The API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 7. Optional: Start the Streamlit Debug Console

Streamlit provides a local developer console for inspecting multi-agent routing, LLM prompts, citations, and conversation state. It is fully synchronized with the user-facing application in `frontend/`.

In a second terminal, from the repository root:

```bash
streamlit run backend/streamlit_app.py --server.port 8501
```

Open [http://localhost:8501](http://localhost:8501). The console logs in through the API, fetches active conversations from `campus_conversations`, allows creating and switching threads, and displays the selected intent, departments, routing confidence, sources, exact retrieved chunks, ticket summaries, solved state, and LangGraph `thread_id` (`u-student-01:conv_...`).

Demo credentials:

```text
Email: student@example.edu
Password: demo-password
```

The API URL can be changed for the console with `CAMPUSONE_API_URL`:

```bash
CAMPUSONE_API_URL=http://localhost:8000 streamlit run backend/streamlit_app.py
```

## 🔌 Chat API

Authenticate with `POST /api/v1/auth/login`, then send the access token as a bearer token to `POST /api/v1/chat`:

```bash
curl -X POST http://localhost:8000/api/v1/chat \
      -H "Authorization: Bearer <access-token>" \
      -H "Content-Type: application/json" \
      -d '{"message":"My Wi-Fi is not working", "conversation_id":"conv-a0096b2e"}'
```

The server derives the LangGraph `thread_id` by combining the authenticated user's ID and the session `conversation_id` (`{user_id}:{conversation_id}`). Multiple sessions are completely isolated. `GET /api/v1/chat/history?conversation_id=conv-a0096b2e` returns the persisted messages for that specific thread.

The response includes routing and grounding inspection data:

```json
{
      "answer": "...",
      "thread_id": "...",
      "ticket_id": null,
      "ticket": null,
      "detected_domains": ["IT"],
      "routing_confidence": 0.94,
      "sources": ["wifi-guide.pdf, page 2"],
      "retrieved_chunks": [
            {
                  "content": "Exact text extracted from the indexed document chunk...",
                  "source": "wifi-guide.pdf",
                  "page": 2,
                  "metadata": {
                        "source": "wifi-guide.pdf",
                        "page": 1
                  }
            }
      ]
}
```

When escalation is triggered, `ticket_id` and `ticket` are populated. The
ticket contains the structured summary generated from the conversation,
department, priority, escalation reason, and conversation history. The current
conversation checkpoints are persisted in PostgreSQL through LangGraph's
`PostgresSaver`, so conversation state survives process restarts and multiple
API workers. Ticket records remain process-local until a durable ticket store
is added.

---

## 🧪 Testing & Verification

Launch the evaluation notebook to interactively test queries, inspect vector search results, and verify routing decisions:

```bash
jupyter notebook test.ipynb
```