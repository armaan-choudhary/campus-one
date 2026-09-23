# CampusOne — One Front Door for Everything

<div align="center">
  <img src="assets/branding/logo.png" alt="CampusOne Logo" width="140" />
  <h3>Adaptive Campus Orchestration Platform</h3>
  <p><em>Ask once. Get routed right. Get multi-domain problems resolved.</em></p>
</div>

---

## 1. What is CampusOne?

**CampusOne** is an enterprise-grade campus conversational orchestration platform designed for higher education institutions. Rather than acting as a simple siloed chatbot or keyword directory, CampusOne serves as an intelligent, single front door for students, faculty, and administrative staff across university departments.

---

## 2. What Problem Does It Solve?

Universities are notoriously divided into bureaucratic silos: IT Support, Student Accounts/Finance, Campus Facilities, Academic Registrars, and Human Resources. 

When a student faces an issue that crosses boundaries—such as:
> *"My scholarship hasn't been credited, I can't pay my semester fees, and I'm worried this will stop me from registering for my exams."*

traditional university bots fail because they force the query into a single department (e.g. only IT or only Fees), ignoring the cross-system consequences. Students are left bouncing between disparate offices, ticketing queues, and contradictory web portals.

---

## 3. What Makes It Different?

1. **Multi-Intent Semantic Detection**: Rather than naive sentence splitting, CampusOne decomposes compound queries into discrete actionable clauses and determines when an issue spans multiple departments.
2. **Strict Department Knowledge Base Isolation**: Department collections (`finance_knowledge`, `it_knowledge`, `facilities_knowledge`, `hr_knowledge`) are physically isolated in PostgreSQL PGVector collections to prevent data leakage.
3. **Resolution Dependency Graph**: Incorporates verified institutional workflows (e.g., fee clearance unlocks IT exam registration holds; HR appointment precedes IT account provisioning) so advice reflects real university prerequisite order.
4. **Sub-10ms CPU Hybrid Router**: Combines a 55% Semantic Vector, 25% Lexical, and 20% Calibrated ML Classifier ensemble with a Margin Guard ($\Delta \ge 0.15$), delivering sub-10ms CPU decisions with zero cross-domain false routes.
5. **Grounded Synthesis & Verifiable Citations**: Every factual claim is backed by verbatim policy citations, accompanied by an ordered action plan.

---

## 4. High-Level Architecture

```text
[Next.js 16 Workspace UI]
         │
         ▼  HTTP POST /api/v1/chat (Bearer JWT)
[FastAPI Gateway]
         │
         ▼  LangGraph State Graph (thread_id persistence)
[3-Way Hybrid Router & Multi-Intent Detector]
         ├─────────────────────────────────────┐
         ▼                                     ▼
[Fees PGVector RAG]                   [IT PGVector RAG]
 (finance_knowledge)                   (it_knowledge)
         │                                     │
         └─────────────────┬───────────────────┘
                           ▼
          [Resolution Dependency Graph Engine]
            • Precedence: Fees ➔ IT Portal Hold
            • Grounded Verbatim Citations
            • Chronological Action Plan
                           │
                           ▼
          [Unified Structured Response Payload]
```

Detailed architectural documentation: [`docs/architecture.md`](docs/architecture.md)

---

## 5. Technology Stack

- **Frontend Client**: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Lucide Icons.
- **Backend Gateway**: FastAPI, Pydantic v2, Python 3.12, Uvicorn, HTTPX.
- **Orchestration**: LangGraph state graph with `MemorySaver` checkpointer for multi-turn state continuity.
- **Vector Knowledge Store**: PostgreSQL 16 with `pgvector` extension and MMR (Maximal Marginal Relevance) retrieval.
- **Embeddings & ML Routing**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2`, Scikit-Learn calibrated classifier, and custom n-gram lexical scorer.
- **Security & Auth**: RFC 6750 Bearer JWT authentication, role-based access control (Student, Support Agent, Knowledge Admin, Executive).

---

## 6. How to Run

### Quick Start (Prerequisites: Docker, Python 3.12, Node.js 20+)

#### 1. Start Vector Database (PostgreSQL + PGVector)
```bash
docker run -d \
  --name campus-one-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=campus_one \
  pgvector/pgvector:pg16
```

#### 2. Seed Department Knowledge Bases
```bash
backend/.venv/bin/python scripts/seed_knowledge_base.py
```

#### 3. Launch Backend Service
```bash
cd backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API documentation available at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### 4. Launch Frontend Web Client
```bash
cd frontend
npm install
npm run dev
```
*Access the workspace at [http://localhost:3000](http://localhost:3000).*

Full setup and configuration details: [`docs/development.md`](docs/development.md)

---

## 7. How to Run Tests

### Backend Automated Test Suite
From the repository root:
```bash
backend/.venv/bin/pytest
```
*Verifies all 99 automated tests covering API endpoints, LangGraph state, hybrid routing, multi-intent detection, unified RAG, and cross-domain security isolation.*

### Frontend Production Build & Type Verification
```bash
cd frontend
npm run build
```
*Compiles all pages via Turbopack with 0 errors.*

### Benchmarks & Latency Evaluation
```bash
backend/.venv/bin/python scripts/benchmark_100_queries.py
backend/.venv/bin/python scripts/benchmark_multi_intent.py
backend/.venv/bin/python scripts/measure_latencies.py
```
Evaluation metrics report: [`docs/evaluation.md`](docs/evaluation.md)

---

## 8. Example Orchestration Query

### Input
```json
POST /api/v1/chat
{
  "query": "My scholarship hasn't been credited, I can't pay my semester fees, and I'm worried this will stop me from registering for my exams."
}
```

### Live Engine Execution
1. **Multi-Intent Router**: Classifies the query as `route_mode="multi"` with target domains `["fees", "it"]`.
2. **Parallel PGVector Retrieval**:
   - `finance_knowledge`: Retrieves scholarship disbursement policy and late payment fee grace period.
   - `it_knowledge`: Retrieves exam registration portal guidelines and financial hold prerequisites.
3. **Dependency Resolution**: Identifies institutional rule `fees ➔ it`: outstanding tuition balances place an automatic financial hold preventing exam registration on the student portal.
4. **Structured Synthesis**:
   - Issue 1 (Scholarship & Fees): Details 3-5 day disbursement timeline and fee clearance procedure.
   - Issue 2 (Exam Registration): Details portal hold mechanism.
   - What This Means: Explains that fee settlement is required before registration access unlocks.
   - Ordered Next Steps:
     1. Contact Student Accounts to verify scholarship disbursement status.
     2. Pay any remaining tuition balance via student finance portal.
     3. Once financial hold clears, access the portal to register for exams.
