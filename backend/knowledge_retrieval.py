import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# Model details

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DEVICE = "cpu"

# Vector stores names

IT_KNOWLEDGE_BASE = "it_knowledge"
HR_KNOWLEDGE_BASE = "hr_knowledge"
FINANCE_KNOWLEDGE_BASE = "finance_knowledge"
FACILITIES_KNOWLEDGE_BASE = "facilities_knowledge"

# embedding

embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={
        "device": EMBEDDING_DEVICE,
    },
    encode_kwargs={
        "normalize_embeddings": True,
    },
)

# functions

def get_vector_store(collection_name: str) -> PGVector:
    return PGVector(
        embeddings=embeddings,
        collection_name=collection_name,
        connection=DATABASE_URL,
        use_jsonb=True,
    )


def retrieve_documents(
    query: str,
    collection_name: str,
    number_of_documents: int = 4,
) -> list[Document]:
    if not query.strip():
        raise ValueError("The query cannot be empty.")

    if number_of_documents < 1:
        raise ValueError(
            "number_of_documents must be greater than or equal to 1."
        )

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