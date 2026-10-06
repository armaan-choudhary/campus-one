import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document

# Robustly load .env relative to this file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one",
)

# Model details
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DEVICE = "cpu"

# Vector stores names
IT_KNOWLEDGE_BASE = "it_knowledge"
HR_KNOWLEDGE_BASE = "hr_knowledge"
FINANCE_KNOWLEDGE_BASE = "finance_knowledge"
FACILITIES_KNOWLEDGE_BASE = "facilities_knowledge"

import json
import re
import psycopg
from rank_bm25 import BM25Okapi

# Lazy-loaded singleton to prevent blocking module imports on cold starts
_embeddings = None
_corpus_cache: dict[str, list[Document]] = {}


def get_embeddings() -> HuggingFaceEmbeddings:
    """Lazy-load embeddings singleton to avoid slow module import overhead."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={
                "device": EMBEDDING_DEVICE,
            },
            encode_kwargs={
                "normalize_embeddings": True,
            },
        )
    return _embeddings


def _tokenize(text: str) -> list[str]:
    """Simple alphanumeric tokenizer for sparse BM25 scoring."""
    return [w.lower() for w in re.findall(r"\w+", text or "")]


def get_vector_store(collection_name: str) -> PGVector:
    return PGVector(
        embeddings=get_embeddings(),
        collection_name=collection_name,
        connection=DATABASE_URL,
        use_jsonb=True,
    )


def get_collection_documents(collection_name: str, force_refresh: bool = False) -> list[Document]:
    """Fetch and cache all document chunks for a specific collection for sparse indexing."""
    global _corpus_cache
    if not force_refresh and collection_name in _corpus_cache and _corpus_cache[collection_name]:
        return _corpus_cache[collection_name]

    raw_url = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://", 1)
    documents: list[Document] = []
    try:
        with psycopg.connect(raw_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT e.document, e.cmetadata
                    FROM langchain_pg_embedding e
                    JOIN langchain_pg_collection c ON e.collection_id = c.uuid
                    WHERE c.name = %s
                    """,
                    (collection_name,),
                )
                rows = cur.fetchall()
                for doc_text, meta in rows:
                    cmetadata = meta if isinstance(meta, dict) else (json.loads(meta) if meta else {})
                    documents.append(Document(page_content=doc_text, metadata=cmetadata))
    except Exception:
        # Fallback to similarity search if raw SQL connection fails
        try:
            vs = get_vector_store(collection_name)
            documents = vs.similarity_search(" ", k=200)
        except Exception:
            documents = []

    _corpus_cache[collection_name] = documents
    return documents


def retrieve_dense_documents(
    query: str,
    collection_name: str,
    number_of_documents: int = 4,
) -> list[Document]:
    """Dense vector search using pgvector MMR retrieval."""
    vector_store = get_vector_store(collection_name)
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": number_of_documents,
            "fetch_k": max(number_of_documents * 4, 10),
            "lambda_mult": 0.7,
        },
    )
    return retriever.invoke(query)


def retrieve_sparse_documents(
    query: str,
    collection_name: str,
    number_of_documents: int = 4,
) -> list[Document]:
    """Sparse keyword search using BM25Okapi over the collection corpus."""
    corpus = get_collection_documents(collection_name)
    if not corpus:
        return []

    tokenized_query = _tokenize(query)
    if not tokenized_query:
        return corpus[:number_of_documents]

    tokenized_corpus = [_tokenize(doc.page_content) for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(tokenized_query)

    # Pair documents with their scores and rank
    scored = [(score, doc) for score, doc in zip(scores, corpus) if score > 0]
    scored.sort(key=lambda x: x[0], reverse=True)

    if not scored:
        return []

    return [doc for _, doc in scored[:number_of_documents]]


def retrieve_hybrid_documents(
    query: str,
    collection_name: str,
    number_of_documents: int = 4,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
    rrf_k: int = 60,
) -> list[Document]:
    """
    Hybrid Search combining Dense (MMR) and Sparse (BM25) with Reciprocal Rank Fusion (RRF).
    
    RRF Score:
        score(doc) = w_dense / (rrf_k + rank_dense) + w_sparse / (rrf_k + rank_sparse)
    """
    candidate_k = max(number_of_documents * 3, 10)
    
    # 1. Fetch dense candidates
    dense_docs = retrieve_dense_documents(query, collection_name, number_of_documents=candidate_k)
    
    # 2. Fetch sparse candidates
    sparse_docs = retrieve_sparse_documents(query, collection_name, number_of_documents=candidate_k)
    
    if not sparse_docs:
        return dense_docs[:number_of_documents]
    if not dense_docs:
        return sparse_docs[:number_of_documents]

    # 3. Compute RRF scores
    doc_registry: dict[str, Document] = {}
    rrf_scores: dict[str, float] = {}

    def get_doc_key(doc: Document) -> str:
        return doc.metadata.get("chunk_id") or doc.page_content.strip()

    # Dense scoring
    for rank, doc in enumerate(dense_docs, start=1):
        key = get_doc_key(doc)
        doc_registry[key] = doc
        rrf_scores[key] = rrf_scores.get(key, 0.0) + (dense_weight / (rrf_k + rank))

    # Sparse scoring
    for rank, doc in enumerate(sparse_docs, start=1):
        key = get_doc_key(doc)
        doc_registry[key] = doc
        rrf_scores[key] = rrf_scores.get(key, 0.0) + (sparse_weight / (rrf_k + rank))

    # Sort documents by final fused RRF score
    ranked_keys = sorted(rrf_scores.keys(), key=lambda k: rrf_scores[k], reverse=True)
    return [doc_registry[k] for k in ranked_keys[:number_of_documents]]


def retrieve_documents(
    query: str,
    collection_name: str,
    number_of_documents: int = 4,
    search_type: str = "hybrid",
) -> list[Document]:
    """
    Unified entry point for document retrieval supporting hybrid, dense, and sparse search.
    Defaults to hybrid (Dense MMR + Sparse BM25 via RRF).
    """
    if not query.strip():
        raise ValueError("The query cannot be empty.")

    if number_of_documents < 1:
        raise ValueError(
            "number_of_documents must be greater than or equal to 1."
        )

    if search_type == "sparse":
        results = retrieve_sparse_documents(query, collection_name, number_of_documents)
        if results:
            return results
        # Fallback to dense if sparse finds nothing
        return retrieve_dense_documents(query, collection_name, number_of_documents)
    elif search_type == "dense":
        return retrieve_dense_documents(query, collection_name, number_of_documents)
    else:
        # Default: hybrid search
        return retrieve_hybrid_documents(query, collection_name, number_of_documents)


def format_retrieved_documents(documents: list[Document]) -> str:
    formatted_documents: list[str] = []

    for index, document in enumerate(documents, start=1):
        source = document.metadata.get(
            "source",
            "Unknown document",
        )

        page = document.metadata.get("page")

        if isinstance(page, int):
            source_reference = f"{source}, page {page + 1}"
        else:
            source_reference = source

        formatted_documents.append(
            f"[Retrieved document {index}: {source_reference}]\n"
            f"{document.page_content}"
        )

    return "\n\n".join(formatted_documents)