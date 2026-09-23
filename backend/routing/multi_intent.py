"""CampusOne Multi-Intent Semantic Detection Engine.
Detects multi-domain problem statements and decomposes queries into domain-scoped sub-intents.
"""
import re
from typing import Dict, Any, List, Tuple, Optional
from backend.routing.vector_scorer import VectorScorer
from backend.routing.lexical_scorer import LexicalScorer
from backend.routing.inference import predict_domain_probabilities

DOMAINS = ["it", "hr", "fees", "facilities"]

# Coordinating conjunctions, transitional adverbs, and punctuation for clause boundaries
CLAUSE_SPLIT_PATTERN = re.compile(
    r"(?:\b(?:and\s+also|as\s+well\s+as|in\s+addition\s+to|plus|furthermore|moreover|additionally|and\s+now|so\s+now|so|therefore)\b"
    r"|\b(?:and|but|however|while|meanwhile)\b(?=\s+[a-zA-Z])"
    r"|[;?]|\.(?=\s+[A-Z]))",
    re.IGNORECASE,
)

# Minimum words required for an actionable clause
MIN_CLAUSE_WORDS = 3


class MultiIntentDetector:
    """
    Detects whether a query contains multiple distinct domain intents
    without relying on a heavy generative LLM.
    """

    def __init__(
        self,
        vector_scorer: Optional[VectorScorer] = None,
        lexical_scorer: Optional[LexicalScorer] = None,
    ):
        self.vector_scorer = vector_scorer or VectorScorer()
        self.lexical_scorer = lexical_scorer or LexicalScorer()

    def segment_query(self, query: str) -> List[str]:
        """
        Extracts candidate semantic clauses from a user query.
        Prunes trivial fragments and normalizes whitespace.
        """
        raw_parts = CLAUSE_SPLIT_PATTERN.split(query)
        clauses = []
        for part in raw_parts:
            cleaned = part.strip(" ,.-;:!?")
            words = cleaned.split()
            if len(words) >= MIN_CLAUSE_WORDS:
                clauses.append(cleaned)

        if not clauses:
            return [query.strip()]
        return clauses

    def score_clause(self, clause: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Computes hybrid scores for a specific clause.
        Returns (top_domain, top_confidence, all_domain_scores).
        """
        v_scores = self.vector_scorer.score(clause)
        l_scores = self.lexical_scorer.score(clause)
        m_scores = predict_domain_probabilities(clause)

        fused: Dict[str, float] = {}
        for d in DOMAINS:
            val = 0.55 * v_scores.get(d, 0.0) + 0.25 * l_scores.get(d, 0.0) + 0.20 * m_scores.get(d, 0.0)
            fused[d] = float(round(val, 4))

        ranked = sorted(fused.items(), key=lambda x: x[1], reverse=True)
        top_dept, top_score = ranked[0]
        return top_dept, top_score, fused

    def detect(self, query: str) -> Dict[str, Any]:
        """
        Analyzes query to determine whether it is single-intent, multi-intent, or ambiguous.
        Returns:
          {
            "route_mode": "single" | "multi",
            "target_domains": List[str],
            "intent_clauses": List[Dict[str, Any]],
            "is_multi": bool
          }
        """
        clauses = self.segment_query(query)
        if len(clauses) <= 1:
            return {
                "route_mode": "single",
                "target_domains": [],
                "intent_clauses": [],
                "is_multi": False,
            }

        detected_intents: List[Dict[str, Any]] = []
        seen_domains: set = set()

        for clause in clauses:
            top_dept, confidence, scores = self.score_clause(clause)

            # Check if clause has strong domain ownership:
            # Requires top score >= 0.35 and margin over second candidate >= 0.05
            ranked_scores = sorted(scores.values(), reverse=True)
            margin = ranked_scores[0] - ranked_scores[1] if len(ranked_scores) > 1 else 0.0

            if confidence >= 0.35 and margin >= 0.05:
                if top_dept not in seen_domains:
                    seen_domains.add(top_dept)
                    detected_intents.append({
                        "domain": top_dept,
                        "clause": clause,
                        "confidence": confidence,
                        "margin": margin,
                    })

        # A request is multi-intent if and only if at least TWO DIFFERENT domains
        # possess independent, actionable clauses with verified confidence.
        if len(seen_domains) >= 2:
            target_domains = [item["domain"] for item in detected_intents]
            return {
                "route_mode": "multi",
                "target_domains": target_domains,
                "intent_clauses": detected_intents,
                "is_multi": True,
            }

        return {
            "route_mode": "single",
            "target_domains": list(seen_domains),
            "intent_clauses": detected_intents,
            "is_multi": False,
        }
