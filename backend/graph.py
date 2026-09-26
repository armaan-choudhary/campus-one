"""LangGraph construction and shared graph lifecycle."""
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

try:
    from backend.graph_state import AssistantState
    from backend.graph_nodes import (
        clarify,
        create_ticket,
        facilities_agent,
        fees_agent,
        general_agent,
        hr_agent,
        it_query,
        respond,
        route_after_response,
        route_by_confidence,
        router,
        synthesize,
    )
except ModuleNotFoundError:
    from graph_state import AssistantState
    from graph_nodes import (
        clarify,
        create_ticket,
        facilities_agent,
        fees_agent,
        general_agent,
        hr_agent,
        it_query,
        respond,
        route_after_response,
        route_by_confidence,
        router,
        synthesize,
    )


_graph = None


def build_graph():
    """Build the assistant graph with in-process conversational checkpoints."""
    builder = StateGraph(AssistantState)
    builder.add_node("router", router)
    builder.add_node("create_ticket", create_ticket)
    builder.add_node("clarify", clarify)
    builder.add_node("it_agent", it_query)
    builder.add_node("hr_agent", hr_agent)
    builder.add_node("fees_agent", fees_agent)
    builder.add_node("facilities_agent", facilities_agent)
    builder.add_node("general_agent", general_agent)
    builder.add_node("synthesize", synthesize)
    builder.add_node("respond", respond)

    builder.add_edge(START, "router")
    builder.add_conditional_edges(
        "router",
        route_by_confidence,
        {
            "create_ticket": "create_ticket",
            "clarify": "clarify",
            "it": "it_agent",
            "hr": "hr_agent",
            "fees": "fees_agent",
            "facilities": "facilities_agent",
            "general": "general_agent",
        },
    )
    builder.add_edge("clarify", "respond")
    builder.add_edge("it_agent", "synthesize")
    builder.add_edge("hr_agent", "synthesize")
    builder.add_edge("fees_agent", "synthesize")
    builder.add_edge("facilities_agent", "synthesize")
    builder.add_edge("general_agent", "synthesize")
    builder.add_edge("synthesize", "respond")
    builder.add_edge("create_ticket", "respond")
    builder.add_conditional_edges(
        "respond",
        route_after_response,
        {
            "create_ticket": "create_ticket",
            "finish": END,
        },
    )


    return builder.compile(checkpointer=MemorySaver())


def get_graph():
    """Return the shared graph so thread memory survives between API requests."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
