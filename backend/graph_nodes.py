from pathlib import Path
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Robustly load .env relative to this file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from backend.graph_state import (
        AgentQueryResponse,
        AssistantState,
        DepartmentRoute,
        ITQueryResponse,
        SynthesisResponse,
        TicketSummary
    )
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.graph_state"}:
        raise
    from graph_state import (
        AgentQueryResponse,
        AssistantState,
        DepartmentRoute,
        ITQueryResponse,
        SynthesisResponse,
        TicketSummary
    )

try:
    from backend.knowledge_retrieval import (
        FACILITIES_KNOWLEDGE_BASE,
        FINANCE_KNOWLEDGE_BASE,
        HR_KNOWLEDGE_BASE,
        IT_KNOWLEDGE_BASE,
        format_retrieved_documents,
        retrieve_documents,
    )
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.knowledge_retrieval"}:
        raise
    from knowledge_retrieval import (
        FACILITIES_KNOWLEDGE_BASE,
        FINANCE_KNOWLEDGE_BASE,
        HR_KNOWLEDGE_BASE,
        IT_KNOWLEDGE_BASE,
        format_retrieved_documents,
        retrieve_documents,
    )

try:
    from backend.Prompts import (
        FACILITIES_AGENT_PROMPT,
        FEES_AGENT_PROMPT,
        GENERAL_AGENT_PROMPT,
        HR_AGENT_PROMPT,
        IT_QUERY_PROMPT,
        ROUTER_PROMPT,
        SYNTHESIZE_PROMPT,
    )
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.Prompts"}:
        raise
    from Prompts import (
        FACILITIES_AGENT_PROMPT,
        FEES_AGENT_PROMPT,
        GENERAL_AGENT_PROMPT,
        HR_AGENT_PROMPT,
        IT_QUERY_PROMPT,
        ROUTER_PROMPT,
        SYNTHESIZE_PROMPT,
    )


# Shared cached LLM instances for fast sub-second turn transitions
_router_llm = None
_it_llm = None
_domain_llms = {}
_general_llm = None
_synth_llm = None
_ticket_llm = None


def _conversation_context(state: AssistantState, limit: int = 8) -> str:
    messages = state.get("messages", [])[-limit:]
    if not messages:
        return "No prior conversation context is available."

    return "\n".join(
        f"{message.get('role', 'unknown').title()}: "
        f"{message.get('content', '')}"
        for message in messages
    )


def _retrieved_chunk_payload(documents) -> list[dict[str, Any]]:
    return [
        {
            "content": document.page_content,
            "source": document.metadata.get("source", "Unknown document"),
            "page": (
                document.metadata["page"] + 1
                if isinstance(document.metadata.get("page"), int)
                else None
            ),
            "metadata": dict(document.metadata),
        }
        for document in documents
    ]


def get_router_llm():
    global _router_llm
    if _router_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.7)
        _router_llm = llm.with_structured_output(
            DepartmentRoute,
            method="json_schema",
        )
    return _router_llm


def get_it_llm():
    global _it_llm
    if _it_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)
        _it_llm = llm.with_structured_output(
            ITQueryResponse,
            method="json_schema",
        )
    return _it_llm


def _get_ticket_llm():
    global _ticket_llm

    if _ticket_llm is None:
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0.2,
        )
        _ticket_llm = llm.with_structured_output(
            TicketSummary,
            method="json_schema",
        )

    return _ticket_llm


def router(state: AssistantState):
    structured_llm = get_router_llm()
    query = state["current_query"]
    messages = list(state.get("messages", []))
    if not messages or messages[-1].get("role") != "user" or messages[-1].get("content") != query:
        messages.append({"role": "user", "content": query})

    prompt = ROUTER_PROMPT.format(query=query)
    prompt += f"\n\nConversation context:\n{_conversation_context({**state, 'messages': messages})}"
    response = structured_llm.invoke(prompt)

    return {
        "messages": messages,
        "detected_domains": response.departments,
        "routing_confidence": response.confidence,
        "intent": response.route,
        "metadata": {"reason": response.reason},
    }


def it_query(state: AssistantState):
    structured_llm = get_it_llm()

    retrieved_documents = retrieve_documents(
        query=state["current_query"],
        collection_name=IT_KNOWLEDGE_BASE,
        number_of_documents=4,
    )

    retrieved_context = format_retrieved_documents(
        retrieved_documents
    )

    prompt = IT_QUERY_PROMPT.format(
        query=state["current_query"],
        context=retrieved_context,
    )
    prompt += f"\n\nConversation context:\n{_conversation_context(state)}"

    response = structured_llm.invoke(prompt)

    answer_confidence = response.answer_confidence

    source_references = [
        (
            f"{document.metadata.get('source', 'Unknown document')}"
            f", page {document.metadata['page'] + 1}"
            if isinstance(document.metadata.get("page"), int)
            else document.metadata.get(
                "source",
                "Unknown document",
            )
        )
        for document in retrieved_documents
    ]

    return {
        "agent_response": response.answer,
        "agent_confidence": answer_confidence,
        "solved": answer_confidence >= 0.75,
        "human_required": answer_confidence < 0.75,
        "handoff_reason": (
            "The retrieved IT documentation does not provide "
            "enough information for a confident answer."
            if answer_confidence < 0.75
            else None
        ),
        "sources": source_references,
        "retrieved_chunks": _retrieved_chunk_payload(retrieved_documents),
        "metadata": {
            **state.get("metadata", {}),
            "agent_domain": "IT",
            "retrieved_document_count": len(retrieved_documents),
        },
    }


def clarify(state: AssistantState):
    query = state["current_query"]
    domains = state.get("detected_domains", [])

    options = ", ".join(domains) if domains else "IT, HR, Fees, or Facilities"

    question = (
        f"Could you clarify which area you need help with: {options}?"
    )

    return {
        "final_answer": question,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "clarification",
        },
    }

def _get_general_llm():
    global _general_llm
    if _general_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.7)
        _general_llm = llm.with_structured_output(
            AgentQueryResponse,
            method="json_schema",
        )
    return _general_llm


def _get_synth_llm():
    global _synth_llm
    if _synth_llm is None:
        _synth_llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.5)
    return _synth_llm


def _run_domain_agent(
    state: AssistantState,
    domain: str,
    prompt_template: str,
    collection_name: str | None = None,
):
    llm = _get_general_llm()
    query = state["current_query"]

    retrieved_documents = (
        retrieve_documents(
            query=query,
            collection_name=collection_name,
            number_of_documents=4,
        )
        if collection_name
        else []
    )
    retrieved_context = format_retrieved_documents(retrieved_documents)
    prompt = prompt_template.format(
        query=query,
        context=retrieved_context or "No retrieved PDF context is available.",
    )
    prompt += f"\n\nConversation context:\n{_conversation_context(state)}"

    response = llm.invoke(prompt)

    source_references = [
        (
            f"{document.metadata.get('source', 'Unknown document')}"
            f", page {document.metadata['page'] + 1}"
            if isinstance(document.metadata.get("page"), int)
            else document.metadata.get("source", "Unknown document")
        )
        for document in retrieved_documents
    ]

    return {
        "agent_response": response.answer,
        "agent_confidence": response.answer_confidence,
        "solved": response.solved,
        "human_required": response.human_required,
        "handoff_reason": response.handoff_reason,
        "sources": source_references,
        "retrieved_chunks": _retrieved_chunk_payload(retrieved_documents),
        "metadata": {
            **state.get("metadata", {}),
            "agent_domain": domain,
            "retrieved_document_count": len(retrieved_documents),
        },
    }


def hr_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "HR",
        HR_AGENT_PROMPT,
        HR_KNOWLEDGE_BASE,
    )


def fees_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "Fees and Finance",
        FEES_AGENT_PROMPT,
        FINANCE_KNOWLEDGE_BASE,
    )


def facilities_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "Facilities and Maintenance",
        FACILITIES_AGENT_PROMPT,
        FACILITIES_KNOWLEDGE_BASE,
    )


def general_agent(state: AssistantState):
    return _run_domain_agent(state, "General", GENERAL_AGENT_PROMPT)


def synthesize(state: AssistantState):
    query = state["current_query"]
    agent_response = state.get("agent_response")

    if state.get("metadata", {}).get("agent_domain") == "General":
        return {
            "final_answer": SynthesisResponse(
                answer=agent_response or "How can I help you today?"
            ).answer,
            "metadata": {
                **state.get("metadata", {}),
                "outcome": "general_response",
            },
        }

    llm = _get_synth_llm()

    prompt = SYNTHESIZE_PROMPT.format(
        query=query,
        agent_response=agent_response or "No agent response is available.",
    )

    response = llm.invoke(prompt)
    structured_response = SynthesisResponse(answer=response.content)

    return {
        "final_answer": structured_response.answer,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "synthesized",
        },
    }

def respond(state: AssistantState):
    if state.get("ticket_requested") and not state.get("ticket_summary"):
        conversation = _conversation_context(state, limit=20)
        prompt = f"""
Create an internal support ticket summary from this conversation.

Use only facts present in the conversation. Do not invent troubleshooting
steps, policies, or user details.

Conversation:
{conversation}

Detected department:
{state.get("detected_domains", ["General"])[0]}
"""
        ticket_summary = _get_ticket_llm().invoke(prompt)

        return {
            "ticket_summary": ticket_summary.model_dump(),
            "metadata": {
                **state.get("metadata", {}),
                "ticket_summary_generated": True,
            },
        }

    candidate_answer = state.get("final_answer") or state.get("agent_response")
    ticket_id = state.get("ticket_id")
    if ticket_id:
        final_answer = (
            "Your issue has been raised as internal support ticket "
            f"{ticket_id}. The conversation summary and troubleshooting "
            "history have been included for the support team."
        )
    else:
        final_answer = candidate_answer

    if not final_answer:
        final_answer = (
            "I could not generate an answer at this time. "
            "Please try again later."
        )

    return {
        "final_answer": final_answer,
        "messages": [
            *state.get("messages", []),
            {
                "role": "assistant",
                "content": final_answer,
            },
        ],
        "metadata": {
            **state.get("metadata", {}),
            "response_sent": True,
        },
    }


def route_after_response(state: AssistantState) -> str:
    if state.get("ticket_requested") and not state.get("ticket_id"):
        return "create_ticket"

    return "finish"


def should_raise_ticket(state: AssistantState) -> bool:
    query = state.get("current_query", "").lower().strip()
    messages = state.get("messages", [])

    dissatisfaction_phrases = (
        "still not",
        "still doesn't",
        "still does not",
        "didn't work",
        "doesn't work",
        "does not work",
        "not working",
        "did not help",
        "not helpful",
        "tried that",
        "same problem",
        "didn't solve",
        "not solved",
        "speak to a human",
        "need a human",
        "talk to someone",
        "create a support ticket",
        "raise a ticket",
        "escalate this",
    )

    has_previous_assistant_response = any(
        message.get("role") == "assistant"
        for message in messages[:-1]
    )

    return has_previous_assistant_response and any(
        phrase in query for phrase in dissatisfaction_phrases
    )

def route_by_confidence(state: AssistantState) -> str:
    if should_raise_ticket(state):
        return "create_ticket"

    confidence = state.get("routing_confidence", 0.0)
    domains = state.get("detected_domains", [])
    intent = (state.get("intent") or "").lower().strip()

    if intent == "human":
        return "create_ticket"

    # Honor an explicit General classification, even if the model omitted
    # the department list for a greeting or small-talk request.
    if confidence >= 0.75 and intent == "general":
        return "general"

    # Ambiguous or unsupported request
    if confidence < 0.75 or not domains:
        return "clarify"

    # DepartmentRoute returns uppercase values, but graph keys are lowercase
    department = domains[0].lower().strip()

    valid_routes = {
        "it": "it",
        "hr": "hr",
        "fees": "fees",
        "finance": "fees",
        "fees and finance": "fees",
        "facilities": "facilities",
        "facilities and maintenance": "facilities",
        "general": "general",
    }

    return valid_routes.get(department, "clarify")

def create_ticket(state: AssistantState):
    if state.get("ticket_id"):
        return {
            "ticket_id": state["ticket_id"],
            "human_required": True,
            "metadata": {
                **state.get("metadata", {}),
                "ticket_created": True,
            },
        }

    if not state.get("ticket_summary"):
        return {
            "ticket_requested": True,
            "metadata": {
                **state.get("metadata", {}),
                "ticket_summary_requested": True,
            },
        }

    ticket_id = f"TKT-{uuid4().hex[:8].upper()}"
    ticket = {
        "ticket_id": ticket_id,
        **state["ticket_summary"],
        "conversation": state.get("messages", []),
    }

    return {
        "ticket_id": ticket_id,
        "human_required": True,
        "metadata": {
            **state.get("metadata", {}),
            "ticket_created": True,
            "ticket": ticket,
        },
    }