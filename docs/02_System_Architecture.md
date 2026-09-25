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

    Student --> Web
    Admin --> Web
    Web --> API
    API --> DB
    API --> Embeddings
    API --> LLM
    API --> Agent
    API --> Logs
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
| `graph_nodes.py` | State graph nodes (`router`, `it_query`, `hr_agent`, `clarify`, `synthesize`, `respond`) | Raw SQL queries, PDF loading | LangChain + ChatGroq (`openai/gpt-oss-120b`) |
| `graph_state.py` | TypedDict schemas (`AssistantState`) & Pydantic models (`DepartmentRoute`, `RetrievedDocument`, `ITQueryResponse`) | Network transport or DB sessions | Pydantic v2 + Typing |
| `knowledge_retrieval.py` | PGVector connections, HuggingFace embeddings (`all-MiniLM-L6-v2`), MMR search | Presentation formatting for UI | `langchain_postgres` + `HuggingFaceEmbeddings` |
| `index_documents.py` | PDF parsing (`PyPDFLoader`), recursive character chunking (1000/150), collection seeding | Answering chat queries | `langchain_community` + `RecursiveCharacterTextSplitter` |
| `Prompts.py` | Department-specific system prompts and grounding instructions | Runtime state transitions | Python string templates |
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

- PostgreSQL is the source of truth for conversations, messages, decisions, documents, chunks, events, handoffs, feedback, and evaluation runs.
- Redis is not a source of truth. It holds locks, rate-limit counters, and queued job metadata.
- OpenAI responses are transient dependencies. Store model name, latency, token counts if available, and request correlation metadata—not prompts containing unnecessary PII.
- The frontend stores only access-token/session state and an optimistic view of the current conversation. It refetches authoritative state after a response.

## 8. Configuration shape

```dotenv
APP_ENV=local
API_BASE_URL=http://localhost:8000
DATABASE_URL=postgresql+asyncpg://campusone:campusone@db:5432/campusone
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=replace-me
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_ROUTER_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
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
```

All settings are loaded by one typed settings object. Environment names are examples; deployment secrets must use the platform's secret manager.

## 9. Resilience and degradation

| Failure | Behavior |
|---|---|
| OpenAI unavailable during routing | Use deterministic lexical/embedding fallback if available; otherwise hand off with `router_unavailable`. |
| OpenAI unavailable during answer generation | Return a clear temporary-unavailable message and offer handoff; do not use ungrounded prose. |
| Database unavailable | Health check is unhealthy; no request claims success. |
| Redis unavailable | Synchronous ingestion/evaluation may run only if explicitly enabled; chat remains independent of Redis. |
| No retrieval evidence | `no_evidence` fallback; never pass empty evidence to a factual generation prompt. |
| Conflicting published evidence | `conflicting_knowledge` handoff, with source references stored. |

## 10. Observability

Every request carries `request_id`; every turn has `conversation_id`, `user_id_hash`, and `message_id`. JSON logs include event name, duration, outcome, domain keys, and error code. They exclude message text by default, access tokens, API keys, full prompts, and retrieved document bodies. See [12 Security](12_Security.md) and [11 Analytics](11_Analytics_and_Evaluation.md).

## 11. Architectural acceptance criteria

- A new domain skill can be registered through configuration and a module implementing `DomainSkill`.
- The chat route never imports a concrete `ITSkill` or `FinanceSkill` directly.
- Retrieval cannot cross a domain boundary unless an explicit multi-domain scope is supplied.
- Every assistant response has a typed outcome (`answered`, `clarification`, `handoff`, or `error`) and persisted event trail.
- Integration tests can replace OpenAI, embeddings, retrieval, and identity with deterministic fakes.

