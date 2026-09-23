# ARCHITECTURE_CONTRACT.md
# CampusOne — Shared Multi-Agent Architecture Contract

**Version:** 1.0.0  
**Status:** Canonical Interface Specification  
**Applies To:** Agent 1 (Unified RAG), Agent 2 (Custom Router), Agent 3 (LangGraph Orchestrator), Agent 4 (Evaluation & Hardening)

---

## 1. Domain Configuration Registry

The central domain registry maps logical department keys to display metadata and isolated vector database collections in PostgreSQL (`pgvector`).

```python
DOMAIN_CONFIG = {
    "it": {
        "collection": "it_knowledge",
        "display_name": "IT",
        "description": "IT services, Wi-Fi, email, passwords, login, student portal, hardware, VPN",
    },
    "hr": {
        "collection": "hr_knowledge",
        "display_name": "HR",
        "description": "Human resources, employee benefits, payroll, leave policy, staff hiring, employment verification",
    },
    "fees": {
        "collection": "finance_knowledge",
        "display_name": "Fees",
        "description": "Tuition fees, payment deadlines, refund policy, fee receipts, payment gateways, financial holds, installments",
    },
    "facilities": {
        "collection": "facilities_knowledge",
        "display_name": "Facilities",
        "description": "Campus facilities, hostel maintenance, room allocation, library hours, sports complex, gym, parking, lab access",
    },
}

SUPPORTED_DOMAINS = list(DOMAIN_CONFIG.keys())  # ["it", "hr", "fees", "facilities"]
```

---

## 2. Public Data Schemas

### 2.1 Routing Result (`RoutingResult`)

Location: `backend.routing.schemas.RoutingResult`

```python
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class RoutingResult(BaseModel):
    department: str = Field(
        description="Selected department ('it', 'hr', 'fees', 'facilities') or 'clarify' when ambiguous/low confidence"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Final composite routing confidence score"
    )
    department_scores: Dict[str, float] = Field(
        description="Composite score per domain {dept: score}"
    )
    requires_clarification: bool = Field(
        default=False,
        description="True if confidence < 0.75, margin < 0.15, or query is underspecified"
    )
    reason: str = Field(
        default="",
        description="Explainable rationale or reason code for the decision"
    )
    margin: float = Field(
        default=0.0,
        description="Margin between top-1 and top-2 scores"
    )
    component_scores: Optional[Dict[str, Dict[str, float]]] = Field(
        default_factory=dict,
        description="Component breakdown: {'vector': {...}, 'lexical': {...}, 'model': {...}}"
    )
```

### 2.2 Domain RAG Result (`DomainRAGResult`)

Location: `backend.rag.schemas.DomainRAGResult` (re-exported in `backend.knowledge_retrieval`)

```python
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    source: str
    page: Optional[int] = None
    chunk_id: Optional[str] = None
    excerpt: Optional[str] = None

class DomainRAGResult(BaseModel):
    answer: str = Field(
        description="Grounded factual answer generated exclusively from retrieved context"
    )
    department: str = Field(
        description="Department that served the query ('it', 'hr', 'fees', 'facilities')"
    )
    answer_confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence that the answer is grounded in retrieved context"
    )
    sources: List[str] = Field(
        default_factory=list,
        description="Human-readable citation strings (e.g. 'wifi_policy.pdf, page 2')"
    )
    citations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured citation objects with source, page, excerpt, and chunk metadata"
    )
    solved: bool = Field(
        default=True,
        description="True if query was answered with sufficient grounding (confidence >= 0.75)"
    )
    human_required: bool = Field(
        default=False,
        description="True if confidence < 0.75 or query requires human escalation"
    )
    handoff_reason: Optional[str] = Field(
        default=None,
        description="Reason for human handoff if human_required is True"
    )
    retrieved_documents: Optional[List[Any]] = Field(
        default_factory=list,
        description="Underlying retrieved document chunks"
    )
```

### 2.3 Graph State (`AssistantState` / `GraphState`)

Location: `backend.graph_state.AssistantState`

```python
from typing import List, Optional, Dict, Any, TypedDict

class AssistantState(TypedDict, total=False):
    # Conversation history & Turn
    messages: List[Dict[str, Any]]
    current_query: str

    # Domain & Topic Tracking
    department: Optional[str]             # Current active department
    previous_department: Optional[str]    # Previous turn's active department
    topic_switched: bool                  # True if active domain changed this turn

    # Router Outputs
    routing_confidence: float             # Final router confidence
    routing_scores: Dict[str, float]      # Per-domain fused scores
    requires_clarification: bool          # Flag triggering clarification node
    detected_domains: List[str]           # Candidate domains considered
    intent: Optional[str]                 # Primary detected intent/route

    # Domain RAG Outputs
    agent_response: Optional[str]         # Raw domain agent response
    agent_confidence: float               # Domain grounding confidence
    solved: bool                          # Whether domain considered it resolved
    human_required: bool                  # Escalation flag
    handoff_reason: Optional[str]         # Escalation reason

    # Grounding & Provenance
    sources: List[str]                    # Human-readable source strings
    citations: List[Dict[str, Any]]       # Structured citations

    # Final Response
    final_answer: Optional[str]           # User-facing synthesized response

    # Turn Metadata & Diagnostics
    metadata: Dict[str, Any]
```

---

## 3. Component Functional Interfaces

### 3.1 Agent 1 — Unified RAG Engine

Primary entry point in `backend/knowledge_retrieval.py` and `backend/rag/engine.py`:

```python
def execute_domain_rag(
    query: str,
    department: str,
    conversation_context: Optional[str] = None,
    number_of_documents: int = 4,
    llm: Optional[Any] = None,
) -> DomainRAGResult:
    """
    Executes grounded MMR retrieval and structured response generation for a given department.
    Guarantees cross-domain collection isolation.
    """
    ...
```

Ingestion entry point in `backend/index_documents.py`:

```python
def index_department(
    department: str,
    collection_name: Optional[str] = None,
    documents: Optional[List[Any]] = None,
) -> int:
    """
    Ingests and embeds department documentation into its isolated PGVector collection.
    Preserves department, source, page, chunk_index, and document metadata.
    """
    ...
```

### 3.2 Agent 2 — Custom Hybrid Router

Primary entry point in `backend/routing/hybrid_router.py`:

```python
def route_query(
    query: str,
    conversation_context: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
    margin_threshold: float = 0.15,
    confidence_threshold: float = 0.75,
) -> RoutingResult:
    """
    Computes hybrid routing score:
      score = 0.55 * vector + 0.25 * lexical + 0.20 * custom_model
    Applies Margin Guard:
      if (top1 - top2) < margin_threshold => requires_clarification=True, department='clarify'
    """
    ...
```

### 3.3 Agent 3 — LangGraph Orchestrator

Workflow entry point in `backend/graph.py`:

```python
def get_compiled_graph():
    """Returns the compiled LangGraph workflow with checkpoints."""
    ...

def run_workflow(state: AssistantState) -> AssistantState:
    """Executes a single conversational turn through the state graph."""
    ...
```

Workflow node structure:
```text
START 
  ↓ 
router (computes RoutingResult via route_query)
  ↓ 
route_by_confidence
  ├── "clarify"     ──> clarify     ──> respond ──> END
  └── <department>  ──> domain_rag  ──> synthesize ──> respond ──> END
```

Topic switching policy:
- When `state.get("previous_department")` is set and differs from current `department`:
  - `topic_switched = True`
  - Previous domain retrieval context is discarded to prevent cross-domain contamination.
  - Conversation history (`messages`) is preserved for conversational continuity.

---

## 4. Phase Gates & Quality Standards

- **Gate 1**: Shared contract published; existing test suite (`test_auth.py`) passes without regressions.
- **Gate 2**: Agent 1 RAG unit/integration tests pass (`test_unified_rag.py`, `test_ingestion.py`); Agent 2 Router unit/evaluation tests pass (`test_router.py`, `test_hybrid_router.py`).
- **Gate 3**: Agent 3 LangGraph orchestrator passes (`test_graph_workflow.py`, `test_topic_switching.py`).
- **Gate 4**: Agent 4 E2E, security, failure mode tests and routing benchmark complete (`docs/evaluation_report.md`, `docs/implementation_report.md`).
