# CampusOne Backend

The CampusOne backend is the orchestration layer for the university assistant. It:

- Routes user queries to the appropriate department.
- Retrieves department-specific documents from PostgreSQL with `pgvector`.
- Sends retrieved context to the relevant LLM node.
- Generates grounded answers with confidence scores.
- Returns source references from the retrieved documents.
- Supports clarification and human handoff when confidence is low.

## Project Files

backend/
├── Documents/
│   ├── IT/
│   ├── HR/
│   ├── Finance/
│   └── Facilities/
├── .env
├── docker-compose.yml
├── graph_nodes.py
├── graph_state.py
├── index_documents.py
├── knowledge_retrieval.py
├── Prompts.py
├── requirements.txt
└── README.md

## Environment Setup

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_api_key_here
DATABASE_URL=postgresql+psycopg://campus_one:your_password@localhost:5432/campus_one
POSTGRES_DB=campus_one
POSTGRES_USER=campus_one
POSTGRES_PASSWORD=your_password


```
## workflow

The backend follows this flow:

1. A user query is received.
2. router() classifies the request into likely departments.
3. The request is routed to the relevant domain agent.
4. If the request is unclear, clarify() asks for more detail.
5. The domain agent returns a response.
6. synthesize() combines the output into a clean final answer.
7. respond() returns the final message to the client.

## Vector Collections

IT_KNOWLEDGE_BASE = "it_knowledge"
HR_KNOWLEDGE_BASE = "hr_knowledge"
FINANCE_KNOWLEDGE_BASE = "finance_knowledge"
FACILITIES_KNOWLEDGE_BASE = "facilities_knowledge"

## Request Flow

1. User submits a question.
2. router() detects the department.
3. route_by_confidence() selects the graph node.
4. The selected node queries its own vector collection.
5. PostgreSQL returns relevant document chunks.
6. The node formats the retrieved context.
7. The LLM generates a structured response.
8. Confidence and source references are stored in the assistant state.
9. synthesize() prepares the final response.
10. respond() returns the answer to the user.

## How to Run

### Start PostgresSQL
docker compose up -d

### Index the documents
python index_documents.py