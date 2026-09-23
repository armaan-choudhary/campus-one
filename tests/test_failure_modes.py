"""Tests for System Failure Modes, Exceptions, and Escalation (Agent 4)."""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document

from backend.routing.hybrid_router import route_query, HybridRouter
from backend.rag.engine import execute_domain_rag, retrieve_domain_documents
from backend.rag.config import normalize_department
from backend.graph import run_workflow
from backend.graph_state import AssistantState


class TestFailureModes:
    def test_empty_and_whitespace_query_handling(self):
        """Test router handles empty and pure whitespace queries gracefully."""
        res_empty = route_query("")
        assert res_empty.department == "clarify"
        assert res_empty.confidence == 0.0
        assert res_empty.requires_clarification is True

        res_space = route_query("     \n\t  ")
        assert res_space.department == "clarify"
        assert res_space.requires_clarification is True

    def test_invalid_department_raises_cleanly(self):
        """Invalid department must raise ValueError with list of supported departments."""
        with pytest.raises(ValueError, match="Unsupported department"):
            normalize_department("athletics")

        with pytest.raises(ValueError, match="Unsupported department"):
            execute_domain_rag(query="test", department="space_exploration")

    def test_empty_retrieval_triggers_human_escalation(self):
        """When vector database returns 0 documents, system must escalate to human."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = []
        mock_store.as_retriever.return_value = mock_retriever

        result = execute_domain_rag(
            query="Where can I pay fees?",
            department="fees",
            vector_store=mock_store,
        )

        assert result.solved is False
        assert result.human_required is True
        assert result.answer_confidence == 0.0
        assert "No relevant documentation found" in (result.handoff_reason or "")

    def test_pgvector_database_exception_handling(self):
        """When database throws connection or timeout error, retrieval raises or escalates."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.side_effect = ConnectionError("Could not connect to PostgreSQL 16")
        mock_store.as_retriever.return_value = mock_retriever

        with pytest.raises(ConnectionError):
            retrieve_domain_documents("query", "it", vector_store=mock_store)

    def test_low_confidence_rag_escalation(self):
        """When grounding confidence is < 0.75, mark human_required=True."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = [
            Document(page_content="Brief mention.", metadata={"source": "faq.pdf"})
        ]
        mock_store.as_retriever.return_value = mock_retriever

        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            answer="I am guessing the procedure.",
            answer_confidence=0.40,
            citations=[],
        )

        result = execute_domain_rag(
            query="obscure university policy inquiry",
            department="hr",
            vector_store=mock_store,
            llm=mock_llm,
        )

        assert result.answer_confidence == 0.40
        assert result.solved is False
        assert result.human_required is True
        assert "documentation does not provide enough information" in result.handoff_reason

    def test_workflow_recovers_when_agent_response_is_none(self):
        """If a node somehow leaves agent_response empty, respond node provides fallback text."""
        state: AssistantState = {
            "current_query": "hello",
            "department": "clarify",
            "agent_response": None,
            "final_answer": None,
            "messages": [],
        }
        from backend.graph_nodes import respond_node
        res = respond_node(state)
        assert res["final_answer"] is not None
        assert len(res["final_answer"]) > 0
        assert len(res["messages"]) == 1

    def test_malformed_model_output_fallback(self):
        """If external LLM invocation fails or returns None, fallback grounded response takes over."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = [
            Document(
                page_content="Hostel geysers operate from 6am to 9am during winter months.",
                metadata={"source": "hostel_rules.pdf", "page": 3},
            )
        ]
        mock_store.as_retriever.return_value = mock_retriever

        mock_failing_llm = MagicMock()
        mock_failing_llm.invoke.side_effect = RuntimeError("Groq API 503 Service Unavailable")

        result = execute_domain_rag(
            query="What are hostel geyser timings?",
            department="facilities",
            vector_store=mock_store,
            llm=mock_failing_llm,
        )

        # Fallback should engage and extract facts from document
        assert result.solved is True
        assert result.answer_confidence >= 0.70
        assert "hostel_rules.pdf" in result.sources[0]
