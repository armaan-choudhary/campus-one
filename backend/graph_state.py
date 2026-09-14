from typing import List, Optional, Dict, Any, TypedDict, Literal
from pydantic import BaseModel, Field


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

    # Grounding
    sources: List[str]

    # Final response
    final_answer: Optional[str]

    # Misc
    metadata: Dict[str, Any]


class DepartmentRoute(BaseModel):
    route: Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General", "Human"]
    departments: List[Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General"]]
    understood: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str

