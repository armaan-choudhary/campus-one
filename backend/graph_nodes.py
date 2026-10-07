import json
from pathlib import Path
import re
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langsmith import traceable

# Robustly load .env relative to this file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from backend.graph_state import (
        AgentQueryResponse,
        AssistantState,
        ClarificationOption,
        ClarificationOutput,
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
        ClarificationOption,
        ClarificationOutput,
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
        CLARIFY_PROMPT,
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
        CLARIFY_PROMPT,
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
_clarify_llm = None
_it_llm = None
_domain_llms = {}
_general_llm = None
_synth_llm = None
_ticket_llm = None


EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess symbols
    "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-a
    "\U00002702-\U000027B0"  # dingbats
    "\U000024C2-\U0001F251"
    "]+",
    flags=re.UNICODE,
)


def _clean_content(text: str) -> str:
    if not text:
        return ""
    trimmed = str(text).strip()
    if trimmed.startswith("{") and trimmed.endswith("}"):
        try:
            parsed = json.loads(trimmed)
            if isinstance(parsed, dict) and "answer" in parsed:
                ans = parsed["answer"]
                if "steps" in parsed and isinstance(parsed["steps"], list):
                    steps_str = "\n".join(f"{i+1}. {s}" for i, s in enumerate(parsed["steps"]))
                    trimmed = f"{ans}\n\n{steps_str}"
                else:
                    trimmed = str(ans)
        except Exception:
            pass

    # Convert inline emoji numbers like 1️⃣, 2️⃣ into standard Markdown numbered lists with newlines
    # e.g. "To request: 1️⃣ Contact office 2️⃣ Fill form" -> "To request:\n\n1. Contact office\n2. Fill form"
    formatted = re.sub(r'(?:^|\s*)(\d+)[\ufe0f\u20e3]+\s*', r'\n\1. ', trimmed)
    # Remove all other emojis
    formatted = EMOJI_PATTERN.sub("", formatted)
    # Ensure colon before list has a clean blank line
    formatted = re.sub(r':\s*\n(\d+\.)', r':\n\n\1', formatted)
    # Normalize excessive newlines (more than 2 consecutive newlines to 2)
    formatted = re.sub(r'\n{3,}', '\n\n', formatted)

    return formatted.strip()


def _conversation_context(state: AssistantState, limit: int = 8) -> str:
    messages = state.get("messages", [])[-limit:]
    if not messages:
        return "No prior conversation context is available."

    return "\n".join(
        f"{message.get('role', 'unknown').title()}: "
        f"{_clean_content(message.get('content', ''))}"
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
        _router_llm = llm.with_structured_output(DepartmentRoute)
    return _router_llm


def get_clarify_llm():
    global _clarify_llm
    if _clarify_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.2)
        _clarify_llm = llm.with_structured_output(
            ClarificationOutput,
            method="json_schema",
        )
    return _clarify_llm


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


@traceable(name="campus-one-normalize-router-output", run_type="chain")
def _normalize_router_output(response: DepartmentRoute) -> DepartmentRoute:
    """Canonicalize router fields after structured LLM output."""
    departments = list(dict.fromkeys(department.strip() for department in response.departments))
    return response.model_copy(
        update={
            "route": response.route.strip(),
            "departments": departments,
        }
    )


@traceable(name="campus-one-router", run_type="chain")
def router(state: AssistantState):
    structured_llm = get_router_llm()
    query = state["current_query"]
    messages = list(state.get("messages", []))
    if not messages or messages[-1].get("role") != "user" or messages[-1].get("content") != query:
        messages.append({"role": "user", "content": query})

    prompt = ROUTER_PROMPT.format(query=query)
    prompt += f"\n\nConversation context:\n{_conversation_context({**state, 'messages': messages})}"
    response = _normalize_router_output(structured_llm.invoke(prompt))

    return {
        "messages": messages,
        "detected_domains": response.departments,
        "routing_confidence": response.confidence,
        "intent": response.route,
        "metadata": {
            **state.get("metadata", {}),
            "reason": response.reason,
        },
    }


@traceable(name="campus-one-it-agent", run_type="chain")
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


@traceable(name="campus-one-clarification-question", run_type="chain")
def _generate_clarification_question(
    state: AssistantState,
    domains: list[str],
    dept_str: str,
) -> tuple[str, list[dict[str, str]], list[str]]:
    """Generate and normalize the student-facing clarification options."""
    try:
        llm = get_clarify_llm()
        prompt = CLARIFY_PROMPT.format(
            departments=dept_str,
            context=_conversation_context(state),
            query=state["current_query"],
        )
        result: ClarificationOutput = llm.invoke(prompt)
        question = result.question
        options = [opt.model_dump() for opt in result.options]
        target_domains = [opt.department for opt in result.options]
    except Exception:
        # Resilient fallback to deterministic options on LLM timeout or error
        question = f"Could you clarify which area you need help with: {dept_str}?"
        target_domains = domains or ["IT", "HR", "Fees", "Facilities"]
        options = [
            {"id": d.lower(), "label": d, "department": d}
            for d in target_domains
        ]

    return question, options, target_domains


@traceable(name="campus-one-clarify", run_type="chain")
def clarify(state: AssistantState):
    attempts = state.get("metadata", {}).get("clarification_attempts", 0)

    # Loop guard: escalate to human support ticket after repeated ambiguous turns,
    # EXCEPT for General campus questions or lost property inquiries.
    if attempts >= 2:
        detected = state.get("detected_domains", [])
        is_general = any(d.lower() == "general" for d in detected) or (state.get("intent") or "").lower() == "general"
        if is_general:
            return {
                "final_answer": (
                    "For lost belongings or general inquiries, please visit the Campus Lost & Found desk "
                    "at the Student Services Center or speak with your hostel block caretaker directly."
                ),
                "intent": "general",
                "solved": True,
                "human_required": False,
                "ticket_requested": False,
                "metadata": {
                    **state.get("metadata", {}),
                    "outcome": "general_guidance",
                    "clarification_attempts": 0,
                },
            }

        return {
            "ticket_requested": True,
            "intent": "human",
            "final_answer": (
                "I want to make sure your request is resolved accurately. "
                "Because your query requires further details, I have opened a support ticket for our campus team."
            ),
            "solved": False,
            "human_required": True,
            "handoff_reason": "Maximum clarification attempts reached.",
            "metadata": {
                **state.get("metadata", {}),
                "outcome": "handoff",
                "clarification_attempts": attempts + 1,
                "escalation_reason": "Maximum clarification attempts reached.",
            },
        }

    domains = [d for d in state.get("detected_domains", []) if d.lower() != "general"]
    dept_str = ", ".join(domains) if domains else "IT, HR, Fees, Facilities"

    question, options, target_domains = _generate_clarification_question(
        state,
        domains,
        dept_str,
    )

    return {
        "final_answer": question,
        "intent": "clarify",
        "detected_domains": target_domains,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "clarification",
            "clarification_options": options,
            "clarification_attempts": attempts + 1,
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


@traceable(name="campus-one-domain-agent", run_type="chain")
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


@traceable(name="campus-one-hr-agent", run_type="chain")
def hr_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "HR",
        HR_AGENT_PROMPT,
        HR_KNOWLEDGE_BASE,
    )


@traceable(name="campus-one-fees-agent", run_type="chain")
def fees_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "Fees and Finance",
        FEES_AGENT_PROMPT,
        FINANCE_KNOWLEDGE_BASE,
    )


@traceable(name="campus-one-facilities-agent", run_type="chain")
def facilities_agent(state: AssistantState):
    return _run_domain_agent(
        state,
        "Facilities and Maintenance",
        FACILITIES_AGENT_PROMPT,
        FACILITIES_KNOWLEDGE_BASE,
    )


@traceable(name="campus-one-general-agent", run_type="chain")
def general_agent(state: AssistantState):
    return _run_domain_agent(state, "General", GENERAL_AGENT_PROMPT)


@traceable(name="campus-one-multi-domain-orchestrator", run_type="chain")
def multi_domain_orchestrator(state: AssistantState) -> dict[str, Any]:
    """
    Concurrently executes multiple domain agents for coupled multi-department requests.
    Aggregates sub-answers, deduplicates sources, and merges retrieved evidence.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    route_map = {
        "it": ("IT", it_query),
        "hr": ("HR", hr_agent),
        "fees": ("Fees", fees_agent),
        "finance": ("Fees", fees_agent),
        "facilities": ("Facilities", facilities_agent),
        "general": ("General", general_agent),
    }

    domains = state.get("detected_domains", [])
    matched_domains = []
    seen = set()
    for d in domains:
        key = d.lower().strip()
        if key in route_map and route_map[key][0] not in seen:
            seen.add(route_map[key][0])
            matched_domains.append((route_map[key][0], route_map[key][1]))

    if not matched_domains:
        return general_agent(state)
    if len(matched_domains) == 1:
        return matched_domains[0][1](state)

    # Execute domain agents concurrently in parallel
    results = []
    with ThreadPoolExecutor(max_workers=min(len(matched_domains), 4)) as executor:
        future_to_dept = {
            executor.submit(agent_fn, state): dept_name
            for dept_name, agent_fn in matched_domains
        }
        for future in as_completed(future_to_dept):
            dept = future_to_dept[future]
            try:
                res = future.result()
                results.append((dept, res))
            except Exception:
                pass

    if not results:
        return general_agent(state)

    # Maintain consistent ordering based on initial matched_domains
    results.sort(key=lambda x: [m[0] for m in matched_domains].index(x[0]))

    combined_answers = []
    combined_sources = []
    combined_chunks = []
    confidences = []
    all_solved = True
    any_human_required = False
    handoff_reasons = []

    for dept, res in results:
        resp_text = res.get("agent_response", "").strip()
        if resp_text:
            combined_answers.append(f"### {dept} Department Resolution\n{resp_text}")
        combined_sources.extend(res.get("sources", []))
        combined_chunks.extend(res.get("retrieved_chunks", []))
        confidences.append(res.get("agent_confidence", 0.8))
        if not res.get("solved", False):
            all_solved = False
        if res.get("human_required", False):
            any_human_required = True
            if res.get("handoff_reason"):
                handoff_reasons.append(f"[{dept}] {res.get('handoff_reason')}")

    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.85
    unique_sources = list(dict.fromkeys(combined_sources))

    return {
        "agent_response": "\n\n".join(combined_answers),
        "agent_confidence": avg_confidence,
        "solved": all_solved,
        "human_required": any_human_required,
        "handoff_reason": "; ".join(handoff_reasons) if handoff_reasons else None,
        "sources": unique_sources,
        "retrieved_chunks": combined_chunks,
        "metadata": {
            **state.get("metadata", {}),
            "agent_domain": "Multi-Domain",
            "executed_domains": [m[0] for m in matched_domains],
            "multi_domain": True,
            "retrieved_document_count": len(combined_chunks),
        },
    }


@traceable(name="campus-one-synthesize", run_type="chain")
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
                "clarification_attempts": 0,
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
            "clarification_attempts": 0,
        },
    }

@traceable(name="campus-one-respond", run_type="chain")
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
{(state.get("detected_domains") or ["General"])[0]}
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
    ticket_just_created = bool(state.get("ticket_just_created", False))

    if ticket_id and ticket_just_created:
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

    clean_final_answer = _clean_content(final_answer)

    assistant_msg = {
        "role": "assistant",
        "content": clean_final_answer,
        "intent": state.get("intent"),
        "detected_domains": state.get("detected_domains", []),
        "routing_confidence": state.get("routing_confidence"),
        "sources": state.get("sources", []),
        "retrieved_chunks": state.get("retrieved_chunks", []),
        "ticket_id": ticket_id if (ticket_id and ticket_just_created) else state.get("ticket_id"),
        "metadata": state.get("metadata", {}),
    }

    return {
        "final_answer": clean_final_answer,
        "ticket_just_created": False,
        "messages": [
            *state.get("messages", []),
            assistant_msg,
        ],
        "metadata": {
            **state.get("metadata", {}),
            "response_sent": True,
            "ticket_newly_raised": ticket_just_created,
        },
    }


def route_after_response(state: AssistantState) -> str:
    if state.get("ticket_requested"):
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
        "raise ticket",
        "create a ticket",
        "create ticket",
        "open a ticket",
        "open ticket",
        "make a ticket",
        "file a ticket",
        "submit a ticket",
        "bro ticket",
        "escalate this",
        "escalate",
    )

    has_previous_assistant_response = any(
        message.get("role") == "assistant"
        for message in messages
    )

    # Check for direct ticket keywords in query when in an ongoing conversation
    direct_ticket_request = (
        query in {"ticket", "bro ticket", "ticket please", "raise ticket", "create ticket"}
        or ("ticket" in query and any(w in query for w in ["raise", "create", "open", "file", "make", "need", "want", "help", "bro", "issue", "send", "give"]))
    )

    return has_previous_assistant_response and (
        any(phrase in query for phrase in dissatisfaction_phrases)
        or direct_ticket_request
    )

@traceable(name="campus-one-follow-up-routing", run_type="chain")
def route_by_confidence(state: AssistantState) -> str:
    if should_raise_ticket(state):
        return "create_ticket"

    confidence = state.get("routing_confidence", 0.0)
    domains = state.get("detected_domains", [])
    intent = (state.get("intent") or "").lower().strip()
    query = (state.get("current_query") or "").lower().strip()
    messages = state.get("messages", [])

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

    if intent == "human":
        return "create_ticket"

    # Distinct candidate routes mapped to valid graph destinations
    distinct_candidates = list(dict.fromkeys(
        valid_routes[d.lower().strip()]
        for d in domains
        if d.lower().strip() in valid_routes
    ))

    # Continuation detection:
    # If the student gives a short conversational reply (e.g. "no", "nope", "not yet", "yes", "haven't")
    # in an ongoing conversation, maintain the conversational flow rather than looping in clarify.
    continuation_indicators = (
        "no", "nope", "nah", "not yet", "haven't", "havent",
        "yes", "yeah", "yep", "yup", "already", "checked", "done", "sure",
        "didn't", "didnt", "ok", "okay",
    )
    is_short_continuation = (
        len(messages) > 1 and
        len(query.split()) <= 6 and
        any(
            query == w or query.startswith(w + " ") or query.startswith(w + ",") or query.startswith(w + ".")
            for w in continuation_indicators
        )
    )

    if is_short_continuation:
        prev_domain = state.get("metadata", {}).get("agent_domain")
        if prev_domain and prev_domain.lower() in valid_routes:
            return valid_routes[prev_domain.lower()]
        # If no prior agent domain recorded, pick non-general candidate if present, else distinct_candidates[0] or general
        non_general = [c for c in distinct_candidates if c != "general"]
        if non_general:
            return non_general[0]
        if distinct_candidates:
            return distinct_candidates[0]
        return "general"

    # Honor an explicit General classification, even if the model omitted
    # the department list for a greeting, lost item, or small-talk request.
    if confidence >= 0.75 and intent == "general":
        return "general"

    # Intra-domain gating:
    # If all detected candidate options point to a SINGLE department (no cross-department divergence),
    # route directly to that department instead of entering a multi-department clarification loop.
    if len(distinct_candidates) == 1 and confidence >= 0.45:
        return distinct_candidates[0]

    # Follow-up in an ongoing departmental conversation
    if len(messages) > 1:
        prev_domain = state.get("metadata", {}).get("agent_domain")
        if not prev_domain and distinct_candidates:
            non_general = [c for c in distinct_candidates if c != "general"]
            if non_general:
                prev_domain = non_general[0]
        if prev_domain and prev_domain.lower() in valid_routes:
            return valid_routes[prev_domain.lower()]

    # High-confidence multi-domain coupled request:
    # If confidence >= 0.75 and there are multiple distinct candidate departments,
    # route to multi_domain to concurrently dispatch and synthesize joint resolution!
    if confidence >= 0.75 and len(distinct_candidates) > 1:
        return "multi_domain"

    # Ambiguous or low-confidence request across multiple departments
    if confidence < 0.75 or not distinct_candidates or len(distinct_candidates) > 1:
        return "clarify"

    return distinct_candidates[0]

@traceable(name="campus-one-create-ticket", run_type="chain")
def create_ticket(state: AssistantState):
    # If a summary hasn't been generated for this ticket request yet,
    # request fresh summary generation from the respond node.
    if not state.get("ticket_summary") or not state.get("ticket_requested"):
        return {
            "ticket_requested": True,
            "ticket_summary": None,
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
        "ticket_just_created": True,
        "ticket_requested": False,
        "human_required": True,
        "metadata": {
            **state.get("metadata", {}),
            "ticket_created": True,
            "ticket": ticket,
            "active_ticket_id": ticket_id,
            "ticket_newly_raised": True,
        },
    }
