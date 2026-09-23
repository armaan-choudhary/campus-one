"""Tests for Standardized Document Ingestion Pipeline (Agent 1)."""
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from langchain_core.documents import Document

from backend.index_documents import (
    split_documents,
    index_department,
    load_pdf_documents,
)


class TestDocumentIngestion:
    def test_split_documents_metadata_preservation(self):
        """Verify that split_documents preserves and adds all required metadata fields."""
        doc = Document(
            page_content="This is the first sentence. " * 50,
            metadata={
                "source": "campus_policy.pdf",
                "page": 2,
                "department": "it",
                "document_id": "doc123",
                "document_name": "Campus Policy",
            },
        )

        chunks = split_documents([doc], chunk_size=200, chunk_overlap=30)
        assert len(chunks) > 1

        for i, chunk in enumerate(chunks):
            assert chunk.metadata["department"] == "it"
            assert chunk.metadata["source"] == "campus_policy.pdf"
            assert chunk.metadata["page"] == 2
            assert chunk.metadata["document_id"] == "doc123"
            assert chunk.metadata["document_name"] == "Campus Policy"
            assert chunk.metadata["chunk_index"] == i
            assert chunk.metadata["chunk_id"] == f"doc123_c{i}"

    def test_split_documents_generates_id_if_missing(self):
        """If document_id is missing, generate deterministic hash id."""
        doc = Document(
            page_content="Short test content.",
            metadata={"source": "test_guide.pdf"},
        )
        chunks = split_documents([doc])
        assert len(chunks) == 1
        assert "document_id" in chunks[0].metadata
        assert chunks[0].metadata["chunk_id"].startswith(chunks[0].metadata["document_id"])
        assert chunks[0].metadata["chunk_index"] == 0

    def test_index_department_adds_documents_to_collection(self):
        """Verify index_department splits and adds documents to vector store."""
        mock_store = MagicMock()
        docs = [
            Document(
                page_content="HR employee benefits and health insurance policy overview.",
                metadata={"source": "hr_benefits.pdf", "page": 0},
            )
        ]

        count = index_department(
            department="hr",
            documents=docs,
            vector_store=mock_store,
        )

        assert count == 1
        mock_store.add_documents.assert_called_once()
        added_chunks = mock_store.add_documents.call_args[0][0]
        assert len(added_chunks) == 1
        assert added_chunks[0].metadata["department"] == "hr"

    def test_reindexing_behavior(self):
        """Verify reindexing can update or add chunks to the store."""
        mock_store = MagicMock()
        docs = [
            Document(
                page_content="Version 1: Fee payment deadline is October 15.",
                metadata={"source": "fee_deadlines.pdf", "page": 1, "document_id": "fee_01"},
            )
        ]

        # First indexing
        count1 = index_department("fees", documents=docs, vector_store=mock_store)
        assert count1 == 1

        # Re-indexing with updated content
        updated_docs = [
            Document(
                page_content="Version 2: Fee payment deadline is extended to October 31.",
                metadata={"source": "fee_deadlines.pdf", "page": 1, "document_id": "fee_01"},
            )
        ]
        count2 = index_department("fees", documents=updated_docs, vector_store=mock_store)
        assert count2 == 1
        assert mock_store.add_documents.call_count == 2

    def test_load_pdf_missing_directory_raises(self, tmp_path):
        """Loading from a non-existent directory must raise FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Directory does not exist"):
            load_pdf_documents("it", directory=tmp_path / "non_existent")

    def test_invalid_department_raises(self):
        """Invalid department name must raise ValueError."""
        with pytest.raises(ValueError, match="Unsupported department"):
            index_department("invalid_dept", documents=[Document(page_content="content")])
