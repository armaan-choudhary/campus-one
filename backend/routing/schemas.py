"""CampusOne Routing Schemas and Data Models."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class RoutingResult(BaseModel):
    """Canonical result object produced by the routing engine."""
    department: str = Field(
        description="Target department ('it', 'hr', 'fees', 'facilities') or 'clarify' when ambiguous/low confidence"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Composite routing confidence score for the selected department"
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
    route_mode: str = Field(
        default="single",
        description="Routing mode: 'single', 'clarify', 'multi', or 'fallback'"
    )
    candidates: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Ranked candidate domains with their respective scores"
    )
    target_domains: List[str] = Field(
        default_factory=list,
        description="List of target domains to execute (multiple for multi-intent requests)"
    )
    intent_clauses: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Decomposed clauses with their respective domains and confidence"
    )


class RoutingTrainingExample(BaseModel):
    """Schema for router training and evaluation datasets."""
    query: str
    department: str
    intent: Optional[str] = None
    category: Optional[str] = None  # standard, noisy, ambiguous, short, conversational, multi_intent
    notes: Optional[str] = None
