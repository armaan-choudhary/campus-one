"""Conversational assistant endpoint."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.auth.dependencies import require_permission
from app.auth.schemas import CurrentUser

try:
    from backend.graph import get_graph
except ModuleNotFoundError:
    from graph import get_graph


router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    answer: str
    thread_id: str
    ticket_id: Optional[str] = None
    ticket: Optional[Dict[str, Any]] = None
    detected_domains: List[str] = Field(default_factory=list)
    intent: Optional[str] = None
    routing_confidence: float = 0.0
    solved: bool = False
    human_required: bool = False
    handoff_reason: Optional[str] = None
    sources: List[str] = Field(default_factory=list)
    retrieved_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post(
    "",
    response_model=ChatResponse,
    summary="Send a chat message",
    description="Send a message and continue a user-scoped conversation thread.",
)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser = Depends(require_permission("messages:create")),
) -> ChatResponse:
    graph = get_graph()
    if not current_user.session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "session_missing",
                "message": "The authenticated session has no conversation identity.",
            },
        )

    thread_id = current_user.session_id

    try:
        result = await run_in_threadpool(
            graph.invoke,
            {"current_query": request.message},
            config={"configurable": {"thread_id": thread_id}},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "assistant_unavailable",
                "message": "The assistant could not process this message.",
            },
        ) from exc

    return ChatResponse(
        answer=result.get("final_answer") or result.get("agent_response") or "",
        thread_id=thread_id,
        ticket_id=result.get("ticket_id"),
        ticket=result.get("metadata", {}).get("ticket"),
        detected_domains=result.get("detected_domains", []),
        intent=result.get("intent"),
        routing_confidence=result.get("routing_confidence", 0.0),
        solved=result.get("solved", False),
        human_required=result.get("human_required", False),
        handoff_reason=result.get("handoff_reason"),
        sources=result.get("sources", []),
        retrieved_chunks=result.get("retrieved_chunks", []),
        metadata=result.get("metadata", {}),
    )
