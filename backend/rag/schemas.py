"""CampusOne Unified RAG Schemas."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Structured evidence citation reference."""
    source: str = Field(description="Name or path of the source document")
    page: Optional[int] = Field(default=None, description="Page number if applicable (1-indexed)")
    chunk_id: Optional[str] = Field(default=None, description="Identifier of the specific chunk")
    excerpt: Optional[str] = Field(default=None, description="Verbatim excerpt from the document")


class DepartmentRAGResponse(BaseModel):
    """Structured LLM output for domain RAG generation."""
    answer: str = Field(
        description="A clear answer based strictly on the retrieved context."
    )
    answer_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence that the answer is correct and fully supported by retrieved context."
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="List of specific citations supporting the answer."
    )


class DomainRAGResult(BaseModel):
    """Canonical public result from executing domain RAG."""
    answer: str = Field(
        description="Grounded factual answer generated exclusively from retrieved context"
    )
    department: str = Field(
        description="Department that served the query ('it', 'hr', 'fees', 'facilities')"
    )
    answer_confidence: float = Field(
        ge=0.0,
        le=1.0,
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
