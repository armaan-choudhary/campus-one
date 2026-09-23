"""CampusOne LangGraph Workflow Builder.
Defines the state graph orchestrating router, domain rag, clarification, and response synthesis.
"""
from typing import Optional, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

try:
    from backend.graph_state import AssistantState
    from backend.graph_nodes import (
        router_node,
        clarify_node,
        domain_rag_node,
        orchestrate_node,
        synthesize_node,
        respond_node,
        route_by_confidence,
    )
except ModuleNotFoundError:
    from graph_state import AssistantState
    from graph_nodes import (
        router_node,
        clarify_node,
        domain_rag_node,
        orchestrate_node,
        synthesize_node,
        respond_node,
        route_by_confidence,
    )


def build_graph() -> StateGraph:
    """Constructs the uncompiled LangGraph StateGraph workflow."""
    workflow = StateGraph(AssistantState)

    # Add core nodes
    workflow.add_node("router", router_node)
    workflow.add_node("clarify", clarify_node)
    workflow.add_node("domain_rag", domain_rag_node)
    workflow.add_node("orchestrate", orchestrate_node)
    workflow.add_node("synthesize", synthesize_node)
    workflow.add_node("respond", respond_node)

    # Connect START to router
    workflow.add_edge(START, "router")

    # Dynamic branch based on router confidence & margin guard
    workflow.add_conditional_edges(
        "router",
        route_by_confidence,
        {
            "clarify": "clarify",
            "orchestrate": "orchestrate",
            "it": "domain_rag",
            "hr": "domain_rag",
            "fees": "domain_rag",
            "facilities": "domain_rag",
        },
    )

    # Connect paths to respond and END
    workflow.add_edge("clarify", "respond")
    workflow.add_edge("orchestrate", "respond")
    workflow.add_edge("domain_rag", "synthesize")
    workflow.add_edge("synthesize", "respond")
    workflow.add_edge("respond", END)

    return workflow


_compiled_graph = None
_default_checkpointer = None


def get_compiled_graph(checkpointer: Optional[Any] = None):
    """Returns compiled LangGraph runnable with state checkpointing."""
    global _compiled_graph, _default_checkpointer
    if checkpointer is not None:
        return build_graph().compile(checkpointer=checkpointer)

    if _compiled_graph is None:
        _default_checkpointer = MemorySaver()
        _compiled_graph = build_graph().compile(checkpointer=_default_checkpointer)
    return _compiled_graph


def run_workflow(
    state: AssistantState,
    thread_id: str = "default_thread",
    checkpointer: Optional[Any] = None,
) -> AssistantState:
    """Executes a single turn of the conversational workflow."""
    graph = get_compiled_graph(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": thread_id}}
    result = graph.invoke(state, config=config)
    return result
