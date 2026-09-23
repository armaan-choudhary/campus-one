"""CampusOne LangGraph Node Implementations.
Integrates Hybrid Router (Agent 2) and Unified Domain RAG (Agent 1).
"""
import os
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Robustly load .env relative to this file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from backend.graph_state import AssistantState
    from backend.rag.config import DOMAIN_CONFIG, SUPPORTED_DOMAINS, normalize_department
    from backend.rag.schemas import DomainRAGResult
    from backend.rag.engine import execute_domain_rag
    from backend.routing.hybrid_router import route_query
    from backend.routing.schemas import RoutingResult
except ModuleNotFoundError:
    from graph_state import AssistantState
    from rag.config import DOMAIN_CONFIG, SUPPORTED_DOMAINS, normalize_department
    from rag.schemas import DomainRAGResult
    from rag.engine import execute_domain_rag
    from routing.hybrid_router import route_query
    from routing.schemas import RoutingResult


# Cached LLM instances
_synth_llm = None


def get_synth_llm():
    """Returns cached synthesizer LLM if GROQ_API_KEY is configured."""
    global _synth_llm
    if _synth_llm is None:
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if groq_api_key:
            try:
                from langchain_groq import ChatGroq
                _synth_llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)
            except Exception:
                _synth_llm = None
    return _synth_llm


def router_node(state: AssistantState) -> Dict[str, Any]:
    """
    Router node:
    Classifies the current user turn using 55/25/20 hybrid scoring and enforces margin guard.
    Detects topic switches between consecutive turns.
    Preserves active multi-domain context on follow-up/precedence queries.
    """
    query = state.get("current_query", "").strip()
    prior_active = list(state.get("active_domains", []))
    prev_dept = state.get("department")

    # Detect conversational anaphora / follow-up queries that depend on active context
    q_clean = query.lower().strip("?!., ")
    is_followup = bool(
        prior_active and (
            any(q_clean.startswith(pat) or q_clean == pat for pat in [
                "what should i fix first", "what should i do first", "which one first",
                "what first", "what to do first", "how do i proceed", "where do i start",
                "who should i contact first", "what order", "which should i do first",
                "what next", "which issue first", "what do i fix first", "so can i still",
            ])
            or (len(q_clean.split()) <= 5 and any(w in q_clean for w in ["first", "order", "start with", "fix first", "do first"]))
        )
    )

    if is_followup and len(prior_active) >= 1:
        target_domains = prior_active
        route_mode = "multi" if len(prior_active) > 1 else "single"
        active_dept = prior_active[0]
        topic_switched = False
        requires_clarification = False
        confidence = 0.92
        department_scores = {d: 0.9 for d in prior_active}
        candidates = prior_active
        routing_reason = f"Contextual follow-up continuing active conversation domains: {prior_active}"
        intent_clauses = [{"domain": d, "clause": query} for d in prior_active]
        margin = 0.5
    else:
        result: RoutingResult = route_query(query)
        new_dept = result.department

        topic_switched = False
        if prev_dept and new_dept != "clarify" and prev_dept != "clarify" and prev_dept != new_dept:
            topic_switched = True

        active_dept = new_dept if not result.requires_clarification else prev_dept
        candidates = [c["domain"] for c in result.candidates] if result.candidates else []
        target_domains = result.target_domains or ([active_dept] if active_dept != "clarify" else [])
        requires_clarification = result.requires_clarification
        confidence = result.confidence
        department_scores = result.department_scores
        routing_reason = result.reason
        margin = result.margin
        route_mode = result.route_mode
        intent_clauses = result.intent_clauses

    new_active = list(dict.fromkeys(prior_active + target_domains))

    topic_history = list(state.get("topic_history", []))
    topic_history.append({
        "turn": len(topic_history) + 1,
        "department": active_dept,
        "route_mode": route_mode,
        "target_domains": target_domains,
        "query": query,
    })

    metadata = dict(state.get("metadata", {}))
    metadata.update({
        "routing_reason": routing_reason,
        "routing_margin": margin,
        "routing_mode": route_mode,
        "intent_clauses": intent_clauses,
    })

    return {
        "department": active_dept or "clarify",
        "previous_department": prev_dept,
        "topic_switched": topic_switched,
        "routing_confidence": confidence,
        "routing_scores": department_scores,
        "requires_clarification": requires_clarification,
        "detected_domains": candidates,
        "target_domains": target_domains,
        "active_domains": new_active,
        "topic_history": topic_history,
        "route_mode": route_mode,
        "intent": active_dept,
        "metadata": metadata,
    }


def route_by_confidence(state: AssistantState) -> str:
    """
    Conditional routing edge function:
    Routes turn to 'clarify', 'orchestrate' (for multi-domain), or a specific domain.
    """
    if state.get("requires_clarification"):
        return "clarify"

    if state.get("route_mode") == "multi":
        return "orchestrate"

    dept = state.get("department", "clarify")
    if not dept or dept == "clarify":
        return "clarify"

    try:
        norm_dept = normalize_department(dept)
        if norm_dept in SUPPORTED_DOMAINS:
            return norm_dept
    except ValueError:
        pass

    return "clarify"


def orchestrate_node(state: AssistantState) -> Dict[str, Any]:
    """
    Multi-domain orchestration node:
    Coordinates parallel domain RAG, infers resolution dependencies,
    and synthesizes a structured unified resolution.
    """
    from backend.orchestration.engine import execute_orchestrated_turn
    from backend.routing.schemas import RoutingResult

    query = state.get("current_query", "")
    target_domains = state.get("target_domains", [])
    routing_result = RoutingResult(
        department=state.get("department", "it"),
        confidence=state.get("routing_confidence", 0.8),
        department_scores=state.get("routing_scores", {}),
        requires_clarification=False,
        route_mode="multi",
        target_domains=target_domains,
        intent_clauses=state.get("metadata", {}).get("intent_clauses", []),
    )

    q_clean = query.lower().strip("?!., ")
    is_precedence_inquiry = any(
        phrase in q_clean for phrase in ["first", "order", "start", "proceed", "fix first", "do first"]
    )

    orch_res = execute_orchestrated_turn(
        query=query,
        routing_result=routing_result,
        conversation_context=None,
    )

    from backend.orchestration.schemas import DependencyRelation

    prior_cross = state.get("cross_domain_resolution") or {}
    prior_deps_raw = prior_cross.get("dependencies", [])
    prior_deps = [
        d if isinstance(d, DependencyRelation) else DependencyRelation(**d)
        for d in prior_deps_raw
    ]
    active_deps = orch_res.dependencies or prior_deps

    if is_precedence_inquiry and active_deps:
        primary_dep = active_deps[0]
        s_name = DOMAIN_CONFIG.get(primary_dep.source_domain, {}).get("display_name", primary_dep.source_domain.upper())
        t_name = DOMAIN_CONFIG.get(primary_dep.target_domain, {}).get("display_name", primary_dep.target_domain.upper())

        precedence_answer = (
            f"Based on campus system resolution dependencies, **you must resolve the {s_name} issue first**:\n\n"
            f"1. **Step 1 ({s_name} — Immediate Prerequisite):** Address {primary_dep.source_issue}. "
            f"{primary_dep.explanation}\n"
            f"2. **Step 2 ({t_name} — Downstream Clearance):** Once {s_name} records clearance, "
            f"{primary_dep.target_issue} will automatically unlock for registration.\n\n"
            f"*(Verified System Workflow: {primary_dep.source_issue} ➔ {primary_dep.target_issue})*"
        )
        orch_res.unified_answer = precedence_answer
        orch_res.dependencies = active_deps

    # Track resolved / unresolved intents
    unresolved = list(state.get("unresolved_intents", []))
    resolved = list(state.get("resolved_intents", []))

    for dept, res in orch_res.resolutions.items():
        if res.solved:
            resolved.append({"domain": dept, "clause": res.query_clause})
        else:
            unresolved.append({"domain": dept, "clause": res.query_clause, "reason": res.handoff_reason})

    metadata = dict(state.get("metadata", {}))
    metadata.update({
        "orchestrated": True,
        "partial_failure": orch_res.partial_failure,
        "dependency_count": len(orch_res.dependencies),
    })

    return {
        "final_answer": orch_res.unified_answer,
        "agent_response": orch_res.unified_answer,
        "agent_confidence": orch_res.overall_confidence,
        "solved": not orch_res.human_required,
        "human_required": orch_res.human_required,
        "handoff_reason": "Some domain issues require human escalation" if orch_res.human_required else None,
        "sources": orch_res.all_sources,
        "citations": orch_res.all_citations,
        "cross_domain_resolution": orch_res.model_dump(),
        "unresolved_intents": unresolved,
        "resolved_intents": resolved,
        "metadata": metadata,
    }


def clarify_node(state: AssistantState) -> Dict[str, Any]:
    """
    Clarification node:
    Prompts the user for clarification when query is ambiguous or confidence margin is small.
    """
    domains = state.get("detected_domains", [])
    if domains:
        display_names = [DOMAIN_CONFIG[d]["display_name"] for d in domains[:3] if d in DOMAIN_CONFIG]
        options = ", ".join(display_names)
        question = (
            f"Could you please clarify which area you need assistance with: {options}?"
        )
    else:
        question = (
            "Could you please clarify your request? I can help with IT services, HR benefits, "
            "Tuition Fees, or Campus Facilities."
        )

    return {
        "final_answer": question,
        "agent_response": question,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "sources": [],
        "citations": [],
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "clarification",
        },
    }


def domain_rag_node(state: AssistantState) -> Dict[str, Any]:
    """
    Unified Domain RAG node:
    Executes grounded MMR retrieval and structured response generation for the active department.
    Ensures context isolation across topic switches.
    """
    query = state.get("current_query", "")
    dept = state.get("department", "it")

    # Format previous turns as conversation context
    # If topic switched, only include current query to prevent cross-domain contamination
    if state.get("topic_switched"):
        conversation_context = "Note: User has switched topic to a new domain."
    else:
        recent_msgs = state.get("messages", [])[-4:]
        conversation_context = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')}" for m in recent_msgs
        )

    rag_result: DomainRAGResult = execute_domain_rag(
        query=query,
        department=dept,
        conversation_context=conversation_context,
    )

    metadata = dict(state.get("metadata", {}))
    metadata.update({
        "agent_domain": dept,
        "rag_retrieved_count": len(rag_result.retrieved_documents or []),
    })

    return {
        "agent_response": rag_result.answer,
        "agent_confidence": rag_result.answer_confidence,
        "solved": rag_result.solved,
        "human_required": rag_result.human_required,
        "handoff_reason": rag_result.handoff_reason,
        "sources": rag_result.sources,
        "citations": rag_result.citations,
        "metadata": metadata,
    }


def synthesize_node(state: AssistantState) -> Dict[str, Any]:
    """
    Synthesize node:
    Refines raw agent response with citations and grounding verification.
    """
    agent_response = state.get("agent_response", "")
    sources = state.get("sources", [])
    query = state.get("current_query", "")

    synth_llm = get_synth_llm()
    if synth_llm is not None:
        try:
            prompt = f"""
You are the CampusOne response synthesizer.
Formulate a concise, clear final answer based exclusively on the department response below.
Do not invent university policies, fees, dates, or contact details.

User Query: {query}
Department Response: {agent_response}
"""
            resp = synth_llm.invoke(prompt)
            final_text = resp.content
        except Exception:
            final_text = agent_response
    else:
        final_text = agent_response

    # If human required, append handoff notice
    if state.get("human_required"):
        handoff_reason = state.get("handoff_reason", "Documentation insufficient")
        final_text = f"{final_text}\n\n[Human Assistance Required: {handoff_reason}]"

    # Append citation references if present
    if sources:
        sources_str = "\n".join(f"- {s}" for s in sources)
        final_text = f"{final_text}\n\n**Sources:**\n{sources_str}"

    return {
        "final_answer": final_text,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "synthesized",
        },
    }


def respond_node(state: AssistantState) -> Dict[str, Any]:
    """
    Respond node:
    Appends the synthesized turn into conversational history.
    """
    final_answer = state.get("final_answer") or state.get("agent_response") or (
        "I could not process your request at this time. Please try again."
    )

    history = list(state.get("messages", []))
    history.append({
        "role": "assistant",
        "content": final_answer,
        "department": state.get("department"),
        "sources": state.get("sources", []),
    })

    return {
        "final_answer": final_answer,
        "messages": history,
        "metadata": {
            **state.get("metadata", {}),
            "response_sent": True,
        },
    }


# Backwards compatibility wrappers
router = router_node
clarify = clarify_node
synthesize = synthesize_node
respond = respond_node
it_query = domain_rag_node
hr_agent = domain_rag_node
fees_agent = domain_rag_node
facilities_agent = domain_rag_node
