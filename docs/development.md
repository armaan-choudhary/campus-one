# CampusOne — Developer & Operations Guide

This guide details everything required to configure, seed, execute, and verify the CampusOne orchestration stack locally.

---

## 1. Prerequisites

- **Python**: 3.12+
- **Node.js**: 20+ (with `npm`)
- **Docker & Docker Compose**: For PostgreSQL with PGVector extension
- **Git**

---

## 2. Environment Configuration

### Backend Configuration (`backend/.env`)
Copy the example file and customize keys:
```bash
cp backend/.env.example backend/.env
```

Key configuration variables:
```env
PROJECT_NAME="CampusOne"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/campus_one"
JWT_SECRET_KEY="campus-one-production-secret-replace-in-real-deployment"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
GROQ_API_KEY=""  # Optional: Groq LLM key for enhanced generative synthesis
```
*Note: If `GROQ_API_KEY` is not provided, the system operates seamlessly in deterministic offline synthesis mode.*

### Frontend Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 3. Database & Knowledge Base Setup

### 3.1 Start PostgreSQL with PGVector
```bash
docker run -d \
  --name campus-one-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=campus_one \
  pgvector/pgvector:pg16
```

### 3.2 Seed Department Knowledge Bases
Populates isolated PGVector collections (`finance_knowledge`, `it_knowledge`, `facilities_knowledge`, `hr_knowledge`) with institutional policies:
```bash
backend/.venv/bin/python scripts/seed_knowledge_base.py
```

---

## 4. Running the Services

### 4.1 Launch FastAPI Backend Gateway
```bash
cd backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`

### 4.2 Launch Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the CampusOne multi-persona workspace.

---

## 5. Running Tests & Quality Verification

### 5.1 Backend Test Suite (Pytest)
From project root:
```bash
backend/.venv/bin/pytest
```
*Executes all 99 automated tests across API endpoints, LangGraph state workflows, multi-intent detection, hybrid routing, unified RAG, and cross-domain security isolation.*

Run a specific module:
```bash
backend/.venv/bin/pytest tests/test_chat_api.py -v
```

### 5.2 Frontend Build & TypeScript Check
```bash
cd frontend
npm run build
```
*Verifies Next.js 16 App Router compilation, static page generation, and strict TypeScript checks via Turbopack.*

### 5.3 Benchmarking & Evaluations
Run the 105-query evaluation suite:
```bash
backend/.venv/bin/python scripts/benchmark_100_queries.py
```
Run the multi-intent routing benchmark:
```bash
backend/.venv/bin/python scripts/benchmark_multi_intent.py
```
Measure routing, RAG, and turn latencies:
```bash
backend/.venv/bin/python scripts/measure_latencies.py
```
