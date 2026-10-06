import logging
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.auth.dependencies import require_permission
from app.auth.schemas import CurrentUser
from app.conversations import conversation_store

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


class ConversationSummaryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    domain_key: str = "it"
    status: str = "open"
    pinned: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreateConversationRequest(BaseModel):
    id: Optional[str] = Field(None, max_length=128)
    title: Optional[str] = Field(None, max_length=250)
    domain_key: Optional[str] = Field("it", max_length=64)


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=250)
    pinned: Optional[bool] = None
    status: Optional[str] = Field(None, max_length=32)


class ChatHistoryResponse(BaseModel):
    thread_id: str
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    conversation: Optional[ConversationSummaryResponse] = None


@router.get(
    "/conversations",
    response_model=List[ConversationSummaryResponse],
    summary="List student conversations",
    description="Retrieve all persistent conversation sessions for the authenticated user.",
)
async def list_conversations(
    current_user: CurrentUser = Depends(require_permission("conversations:own")),
) -> List[ConversationSummaryResponse]:
    return await conversation_store.list_conversations(current_user.id)


@router.post(
    "/conversations",
    response_model=ConversationSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation session",
    description="Provision a persistent conversation record in the student directory.",
)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: CurrentUser = Depends(require_permission("conversations:own")),
) -> ConversationSummaryResponse:
    try:
        return await conversation_store.create_conversation(
            user_id=current_user.id,
            conversation_id=request.id,
            title=request.title,
            domain_key=request.domain_key or "it",
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "conversation_conflict", "message": "Conversation identifier is already registered by another account"},
        )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationSummaryResponse,
    summary="Update conversation metadata",
    description="Update title, pinned status, or resolution status of a student conversation.",
)
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationRequest,
    current_user: CurrentUser = Depends(require_permission("conversations:own")),
) -> ConversationSummaryResponse:
    updated = await conversation_store.update_conversation(
        user_id=current_user.id,
        conversation_id=conversation_id,
        title=request.title,
        pinned=request.pinned,
        status=request.status,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "conversation_not_found", "message": "Conversation does not exist"},
        )
    return updated


@router.delete(
    "/conversations/{conversation_id}",
    summary="Delete conversation session",
    description="Remove a conversation record from the student directory.",
)
async def delete_conversation(
    conversation_id: str,
    current_user: CurrentUser = Depends(require_permission("conversations:own")),
) -> Dict[str, Any]:
    deleted = await conversation_store.delete_conversation(current_user.id, conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "conversation_not_found", "message": "Conversation does not exist"},
        )
    return {"status": "success", "id": conversation_id, "deleted": True}


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

    conv_meta = None
    if conversation_id:
        conv_meta = await conversation_store.get_conversation(current_user.id, conversation_id)

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
        conversation=conv_meta,
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

    if request.conversation_id:
        detected_domain = (result.get("detected_domains") or ["it"])[0]
        status_val = (
            "clarification"
            if result.get("clarification_options")
            else ("resolved" if result.get("solved") else "open")
        )
        try:
            await conversation_store.touch_conversation(
                user_id=current_user.id,
                conversation_id=request.conversation_id,
                first_query=request.message,
                domain_key=detected_domain,
                status=status_val,
            )
        except Exception as store_err:
            logger.warning("Failed to touch conversation: %s", store_err)

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

        if request.conversation_id:
            detected_domains = last_state.get("detected_domains") or ["it"]
            status_val = (
                "clarification"
                if last_state.get("metadata", {}).get("clarification_options")
                else ("resolved" if last_state.get("solved") else "open")
            )
            try:
                await conversation_store.touch_conversation(
                    user_id=current_user.id,
                    conversation_id=request.conversation_id,
                    first_query=request.message,
                    domain_key=detected_domains[0] if detected_domains else "it",
                    status=status_val,
                )
            except Exception as store_err:
                logger.warning("Failed to touch conversation in stream: %s", store_err)

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


class QuickReplyRequest(BaseModel):
    department: str = Field(default="General", description="Department managing the issue")
    issue_summary: str = Field(..., min_length=1, max_length=1000, description="Summary of the ticket or issue")
    conversation_summary: Optional[str] = Field(None, max_length=2000, description="Optional conversation context")
    target: Literal["ticket_resolution", "chat_followup"] = Field(
        default="ticket_resolution",
        description="Whether to generate resolution action templates or student follow-up prompts",
    )


class QuickReplyResponse(BaseModel):
    templates: List[str]
    source: str = "llm"


class _QuickReplyOutput(BaseModel):
    options: List[str] = Field(description="List of 3 distinct, concise response templates or actions.")


_quick_reply_llm = None


def _get_quick_reply_llm():
    global _quick_reply_llm
    if _quick_reply_llm is None:
        from langchain_groq import ChatGroq
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)
        _quick_reply_llm = llm.with_structured_output(_QuickReplyOutput, method="json_schema")
    return _quick_reply_llm


@router.post(
    "/quick-replies",
    response_model=QuickReplyResponse,
    summary="Generate LLM-based Quick-Reply Templates",
    description="Generate context-aware resolution notes or conversational follow-up suggestions.",
)
async def generate_quick_replies(
    request: QuickReplyRequest,
    current_user: CurrentUser = Depends(require_permission("messages:create")),
) -> QuickReplyResponse:
    dept = request.department or "General"
    issue = request.issue_summary
    context = request.conversation_summary or ""

    if request.target == "ticket_resolution":
        prompt = f"""You are an experienced university operations administrator.
Generate exactly 3 professional, practical, and distinct resolution templates that a staff specialist can use to close this support ticket.

Department: {dept}
Issue Summary: {issue}
Conversation Context: {context}

Rules:
- Each template should describe a concrete action taken by university staff (e.g., dispatched technician, cleared account hold, verified records, rebooted access point).
- Keep each template concise (1-2 sentences).
- Do not use emojis.
- Provide practical resolutions tailored to {dept}."""
    else:
        prompt = f"""You are a university student assistant.
Generate exactly 3 helpful, concise follow-up questions or actions a student might ask next.

Department: {dept}
Issue Summary: {issue}
Conversation Context: {context}

Rules:
- Keep each suggestion under 10 words.
- Natural, supportive student tone.
- Do not use emojis."""

    try:
        llm = _get_quick_reply_llm()
        result: _QuickReplyOutput = await run_in_threadpool(llm.invoke, prompt)
        if result and result.options and len(result.options) > 0:
            return QuickReplyResponse(templates=result.options[:4], source="llm")
    except Exception as exc:
        logger.warning("LLM quick reply generation failed, falling back to deterministic defaults: %s", exc)

    # Deterministic resilient fallback templates by department
    dept_lower = dept.lower()
    if "it" in dept_lower or "wifi" in dept_lower or "network" in dept_lower:
        fallback = [
            "Credentials re-synchronized across campus IAM and Eduroam RADIUS access points.",
            "Dispatched technician to inspect local network switch. Student connection verified.",
            "Temporary browser cache cleared and authentication session reset in portal database.",
        ]
    elif "fee" in dept_lower or "finan" in dept_lower or "account" in dept_lower:
        fallback = [
            "Finance hold cleared in student ledger; academic hold release queued in Registrar sync.",
            "Verified payment receipt against university merchant gateway. Ledger updated.",
            "Late fee waiver approved under academic circumstance code. Records updated.",
        ]
    elif "facil" in dept_lower or "hostel" in dept_lower or "mainten" in dept_lower:
        fallback = [
            "Work order dispatched to Facilities Maintenance team for urgent on-site repair.",
            "Room fixtures inspected and repair completed by campus block caretaker.",
            "Maintenance order logged in central facilities dispatch directory.",
        ]
    elif "hr" in dept_lower or "employ" in dept_lower or "staff" in dept_lower:
        fallback = [
            "Official documentation verified with HR Directorate. Staff records updated.",
            "Onboarding verification completed and transmitted to payroll coordinator.",
            "Inquiry reviewed by University Employee Relations desk.",
        ]
    else:
        fallback = [
            "Issue reviewed and verified by Central Administration. Resolution logged in directory.",
            "Official documentation transmitted to student portal records.",
            "Inquiry processed and filed with central student services coordinator.",
        ]

    return QuickReplyResponse(templates=fallback, source="fallback")
