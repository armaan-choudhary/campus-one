"""CampusOne Live Chat API Endpoint.
Exposes POST /api/v1/chat to bridge frontend with LangGraph workflow and multi-domain orchestration.
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.schemas import CurrentUser
from app.auth.dependencies import get_current_user

try:
    from backend.graph import run_workflow
    from backend.graph_state import AssistantState
    from backend.rag.config import DOMAIN_CONFIG
except ModuleNotFoundError:
    from graph import run_workflow
    from graph_state import AssistantState
    from rag.config import DOMAIN_CONFIG

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    """Incoming user chat query."""
    query: str = Field(..., min_length=1, max_length=4096, description="User query text")
    conversation_id: Optional[str] = Field(default=None, description="Optional conversation/thread ID")


class DomainItem(BaseModel):
    """Department-specific resolution summary."""
    department: str
    display_name: str
    confidence: float
    solved: bool
    human_required: bool
    sources: List[str] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)


class ClarificationOptionItem(BaseModel):
    """Interactive clarification choice."""
    id: str
    label: str
    domain: str


class ChatResponse(BaseModel):
    """Canonical chat response for frontend consumption."""
    answer: str
    conversation_id: str
    route_mode: str = Field(default="single", description="'single', 'multi', or 'clarify'")
    department: Optional[str] = None
    domains: List[DomainItem] = Field(default_factory=list)
    confidence: float = 0.0
    sources: List[str] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    requires_clarification: bool = False
    clarification_options: List[ClarificationOptionItem] = Field(default_factory=list)
    human_required: bool = False
    handoff_reason: Optional[str] = None


@router.post(
    "",
    response_model=ChatResponse,
    summary="Process Chat Message",
    description="Invokes LangGraph workflow with hybrid routing, MMR retrieval, and multi-domain orchestration.",
)
async def process_chat(
    request: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ChatResponse:
    """Executes a conversational turn through the live LangGraph orchestration engine."""
    conv_id = request.conversation_id or str(uuid.uuid4())
    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_request", "message": "Query cannot be empty."},
        )

    # Initial state with query and user context
    state: AssistantState = {
        "current_query": clean_query,
        "metadata": {
            "user_id": current_user.id,
            "user_email": current_user.email,
            "user_role": current_user.role.value,
        },
    }

    try:
        result = run_workflow(state=state, thread_id=conv_id)
    except Exception as exc:
        logger.exception("Error executing orchestration workflow for turn: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "orchestration_failure", "message": f"Orchestration engine failed: {str(exc)}"},
        )

    answer = result.get("final_answer") or result.get("agent_response") or "Unable to process query."
    route_mode = result.get("route_mode") or "single"
    primary_dept = result.get("department") or "it"
    confidence = float(result.get("agent_confidence", result.get("routing_confidence", 0.85)))
    sources = result.get("sources", [])
    raw_citations = result.get("citations", [])
    requires_clarification = bool(result.get("requires_clarification", False))
    human_required = bool(result.get("human_required", False))
    handoff_reason = result.get("handoff_reason")

    # Format citations with frontend structure if needed
    formatted_citations: List[Dict[str, Any]] = []
    for idx, cit in enumerate(raw_citations, start=1):
        if isinstance(cit, dict):
            formatted_citations.append({
                "id": str(cit.get("id") or f"cit-{idx}"),
                "marker": f"[{idx}]",
                "title": cit.get("source") or cit.get("title") or "University Policy",
                "section": f"Page {cit.get('page')}" if cit.get("page") else cit.get("section", ""),
                "version": "v2026.1",
                "excerpt": cit.get("excerpt", ""),
                "groundingScore": float(cit.get("groundingScore", 0.9)),
                "sourceUri": cit.get("sourceUri"),
            })

    # Build domain items and next steps
    domains: List[DomainItem] = []
    next_steps: List[str] = []

    cross_res = result.get("cross_domain_resolution")
    if cross_res and isinstance(cross_res, dict):
        next_steps = cross_res.get("next_steps", [])
        res_map = cross_res.get("resolutions", {})
        for d_key, r_info in res_map.items():
            if isinstance(r_info, dict):
                domains.append(
                    DomainItem(
                        department=d_key,
                        display_name=r_info.get("display_name") or DOMAIN_CONFIG.get(d_key, {}).get("display_name", d_key.upper()),
                        confidence=float(r_info.get("confidence", 0.85)),
                        solved=bool(r_info.get("solved", True)),
                        human_required=bool(r_info.get("human_required", False)),
                        sources=r_info.get("sources", []),
                        citations=r_info.get("citations", []),
                    )
                )
    else:
        # Single domain resolution
        disp_name = DOMAIN_CONFIG.get(primary_dept, {}).get("display_name", primary_dept.upper())
        domains.append(
            DomainItem(
                department=primary_dept,
                display_name=disp_name,
                confidence=confidence,
                solved=bool(result.get("solved", True)),
                human_required=human_required,
                sources=sources,
                citations=raw_citations,
            )
        )

    # Clarification options
    clarification_options: List[ClarificationOptionItem] = []
    if requires_clarification:
        detected = result.get("detected_domains", [])
        for d in detected:
            if d in DOMAIN_CONFIG:
                clarification_options.append(
                    ClarificationOptionItem(
                        id=f"opt-{d}",
                        label=DOMAIN_CONFIG[d]["display_name"],
                        domain=d,
                    )
                )

    return ChatResponse(
        answer=answer,
        conversation_id=conv_id,
        route_mode=route_mode,
        department=primary_dept,
        domains=domains,
        confidence=confidence,
        sources=sources,
        citations=formatted_citations,
        next_steps=next_steps,
        requires_clarification=requires_clarification,
        clarification_options=clarification_options,
        human_required=human_required,
        handoff_reason=handoff_reason,
    )
