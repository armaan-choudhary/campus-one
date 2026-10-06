import pytest
from unittest.mock import patch, MagicMock
from langchain_core.documents import Document

try:
    from backend.graph_state import AssistantState, AgentQueryResponse
    from backend.graph_nodes import route_by_confidence, multi_domain_orchestrator
    from backend.graph import build_graph
except ModuleNotFoundError:
    from graph_state import AssistantState, AgentQueryResponse
    from graph_nodes import route_by_confidence, multi_domain_orchestrator
    from graph import build_graph


def test_route_by_confidence_routes_high_confidence_coupled_queries_to_multi_domain():
    state: AssistantState = {
        "messages": [{"role": "user", "content": "I paid my hostel fees but portal says unpaid and I cannot register for exams"}],
        "current_query": "I paid my hostel fees but portal says unpaid and I cannot register for exams",
        "detected_domains": ["Fees", "IT"],
        "routing_confidence": 0.92,
        "intent": "Fees",
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

    destination = route_by_confidence(state)
    assert destination == "multi_domain"


def test_route_by_confidence_routes_low_confidence_multi_domain_to_clarify():
    state: AssistantState = {
        "messages": [{"role": "user", "content": "I have an account issue and maybe a card problem"}],
        "current_query": "I have an account issue and maybe a card problem",
        "detected_domains": ["Fees", "IT"],
        "routing_confidence": 0.55,
        "intent": None,
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

    destination = route_by_confidence(state)
    assert destination == "clarify"


def test_multi_domain_orchestrator_parallel_execution_and_aggregation():
    state: AssistantState = {
        "messages": [{"role": "user", "content": "Coupled finance and IT problem"}],
        "current_query": "Coupled finance and IT problem",
        "detected_domains": ["Fees", "IT"],
        "routing_confidence": 0.88,
        "intent": "Fees",
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

    mock_fees_response = {
        "agent_response": "Fees resolution guidance.",
        "agent_confidence": 0.90,
        "solved": True,
        "human_required": False,
        "handoff_reason": None,
        "sources": ["finance_policy.pdf, page 1"],
        "retrieved_chunks": [{"content": "Fee policy", "source": "finance_policy.pdf"}],
        "metadata": {"agent_domain": "Fees"},
    }

    mock_it_response = {
        "agent_response": "IT portal guidance.",
        "agent_confidence": 0.85,
        "solved": True,
        "human_required": False,
        "handoff_reason": None,
        "sources": ["it_guide.pdf, page 2", "shared_doc.pdf"],
        "retrieved_chunks": [{"content": "IT manual", "source": "it_guide.pdf"}],
        "metadata": {"agent_domain": "IT"},
    }

    with patch("backend.graph_nodes.fees_agent", return_value=mock_fees_response) if "backend.graph_nodes" in globals() else patch("graph_nodes.fees_agent", return_value=mock_fees_response), \
         patch("backend.graph_nodes.it_query", return_value=mock_it_response) if "backend.graph_nodes" in globals() else patch("graph_nodes.it_query", return_value=mock_it_response):
        
        result = multi_domain_orchestrator(state)

        assert "Fees" in result["agent_response"]
        assert "IT" in result["agent_response"]
        assert "finance_policy.pdf, page 1" in result["sources"]
        assert "it_guide.pdf, page 2" in result["sources"]
        assert len(result["retrieved_chunks"]) == 2
        assert result["metadata"]["multi_domain"] is True
        assert result["metadata"]["agent_domain"] == "Multi-Domain"
        assert result["solved"] is True


def test_build_graph_includes_multi_domain_node():
    graph = build_graph()
    # Ensure the compiled graph includes the new multi_domain_agent node
    assert "multi_domain_agent" in graph.nodes
