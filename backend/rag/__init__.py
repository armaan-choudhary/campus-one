"""CampusOne Unified RAG Module."""
from backend.rag.config import (
    DOMAIN_CONFIG,
    SUPPORTED_DOMAINS,
    normalize_department,
)
from backend.rag.schemas import (
    Citation,
    DepartmentRAGResponse,
    DomainRAGResult,
)
from backend.rag.engine import (
    execute_domain_rag,
    retrieve_domain_documents,
    format_retrieved_documents,
)

__all__ = [
    "DOMAIN_CONFIG",
    "SUPPORTED_DOMAINS",
    "normalize_department",
    "Citation",
    "DepartmentRAGResponse",
    "DomainRAGResult",
    "execute_domain_rag",
    "retrieve_domain_documents",
    "format_retrieved_documents",
]
