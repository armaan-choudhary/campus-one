import pytest
from unittest.mock import MagicMock, patch
from pydantic import ValidationError

try:
    import backend.graph_nodes as gn
    from backend.graph_state import (
        AssistantState,
        ClarificationOption,
        ClarificationOutput,
        DepartmentRoute,
    )
    from backend.graph_nodes import clarify, router, route_by_confidence
except ModuleNotFoundError:
    import graph_nodes as gn
    from graph_state import (
        AssistantState,
        ClarificationOption,
        ClarificationOutput,
        DepartmentRoute,
    )
    from graph_nodes import clarify, router, route_by_confidence


def test_clarification_schema_valid():
    """Verify ClarificationOutput validates and parses structured options correctly."""
    data = {
        "question": "Are you asking about campus Wi-Fi or tuition fees?",
        "options": [
            {
                "id": "wifi_login",
                "label": "Campus Wi-Fi & Portal Login",
                "department": "IT",
            },
            {
                "id": "tuition_fees",
                "label": "Tuition Fees & Payments",
                "department": "Fees",
            },
        ],
    }
    parsed = ClarificationOutput(**data)
    assert parsed.question == "Are you asking about campus Wi-Fi or tuition fees?"
    assert len(parsed.options) == 2
    assert parsed.options[0].department == "IT"
    assert parsed.options[1].department == "Fees"


def test_clarification_schema_rejects_unsupported_department():
    """Verify ClarificationOutput rejects unsupported department values."""
    with pytest.raises(ValidationError):
        ClarificationOutput(
            question="Which department?",
            options=[
                {"id": "opt1", "label": "Option 1", "department": "Astronomy"},
                {"id": "opt2", "label": "Option 2", "department": "IT"},
            ],
        )


def test_clarification_schema_enforces_bounds():
    """Verify ClarificationOutput requires at least 2 options."""
    with pytest.raises(ValidationError):
        ClarificationOutput(
            question="Which department?",
            options=[
                {"id": "opt1", "label": "Single Option", "department": "IT"},
            ],
        )


def test_clarify_node_invokes_llm_successfully():
    """Verify clarify node invokes structured LLM and packages output correctly."""
    mock_output = ClarificationOutput(
        question="Which system do you need help accessing?",
        options=[
            ClarificationOption(
                id="portal_access",
                label="Student Portal Login",
                department="IT",
            ),
            ClarificationOption(
                id="fee_portal",
                label="Fee Payment Portal",
                department="Fees",
            ),
        ],
    )

    mock_llm = MagicMock()
    mock_llm.invoke.return_value = mock_output

    state: AssistantState = {
        "messages": [{"role": "user", "content": "My account has an error"}],
        "current_query": "My account has an error",
        "detected_domains": ["IT", "Fees"],
        "routing_confidence": 0.55,
        "intent": "clarify",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {"reason": "Ambiguous between IT and Fees", "clarification_attempts": 0},
    }

    with patch.object(gn, "get_clarify_llm", return_value=mock_llm):
        result = clarify(state)

    assert result["intent"] == "clarify"
    assert result["final_answer"] == "Which system do you need help accessing?"
    assert result["detected_domains"] == ["IT", "Fees"]
    assert result["metadata"]["outcome"] == "clarification"
    assert result["metadata"]["clarification_attempts"] == 1
    assert len(result["metadata"]["clarification_options"]) == 2
    assert result["metadata"]["clarification_options"][0]["label"] == "Student Portal Login"


def test_clarify_node_graceful_fallback_on_error():
    """Verify clarify node falls back to deterministic options if LLM call fails."""
    mock_llm = MagicMock()
    mock_llm.invoke.side_effect = RuntimeError("Groq API Timeout")

    state: AssistantState = {
        "messages": [{"role": "user", "content": "Help me with account"}],
        "current_query": "Help me with account",
        "detected_domains": ["IT", "Fees"],
        "routing_confidence": 0.50,
        "intent": "clarify",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {"clarification_attempts": 0},
    }

    with patch.object(gn, "get_clarify_llm", return_value=mock_llm):
        result = clarify(state)

    assert result["intent"] == "clarify"
    assert "Could you clarify which area you need help with" in result["final_answer"]
    assert result["metadata"]["outcome"] == "clarification"
    assert result["metadata"]["clarification_attempts"] == 1
    assert len(result["metadata"]["clarification_options"]) == 2


def test_clarify_node_loop_guard_escalates():
    """Verify clarify node escalates to ticket creation when max attempts (2) are reached."""
    state: AssistantState = {
        "messages": [
            {"role": "user", "content": "Still not sure"},
        ],
        "current_query": "Still not sure",
        "detected_domains": ["IT", "Fees"],
        "routing_confidence": 0.40,
        "intent": "clarify",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {"clarification_attempts": 2},
    }

    result = clarify(state)

    assert result["ticket_requested"] is True
    assert result["intent"] == "human"
    assert result["human_required"] is True
    assert result["metadata"]["outcome"] == "handoff"
    assert result["metadata"]["clarification_attempts"] == 3
    assert result["handoff_reason"] == "Maximum clarification attempts reached."


def test_router_preserves_existing_metadata():
    """Verify router node preserves existing metadata keys across turns."""
    mock_route = DepartmentRoute(
        route="IT",
        departments=["IT"],
        understood=True,
        confidence=0.95,
        reason="Clear password reset query",
    )
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = mock_route

    state: AssistantState = {
        "messages": [],
        "current_query": "Reset my password",
        "detected_domains": [],
        "routing_confidence": 0.0,
        "intent": None,
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {
            "clarification_attempts": 1,
            "session_source": "web_chat",
        },
    }

    with patch.object(gn, "get_router_llm", return_value=mock_llm):
        result = router(state)

    # Metadata must preserve prior keys, not overwrite
    assert result["metadata"]["clarification_attempts"] == 1
    assert result["metadata"]["session_source"] == "web_chat"
    assert result["metadata"]["reason"] == "Clear password reset query"


def test_clarify_node_loop_guard_general_exempt_from_ticket():
    """Verify clarify loop guard provides general guidance without opening support ticket for General queries."""
    state: AssistantState = {
        "messages": [
            {"role": "user", "content": "I lost my shirt in the hostel"},
            {"role": "assistant", "content": "Have you checked the desk?"},
            {"role": "user", "content": "nope"},
        ],
        "current_query": "nope",
        "detected_domains": ["General"],
        "routing_confidence": 0.50,
        "intent": "general",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {"clarification_attempts": 2},
    }

    result = clarify(state)

    assert result["ticket_requested"] is not True
    assert result["solved"] is True
    assert result["human_required"] is False
    assert result["intent"] == "general"
    assert "Lost & Found" in result["final_answer"]
    assert result["metadata"]["outcome"] == "general_guidance"


def test_route_by_confidence_intra_domain_gating():
    """Verify that when all candidate domains point to a single department, route directly without clarify."""
    state: AssistantState = {
        "messages": [{"role": "user", "content": "My hostel shower head is leaking"}],
        "current_query": "My hostel shower head is leaking",
        "detected_domains": ["Facilities", "Facilities"],
        "routing_confidence": 0.60,
        "intent": "facilities",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    next_node = route_by_confidence(state)
    assert next_node == "facilities"


def test_route_by_confidence_short_continuation_preserves_domain():
    """Verify short continuation answers ('nope', 'no') route to previous active domain rather than clarify."""
    state: AssistantState = {
        "messages": [
            {"role": "user", "content": "I need help with Wi-Fi login"},
            {"role": "assistant", "content": "Have you tried resetting your campus password?"},
            {"role": "user", "content": "nope"},
        ],
        "current_query": "nope",
        "detected_domains": [],
        "routing_confidence": 0.20,
        "intent": None,
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {"agent_domain": "IT"},
    }

    next_node = route_by_confidence(state)
    assert next_node == "it"


def test_route_by_confidence_general_query_direct():
    """Verify general/lost personal belongings query with high confidence routes directly to general."""
    state: AssistantState = {
        "messages": [{"role": "user", "content": "I can't find my shirt dude I kept it on my hostel bed"}],
        "current_query": "I can't find my shirt dude I kept it on my hostel bed",
        "detected_domains": ["General"],
        "routing_confidence": 0.85,
        "intent": "general",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    next_node = route_by_confidence(state)
    assert next_node == "general"
