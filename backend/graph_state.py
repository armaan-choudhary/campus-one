"""CampusOne LangGraph Assistant State Definitions."""
from typing import List, Optional, Dict, Any, TypedDict, Literal
from pydantic import BaseModel, Field


# Canonical Assistant State Graph Schema
class AssistantState(TypedDict, total=False):
    # Conversation History & Current Turn
    messages: List[Dict[str, Any]]
    current_query: str

    # Domain & Topic Tracking
    department: Optional[str]             # Active department: "it", "hr", "fees", "facilities", or "clarify"
    previous_department: Optional[str]    # Previous turn active department
    topic_switched: bool                  # True if active domain switched this turn
    domain_context: Optional[str]         # Isolated domain context for current turn
    active_domains: List[str]             # All active domains involved in current session/turn
    topic_history: List[Dict[str, Any]]   # Track sequence of topics and domains across turns
    unresolved_intents: List[Dict[str, Any]] # Pending issues across multi-turn sessions
    resolved_intents: List[Dict[str, Any]]   # Successfully answered issues

    # Router Outputs
    route_mode: str                       # "single", "multi", or "clarify"
    target_domains: List[str]             # List of domains to invoke in parallel
    routing_confidence: float             # Final router composite score
    routing_scores: Dict[str, float]      # Fused domain scores
    requires_clarification: bool          # Margin guard trigger flag
    detected_domains: List[str]           # Candidate domains ranked
    intent: Optional[str]                 # Primary detected intent / route
    cross_domain_resolution: Optional[Dict[str, Any]] # Structured multi-domain orchestration output

    # Domain RAG Outputs
    agent_response: Optional[str]         # Raw domain agent response
    agent_confidence: float               # Domain grounding confidence
    solved: bool                          # Whether domain considered query solved
    human_required: bool                  # Escalation flag
    handoff_reason: Optional[str]         # Escalation reason

    # Grounding & Citations
    sources: List[str]                    # Human-readable citation strings
    citations: List[Dict[str, Any]]       # Structured citation objects

    # Final Response
    final_answer: Optional[str]           # Synthesized response sent to user

    # Diagnostics & Metadata
    metadata: Dict[str, Any]


# Preserved legacy Pydantic models for backwards compatibility
class DepartmentRoute(BaseModel):
    route: Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General", "Human"]
    departments: List[Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General"]]
    understood: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


class RetrievedDocument(BaseModel):
    document_id: Optional[str] = Field(default=None, description="ID of the retrieved document or chunk.")
    content: str = Field(description="Content retrieved from the vector database.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata such as filename or chunk ID.")
    relevance_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Relevance score.")


class ITQueryResponse(BaseModel):
    answer: str = Field(description="A clear answer based only on retrieved documents.")
    answer_confidence: float = Field(ge=0.0, le=1.0, description="Confidence score.")
    source_references: List[RetrievedDocument] = Field(default_factory=list, description="Retrieved documents.")