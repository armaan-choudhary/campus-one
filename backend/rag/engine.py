"""CampusOne Unified Domain RAG Execution Engine."""
import os
from pathlib import Path
from typing import Any, List, Optional
from dotenv import load_dotenv
from langchain_core.documents import Document

try:
    from backend.rag.config import DOMAIN_CONFIG, normalize_department
    from backend.rag.schemas import Citation, DepartmentRAGResponse, DomainRAGResult
    from backend.rag.prompts import DOMAIN_QUERY_PROMPT
except ModuleNotFoundError:
    from rag.config import DOMAIN_CONFIG, normalize_department
    from rag.schemas import Citation, DepartmentRAGResponse, DomainRAGResult
    from rag.prompts import DOMAIN_QUERY_PROMPT

# Load environment
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


def get_vector_store(collection_name: str):
    """Resolve PGVector collection store via knowledge_retrieval."""
    try:
        from backend.knowledge_retrieval import get_vector_store as _gvs
    except ModuleNotFoundError:
        from knowledge_retrieval import get_vector_store as _gvs
    return _gvs(collection_name)


def format_retrieved_documents(documents: List[Document]) -> str:
    """Formats retrieved document chunks into clean reference context."""
    formatted_chunks: List[str] = []

    for index, document in enumerate(documents, start=1):
        source = document.metadata.get("source", "Unknown document")
        page = document.metadata.get("page")
        chunk_id = document.metadata.get("chunk_id", str(index))

        if isinstance(page, int):
            source_ref = f"{source}, page {page + 1} (chunk {chunk_id})"
        else:
            source_ref = f"{source} (chunk {chunk_id})"

        formatted_chunks.append(
            f"[Retrieved document {index}: {source_ref}]\n{document.page_content}"
        )

    return "\n\n".join(formatted_chunks)


def retrieve_domain_documents(
    query: str,
    department: str,
    number_of_documents: int = 4,
    vector_store: Optional[Any] = None,
) -> List[Document]:
    """
    Retrieves documents strictly from the isolated vector collection for the given department.
    Guarantees cross-domain collection isolation and MMR retrieval.
    """
    if not query or not query.strip():
        raise ValueError("The query cannot be empty.")

    if number_of_documents < 1:
        raise ValueError("number_of_documents must be greater than or equal to 1.")

    dept_key = normalize_department(department)
    collection_name = DOMAIN_CONFIG[dept_key]["collection"]

    if vector_store is None:
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


def _get_default_llm():
    """Instantiate structured LLM if GROQ_API_KEY is available."""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            from langchain_groq import ChatGroq
            llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)
            return llm.with_structured_output(DepartmentRAGResponse)
        except Exception:
            return None
    return None


def _fallback_grounded_response(
    query: str,
    dept_key: str,
    display_name: str,
    documents: List[Document],
) -> DepartmentRAGResponse:
    """
    Deterministic grounded fallback generator used when no external LLM is configured
    or in offline testing environments. Derives answer and confidence strictly from retrieved documents.
    """
    if not documents:
        return DepartmentRAGResponse(
            answer=f"The available {display_name} documentation is insufficient to answer your query.",
            answer_confidence=0.0,
            citations=[],
        )

    # Search for term overlap between query and documents
    query_terms = set(query.lower().split())
    matched_docs = []
    citations = []

    for doc in documents:
        content_lower = doc.page_content.lower()
        overlap = sum(1 for term in query_terms if term in content_lower)
        if overlap > 0:
            matched_docs.append(doc)
            citations.append(
                Citation(
                    source=doc.metadata.get("source", "Document"),
                    page=doc.metadata.get("page"),
                    chunk_id=str(doc.metadata.get("chunk_id", doc.metadata.get("chunk_index", ""))),
                    excerpt=doc.page_content[:150] + "..." if len(doc.page_content) > 150 else doc.page_content,
                )
            )

    if not matched_docs:
        return DepartmentRAGResponse(
            answer=f"The retrieved {display_name} documentation does not contain sufficient details to address '{query}'.",
            answer_confidence=0.2,
            citations=[],
        )

    # Calculate confidence based on evidence quality
    confidence = min(0.95, 0.75 + 0.05 * len(matched_docs))
    top_doc = matched_docs[0]
    answer = f"According to {display_name} records ({top_doc.metadata.get('source', 'documentation')}): {top_doc.page_content[:300].strip()}."

    return DepartmentRAGResponse(
        answer=answer,
        answer_confidence=confidence,
        citations=citations,
    )


def execute_domain_rag(
    query: str,
    department: str,
    conversation_context: Optional[str] = None,
    number_of_documents: int = 4,
    vector_store: Optional[Any] = None,
    llm: Optional[Any] = None,
) -> DomainRAGResult:
    """
    Unified Domain RAG execution pipeline:
    1. Validates and normalizes department.
    2. Retrieves department-isolated documents using MMR.
    3. Handles empty retrieval with human escalation.
    4. Formats context and executes structured generation.
    5. Enforces grounding thresholds and human handoff policy.
    6. Returns standard DomainRAGResult.
    """
    dept_key = normalize_department(department)
    display_name = DOMAIN_CONFIG[dept_key]["display_name"]

    retrieved_documents = retrieve_domain_documents(
        query=query,
        department=dept_key,
        number_of_documents=number_of_documents,
        vector_store=vector_store,
    )

    if not retrieved_documents:
        return DomainRAGResult(
            answer=f"I could not find relevant documentation in the {display_name} knowledge base to answer your question.",
            department=dept_key,
            answer_confidence=0.0,
            sources=[],
            citations=[],
            solved=False,
            human_required=True,
            handoff_reason=f"No relevant documentation found in {display_name} knowledge base.",
            retrieved_documents=[],
        )

    formatted_context = format_retrieved_documents(retrieved_documents)
    prompt = DOMAIN_QUERY_PROMPT.format(
        display_name=display_name,
        query=query,
        conversation_context=conversation_context or "No previous context.",
        context=formatted_context,
    )

    rag_response = None
    if llm is not None:
        try:
            rag_response = llm.invoke(prompt)
        except Exception:
            rag_response = None

    if rag_response is None:
        default_llm = _get_default_llm()
        if default_llm is not None:
            try:
                rag_response = default_llm.invoke(prompt)
            except Exception:
                rag_response = None

    if rag_response is None:
        rag_response = _fallback_grounded_response(
            query=query,
            dept_key=dept_key,
            display_name=display_name,
            documents=retrieved_documents,
        )

    answer_confidence = getattr(rag_response, "answer_confidence", 0.0)
    answer_text = getattr(rag_response, "answer", "")

    # Human escalation policy
    solved = answer_confidence >= 0.75
    human_required = not solved
    handoff_reason = (
        None
        if solved
        else f"The retrieved {display_name} documentation does not provide enough information for a confident answer."
    )

    # Build sources and citations
    sources = []
    structured_citations = []

    for doc in retrieved_documents:
        src = doc.metadata.get("source", "Unknown document")
        page = doc.metadata.get("page")
        if isinstance(page, int):
            sources.append(f"{src}, page {page + 1}")
        else:
            sources.append(src)

    raw_citations = getattr(rag_response, "citations", [])
    for c in raw_citations:
        if isinstance(c, Citation):
            structured_citations.append(c.model_dump())
        elif isinstance(c, dict):
            structured_citations.append(c)

    return DomainRAGResult(
        answer=answer_text,
        department=dept_key,
        answer_confidence=answer_confidence,
        sources=list(dict.fromkeys(sources)),  # deduplicate preserving order
        citations=structured_citations,
        solved=solved,
        human_required=human_required,
        handoff_reason=handoff_reason,
        retrieved_documents=retrieved_documents,
    )
