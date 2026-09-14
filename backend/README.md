# CampusOne Backend

This backend is the orchestration layer for the CampusOne university assistant. It routes user queries to the appropriate department, invokes domain-specific support logic, and synthesizes the final response.

## Environment Setup

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_api_key_here


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