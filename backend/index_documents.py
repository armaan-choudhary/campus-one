from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from knowledge_retrieval import (
    FACILITIES_KNOWLEDGE_BASE,
    FINANCE_KNOWLEDGE_BASE,
    HR_KNOWLEDGE_BASE,
    IT_KNOWLEDGE_BASE,
    get_vector_store,
)


PDF_DIRECTORY = Path(__file__).parent / "Documents"


def load_pdf_documents(department: str):
    department_directory = PDF_DIRECTORY / department

    if not department_directory.exists():
        raise FileNotFoundError(
            f"Directory does not exist: {department_directory}"
        )

    documents = []

    for pdf_path in sorted(department_directory.glob("*.pdf")):
        pages = PyPDFLoader(str(pdf_path)).load()

        for page in pages:
            page.metadata.update(
                {
                    "department": department,
                    "source": pdf_path.name,
                    "file_name": pdf_path.name,
                    "file_path": str(pdf_path),
                    "document_type": "pdf",
                }
            )

        documents.extend(pages)

    if not documents:
        raise FileNotFoundError(
            f"No PDF files found in: {department_directory}"
        )

    return documents


def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(documents)

    for chunk_index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = chunk_index

    return chunks


def index_department(
    department: str,
    collection_name: str,
) -> None:
    documents = load_pdf_documents(department)
    chunks = split_documents(documents)

    vector_store = get_vector_store(collection_name)
    vector_store.add_documents(chunks)

    print(
        f"Indexed {len(chunks)} chunks for {department}."
    )


if __name__ == "__main__":
    index_department("IT", IT_KNOWLEDGE_BASE)
    index_department("HR", HR_KNOWLEDGE_BASE)
    index_department("Finance", FINANCE_KNOWLEDGE_BASE)
    index_department("Facilities", FACILITIES_KNOWLEDGE_BASE)