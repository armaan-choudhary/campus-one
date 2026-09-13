from langchain_groq import ChatGroq
from typing import List, Optional, Dict, Any, TypedDict, Literal
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# State Graph

class AssistantState(TypedDict):

    # Conversation
    messages: List[Dict[str, Any]]
    current_query: str

    # Routing
    detected_domains: List[str]
    intent: Optional[str]
    routing_confidence: float

    # Agent result
    agent_response: Optional[str]
    agent_confidence: float
    solved: bool

    # Human handoff
    human_required: bool
    handoff_reason: Optional[str]
    ticket_id: Optional[str]

    # Grounding
    sources: List[str]

    # Final response
    final_answer: Optional[str]

    # Misc
    metadata: Dict[str, Any]

class DepartmentRoute(BaseModel):
    route: Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General", "Human"]
    departments: List[Literal["IT", "HR", "Fees", "Facilities", "Admissions", "Academics", "General"]]
    understood: bool
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str



def router(state : AssistantState):

    llm = ChatGroq(
        model = "openai/gpt-oss-120b",
        temperature = 0.7
        )

    structured_llm = llm.with_structured_output(DepartmentRoute, method="json_schema")

    query = state["current_query"]

    response  = structured_llm.invoke(query)

    return {
        "detected_domains": response.departments,
        "routing_confidence": response.confidence,
        "intent": response.route,
        "metadata": {"reason": response.reason},
    }



def it_agent(state : AssistantState):

    llm = ChatGroq(
        model = "openai/gpt-oss-120b",
        temperature = 0.7
        )

    query = state["current_query"]
    prompt = f"""
        You are the university IT support agent.

        Answer the user's technical question clearly and practically.
        If the issue requires account access, system permissions, or manual intervention,
        explain that a human support agent is required.

        User query:
        {query}
        """
    response  = llm.invoke(prompt)

    return {
        "agent_response": response.content,
        "agent_confidence": 0.85,
        "solved": True,
        "human_required": False,
        "handoff_reason": None,
        "sources": [],
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

def _run_domain_agent(state: AssistantState, domain: str):
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.7,
    )

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
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.5,
    )

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
    department = domains[0].lower()

    valid_routes = {
        "it": "it",
        "hr": "hr",
        "fees": "fees",
        "facilities": "facilities",
    }

    return valid_routes.get(department, "clarify")
