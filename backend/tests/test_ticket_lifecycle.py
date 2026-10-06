import pytest
from unittest.mock import MagicMock, patch

try:
    import backend.graph_nodes as gn
    from backend.graph_state import AssistantState
    from backend.graph_nodes import create_ticket, respond, route_by_confidence
except ModuleNotFoundError:
    import graph_nodes as gn
    from graph_state import AssistantState
    from graph_nodes import create_ticket, respond, route_by_confidence


def test_create_ticket_sets_receipt_flags():
    """Verify that create_ticket generates ticket and marks it as newly created."""
    state: AssistantState = {
        "messages": [{"role": "user", "content": "I need a human agent"}],
        "current_query": "I need a human agent",
        "detected_domains": ["IT"],
        "routing_confidence": 0.95,
        "intent": "human",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": True,
        "handoff_reason": "Requested person",
        "ticket_id": None,
        "ticket_requested": True,
        "ticket_just_created": False,
        "ticket_summary": {
            "subject": "Human agent request",
            "department": "IT",
            "issue_summary": "User wants a human",
            "conversation_summary": "Requested person",
            "attempted_steps": [],
            "current_status": "Escalated",
            "priority": "medium",
            "escalation_reason": "Explicit user request",
        },
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    result = create_ticket(state)
    assert result["ticket_id"].startswith("TKT-")
    assert result["ticket_just_created"] is True
    assert result["ticket_requested"] is False
    assert result["metadata"]["ticket_newly_raised"] is True
    assert result["metadata"]["active_ticket_id"] == result["ticket_id"]


def test_respond_delivers_receipt_on_creation_turn():
    """Verify respond outputs formal receipt when ticket_just_created is True."""
    state: AssistantState = {
        "messages": [],
        "current_query": "Escalate this",
        "detected_domains": ["IT"],
        "routing_confidence": 0.95,
        "intent": "human",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": True,
        "handoff_reason": "Escalated",
        "ticket_id": "TKT-ABC12345",
        "ticket_requested": False,
        "ticket_just_created": True,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    result = respond(state)
    assert "Your issue has been raised as internal support ticket TKT-ABC12345" in result["final_answer"]
    # The flag must be consumed on delivery
    assert result["ticket_just_created"] is False
    assert result["metadata"]["ticket_newly_raised"] is True


def test_respond_delivers_real_answer_on_followup_turn():
    """Verify respond delivers specialist answer on subsequent turns without repeating receipt."""
    state: AssistantState = {
        "messages": [
            {"role": "user", "content": "I need help with Wi-Fi"},
            {"role": "assistant", "content": "Your issue has been raised as internal support ticket TKT-ABC12345."},
        ],
        "current_query": "How long will it take for someone to look at my ticket?",
        "detected_domains": ["IT"],
        "routing_confidence": 0.90,
        "intent": "it",
        "agent_response": "IT technicians typically review submitted tickets within 2 business hours.",
        "agent_confidence": 0.95,
        "solved": True,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": "TKT-ABC12345",  # Ticket still exists on thread
        "ticket_requested": False,
        "ticket_just_created": False,  # Was consumed on prior turn!
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": "IT technicians typically review submitted tickets within 2 business hours.",
        "metadata": {"active_ticket_id": "TKT-ABC12345"},
    }

    result = respond(state)
    # Must deliver the real answer, NOT the canned creation receipt!
    assert "IT technicians typically review submitted tickets within 2 business hours" in result["final_answer"]
    assert "Your issue has been raised as internal support ticket" not in result["final_answer"]
    assert result["metadata"]["ticket_newly_raised"] is False


def test_personal_belongings_routing_triggers_clarification():
    """Verify that ambiguous lost personal belongings queries do not score high confidence Facilities."""
    # Under our updated route_by_confidence, confidence < 0.75 triggers clarify
    state: AssistantState = {
        "messages": [],
        "current_query": "I lost my belt bro what do I do?",
        "detected_domains": ["General", "Facilities"],
        "routing_confidence": 0.55,  # Ambiguous band
        "intent": "general",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "ticket_id": None,
        "ticket_requested": False,
        "ticket_just_created": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    next_node = route_by_confidence(state)
    assert next_node == "clarify"


def test_clean_content_strips_emojis_and_formats_markdown_lists():
    """Verify _clean_content formats emoji numbers into standard Markdown lists and strips emojis."""
    raw_text = (
        "Sure! To request a reprint of your university ID card, you’ll generally need to: "
        "1️⃣ Contact the Student Services or ID Office. "
        "2️⃣ Fill out the ID‑card re‑issue form. "
        "3️⃣ Pay any applicable re‑issue fee. 💡"
    )
    cleaned = gn._clean_content(raw_text)

    # Must contain Markdown list items
    assert "1. Contact the Student Services" in cleaned
    assert "2. Fill out the ID‑card" in cleaned
    assert "3. Pay any applicable" in cleaned

    # Must NOT contain any emojis
    assert "1️⃣" not in cleaned
    assert "2️⃣" not in cleaned
    assert "3️⃣" not in cleaned
    assert "💡" not in cleaned


def test_should_raise_ticket_conversational_ticket_commands():
    """Verify should_raise_ticket recognizes 'bro ticket', 'help me raise a ticket', etc."""
    base_state: AssistantState = {
        "messages": [
            {"role": "user", "content": "How do I reprint my ID?"},
            {"role": "assistant", "content": "Contact student services to apply."},
        ],
        "current_query": "help me raise a ticket for the same",
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
        "ticket_just_created": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    assert gn.should_raise_ticket(base_state) is True

    # Also test "bro ticket"
    state_bro = {**base_state, "current_query": "bro ticket"}
    assert gn.should_raise_ticket(state_bro) is True

    # Also test plain "ticket"
    state_ticket = {**base_state, "current_query": "ticket"}
    assert gn.should_raise_ticket(state_ticket) is True


def test_create_ticket_allows_new_ticket_when_prior_ticket_existed():
    """Verify create_ticket requests fresh summary when new ticket is requested, even if ticket_id was set."""
    state: AssistantState = {
        "messages": [
            {"role": "user", "content": "Earlier issue"},
            {"role": "assistant", "content": "Ticket raised"},
            {"role": "user", "content": "help me raise a ticket for my ID"},
        ],
        "current_query": "help me raise a ticket for my ID",
        "detected_domains": ["General"],
        "routing_confidence": 0.90,
        "intent": "human",
        "agent_response": None,
        "agent_confidence": 0.0,
        "solved": False,
        "human_required": True,
        "handoff_reason": None,
        "ticket_id": "TKT-OLD12345",  # Old ticket already existed
        "ticket_requested": False,   # Router just sent user here
        "ticket_just_created": False,
        "ticket_summary": None,
        "sources": [],
        "retrieved_chunks": [],
        "final_answer": None,
        "metadata": {},
    }

    result = create_ticket(state)
    assert result["ticket_requested"] is True
    assert result["ticket_summary"] is None
    assert result["metadata"]["ticket_summary_requested"] is True

