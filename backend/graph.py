"""LangGraph construction and shared graph lifecycle."""
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from psycopg_pool import ConnectionPool

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
        multi_domain_orchestrator,
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
        multi_domain_orchestrator,
        respond,
        route_after_response,
        route_by_confidence,
        router,
        synthesize,
    )


_graph = None
_checkpointer = None
_connection_pool = None


def build_graph(checkpointer=None):
    """Build the assistant graph with the supplied conversational checkpointer."""
    if checkpointer is None:
        checkpointer = MemorySaver()

    builder = StateGraph(AssistantState)
    builder.add_node("router", router)
    builder.add_node("create_ticket", create_ticket)
    builder.add_node("clarify", clarify)
    builder.add_node("it_agent", it_query)
    builder.add_node("hr_agent", hr_agent)
    builder.add_node("fees_agent", fees_agent)
    builder.add_node("facilities_agent", facilities_agent)
    builder.add_node("general_agent", general_agent)
    builder.add_node("multi_domain_agent", multi_domain_orchestrator)
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
            "multi_domain": "multi_domain_agent",
        },
    )
    builder.add_edge("clarify", "respond")
    builder.add_edge("it_agent", "synthesize")
    builder.add_edge("hr_agent", "synthesize")
    builder.add_edge("fees_agent", "synthesize")
    builder.add_edge("facilities_agent", "synthesize")
    builder.add_edge("general_agent", "synthesize")
    builder.add_edge("multi_domain_agent", "synthesize")
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
    return builder.compile(checkpointer=checkpointer)


def initialize_graph(database_url: str) -> None:
    """Initialize the shared graph and durable PostgreSQL checkpoint store."""
    global _connection_pool, _checkpointer, _graph

    if _graph is not None:
        return

    conn_string = database_url.replace("postgresql+psycopg://", "postgresql://", 1)
    _connection_pool = ConnectionPool(
        conninfo=conn_string,
        kwargs={"autocommit": True, "prepare_threshold": 0},
        open=True,
    )
    _checkpointer = PostgresSaver(_connection_pool)
    _checkpointer.setup()
    _graph = build_graph(_checkpointer)


def close_graph() -> None:
    """Close the shared database pool during application shutdown."""
    global _connection_pool, _checkpointer, _graph

    if _connection_pool is not None:
        _connection_pool.close()
    _connection_pool = None
    _checkpointer = None
    _graph = None


def get_graph():
    """Return the initialized shared graph, auto-building with MemorySaver if uninitialized."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
