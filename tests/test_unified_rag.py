"""Tests for Unified Domain RAG Engine (Agent 1)."""
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.documents import Document

from backend.rag.config import DOMAIN_CONFIG, SUPPORTED_DOMAINS, normalize_department
from backend.rag.schemas import DomainRAGResult, DepartmentRAGResponse, Citation
from backend.rag.engine import (
    execute_domain_rag,
    retrieve_domain_documents,
    format_retrieved_documents,
)


class TestUnifiedRAGConfig:
    def test_domain_config_collections(self):
        """Test that all four domains map to their exact PGVector collections."""
        assert DOMAIN_CONFIG["it"]["collection"] == "it_knowledge"
        assert DOMAIN_CONFIG["hr"]["collection"] == "hr_knowledge"
        assert DOMAIN_CONFIG["fees"]["collection"] == "finance_knowledge"
        assert DOMAIN_CONFIG["facilities"]["collection"] == "facilities_knowledge"

    def test_normalize_department(self):
        """Test alias and department key normalization."""
        assert normalize_department("it") == "it"
        assert normalize_department("IT") == "it"
        assert normalize_department("HR") == "hr"
        assert normalize_department("fees") == "fees"
        assert normalize_department("finance") == "fees"
        assert normalize_department("fees and finance") == "fees"
        assert normalize_department("facilities") == "facilities"
        assert normalize_department("facilities and maintenance") == "facilities"

    def test_invalid_department_raises(self):
        """Test that invalid department raises ValueError."""
        with pytest.raises(ValueError, match="Unsupported department"):
            normalize_department("unknown_department")

        with pytest.raises(ValueError):
            normalize_department("")


class TestUnifiedRAGRetrieval:
    def test_empty_query_raises(self):
        """Empty query must raise ValueError."""
        with pytest.raises(ValueError, match="cannot be empty"):
            retrieve_domain_documents("", "it")

        with pytest.raises(ValueError, match="cannot be empty"):
            retrieve_domain_documents("   ", "hr")

    def test_invalid_doc_count_raises(self):
        """Zero or negative number of documents must raise ValueError."""
        with pytest.raises(ValueError, match="greater than or equal to 1"):
            retrieve_domain_documents("wifi", "it", number_of_documents=0)

    def test_cross_domain_isolation(self):
        """Verify that retrieving for a domain only queries its dedicated collection."""
        for dept in SUPPORTED_DOMAINS:
            mock_store = MagicMock()
            mock_retriever = MagicMock()
            mock_retriever.invoke.return_value = [
                Document(page_content=f"{dept} policy chunk", metadata={"source": f"{dept}.pdf", "page": 1})
            ]
            mock_store.as_retriever.return_value = mock_retriever

            docs = retrieve_domain_documents("query", dept, number_of_documents=3, vector_store=mock_store)

            # Check MMR search type and kwargs
            mock_store.as_retriever.assert_called_once_with(
                search_type="mmr",
                search_kwargs={
                    "k": 3,
                    "fetch_k": 12,
                    "lambda_mult": 0.7,
                },
            )
            assert len(docs) == 1
            assert dept in docs[0].page_content


class TestUnifiedRAGExecution:
    def test_execute_empty_retrieval_triggers_human_escalation(self):
        """When vector store returns no documents, trigger human handoff with confidence 0.0."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = []
        mock_store.as_retriever.return_value = mock_retriever

        result = execute_domain_rag(
            query="Where can I pay hostel fees?",
            department="fees",
            vector_store=mock_store,
        )

        assert isinstance(result, DomainRAGResult)
        assert result.department == "fees"
        assert result.answer_confidence == 0.0
        assert result.solved is False
        assert result.human_required is True
        assert "No relevant documentation found" in (result.handoff_reason or "")
        assert result.sources == []
        assert result.citations == []

    def test_execute_domain_rag_all_four_departments(self):
        """Verify execute_domain_rag runs cleanly for all 4 departments."""
        for dept in ["it", "hr", "fees", "facilities"]:
            mock_store = MagicMock()
            mock_retriever = MagicMock()
            mock_retriever.invoke.return_value = [
                Document(
                    page_content=f"Official {dept} operating instructions.",
                    metadata={"source": f"{dept}_guide.pdf", "page": 2, "chunk_id": f"{dept}_c1"},
                )
            ]
            mock_store.as_retriever.return_value = mock_retriever

            result = execute_domain_rag(
                query=f"How does {dept} work?",
                department=dept,
                vector_store=mock_store,
            )

            assert isinstance(result, DomainRAGResult)
            assert result.department == dept
            assert result.answer_confidence > 0.0
            assert len(result.sources) == 1
            assert f"{dept}_guide.pdf, page 3" in result.sources[0]

    def test_execute_domain_rag_confidence_escalation(self):
        """Test that answer_confidence < 0.75 triggers human handoff."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = [
            Document(page_content="Partial info.", metadata={"source": "doc.pdf", "page": 0})
        ]
        mock_store.as_retriever.return_value = mock_retriever

        mock_llm = MagicMock()
        mock_llm.invoke.return_value = DepartmentRAGResponse(
            answer="I am not fully certain based on this document.",
            answer_confidence=0.55,
            citations=[Citation(source="doc.pdf", page=1, excerpt="Partial info.")],
        )

        result = execute_domain_rag(
            query="Special exception inquiry",
            department="it",
            vector_store=mock_store,
            llm=mock_llm,
        )

        assert result.answer_confidence == 0.55
        assert result.solved is False
        assert result.human_required is True
        assert "does not provide enough information" in (result.handoff_reason or "")
        assert len(result.citations) == 1

    def test_execute_domain_rag_high_confidence_solved(self):
        """Test that answer_confidence >= 0.75 marks query as solved without handoff."""
        mock_store = MagicMock()
        mock_retriever = MagicMock()
        mock_retriever.invoke.return_value = [
            Document(page_content="Campus Wi-Fi SSID is EduRoam.", metadata={"source": "wifi.pdf", "page": 1})
        ]
        mock_store.as_retriever.return_value = mock_retriever

        mock_llm = MagicMock()
        mock_llm.invoke.return_value = DepartmentRAGResponse(
            answer="The campus Wi-Fi network name is EduRoam.",
            answer_confidence=0.92,
            citations=[Citation(source="wifi.pdf", page=2, excerpt="SSID is EduRoam.")],
        )

        result = execute_domain_rag(
            query="What is the Wi-Fi SSID?",
            department="it",
            vector_store=mock_store,
            llm=mock_llm,
        )

        assert result.answer_confidence == 0.92
        assert result.solved is True
        assert result.human_required is False
        assert result.handoff_reason is None
        assert len(result.citations) == 1

    def test_format_retrieved_documents(self):
        """Test document formatting with page and chunk metadata."""
        docs = [
            Document(page_content="Text chunk 1", metadata={"source": "guide.pdf", "page": 0, "chunk_id": "c1"}),
            Document(page_content="Text chunk 2", metadata={"source": "guide.pdf", "page": 4, "chunk_id": "c2"}),
        ]
        formatted = format_retrieved_documents(docs)
        assert "[Retrieved document 1: guide.pdf, page 1 (chunk c1)]" in formatted
        assert "[Retrieved document 2: guide.pdf, page 5 (chunk c2)]" in formatted
        assert "Text chunk 1" in formatted
        assert "Text chunk 2" in formatted
