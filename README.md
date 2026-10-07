# CampusOne

<div align="center">
  <img src="assets/branding/logo.png" alt="CampusOne Logo" width="140" />
  <h3>One Front Door for Everything</h3>
  <p><em>Ask once. Get routed right. Get it resolved.</em></p>
</div>

---

## 🏛️ About CampusOne

**CampusOne** is an enterprise-grade university orchestration platform and conversational single front door. Universities are notoriously fragmented into bureaucratic silos: IT Helpdesks, Student Accounts/Finance, Campus Facilities, Academic Registrars, and Administrative Directorates. 

CampusOne replaces disjointed chatbots, confusing portal links, and bouncing email threads with a single conversational entry point powered by:
- **Margin-Guarded Intent Routing** with structured JSON output classification
- **Isolated Domain Knowledge Stores** backed by PostgreSQL + `pgvector` MMR retrieval
- **Strict Grounding & Verifiable Citations** (mandatory source attribution with page-level PDF provenance)
- **Dynamic Clarification & Contextual Escalation** (avoids guessing when confidence is ambiguous)
- **Role-Separated Operational Architecture** with dedicated student and administrator interfaces

---

## ⚙️ Backend Multi-Agent & Retrieval Engine

The backend (`backend/`) is a LangGraph orchestration service combining Groq high-throughput LLMs and PostgreSQL with `pgvector`:

- **Structured Intent Routing (`router()`):** Employs JSON Schema structured outputs (`DepartmentRoute`) to determine target departments, routing confidence, and classification reasoning.
- **Intra-Domain Gating (Answer-First):** When candidate options collapse to a single department, the system routes directly without entering clarification loops; clarification is strictly reserved for cross-department divergence.
- **Conversational Continuation Support:** Recognizes short replies (*"no"*, *"nope"*, *"yes"*, *"not yet"*) in ongoing conversations to maintain domain context.
- **Clarification Loop Guard:** Exempts `General` campus and lost personal property inquiries from internal ticket creation, providing direct actionable guidance.
- **Conversational Ticket Triggers & Lifecycle:** Recognizes explicit ticket requests (*"help me raise a ticket for the same"*, *"bro ticket"*, *"ticket"*) and delivers single-turn creation receipts without stale session locks.
- **Zero-Emoji Markdown Delivery:** Formats domain agent responses into clean, accessible Markdown lists; emojis are strictly prohibited and sanitized.
- **Isolated PGVector Knowledge Bases:** Dedicated vector stores (`it_knowledge`, `hr_knowledge`, `finance_knowledge`, `facilities_knowledge`) to prevent multi-department cross-contamination.
- **MMR Search Strategy:** Employs Maximal Marginal Relevance ($k=4, \text{fetch\_k}=16, \lambda=0.7$) over `sentence-transformers/all-MiniLM-L6-v2` embeddings for semantically rich and non-redundant evidence.
- **Strict Grounded Citations:** Automatically attaches document filenames and page numbers (`RetrievedDocument`) to LLM responses for audited provenance.
- **Confidence-Gated Resolution:** If routing confidence $\ge 0.75$, routes to domain agents (`it_query`, `hr_agent`, `fees_agent`, `facilities_agent`); if confidence $< 0.75$, shifts to dynamic clarification (`clarify()`) or flags human specialist escalation.
- **Durable Multi-Session Conversation Checkpointing:** Persists LangGraph conversational checkpoints in PostgreSQL using `PostgresSaver` keyed hierarchically by `thread_id = "{user_id}:{conversation_id}"` with automatic fallback, isolating multiple student inquiries across sessions via `GET /api/v1/chat/history`.
- **PostgreSQL Ticket Lifecycle Engine:** Full multi-tenant ticket persistence in PostgreSQL (`campus_tickets`) with dedicated REST endpoints (`/api/v1/tickets`), real-time status transitions (`pending`, `in_progress`, `resolved`), and staff resolution auditing.
- **PostgreSQL Authentication & Student Registration:** Persists user credentials in PostgreSQL (`campus_users`) with PBKDF2-HMAC-SHA256 password hashing, supporting self-service student signup (`POST /api/v1/auth/register`).
- **LangSmith Tracing & Observability:** Instruments full graph executions, node latencies, and LLM token usage via configurable LangSmith integration (`LANGSMITH_TRACING=true`).
- **Automated Unit Testing Suite:** 54 automated tests verifying auth, tickets CRUD API, clarification schemas, intra-domain routing, ticket lifecycle, hybrid retrieval, SSE streaming, and analytics (`pytest backend/tests/`).
- **Synthesis Node (`synthesize()`):** Formats raw domain outputs into clear, actionable advice with numbered checklists before returning to the conversation history.

---

## 💻 Frontend Dual-Role Architecture

The frontend (`frontend/`) is built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Inter**, **Playfair Display**, and **Geist Mono**, enforcing clean page separation across two primary roles:

### 1. Student Portal (`/workspace`)
- **Primary Audience:** Alex Rivera (`s24cseu1866@bennett.edu.in`) or 1-Click Fast-Track
- **Campus Intelligence Workspace:** Sleek obsidian dark canvas (`#0A0A0D`) with subtle radial ambient glow, unified header (*"Let’s figure it out."* with glowing `#FF7A00` status indicator), common student prompt suggestion cards positioned cleanly above the input section, and a docked bottom message composer with voice input (`Web Speech API`), document attachments, and amber submit glow.
- **Docked Official Record Inspector:** Slide-out right inspection drawer with 2x2 metadata grid (Authority, Effective Date, Record ID, Match Score), verbatim subclause formatting, FERPA compliance badge, copy citation utility, and direct form action.
- **My Tickets:** Real-time tracking of personal inquiries split into **All Cases**, **Open Cases**, and **Resolved** tabs. Automatically captures escalated handoff tickets produced by the assistant, displays staff resolution notes, and formats timestamps into clean human-readable times.
- **Quiet Catalog Drawer:** 215px collapsible history sidebar that recedes into the perimeter to keep focus on active inquiries.
- **Isolated Context:** Strictly student-focused; administrative panels or controls are completely segregated.

### 2. Administrator Console (`/admin`)
- **Primary Audience:** System Administrator (`admin@campusone.internal` / `admin1234`) or 1-Click Fast-Track
- **Unified Ticket Management Console:** Centralized triage board with real-time queue counts (Pending vs Claimed vs Resolved), status filtering (`all`, `pending`, `in_progress`, `resolved`), search filter, and detailed inspector.
- **Lifecycle Management:** One-click ticket claiming, department reassignment, resolution note entry, and resolution actions that instantly synchronize with the student's ticket view via PostgreSQL and reactive `TicketContext`.
- **RBAC Security Guard:** Protected by an **HTTP 403 Role Clearance Barrier**; unauthenticated visitors or student sessions cannot access administrative tools without admin authentication.

### 3. Unified Authentication Gateway (`/login`)
- **3-Mode Switcher:** Seamless switching between **Student Access**, **Staff & Admin**, and **New Account Registration**.
- **1-Click Fast-Track Clearance:** Dedicated instant demo buttons for both Alex Rivera (Student) and System Administrator.
- **Automated Role Routing:** Dynamically routes staff and administrators to `/admin` and students to `/workspace`.

---

## 🚀 One-Command Launch (All Platforms)

Right after a fresh `git clone` or `git pull`, launch the stack:

#### Linux & macOS (Bash)
```bash
./scripts/start.sh
```

#### Windows (Command Prompt)
```cmd
scripts\start.bat
```

#### Windows & Cross-Platform (PowerShell)
```powershell
.\scripts\start.ps1
```

---

## 🛠️ Manual Step-by-Step Setup

If you prefer running services independently:

### 1. Start Vector Database (PostgreSQL + pgvector)
```bash
cd backend
docker compose up -d
```

### 2. Configure & Run Backend Pipeline
```bash
# In backend/ directory
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Ingest and index PDF policy documents into pgvector:
python index_documents.py

# Launch FastAPI backend:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Start Frontend Development Server
```bash
cd ../frontend
npm install
npm run dev # Launches on http://localhost:3000
```

---

## 📂 Repository Structure

```text
msInnovateHack/
├── backend/                       # Python LangGraph & pgvector orchestration engine
│   ├── app/                       # FastAPI application (main.py, auth, chat endpoints)
│   ├── Documents/                 # Institutional policy PDFs (IT, HR, Finance, Facilities)
│   ├── docker-compose.yml         # PostgreSQL 16 + pgvector container
│   ├── graph.py                   # LangGraph construction and PostgresSaver checkpointer lifecycle
│   ├── graph_nodes.py             # Router, domain RAG nodes, clarify, synthesize, respond
│   ├── graph_state.py             # State graph schemas and Pydantic structured output models
│   ├── tickets.py                 # PostgreSQL campus_tickets schema, CRUD operations & lifecycle
│   ├── index_documents.py         # PDF chunking and vector indexing script
│   ├── knowledge_retrieval.py     # Embeddings, vector store connectors, MMR retriever
│   ├── Prompts.py                 # Domain prompt templates and system instructions
│   ├── tests/                     # Automated unit test suite (54 tests passing)
│   │   ├── test_auth.py           # Password hashing, registration, JWT, and RBAC
│   │   ├── test_clarification.py  # Clarification bounds, intra-domain gating, continuation
│   │   ├── test_ticket_lifecycle.py # Single-turn receipts, conversational ticket commands
│   │   ├── test_tickets_api.py    # PostgreSQL ticket CRUD API & multi-tenant isolation
│   │   ├── test_chat_stream.py    # SSE token streaming & metadata verification
│   │   ├── test_analytics.py      # Real-time institutional telemetry endpoints
│   │   └── test_hybrid_retrieval.py # Vector + semantic retrieval validation
│   ├── streamlit_app.py           # Synchronized developer debug console (auth, chat, threads)
│   └── requirements.txt           # Python dependencies
├── frontend/                      # Next.js 16 App Router application
│   ├── src/app/
│   │   ├── page.tsx               # Editorial campus wayfinding landing page
│   │   ├── login/page.tsx         # Unified 3-way authentication gateway (Student/Admin/Signup)
│   │   ├── workspace/page.tsx     # Student workspace (Assistant Chat & My Tickets)
│   │   └── admin/page.tsx         # Dedicated Administrator Ticket Console (RBAC protected)
│   ├── src/components/
│   │   ├── home/                  # Editorial landing sections (Hero, Problem, Features, Footer)
│   │   ├── StudentTicketsView.tsx # Student ticket list (All Cases / Open Cases / Resolved tabs)
│   │   ├── AdminTicketPanel.tsx   # Consolidated ticket triage & resolution console
│   │   ├── AdminAnalyticsPanel.tsx # Operational telemetry, SLA trends, and department loads
│   │   ├── TopNav.tsx             # Clean student navigation bar
│   │   ├── MessageBubble.tsx      # Turns, checklists, citations, deduplicated clarification
│   │   └── CitationDrawer.tsx     # Docked policy inspection panel
│   ├── src/context/               # AuthContext and reactive TicketContext
│   ├── src/lib/                   # API client (FastAPI bridge), fixtures, utilities
│   └── README.md                  # Frontend documentation
├── docs/                          # Architectural specification suite (00-15 & DESIGN_GUIDE)
├── assets/                        # Brand marks, vector assets, and design artifacts
└── README.md                      # Monorepo master documentation
```

---

## 📚 Architectural Specification Suite

| Document | Description |
| :--- | :--- |
| [`docs/00_Project_Overview.md`](docs/00_Project_Overview.md) | Vision, scope, two-role model, and brand identity |
| [`docs/01_Product_Requirements.md`](docs/01_Product_Requirements.md) | Complete PRD and functional requirements (FR-AUTH through FR-KB) |
| [`docs/02_System_Architecture.md`](docs/02_System_Architecture.md) | Modular monolith architecture, interfaces, and system boundaries |
| [`docs/03_Routing_Engine.md`](docs/03_Routing_Engine.md) | Margin Guard, Negative Anchors, and two-stage classification |
| [`docs/04_Domain_Skills.md`](docs/04_Domain_Skills.md) | Pluggable skill interfaces and domain specifications |
| [`docs/05_RAG_and_Knowledge_Base.md`](docs/05_RAG_and_Knowledge_Base.md) | Hybrid RRF retrieval, chunking, and seed corpus strategy |
| [`docs/06_Conversation_Orchestration.md`](docs/06_Conversation_Orchestration.md) | Turn state machine and multi-domain resolution matrix |
| [`docs/07_Fallback_and_Handoff.md`](docs/07_Fallback_and_Handoff.md) | Clarification dialogs, handoff tickets, and queue routing |
| [`docs/08_Database_Design.md`](docs/08_Database_Design.md) | Relational tables, pgvector HNSW indexes, and migrations |
| [`docs/09_API_Reference.md`](docs/09_API_Reference.md) | Comprehensive REST and SSE streaming API contracts |
| [`docs/10_Frontend_Architecture.md`](docs/10_Frontend_Architecture.md) | Next.js architecture, dual-role pages, and state management |
| [`docs/12_Security.md`](docs/12_Security.md) | Auth abstractions, RBAC matrix, and prompt injection defense |
| [`docs/13_Testing_Strategy.md`](docs/13_Testing_Strategy.md) | Test hierarchy, automated suites, and CI verification gates |
| [`docs/14_Deployment.md`](docs/14_Deployment.md) | Docker Compose infrastructure and operations |
| [`docs/15_Demo_Runbook.md`](docs/15_Demo_Runbook.md) | Live hackathon presentation playbook and script |

---

## 🎨 Brand Identity

- **Official Mark:** Minimalist monochrome university gateway arch framing an integrated numeral "1" (One Front Door for Everything).
- **Assets:** Transparent antialiased mark in `assets/branding/logo.png` (white for dark mode) and `assets/branding/logo-dark.png` (deep slate for light mode).
- **Typography:** **Inter** as primary interface typeface, paired with JetBrains Mono for telemetry, citations, and identifiers.
- **Design Tokens:** Deep neutral black canvas (`#09090b` / `#121215`) with restrained electric sapphire/indigo accent (`#6366f1` / `#4f46e5`) and accessible WCAG 2.1 AA contrast.
