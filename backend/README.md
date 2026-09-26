# CampusOne Backend Orchestration Engine

The **CampusOne Backend** is a high-performance multi-agent orchestration service powered by **LangGraph**, **Groq LLMs** (`openai/gpt-oss-120b`), and **PostgreSQL with pgvector**. It acts as the intelligent single front door for campus-wide inquiries—dynamically classifying intent, querying domain-specific knowledge bases via Max Marginal Relevance (MMR), synthesizing grounded responses with verified citations, and automatically triggering clarification or human handoff when confidence falls below required thresholds.

---

## 🚀 Key Capabilities

- **Structured Intent Routing:** Classifies multi-domain inquiries with confidence scoring and explicit reasoning via Groq JSON Schema outputs (`DepartmentRoute`).
- **Department-Isolated Vector Retrieval:** Dedicated pgvector collections for IT, HR, Finance, and Facilities, preventing cross-domain hallucinations.
- **MMR RAG Search:** Combines semantic similarity with diversity weighting (`k=4, fetch_k=16, lambda_mult=0.7`) using normalized `all-MiniLM-L6-v2` embeddings.
- **Verifiable Institutional Citations:** Extracts exact document names and page numbers directly from vector metadata for source attribution.
- **Confidence-Gated Edge Routing:** Routes to specialized domain agents if confidence $\ge 0.75$; triggers dynamic clarification dialogs or human specialist handoff if confidence $< 0.75$.
- **Synthesized Final Output:** Condenses domain agent responses into concise, student-friendly answers with actionable numbered steps.
- **Authenticated Conversations:** Uses the access-token JWT ID (`jti`) as a unique LangGraph thread ID for each login session.
- **FastAPI Chat API:** Exposes authenticated conversations through `POST /api/v1/chat`.
- **Streamlit Debug Console:** Provides a developer-only local UI for smoke-testing login, routing, confidence, sources, and conversation context. The dedicated `frontend/` application is the user-facing client.

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
├── graph.py                  # LangGraph construction and shared checkpoint lifecycle
├── graph_nodes.py            # LangGraph workflow nodes (router, domain agents, clarify, synthesize, respond)
├── graph_state.py            # TypedDict state schemas & Pydantic structured output models
├── index_documents.py        # PDF loading, recursive chunking, and PGVector indexing pipeline
├── knowledge_retrieval.py    # PGVector connection, HuggingFace embeddings, and MMR retrieval helpers
├── Prompts.py                # Departmental prompt templates and system instructions
├── streamlit_app.py          # Developer-only authentication and routing debug console
├── app/api/v1/endpoints/chat.py # Authenticated chat endpoint
├── requirements.txt          # Python dependencies (LangChain, Groq, PGVector, SentenceTransformers)
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
│   router()   │  ── Structured JSON classification (confidence, department, reason)
└──────┬───────┘
       │
  route_by_confidence()
   ├── Confidence < 0.75 ──────────────► ┌─────────────┐
   │                                     │  clarify()  │ ── Prompt student for more details
   └── Confidence >= 0.75                └─────────────┘
         │
   Select Domain Agent:
   ├── IT: it_query() ──► MMR pgvector search ──► Grounded answer + citations
   ├── HR: hr_agent()
   ├── Fees: fees_agent()
   └── Facilities: facilities_agent()
      └── General: general_agent() ──► greetings, thanks, and small talk
         │
         ▼
┌─────────────────┐
│  synthesize()   │  ── Cleans, formats, and structures the response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    respond()    │  ── Appends to conversation history and returns state
└─────────────────┘
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
```

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

Streamlit is only for local backend debugging and routing smoke tests. It is not the production or user-facing frontend; use the dedicated application in `frontend/` for that.

In a second terminal, from the repository root:

```bash
streamlit run backend/streamlit_app.py --server.port 8501
```

Open [http://localhost:8501](http://localhost:8501). The console logs in through the API, sends authenticated messages, and displays the selected intent, departments, routing confidence, sources, solved state, and thread ID.

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
      -d '{"message":"My Wi-Fi is not working"}'
```

The server derives the LangGraph `thread_id` from the authenticated access token's unique JWT `jti`. Reusing the same access token continues the same conversation; a new login creates a separate conversation thread. Clients do not provide or override the thread ID.

---

## 🧪 Testing & Verification

Launch the evaluation notebook to interactively test queries, inspect vector search results, and verify routing decisions:

```bash
jupyter notebook test.ipynb
```