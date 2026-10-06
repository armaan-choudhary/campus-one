import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.auth.dependencies import require_permission
from app.auth.schemas import CurrentUser

logger = logging.getLogger(__name__)

try:
    from backend.graph import get_graph
except ModuleNotFoundError:
    from graph import get_graph


router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = Field(None, max_length=128)


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
    clarification_options: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ChatHistoryResponse(BaseModel):
    thread_id: str
    messages: List[Dict[str, Any]] = Field(default_factory=list)


@router.get(
    "/history",
    response_model=ChatHistoryResponse,
    summary="Load conversation history",
    description="Load the authenticated user's latest persisted conversation state.",
)
async def chat_history(
    conversation_id: Optional[str] = None,
    current_user: CurrentUser = Depends(require_permission("messages:create")),
) -> ChatHistoryResponse:
    thread_id = (
        f"{current_user.id}:{conversation_id}"
        if conversation_id
        else current_user.id
    )

    try:
        snapshot = await run_in_threadpool(
            get_graph().get_state,
            {"configurable": {"thread_id": thread_id}},
        )
    except Exception as exc:
        logger.exception("Conversation history failed for thread %s", thread_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "conversation_unavailable",
                "message": f"The conversation history could not be loaded: {exc}",
            },
        ) from exc

    return ChatHistoryResponse(
        thread_id=thread_id,
        messages=(snapshot.values or {}).get("messages", []),
    )


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
    thread_id = (
        f"{current_user.id}:{request.conversation_id}"
        if request.conversation_id
        else current_user.id
    )

    try:
        result = await run_in_threadpool(
            graph.invoke,
            {"current_query": request.message},
            config={
                "configurable": {"thread_id": thread_id},
                "run_name": "campus-one-chat",
                "tags": ["campus-one", "chat", current_user.role.value],
                "metadata": {
                    "user_id": current_user.id,
                    "conversation_id": request.conversation_id,
                    "role": current_user.role.value,
                },
            },
        )
    except Exception as exc:
        logger.exception("Assistant execution failed for thread %s on query %r", thread_id, request.message)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "assistant_unavailable",
                "message": f"The assistant could not process this message: {exc}",
            },
        ) from exc

    is_new_ticket = bool(result.get("metadata", {}).get("ticket_newly_raised", False))
    return ChatResponse(
        answer=result.get("final_answer") or result.get("agent_response") or "",
        thread_id=thread_id,
        ticket_id=result.get("ticket_id") if is_new_ticket else None,
        ticket=result.get("metadata", {}).get("ticket") if is_new_ticket else None,
        detected_domains=result.get("detected_domains", []),
        intent=result.get("intent"),
        routing_confidence=result.get("routing_confidence", 0.0),
        solved=result.get("solved", False),
        human_required=result.get("human_required", False),
        handoff_reason=result.get("handoff_reason"),
        sources=result.get("sources", []),
        retrieved_chunks=result.get("retrieved_chunks", []),
        clarification_options=result.get("metadata", {}).get("clarification_options"),
        metadata=result.get("metadata", {}),
    )


@router.post(
    "/stream",
    summary="Send a chat message with Server-Sent Events (SSE) streaming",
    description="Stream stage updates, token deltas, and final message payload over SSE.",
)
async def chat_stream(
    request: ChatRequest,
    current_user: CurrentUser = Depends(require_permission("messages:create")),
):
    import asyncio
    import json
    from starlette.responses import StreamingResponse

    graph = get_graph()
    thread_id = (
        f"{current_user.id}:{request.conversation_id}"
        if request.conversation_id
        else current_user.id
    )

    async def event_generator():
        yield f"event: stage\ndata: {json.dumps({'stage': 'received', 'label': 'Inquiry received'})}\n\n"

        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()

        def run_stream():
            try:
                for chunk in graph.stream(
                    {"current_query": request.message},
                    config={
                        "configurable": {"thread_id": thread_id},
                        "run_name": "campus-one-chat-stream",
                        "tags": ["campus-one", "chat-stream", current_user.role.value],
                        "metadata": {
                            "user_id": current_user.id,
                            "conversation_id": request.conversation_id,
                            "role": current_user.role.value,
                        },
                    },
                ):
                    loop.call_soon_threadsafe(queue.put_nowait, ("chunk", chunk))
                loop.call_soon_threadsafe(queue.put_nowait, ("done", None))
            except Exception as exc:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", exc))

        loop.run_in_executor(None, run_stream)

        last_state = {}

        while True:
            item_type, item_data = await queue.get()
            if item_type == "done":
                break
            elif item_type == "error":
                yield f"event: error\ndata: {json.dumps({'error': str(item_data)})}\n\n"
                return
            elif item_type == "chunk":
                node_name = list(item_data.keys())[0]
                node_output = item_data[node_name]
                last_state.update(node_output)

                if node_name == "router":
                    yield f"event: stage\ndata: {json.dumps({'stage': 'routing', 'detected_domains': node_output.get('detected_domains', []), 'confidence': node_output.get('routing_confidence', 0.0), 'intent': node_output.get('intent')})}\n\n"
                elif node_name in {"it_agent", "hr_agent", "fees_agent", "facilities_agent", "general_agent", "multi_domain_agent"}:
                    yield f"event: stage\ndata: {json.dumps({'stage': 'retrieving', 'domain': node_name, 'sources': node_output.get('sources', [])})}\n\n"
                elif node_name == "clarify":
                    yield f"event: stage\ndata: {json.dumps({'stage': 'clarifying', 'options': node_output.get('metadata', {}).get('clarification_options', [])})}\n\n"
                elif node_name == "synthesize":
                    yield f"event: stage\ndata: {json.dumps({'stage': 'synthesizing', 'label': 'Synthesizing response'})}\n\n"

        final_answer = last_state.get("final_answer") or last_state.get("agent_response") or ""
        words = final_answer.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"event: token\ndata: {json.dumps({'delta': token})}\n\n"
            await asyncio.sleep(0.015)

        is_new_ticket = bool(last_state.get("metadata", {}).get("ticket_newly_raised", False))
        final_response = {
            "answer": final_answer,
            "thread_id": thread_id,
            "ticket_id": last_state.get("ticket_id") if is_new_ticket else None,
            "ticket": last_state.get("metadata", {}).get("ticket") if is_new_ticket else None,
            "detected_domains": last_state.get("detected_domains", []),
            "intent": last_state.get("intent"),
            "routing_confidence": last_state.get("routing_confidence", 0.0),
            "solved": last_state.get("solved", False),
            "human_required": last_state.get("human_required", False),
            "handoff_reason": last_state.get("handoff_reason"),
            "sources": last_state.get("sources", []),
            "retrieved_chunks": last_state.get("retrieved_chunks", []),
            "clarification_options": last_state.get("metadata", {}).get("clarification_options"),
            "metadata": last_state.get("metadata", {}),
        }
        yield f"event: done\ndata: {json.dumps(final_response)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
