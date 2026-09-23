"""Tests for Multi-Turn Topic Switching and Context Isolation (Agent 3)."""
import pytest
from unittest.mock import MagicMock, patch

from backend.graph_state import AssistantState
from backend.graph_nodes import router_node, domain_rag_node
from backend.graph import run_workflow
from backend.rag.schemas import DomainRAGResult


class TestTopicSwitching:
    def test_topic_switch_it_to_fees(self):
        """Turn 1: IT -> Turn 2: Fees. topic_switched must be True and history preserved."""
        # Turn 1: IT turn
        state_turn1: AssistantState = {
            "current_query": "My hostel Wi-Fi isn't working.",
            "messages": [],
        }
        res1 = router_node(state_turn1)
        assert res1["department"] == "it"
        assert res1["topic_switched"] is False

        # Simulate state after Turn 1 response
        state_after_turn1: AssistantState = {
            **state_turn1,
            **res1,
            "messages": [
                {"role": "user", "content": "My hostel Wi-Fi isn't working."},
                {"role": "assistant", "content": "Please reconnect to Eduroam with your campus credentials."},
            ],
            "current_query": "When do I need to pay my semester fees?",
        }

        # Turn 2: Fees turn
        res2 = router_node(state_after_turn1)
        assert res2["department"] == "fees"
        assert res2["previous_department"] == "it"
        assert res2["topic_switched"] is True

    def test_topic_switch_fees_to_facilities(self):
        """Turn 1: Fees -> Turn 2: Facilities. topic_switched must be True."""
        state: AssistantState = {
            "department": "fees",
            "previous_department": None,
            "current_query": "The air conditioning in hostel room 302 is broken and leaking.",
            "messages": [{"role": "user", "content": "fees query"}],
        }
        res = router_node(state)
        assert res["department"] == "facilities"
        assert res["previous_department"] == "fees"
        assert res["topic_switched"] is True

    def test_topic_switch_facilities_to_it(self):
        """Turn 1: Facilities -> Turn 2: IT. topic_switched must be True."""
        state: AssistantState = {
            "department": "facilities",
            "previous_department": None,
            "current_query": "How do I setup the university VPN on my laptop?",
            "messages": [],
        }
        res = router_node(state)
        assert res["department"] == "it"
        assert res["previous_department"] == "facilities"
        assert res["topic_switched"] is True

    def test_topic_switch_hr_to_it(self):
        """Turn 1: HR -> Turn 2: IT. topic_switched must be True."""
        state: AssistantState = {
            "department": "hr",
            "previous_department": None,
            "current_query": "I forgot my student portal password and cannot log in.",
            "messages": [],
        }
        res = router_node(state)
        assert res["department"] == "it"
        assert res["previous_department"] == "hr"
        assert res["topic_switched"] is True

    def test_same_domain_continuation(self):
        """Turn 1: IT -> Turn 2: IT. topic_switched must be False."""
        state: AssistantState = {
            "department": "it",
            "previous_department": None,
            "current_query": "Can I also configure this VPN connection on Ubuntu Linux?",
            "messages": [{"role": "user", "content": "How do I connect to VPN?"}],
        }
        res = router_node(state)
        assert res["department"] == "it"
        assert res["topic_switched"] is False

    def test_ambiguous_follow_up_preserves_department(self):
        """Turn 1: IT -> Turn 2: Ambiguous query. Clarification triggered without losing prior dept context."""
        state: AssistantState = {
            "department": "it",
            "previous_department": None,
            "current_query": "My account is blocked",
            "messages": [{"role": "user", "content": "IT query"}],
        }
        res = router_node(state)
        assert res["requires_clarification"] is True
        assert res["topic_switched"] is False

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_cross_domain_context_isolation(self, mock_rag):
        """Verify that when topic_switched is True, previous domain context does not contaminate RAG call."""
        mock_rag.return_value = DomainRAGResult(
            answer="Fee payment deadline is October 15.",
            department="fees",
            answer_confidence=0.9,
            sources=["fees.pdf"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "When do I need to pay my semester fees?",
            "department": "fees",
            "previous_department": "it",
            "topic_switched": True,
            "messages": [
                {"role": "user", "content": "My Wi-Fi is broken"},
                {"role": "assistant", "content": "Try rebooting your network router"},
            ],
        }

        domain_rag_node(state)

        # Verify that execute_domain_rag was invoked with isolated context
        mock_rag.assert_called_once()
        call_kwargs = mock_rag.call_args[1]
        assert call_kwargs["department"] == "fees"
        assert "User has switched topic" in call_kwargs["conversation_context"]
        # Make sure Wi-Fi advice was NOT passed into the fees RAG prompt!
        assert "router" not in call_kwargs["conversation_context"]
