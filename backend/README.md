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

---

## 📂 Project Structure

```text
backend/
├── app/                      # FastAPI service layer (auth, chat API, core config)
│   ├── api/v1/endpoints/     # chat.py, auth.py
│   └── auth/                 # JWT lifecycle, RBAC matrix, dependencies
├── routing/                  # 3-Way Hybrid Router & Multi-Intent Semantic Detector
│   ├── hybrid_router.py      # 55% Vector + 25% Lexical + 20% ML Classifier
│   ├── multi_intent.py       # Clause segmentation & multi-domain routing
│   ├── vector_scorer.py      # SentenceTransformers centroid cosine scoring
│   ├── lexical_scorer.py     # N-gram & negative anchor keyword scoring
│   └── model.py              # Calibrated Scikit-Learn routing model
├── rag/                      # Department RAG & isolated retrieval
│   ├── engine.py             # MMR retrieval & grounded citation generation
│   ├── prompts.py            # Departmental prompt templates
│   └── config.py             # Domain registry & collection mappings
├── orchestration/            # Cross-domain resolution & dependencies
│   ├── engine.py             # Multi-domain synthesis & parallel execution
│   └── dependency_graph.py   # Institutional workflow topological precedence
├── graph.py                  # LangGraph StateGraph builder with MemorySaver
├── graph_nodes.py            # Graph nodes (router, clarify, RAG, orchestrate, respond)
├── graph_state.py            # TypedDict state schemas
├── index_documents.py        # PDF chunking and vector indexing script
├── knowledge_retrieval.py    # PGVector connection and MMR retrieval helpers
├── requirements.txt          # Python dependencies
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

---

## 🧪 Testing & Verification

Launch the evaluation notebook to interactively test queries, inspect vector search results, and verify routing decisions:

```bash
jupyter notebook test.ipynb
```