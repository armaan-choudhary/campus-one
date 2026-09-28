# CampusOne — System Architecture

## 1. Architecture decision

CampusOne uses a **modular LangGraph-driven monolith**: a Python backend orchestrates multi-agent conversation graphs (`graph_nodes.py`, `graph_state.py`) with high-throughput Groq LLMs (`openai/gpt-oss-120b`), a Next.js 16 application owns the multi-persona web UI, and PostgreSQL 16 with `pgvector` hosts department-isolated vector stores (`it_knowledge`, `hr_knowledge`, `finance_knowledge`, `facilities_knowledge`) with Max Marginal Relevance (MMR) retrieval. 

This balances hackathon delivery speed with clean, decoupled seams. Department skills, vector collections, or human handoff queues can be evolved independently without impacting the conversational front door.

## 2. Context diagram

```mermaid
flowchart TB
    Student[Student browser]
    Admin[Admin/evaluator browser]
    Web[Next.js 16 web client]
    API[Backend: LangGraph Orchestration]
    LLM[Groq API: openai/gpt-oss-120b]
    DB[(PostgreSQL 16 + pgvector)]
    Embeddings[HuggingFace: all-MiniLM-L6-v2]
    Agent[Sarah Jenkins: Support Triage Queue]
    Logs[Structured telemetry / audit logs]
    LangSmith[LangSmith: LLM Tracing & Observability]

    Student --> Web
    Admin --> Web
    Web --> API
    API --> DB
    API --> Embeddings
    API --> LLM
    API --> Agent
    API --> Logs
    API --> LangSmith
```

## 3. Container architecture

```mermaid
flowchart LR
    subgraph Browser
      Chat[Chat UI]
      AdminUI[Analytics and knowledge UI]
    end

    subgraph Backend[FastAPI modular monolith]
      Auth[Auth and RBAC]
      Conversation[Conversation Manager & Turn Mutex]
      Router[Intent Router with Margin Guard]
      Policy[Routing Policy]
      Skills[Domain Skill Registry]
      RAG[Hybrid Retrieval: pgvector + FTS GIN]
      Generator[Grounded Response Generator]
      Citation[Citation Manager]
      Handoff[Handoff Manager]
      Streamer[SSE Streaming Event Broker]
      ResilientLLM[Resilient LLM Client & Replay Breaker]
      Analytics[Event and analytics service]
      Eval[Evaluation service]
      Ingest[Table-Aware Ingestion Service]
    end

    Chat --> Streamer
    Chat --> Conversation
    AdminUI --> Analytics
    AdminUI --> Ingest
    AdminUI --> Eval
    Conversation --> Router
    Router --> Policy
    Conversation --> Skills
    Skills --> RAG
    RAG --> Generator
    Generator --> Citation
    Conversation --> Streamer
    Conversation --> Handoff
    Conversation --> Analytics
    Ingest --> RAG
    Eval --> Router
    Eval --> Conversation
    Store[(PostgreSQL / pgvector + FTS)]
    Queue[(Redis: Turn Mutex & Queues)]
    OpenAI[OpenAI / Local Replay Fixtures]
    Store --- Conversation
    Store --- RAG
    Store --- Analytics
    Queue --- Conversation
    Queue --- Ingest
    Queue --- Eval
    OpenAI --- ResilientLLM
    ResilientLLM --- Router
    ResilientLLM --- Generator
    ResilientLLM --- RAG
```

## 4. Backend module boundaries & File Mappings

| Module / File | Owns | Does not own | Implementation |
|---|---|---|---|
| `graph.py` | LangGraph state graph compilation, PostgreSQL checkpointer (`PostgresSaver`) initialization, connection pool lifecycle (`initialize_graph`, `close_graph`, `get_graph`) | HTTP routing, prompt generation | `langgraph` + `langgraph-checkpoint-postgres` + `psycopg_pool` |
| `graph_nodes.py` | State graph nodes (`router`, `it_query`, `hr_agent`, `clarify`, `synthesize`, `respond`, `create_ticket`) | Raw SQL queries, PDF loading | LangChain + ChatGroq (`openai/gpt-oss-120b`) |
| `graph_state.py` | TypedDict schemas (`AssistantState`) & Pydantic models (`DepartmentRoute`, `RetrievedDocument`, `ITQueryResponse`) | Network transport or DB sessions | Pydantic v2 + Typing |
| `knowledge_retrieval.py` | PGVector connections, HuggingFace embeddings (`all-MiniLM-L6-v2`), MMR search | Presentation formatting for UI | `langchain_postgres` + `HuggingFaceEmbeddings` |
| `index_documents.py` | PDF parsing (`PyPDFLoader`), recursive character chunking (1000/150), collection seeding | Answering chat queries | `langchain_community` + `RecursiveCharacterTextSplitter` |
| `Prompts.py` | Department-specific system prompts and grounding instructions | Runtime state transitions | Python string templates |
| `app/auth/provider.py` | `MockAuthProvider` backed by PostgreSQL `campus_users`, PBKDF2 password hashing, student registration, JWT issuance/revocation | HTTP routing or request parsing | `asyncpg` + `pyjwt` + PBKDF2-HMAC-SHA256 |
| `app/api/v1/endpoints/auth.py` | Auth endpoints (`/login`, `/register`, `/refresh`, `/me`) | Cryptographic hashing implementation | FastAPI + Pydantic |
| `app/api/v1/endpoints/chat.py` | Authenticated conversation execution (`POST /chat`) and conversation history retrieval (`GET /chat/history`) | Graph execution internals | FastAPI + LangGraph state reader |
| `streamlit_app.py` | Developer smoke-test console (login, student signup, conversation history reload, routing inspection) | Production end-user experience | Streamlit + HTTPX |
| `docker-compose.yml` | PostgreSQL 16 + pgvector container runtime (`campus-one-postgres`) | Application-level graph logic | Docker Compose v2 |

## 5. Request lifecycle & streaming events

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web client
    participant C as Conversation & Stream API
    participant M as Redis Turn Mutex
    participant R as Router (Margin Guarded)
    participant S as Skill registry
    participant V as Hybrid Retrieval (pgvector + FTS)
    participant G as Grounded Generator & Replay Breaker
    participant D as PostgreSQL

    U->>W: Send message
    W->>C: POST /conversations/{id}/messages/stream (SSE)
    C->>M: Acquire lock:conv:{id} (TTL 15s)
    C-->>W: event: stage | {"stage":"routing"} (150ms)
    C->>D: Load conversation and recent state
    C->>R: classify(message, context)
    R-->>C: RouteDecision (Margin-guarded)
    alt clarify or handoff
        C->>D: Persist decision and assistant state
        C->>M: Release lock:conv:{id}
        C-->>W: event: done | Clarification / handoff response
    else one or more eligible domains
        C-->>W: event: routed | {"domain":"it","confidence":0.94}
        C-->>W: event: stage | {"stage":"retrieving"}
        C->>S: resolve(domain keys)
        S->>V: hybrid_search(question, domain, rrf)
        V-->>S: EvidenceBundle (Top chunks)
        C-->>W: event: stage | {"stage":"generating"}
        S->>G: stream_answer(question, evidence, policy)
        loop Token Streaming (TTFT < 1.8s)
            G-->>C: token chunk
            C-->>W: event: token | {"delta":"..."}
        end
        G-->>S: GroundedAnswer + Citations
        S-->>C: DomainAnswer
        C->>D: Persist message, citations, events, resolution
        C->>M: Release lock:conv:{id}
        C-->>W: event: citations | [CitationRef]
        C-->>W: event: done | {"message_id":"m2","state":"resolved"}
    end
```

## 6. Core interfaces

The following Python-like contracts are normative. Concrete implementations may use Pydantic models, dataclasses, or typed protocols, but field meanings and invariants must remain stable.

```python
class SkillDependencies(Protocol):
    retriever: Retriever
    generator: ResponseGenerator
    llm_client: ResilientLLMClient
    settings: AppSettings

class DomainSkill(Protocol):
    key: str
    version: str

    def describe(self) -> SkillDescriptor: ...
    async def answer(
        self,
        request: SkillRequest,
        dependencies: SkillDependencies,
    ) -> DomainAnswer: ...
    async def health(self) -> SkillHealth: ...

class IntentRouter(Protocol):
    async def classify(
        self, message: str, context: RoutingContext
    ) -> RouteDecision: ...

class Retriever(Protocol):
    async def search(self, query: str, scope: RetrievalScope) -> EvidenceBundle: ...

class ResponseGenerator(Protocol):
    async def generate(
        self, request: GenerationRequest
    ) -> GroundedAnswer: ...
```

## 7. Data ownership

- PostgreSQL is the source of truth for:
  - User accounts and authentication credentials (`campus_users`, with PBKDF2 password hashes and roles);
  - Conversational checkpoint snapshots (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations`) managed by LangGraph's `PostgresSaver`;
  - Vector embeddings and chunk collections (`langchain_pg_collection`, `langchain_pg_embedding`);
  - Messages, decisions, documents, events, handoffs, feedback, and evaluation runs.
- Redis is not a source of truth. It holds locks, rate-limit counters, and queued job metadata.
- LLM provider responses (Groq / OpenAI) are transient dependencies. Store model name, latency, token counts if available, and request correlation metadata—not prompts containing unnecessary PII.
- The frontend stores only access-token/session state and an optimistic view of the current conversation. It refetches authoritative state after a response or restores saved messages via `GET /chat/history`.

## 8. Configuration shape

```dotenv
APP_ENV=local
API_BASE_URL=http://localhost:8000
DATABASE_URL=postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one
POSTGRES_DB=campus_one
POSTGRES_USER=campus_one
POSTGRES_PASSWORD=campus_one_secret
GROQ_API_KEY=your_groq_api_key_here
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=replace-me
ROUTING_HIGH_THRESHOLD=0.75
ROUTING_LOW_THRESHOLD=0.45
ROUTING_MAX_DOMAINS=3
CLARIFICATION_MAX_ATTEMPTS=2
HANDOFF_AFTER_FAILED_TURNS=3
RETRIEVAL_TOP_K=8
RETRIEVAL_MIN_SCORE=0.65
JWT_SECRET=local-only-secret
KNOWLEDGE_STORAGE_PATH=./knowledge
LOG_LEVEL=INFO

# Optional LangSmith observability & tracing
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=campus-one
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

All settings are loaded by one typed settings object (`Settings` in `app/core/config.py`). Environment names are examples; deployment secrets must use the platform's secret manager.

## 9. Resilience and degradation

| Failure | Behavior |
|---|---|
| LLM unavailable during routing | Use deterministic lexical/embedding fallback if available; otherwise hand off with `router_unavailable`. |
| LLM unavailable during answer generation | Return a clear temporary-unavailable message and offer handoff; do not use ungrounded prose. |
| Database unavailable | Health check is unhealthy; no request claims success. Checkpointer raises HTTP 502 `conversation_unavailable`. |
| Redis unavailable | Synchronous ingestion/evaluation may run only if explicitly enabled; chat remains independent of Redis. |
| No retrieval evidence | `no_evidence` fallback; never pass empty evidence to a factual generation prompt. |
| Conflicting published evidence | `conflicting_knowledge` handoff, with source references stored. |

## 10. Observability

Observability in CampusOne operates on two synchronized levels:

1. **Structured Request & Audit Telemetry:**
   Every request carries `request_id`; every turn has `conversation_id`, `user_id_hash`, and `message_id`. JSON logs include event name, duration, outcome, domain keys, and error code. They exclude message text by default, access tokens, API keys, full prompts, and retrieved document bodies. See [12 Security](12_Security.md).

2. **LangSmith Distributed Tracing:**
   When `LANGSMITH_TRACING=true` and a valid `LANGSMITH_API_KEY` are provided, the FastAPI lifespan (`configure_langsmith()`) exports the required OpenTelemetry and LangChain tracing environment variables (`LANGCHAIN_TRACING_V2=true`, `LANGCHAIN_PROJECT`, etc.). This enables end-to-end tracing across:
   - State graph node executions (`router`, `create_ticket`, domain retrieval, `synthesize`, `respond`);
   - LLM generation runs, token consumption, and latencies;
   - Tool and retriever invocations against PostgreSQL vector collections;
   - Prompt debugging and confidence score tracking in the LangSmith project dashboard.

## 11. Architectural acceptance criteria

- A new domain skill can be registered through configuration and a module implementing `DomainSkill`.
- The chat route never imports a concrete `ITSkill` or `FinanceSkill` directly.
- Retrieval cannot cross a domain boundary unless an explicit multi-domain scope is supplied.
- Every assistant response has a typed outcome (`answered`, `clarification`, `handoff`, or `error`) and persisted event trail.
- Integration tests can replace OpenAI, embeddings, retrieval, and identity with deterministic fakes.

