"""CampusOne Router Model Inference Service."""
from typing import Dict
from backend.routing.model import CustomRoutingModel

_singleton_model: CustomRoutingModel | None = None


def get_inference_model() -> CustomRoutingModel:
    """Returns initialized singleton routing model."""
    global _singleton_model
    if _singleton_model is None:
        _singleton_model = CustomRoutingModel().load_or_train()
    return _singleton_model


def predict_domain_probabilities(query: str) -> Dict[str, float]:
    """
    Computes lightweight custom model probability distribution across domains.
    Returns normalized {domain: probability} dictionary.
    """
    model = get_inference_model()
    return model.predict_proba(query)
