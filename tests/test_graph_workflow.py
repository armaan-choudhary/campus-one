"""Tests for LangGraph Workflow Orchestration (Agent 3)."""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document

from backend.graph_state import AssistantState
from backend.graph_nodes import (
    router_node,
    clarify_node,
    domain_rag_node,
    synthesize_node,
    respond_node,
    route_by_confidence,
)
from backend.graph import build_graph, get_compiled_graph, run_workflow
from backend.rag.schemas import DomainRAGResult


class TestGraphNodes:
    def test_router_node_unambiguous(self):
        """Test router node assigns department and calculates confidence."""
        state: AssistantState = {"current_query": "How do I reset my student portal password?"}
        res = router_node(state)
        assert res["department"] == "it"
        assert res["requires_clarification"] is False
        assert res["routing_confidence"] > 0.45
        assert "it" in res["detected_domains"]

    def test_router_node_ambiguous_triggers_clarification(self):
        """Test router node flags ambiguous query for clarification."""
        state: AssistantState = {"current_query": "My account is blocked"}
        res = router_node(state)
        assert res["requires_clarification"] is True
        assert res["department"] == "clarify"

    def test_route_by_confidence_branching(self):
        """Test conditional branching edge."""
        assert route_by_confidence({"requires_clarification": True, "department": "it"}) == "clarify"
        assert route_by_confidence({"requires_clarification": False, "department": "it"}) == "it"
        assert route_by_confidence({"requires_clarification": False, "department": "fees"}) == "fees"
        assert route_by_confidence({"requires_clarification": False, "department": "hr"}) == "hr"
        assert route_by_confidence({"requires_clarification": False, "department": "facilities"}) == "facilities"
        assert route_by_confidence({"requires_clarification": False, "department": "unknown"}) == "clarify"

    def test_clarify_node_response(self):
        """Test clarify node generates polite clarification question."""
        state: AssistantState = {
            "current_query": "Help",
            "detected_domains": ["it", "fees"],
        }
        res = clarify_node(state)
        assert "clarify" in res["final_answer"].lower()
        assert res["solved"] is False
        assert res["human_required"] is False

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_domain_rag_node_invokes_unified_rag(self, mock_rag):
        """Test domain_rag node executes RAG with proper department."""
        mock_rag.return_value = DomainRAGResult(
            answer="Eduroam requires student credentials.",
            department="it",
            answer_confidence=0.9,
            sources=["it_guide.pdf, page 1"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "How to connect to Eduroam?",
            "department": "it",
            "topic_switched": False,
            "messages": [],
        }

        res = domain_rag_node(state)
        assert res["agent_response"] == "Eduroam requires student credentials."
        assert res["solved"] is True
        assert res["agent_confidence"] == 0.9
        assert len(res["sources"]) == 1

    def test_synthesize_and_respond_nodes(self):
        """Test synthesis and respond state updates."""
        state: AssistantState = {
            "current_query": "What are gym timings?",
            "agent_response": "Gym is open from 6am to 9pm daily.",
            "sources": ["gym_policy.pdf"],
            "messages": [],
            "department": "facilities",
        }

        synth_res = synthesize_node(state)
        assert "Gym is open" in synth_res["final_answer"]
        assert "gym_policy.pdf" in synth_res["final_answer"]

        state.update(synth_res)
        resp_res = respond_node(state)
        assert len(resp_res["messages"]) == 1
        assert resp_res["messages"][0]["role"] == "assistant"


class TestFullGraphWorkflow:
    @patch("backend.graph_nodes.execute_domain_rag")
    def test_end_to_end_graph_execution_it(self, mock_rag):
        """Test complete workflow execution for an IT query."""
        mock_rag.return_value = DomainRAGResult(
            answer="To configure VPN, download the campus client from the intranet.",
            department="it",
            answer_confidence=0.92,
            sources=["vpn_manual.pdf, page 3"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        initial_state: AssistantState = {
            "current_query": "How do I configure the university VPN on Linux?",
            "messages": [],
        }

        final_state = run_workflow(initial_state, thread_id="test_it_flow")
        assert final_state["department"] == "it"
        assert final_state["solved"] is True
        assert "VPN" in final_state["final_answer"]
        assert len(final_state["messages"]) == 1

    def test_end_to_end_graph_clarification(self):
        """Test workflow execution for an ambiguous query routing to clarification."""
        initial_state: AssistantState = {
            "current_query": "My account is blocked",
            "messages": [],
        }

        final_state = run_workflow(initial_state, thread_id="test_clarify_flow")
        assert final_state["requires_clarification"] is True
        assert "clarify" in final_state["final_answer"].lower()
        assert final_state["solved"] is False
