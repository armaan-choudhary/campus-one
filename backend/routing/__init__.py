"""CampusOne Routing Engine Package."""
from backend.routing.schemas import RoutingResult, RoutingTrainingExample
from backend.routing.model import CustomRoutingModel
from backend.routing.inference import predict_domain_probabilities, get_inference_model
from backend.routing.vector_scorer import VectorScorer
from backend.routing.lexical_scorer import LexicalScorer
from backend.routing.hybrid_router import (
    HybridRouter,
    route_query,
    get_router,
    DEFAULT_WEIGHTS,
    MARGIN_THRESHOLD,
)

__all__ = [
    "RoutingResult",
    "RoutingTrainingExample",
    "CustomRoutingModel",
    "predict_domain_probabilities",
    "get_inference_model",
    "VectorScorer",
    "LexicalScorer",
    "HybridRouter",
    "route_query",
    "get_router",
    "DEFAULT_WEIGHTS",
    "MARGIN_THRESHOLD",
]
