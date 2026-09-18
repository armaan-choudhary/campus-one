from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Robustly load .env relative to this file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from backend.graph_state import AssistantState, DepartmentRoute, ITQueryResponse
    from backend.knowledge_retrieval import IT_KNOWLEDGE_BASE, format_retrieved_documents, retrieve_documents
    from backend.Prompts import IT_QUERY_PROMPT
except ModuleNotFoundError:
    from graph_state import AssistantState, DepartmentRoute, ITQueryResponse
    from knowledge_retrieval import IT_KNOWLEDGE_BASE, format_retrieved_documents, retrieve_documents
    from Prompts import IT_QUERY_PROMPT


# Shared cached LLM instances for fast sub-second turn transitions
_router_llm = None
_it_llm = None
_domain_llms = {}
_synth_llm = None


def get_router_llm():
    global _router_llm
    if _router_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.7)
        _router_llm = llm.with_structured_output(DepartmentRoute, method="json_schema")
    return _router_llm


def get_it_llm():
    global _it_llm
    if _it_llm is None:
        llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.3)
        _it_llm = llm.with_structured_output(ITQueryResponse)
    return _it_llm


def router(state: AssistantState):
    structured_llm = get_router_llm()
    query = state["current_query"]
    response = structured_llm.invoke(query)

    return {
        "detected_domains": response.departments,
        "routing_confidence": response.confidence,
        "intent": response.route,
        "metadata": {"reason": response.reason},
    }


def it_query(state: AssistantState):
    structured_llm = get_it_llm()

    retrieved_documents = retrieve_documents(
        query=state["current_query"],
        collection_name=IT_KNOWLEDGE_BASE,
        number_of_documents=4,
    )

    retrieved_context = format_retrieved_documents(
        retrieved_documents
    )

    prompt = IT_QUERY_PROMPT.format(
        query=state["current_query"],
        context=retrieved_context,
    )

    response = structured_llm.invoke(prompt)

    answer_confidence = response.answer_confidence

    source_references = [
        (
            f"{document.metadata.get('source', 'Unknown document')}"
            f", page {document.metadata['page'] + 1}"
            if isinstance(document.metadata.get("page"), int)
            else document.metadata.get(
                "source",
                "Unknown document",
            )
        )
        for document in retrieved_documents
    ]

    return {
        "agent_response": response.answer,
        "agent_confidence": answer_confidence,
        "solved": answer_confidence >= 0.75,
        "human_required": answer_confidence < 0.75,
        "handoff_reason": (
            "The retrieved IT documentation does not provide "
            "enough information for a confident answer."
            if answer_confidence < 0.75
            else None
        ),
        "sources": source_references,
        "metadata": {
            **state.get("metadata", {}),
            "agent_domain": "IT",
            "retrieved_document_count": len(retrieved_documents),
        },
    }


def clarify(state: AssistantState):
    query = state["current_query"]
    domains = state.get("detected_domains", [])

    options = ", ".join(domains) if domains else "IT, HR, Fees, or Facilities"

    question = (
        f"Could you clarify which area you need help with: {options}?"
    )

    return {
        "final_answer": question,
        "solved": False,
        "human_required": False,
        "handoff_reason": None,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "clarification",
        },
    }

def _get_general_llm():
    global _general_llm
    if _general_llm is None:
        _general_llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.7)
    return _general_llm


def _get_synth_llm():
    global _synth_llm
    if _synth_llm is None:
        _synth_llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0.5)
    return _synth_llm


def _run_domain_agent(state: AssistantState, domain: str):
    llm = _get_general_llm()
    query = state["current_query"]

    prompt = f"""
You are the {domain} support agent for a university.

Answer only questions related to {domain}.
Give clear, practical next steps.
Do not invent university-specific policies or facts.
If the question requires human intervention, say so clearly.

User question:
{query}
"""

    response = llm.invoke(prompt)

    return {
        "agent_response": response.content,
        "agent_confidence": 0.85,
        "solved": True,
        "human_required": False,
        "handoff_reason": None,
        "sources": [],
        "metadata": {
            **state.get("metadata", {}),
            "agent_domain": domain,
        },
    }


def hr_agent(state: AssistantState):
    return _run_domain_agent(state, "HR")


def fees_agent(state: AssistantState):
    return _run_domain_agent(state, "Fees and Finance")


def facilities_agent(state: AssistantState):
    return _run_domain_agent(state, "Facilities and Maintenance")


def synthesize(state: AssistantState):
    llm = _get_synth_llm()
    query = state["current_query"]
    agent_response = state.get("agent_response")

    prompt = f"""
You are the final response synthesizer for a university assistant.

Create one concise, clear answer to the user's question.
Use only the agent response provided below.
Do not invent facts, policies, links, or sources.
Include numbered steps when useful.

User question:
{query}

Agent response:
{agent_response or "No agent response is available."}
"""

    response = llm.invoke(prompt)

    return {
        "final_answer": response.content,
        "metadata": {
            **state.get("metadata", {}),
            "outcome": "synthesized",
        },
    }

def respond(state: AssistantState):
    final_answer = state.get("final_answer") or state.get("agent_response")

    if not final_answer:
        final_answer = (
            "I could not generate an answer at this time. "
            "Please try again or request human assistance."
        )

    return {
        "final_answer": final_answer,
        "messages": [
            *state.get("messages", []),
            {
                "role": "assistant",
                "content": final_answer,
            },
        ],
        "metadata": {
            **state.get("metadata", {}),
            "response_sent": True,
        },
    }

def route_by_confidence(state: AssistantState) -> str:
    confidence = state.get("routing_confidence", 0.0)
    domains = state.get("detected_domains", [])

    # Ambiguous or unsupported request
    if confidence < 0.75 or not domains:
        return "clarify"

    # DepartmentRoute returns uppercase values, but graph keys are lowercase
    department = domains[0].lower().strip()

    valid_routes = {
        "it": "it",
        "hr": "hr",
        "fees": "fees",
        "finance": "fees",
        "fees and finance": "fees",
        "facilities": "facilities",
        "facilities and maintenance": "facilities",
    }

    return valid_routes.get(department, "clarify")
