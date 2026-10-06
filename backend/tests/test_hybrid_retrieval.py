import pytest
from langchain_core.documents import Document

try:
    from backend.knowledge_retrieval import (
        IT_KNOWLEDGE_BASE,
        HR_KNOWLEDGE_BASE,
        FINANCE_KNOWLEDGE_BASE,
        FACILITIES_KNOWLEDGE_BASE,
        _tokenize,
        format_retrieved_documents,
        get_collection_documents,
        retrieve_dense_documents,
        retrieve_documents,
        retrieve_hybrid_documents,
        retrieve_sparse_documents,
    )
except ModuleNotFoundError:
    from knowledge_retrieval import (
        IT_KNOWLEDGE_BASE,
        HR_KNOWLEDGE_BASE,
        FINANCE_KNOWLEDGE_BASE,
        FACILITIES_KNOWLEDGE_BASE,
        _tokenize,
        format_retrieved_documents,
        get_collection_documents,
        retrieve_dense_documents,
        retrieve_documents,
        retrieve_hybrid_documents,
        retrieve_sparse_documents,
    )


def test_tokenize_basic():
    text = "Eduroam Wi-Fi (802.11ax) at Campus-Center!"
    tokens = _tokenize(text)
    assert "eduroam" in tokens
    assert "wi" in tokens
    assert "fi" in tokens
    assert "campus" in tokens
    assert "center" in tokens


def test_empty_query_raises_value_error():
    with pytest.raises(ValueError, match="The query cannot be empty"):
        retrieve_documents("   ", IT_KNOWLEDGE_BASE)


def test_invalid_document_count_raises_value_error():
    with pytest.raises(ValueError, match="number_of_documents must be greater than or equal to 1"):
        retrieve_documents("wifi", IT_KNOWLEDGE_BASE, number_of_documents=0)


def test_get_collection_documents_returns_corpus():
    docs = get_collection_documents(IT_KNOWLEDGE_BASE)
    assert isinstance(docs, list)
    assert len(docs) > 0
    assert any("eduroam" in d.page_content.lower() or "portal" in d.page_content.lower() for d in docs)


def test_sparse_bm25_retrieves_exact_keyword_match():
    # Query with exact rare keyword
    docs = retrieve_sparse_documents("eduroam", IT_KNOWLEDGE_BASE, number_of_documents=2)
    assert len(docs) >= 1
    assert "eduroam" in docs[0].page_content.lower()


def test_hybrid_search_combines_dense_and_sparse():
    # Hybrid search on IT query
    docs = retrieve_documents("reset wifi password in eduroam", IT_KNOWLEDGE_BASE, number_of_documents=3, search_type="hybrid")
    assert len(docs) >= 1
    assert any("eduroam" in d.page_content.lower() or "password" in d.page_content.lower() for d in docs)


def test_dense_search_fallback():
    docs = retrieve_documents("network connectivity", IT_KNOWLEDGE_BASE, number_of_documents=2, search_type="dense")
    assert len(docs) >= 1


def test_format_retrieved_documents():
    sample_docs = [
        Document(page_content="Policy 1 content", metadata={"source": "it_policy.pdf", "page": 0}),
        Document(page_content="Policy 2 content", metadata={"source": "faq.pdf"}),
    ]
    formatted = format_retrieved_documents(sample_docs)
    assert "[Retrieved document 1: it_policy.pdf, page 1]" in formatted
    assert "Policy 1 content" in formatted
    assert "[Retrieved document 2: faq.pdf]" in formatted
    assert "Policy 2 content" in formatted
