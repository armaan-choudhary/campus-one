"""CampusOne Standardized Multi-Department Document Ingestion Pipeline."""
import hashlib
from pathlib import Path
from typing import List, Optional, Any

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

try:
    from backend.rag.config import DOMAIN_CONFIG, normalize_department
    from backend.knowledge_retrieval import get_vector_store
except ModuleNotFoundError:
    from rag.config import DOMAIN_CONFIG, normalize_department
    from knowledge_retrieval import get_vector_store


PDF_DIRECTORY = Path(__file__).resolve().parent / "Documents"


def load_pdf_documents(department: str, directory: Optional[Path] = None) -> List[Document]:
    """
    Loads PDF documents for a department, preserving document and page metadata.
    """
    dept_key = normalize_department(department)
    base_dir = directory or PDF_DIRECTORY
    # Check both canonical key and capitalized folder name (e.g. IT, HR, Finance, Facilities)
    possible_dirs = [
        base_dir / dept_key,
        base_dir / DOMAIN_CONFIG[dept_key]["display_name"],
        base_dir / department,
    ]
    department_directory = None
    for d in possible_dirs:
        if d.exists():
            department_directory = d
            break

    if not department_directory or not department_directory.exists():
        raise FileNotFoundError(
            f"Directory does not exist for department '{department}': checked {[str(p) for p in possible_dirs]}"
        )

    documents: List[Document] = []
    pdf_files = sorted(department_directory.glob("*.pdf"))

    for pdf_path in pdf_files:
        try:
            pages = PyPDFLoader(str(pdf_path)).load()
        except Exception as e:
            print(f"Warning: Failed to load {pdf_path}: {e}")
            continue

        doc_id = hashlib.sha256(pdf_path.name.encode()).hexdigest()[:12]
        for page in pages:
            page.metadata.update(
                {
                    "department": dept_key,
                    "document_id": doc_id,
                    "document_name": pdf_path.stem.replace("_", " ").title(),
                    "source": pdf_path.name,
                    "file_name": pdf_path.name,
                    "file_path": str(pdf_path),
                    "document_type": "pdf",
                }
            )
        documents.extend(pages)

    if not documents:
        raise FileNotFoundError(
            f"No valid PDF files found in: {department_directory}"
        )

    return documents


def split_documents(
    documents: List[Document],
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> List[Document]:
    """
    Splits documents into chunks while preserving and standardizing metadata:
    department, document_id, document_name, source, page, chunk_id, chunk_index.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(documents)

    for chunk_index, chunk in enumerate(chunks):
        doc_id = chunk.metadata.get("document_id")
        if not doc_id:
            src = chunk.metadata.get("source", "doc")
            doc_id = hashlib.sha256(src.encode()).hexdigest()[:12]
            chunk.metadata["document_id"] = doc_id

        if "document_name" not in chunk.metadata:
            chunk.metadata["document_name"] = chunk.metadata.get("source", "Document")

        chunk.metadata["chunk_index"] = chunk_index
        chunk.metadata["chunk_id"] = f"{doc_id}_c{chunk_index}"

    return chunks


def index_department(
    department: str,
    collection_name: Optional[str] = None,
    documents: Optional[List[Document]] = None,
    vector_store: Optional[Any] = None,
    directory: Optional[Path] = None,
) -> int:
    """
    Standardized department-aware indexing:
    1. Normalizes department key.
    2. Resolves target PGVector collection.
    3. Loads or accepts document objects.
    4. Applies chunking with metadata preservation.
    5. Embeds and adds documents into isolated collection.
    Returns the count of indexed chunks.
    """
    dept_key = normalize_department(department)
    target_collection = collection_name or DOMAIN_CONFIG[dept_key]["collection"]

    if documents is None:
        raw_documents = load_pdf_documents(dept_key, directory=directory)
    else:
        raw_documents = documents

    # Ensure department metadata is stamped
    for doc in raw_documents:
        if "department" not in doc.metadata:
            doc.metadata["department"] = dept_key

    chunks = split_documents(raw_documents)

    if vector_store is None:
        store = get_vector_store(target_collection)
    else:
        store = vector_store

    store.add_documents(chunks)
    print(f"Successfully indexed {len(chunks)} chunks into collection '{target_collection}' for department '{dept_key}'.")
    return len(chunks)


if __name__ == "__main__":
    for dept in ["it", "hr", "fees", "facilities"]:
        try:
            index_department(dept)
        except FileNotFoundError as err:
            print(f"Skipping {dept}: {err}")