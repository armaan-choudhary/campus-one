"""CampusOne Orchestration Schemas.
Data models for multi-domain dispatch, dependency relations, and cross-domain synthesis.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.rag.schemas import DomainRAGResult


class DomainResolution(BaseModel):
    """Result of an individual domain's grounded contribution."""
    domain: str = Field(description="Department key ('it', 'hr', 'fees', 'facilities')")
    display_name: str = Field(description="Display name of department")
    query_clause: str = Field(description="Sub-query or clause served by this domain")
    answer: str = Field(description="Grounded answer produced for this domain")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence of this domain's evidence")
    solved: bool = Field(description="Whether this domain was confidently resolved")
    human_required: bool = Field(description="Whether this domain requires human handoff")
    handoff_reason: Optional[str] = Field(default=None, description="Reason if escalation needed")
    sources: List[str] = Field(default_factory=list, description="Domain citation sources")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="Structured citations")


class DependencyRelation(BaseModel):
    """Represents a directional dependency between campus issues/domains."""
    source_domain: str = Field(description="Domain where prerequisite condition exists")
    source_issue: str = Field(description="Condition description (e.g. 'Fee payment balance')")
    target_domain: str = Field(description="Dependent domain affected by the condition")
    target_issue: str = Field(description="Affected issue (e.g. 'Student portal hold / Exam registration')")
    relation_type: str = Field(
        default="prerequisite_for",
        description="Type: 'prerequisite_for', 'blocks', 'resolves', or 'sequential'"
    )
    explanation: str = Field(description="Human-readable explanation of the relationship")
    evidence_source: Optional[str] = Field(
        default=None,
        description="Source document confirming the dependency if derived from retrieved knowledge"
    )


class OrchestrationResult(BaseModel):
    """Canonical cross-domain orchestrated resolution."""
    query: str
    route_mode: str = Field(description="'single' or 'multi'")
    primary_domain: str
    target_domains: List[str]
    resolutions: Dict[str, DomainResolution]
    dependencies: List[DependencyRelation] = Field(default_factory=list)
    unified_answer: str
    overall_confidence: float = Field(ge=0.0, le=1.0)
    partial_failure: bool = Field(default=False)
    human_required: bool = Field(default=False)
    all_sources: List[str] = Field(default_factory=list)
    all_citations: List[Dict[str, Any]] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
