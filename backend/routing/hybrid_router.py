"""CampusOne Hybrid Routing Engine.
Combines 55% Vector Semantic + 25% Lexical + 20% Custom Model scoring with Margin Guard policy.
"""
from typing import Dict, Any, Optional, Set
from backend.routing.schemas import RoutingResult
from backend.routing.vector_scorer import VectorScorer
from backend.routing.lexical_scorer import LexicalScorer
from backend.routing.inference import predict_domain_probabilities
from backend.routing.multi_intent import MultiIntentDetector

DEFAULT_WEIGHTS = {
    "vector": 0.55,
    "lexical": 0.25,
    "model": 0.20,
}

MARGIN_THRESHOLD = 0.15
HIGH_CONFIDENCE_THRESHOLD = 0.75
MIN_CONFIDENCE_FLOOR = 0.35

DOMAINS = ["it", "hr", "fees", "facilities"]

NEGATIVE_ANCHORS: Dict[str, Set[str]] = {
    "fees": {"wifi", "wi-fi", "wiffi", "password", "vpn", "email", "plumbing", "ac", "gym"},
    "facilities": {"wifi", "wi-fi", "wiffi", "password", "vpn", "email", "salary", "tuition", "payslip"},
    "hr": {"wifi", "wiffi", "hostel", "plumbing", "tuition"},
    "it": {"salary", "payslip", "plumbing", "tuition"},
}


class HybridRouter:
    """Orchestrates 3-way hybrid scoring and applies margin guard policies."""

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        margin_threshold: float = MARGIN_THRESHOLD,
        confidence_threshold: float = HIGH_CONFIDENCE_THRESHOLD,
    ):
        raw_weights = weights or DEFAULT_WEIGHTS
        total_w = sum(raw_weights.values())
        self.weights = {k: v / total_w for k, v in raw_weights.items()}
        self.margin_threshold = margin_threshold
        self.confidence_threshold = confidence_threshold
        self.vector_scorer = VectorScorer()
        self.lexical_scorer = LexicalScorer()
        self.multi_detector = MultiIntentDetector(
            vector_scorer=self.vector_scorer,
            lexical_scorer=self.lexical_scorer,
        )

    def route(
        self,
        query: str,
        conversation_context: Optional[Dict[str, Any]] = None,
    ) -> RoutingResult:
        """
        Computes composite domain scores:
          score(d) = 0.55 * vector + 0.25 * lexical + 0.20 * model
        Applies Margin Guard:
          If (top1 - top2) < margin_threshold => department="clarify", requires_clarification=True.
        """
        if not query or not query.strip():
            return RoutingResult(
                department="clarify",
                confidence=0.0,
                department_scores={d: 0.25 for d in DOMAINS},
                requires_clarification=True,
                reason="Empty query submitted",
                margin=0.0,
                route_mode="clarify",
            )

        # 1. Component scores (each normalized to sum to 1.0)
        v_scores = self.vector_scorer.score(query)
        l_scores = self.lexical_scorer.score(query)
        m_scores = predict_domain_probabilities(query)

        # 2. Composite score calculation
        fused_scores: Dict[str, float] = {}
        for d in DOMAINS:
            fused = (
                self.weights["vector"] * v_scores.get(d, 0.0)
                + self.weights["lexical"] * l_scores.get(d, 0.0)
                + self.weights["model"] * m_scores.get(d, 0.0)
            )
            fused_scores[d] = float(round(fused, 4))

        # Dynamic negative domain anchor penalty
        q_tokens = set(query.lower().split())
        penalized = False
        for d in DOMAINS:
            if any(anchor in q_tokens for anchor in NEGATIVE_ANCHORS.get(d, set())):
                fused_scores[d] = max(0.0, fused_scores[d] - 0.25)
                penalized = True

        if penalized:
            total_s = sum(fused_scores.values())
            if total_s > 0:
                fused_scores = {d: float(round(v / total_s, 4)) for d, v in fused_scores.items()}

        # Rank candidates
        ranked = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        top1_dept, top1_score = ranked[0]
        top2_dept, top2_score = ranked[1]
        margin = float(round(top1_score - top2_score, 4))

        candidates = [
            {"domain": dept, "score": score, "rank": idx + 1}
            for idx, (dept, score) in enumerate(ranked)
        ]

        component_breakdown = {
            "vector": v_scores,
            "lexical": l_scores,
            "model": m_scores,
        }

        # Multi-Intent Evaluation:
        # If the query contains independent actionable clauses across multiple domains,
        # route to multi-domain execution rather than forcing single-domain or clarification.
        multi_info = self.multi_detector.detect(query)
        if multi_info["is_multi"]:
            target_domains = multi_info["target_domains"]
            intent_clauses = multi_info["intent_clauses"]
            primary_dept = target_domains[0]
            top_conf = max(c["confidence"] for c in intent_clauses)
            return RoutingResult(
                department=primary_dept,
                confidence=top_conf,
                department_scores=fused_scores,
                requires_clarification=False,
                reason=f"Multi-domain query detected across systems: {', '.join(target_domains)}",
                margin=margin,
                component_scores=component_breakdown,
                route_mode="multi",
                candidates=candidates,
                target_domains=target_domains,
                intent_clauses=intent_clauses,
            )

        # 3. Margin Guard and Ambiguity Evaluation
        # If margin is smaller than threshold, or score is below floor, trigger clarification
        if margin < self.margin_threshold or top1_score < MIN_CONFIDENCE_FLOOR:
            requires_clarification = True
            dept = "clarify"
            route_mode = "clarify"
            if margin < self.margin_threshold:
                reason = (
                    f"Ambiguous query: Margin between top candidate '{top1_dept}' ({top1_score:.3f}) "
                    f"and runner-up '{top2_dept}' ({top2_score:.3f}) is {margin:.3f} (< {self.margin_threshold})."
                )
            else:
                reason = (
                    f"Low confidence query: Top score {top1_score:.3f} is below threshold floor {MIN_CONFIDENCE_FLOOR}."
                )
        else:
            requires_clarification = False
            dept = top1_dept
            route_mode = "single"
            reason = (
                f"Routed to '{top1_dept}' with confidence {top1_score:.3f} and margin {margin:.3f}."
            )

        return RoutingResult(
            department=dept,
            confidence=top1_score,
            department_scores=fused_scores,
            requires_clarification=requires_clarification,
            reason=reason,
            margin=margin,
            component_scores=component_breakdown,
            route_mode=route_mode,
            candidates=candidates,
            target_domains=[dept] if dept != "clarify" else [],
            intent_clauses=[],
        )


_global_router: Optional[HybridRouter] = None


def get_router() -> HybridRouter:
    """Returns singleton router instance."""
    global _global_router
    if _global_router is None:
        _global_router = HybridRouter()
    return _global_router


def route_query(
    query: str,
    conversation_context: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
    margin_threshold: float = MARGIN_THRESHOLD,
    confidence_threshold: float = HIGH_CONFIDENCE_THRESHOLD,
) -> RoutingResult:
    """
    Primary routing API:
    Determines domain routing for query with 55/25/20 hybrid scoring and margin guard.
    """
    if weights is not None or margin_threshold != MARGIN_THRESHOLD or confidence_threshold != HIGH_CONFIDENCE_THRESHOLD:
        router = HybridRouter(
            weights=weights,
            margin_threshold=margin_threshold,
            confidence_threshold=confidence_threshold,
        )
        return router.route(query, conversation_context)

    return get_router().route(query, conversation_context)
