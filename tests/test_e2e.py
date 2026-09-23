"""End-to-End Pipeline Tests (Agent 4).
Verifies complete flow: Query -> Router -> Margin Guard -> Domain RAG -> Grounded Response -> Citations.
"""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document

from backend.graph_state import AssistantState
from backend.graph import run_workflow
from backend.rag.schemas import DomainRAGResult


class TestEndToEndPipeline:
    @patch("backend.graph_nodes.execute_domain_rag")
    def test_e2e_it_domain_pipeline(self, mock_rag):
        """Test full pipeline execution for an IT domain query."""
        mock_rag.return_value = DomainRAGResult(
            answer="Eduroam authentication requires username@campus.edu and active password.",
            department="it",
            answer_confidence=0.91,
            sources=["it_network_policy.pdf, page 4"],
            citations=[{"source": "it_network_policy.pdf", "page": 4, "excerpt": "username@campus.edu"}],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "How do I connect to the campus Eduroam Wi-Fi network?",
            "messages": [],
        }

        output = run_workflow(state, thread_id="e2e_it")

        # 1. Router verification
        assert output["department"] == "it"
        assert output["requires_clarification"] is False
        assert output["routing_confidence"] > 0.45

        # 2. RAG verification
        assert output["solved"] is True
        assert output["agent_confidence"] == 0.91
        assert len(output["sources"]) == 1
        assert "it_network_policy.pdf" in output["sources"][0]

        # 3. Grounded synthesized response
        assert "Eduroam" in output["final_answer"]
        assert "Sources:" in output["final_answer"]
        assert len(output["messages"]) == 1
        assert output["messages"][0]["role"] == "assistant"

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_e2e_fees_domain_pipeline(self, mock_rag):
        """Test full pipeline execution for a Fees domain query."""
        mock_rag.return_value = DomainRAGResult(
            answer="Semester tuition fees must be paid before October 31 via the netbanking portal.",
            department="fees",
            answer_confidence=0.95,
            sources=["tuition_schedule_2026.pdf, page 1"],
            citations=[{"source": "tuition_schedule_2026.pdf", "page": 1, "excerpt": "before October 31"}],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "What is the deadline for paying autumn semester tuition fees?",
            "messages": [],
        }

        output = run_workflow(state, thread_id="e2e_fees")

        assert output["department"] == "fees"
        assert output["solved"] is True
        assert "October 31" in output["final_answer"]
        assert "tuition_schedule_2026.pdf" in output["final_answer"]

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_e2e_facilities_domain_pipeline(self, mock_rag):
        """Test full pipeline execution for a Facilities domain query."""
        mock_rag.return_value = DomainRAGResult(
            answer="Report hostel maintenance by contacting the resident warden desk.",
            department="facilities",
            answer_confidence=0.88,
            sources=["hostel_handbook.pdf, page 12"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "The air conditioning in room 204 of hostel 5 is leaking water.",
            "messages": [],
        }

        output = run_workflow(state, thread_id="e2e_facilities")

        assert output["department"] == "facilities"
        assert output["solved"] is True
        assert "warden" in output["final_answer"]

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_e2e_hr_domain_pipeline(self, mock_rag):
        """Test full pipeline execution for an HR domain query."""
        mock_rag.return_value = DomainRAGResult(
            answer="Monthly salary payslips are available on the employee self-service portal.",
            department="hr",
            answer_confidence=0.93,
            sources=["hr_payroll_guide.pdf, page 2"],
            citations=[],
            solved=True,
            human_required=False,
            handoff_reason=None,
        )

        state: AssistantState = {
            "current_query": "Where can faculty members download their monthly salary payslip?",
            "messages": [],
        }

        output = run_workflow(state, thread_id="e2e_hr")

        assert output["department"] == "hr"
        assert output["solved"] is True
        assert "payslips" in output["final_answer"]

    def test_e2e_clarification_pipeline(self):
        """Test ambiguous query triggers Margin Guard and directs to clarification."""
        state: AssistantState = {
            "current_query": "My account is blocked",
            "messages": [],
        }

        output = run_workflow(state, thread_id="e2e_clarify")

        assert output["requires_clarification"] is True
        assert output["solved"] is False
        assert output["human_required"] is False
        assert "clarify" in output["final_answer"].lower()

    @patch("backend.graph_nodes.execute_domain_rag")
    def test_e2e_multi_turn_topic_switching(self, mock_rag):
        """Test multi-turn interaction with topic switching from IT to Fees."""
        mock_rag.side_effect = [
            DomainRAGResult(
                answer="To reset your password, visit auth.campus.edu/reset.",
                department="it",
                answer_confidence=0.9,
                sources=["auth.pdf"],
                citations=[],
                solved=True,
                human_required=False,
            ),
            DomainRAGResult(
                answer="Tuition fees can be paid via NEFT or online credit card.",
                department="fees",
                answer_confidence=0.92,
                sources=["fees.pdf"],
                citations=[],
                solved=True,
                human_required=False,
            ),
        ]

        # Turn 1
        state1: AssistantState = {
            "current_query": "I forgot my student portal password.",
            "messages": [],
        }
        res1 = run_workflow(state1, thread_id="multi_turn_session")
        assert res1["department"] == "it"
        assert res1["topic_switched"] is False

        # Turn 2: Switch to fees
        state2: AssistantState = {
            **res1,
            "current_query": "What are the bank account details for paying semester tuition fees?",
        }
        res2 = run_workflow(state2, thread_id="multi_turn_session")
        assert res2["department"] == "fees"
        assert res2["previous_department"] == "it"
        assert res2["topic_switched"] is True
        assert len(res2["messages"]) == 2
