from typing import List, Optional, Dict, Any, TypedDict, Literal
from pydantic import BaseModel, Field

# State Graph

class AssistantState(TypedDict):

    # Conversation
    messages: List[Dict[str, Any]]
    current_query: str

    # Routing
    detected_domains: List[str]
    intent: Optional[str]
    routing_confidence: float

    # Agent result
    agent_response: Optional[str]
    agent_confidence: float
    solved: bool

    # Human handoff
    human_required: bool
    handoff_reason: Optional[str]
    ticket_id: Optional[str]
    ticket_requested: bool
    ticket_summary: Optional[Dict[str, Any]]

    # Grounding
    sources: List[str]
    retrieved_chunks: List[Dict[str, Any]]

    # Final response
    final_answer: Optional[str]

    # Misc
    metadata: Dict[str, Any]


# Structure Output for Router LLM

class DepartmentRoute(BaseModel):
    route: Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General", "Human"]
    departments: List[Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General"]]
    understood: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str


# Vector Db related

class RetrievedDocument(BaseModel):
    document_id: Optional[str] = Field(
        default=None,
        description="ID of the retrieved document or vector database chunk."
    )
    content: str = Field(
        description="Content retrieved from the vector database."
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata such as filename, page number, section, or chunk ID."
    )
    relevance_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Relevance score returned by the vector database."
    )



# Structured Output for it_agent LLM

class ITQueryResponse(BaseModel):
    answer: str = Field(
        description="A clear answer based only on the retrieved documents."
    )
    answer_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Confidence that the answer is correct and supported "
            "by the retrieved documents."
        )
    )
    source_references: List[RetrievedDocument] = Field(
        default_factory=list,
        description=(
            "The retrieved vector database documents used as evidence "
            "for generating the answer."
        )
    )


# Structured output for HR, Fees, Facilities, and General agents

class AgentQueryResponse(BaseModel):
    answer: str = Field(
        description=(
            "A clear response to the user's question based on the "
            "department's guidance."
        )
    )
    answer_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Confidence that the answer is accurate, appropriate, and "
            "supported by the available information."
        )
    )
    solved: bool = Field(
        description=(
            "Whether the response fully addresses the user's request."
        )
    )
    human_required: bool = Field(
        description=(
            "Whether a university staff member must handle the request."
        )
    )
    handoff_reason: Optional[str] = Field(
        default=None,
        description=(
            "Reason human assistance is required, when applicable."
        )
    )
    source_references: List[RetrievedDocument] = Field(
        default_factory=list,
        description=(
            "Optional retrieved document references. The application fills "
            "this from the retrieved context after the response is generated."
        )
    )


# Structured output for the final synthesis node

class SynthesisResponse(BaseModel):
    answer: str = Field(
        description=(
            "A concise final answer assembled from the agent response."
        )
    )


# Structured schema for creating ticket

class TicketSummary(BaseModel):
    subject: str = Field(
        description="Short, clear title for the support ticket."
    )
    department: Literal[
        "IT",
        "HR",
        "Fees",
        "Facilities",
        "General",
    ] = Field(
        description="Department responsible for handling the ticket."
    )
    issue_summary: str = Field(
        description="Concise description of the user's original problem."
    )
    conversation_summary: str = Field(
        description="Summary of the relevant conversation between the user and assistant."
    )
    attempted_steps: List[str] = Field(
        default_factory=list,
        description="Troubleshooting or guidance already attempted."
    )
    current_status: str = Field(
        description="What remains unresolved for the user."
    )
    priority: Literal[
        "low",
        "medium",
        "high",
        "urgent",
    ] = Field(
        default="medium",
        description="Suggested ticket priority."
    )
    escalation_reason: str = Field(
        description="Why the issue requires internal support."
    )
