# CampusOne — System Architecture

## 1. Architecture decision

CampusOne uses a **modular monolith**: one FastAPI application owns orchestration and APIs, one Next.js application owns the web UI, PostgreSQL with pgvector owns durable state and vector retrieval, and Redis is used for short-lived locks and ingestion/evaluation jobs. The modules are separated in code and tested independently, but they are deployed with the smallest number of operational units that still supports the prototype.

This balances hackathon delivery speed with clean future seams. A future domain, retrieval backend, identity provider, or ticketing integration can be added behind an interface without changing the public chat contract.

## 2. Context diagram

```mermaid
flowchart TB
    Student[Student browser]
    Admin[Admin/evaluator browser]
    Web[Next.js web client]
    API[FastAPI API / modular monolith]
    LLM[OpenAI API]
    DB[(PostgreSQL + pgvector)]
    Redis[(Redis)]
    IdP[Mock auth / future university OIDC]
    Agent[Support agent or handoff inbox]
    Logs[Structured logs / metrics]

    Student --> Web
    Admin --> Web
    Web --> API
    API --> IdP
    API --> DB
    API --> Redis
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

## 4. Backend module boundaries

| Module | Owns | Does not own |
|---|---|---|
| `api` | HTTP validation, SSE streaming protocols, auth wiring, status codes | business routing logic |
| `auth` | provider abstraction, token validation, role checks | conversation ownership decisions outside the current user |
| `conversation` | turn lifecycle, Redis turn mutex, optimistic versioning, state transitions | domain-specific facts |
| `routing` | candidate intents, margin-guarded confidence, topic switches | answer generation |
| `skills` | registry, micro-drafts, domain-specific retrieval filters | global conversation state |
| `retrieval` | hybrid pgvector HNSW + FTS GIN, RRF ranking, relevance filtering | choosing the user-facing wording |
| `generation` | grounded structured answer from evidence, streaming tokens | deciding which domain owns the message |
| `citation` | stable citation objects and coverage validation | document parsing |
| `handoff` | fallback policy, summary, queue record | agent's external ticket system |
| `analytics` | event schema, aggregation queries | changing a routing decision after the fact |
| `evaluation` | fixtures, runners, metric calculations | production conversation mutation |
| `db` | SQLAlchemy models, sessions, migrations, full-text indexes | domain policy |
| `config` | typed environment settings | hidden defaults in feature modules |

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

