"""CampusOne Vector Semantic Scorer for Hybrid Routing."""
from typing import Dict, List, Optional
import numpy as np

DOMAINS = ["it", "hr", "fees", "facilities"]

DOMAIN_PROFILES: Dict[str, str] = {
    "it": (
        "Information technology, campus Wi-Fi eduroam network, VPN access, student portal login, "
        "password reset, 2FA authentication, computer lab, software license, email mailbox, printer credits."
    ),
    "hr": (
        "Human resources, employee medical insurance benefits, monthly salary payslip, paternity maternity leave, "
        "employment verification letter, provident fund, performance appraisal, staff reimbursement."
    ),
    "fees": (
        "Tuition fees, hostel fee payment deadline, payment receipt download, transaction pending status, "
        "late fee fine penalty, installment plan, refund policy, financial hold clearance, scholarship balance."
    ),
    "facilities": (
        "Campus facilities, hostel room maintenance, air conditioning AC repair, bathroom plumbing water leakage, "
        "sports complex gym timings, campus shuttle bus schedule, parking permit sticker, classroom projector."
    ),
}

_domain_embeddings: Optional[Dict[str, np.ndarray]] = None


def _get_domain_embeddings() -> Dict[str, np.ndarray]:
    """Computes and caches domain profile embeddings."""
    global _domain_embeddings
    if _domain_embeddings is None:
        try:
            from backend.knowledge_retrieval import get_embeddings
            embeddings = get_embeddings()
            _domain_embeddings = {}
            for domain in DOMAINS:
                profile_text = DOMAIN_PROFILES[domain]
                emb = embeddings.embed_query(profile_text)
                arr = np.array(emb, dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                _domain_embeddings[domain] = arr
        except Exception as e:
            # Fallback for environments where sentence-transformers is offline or initializing
            _domain_embeddings = {}
            for i, domain in enumerate(DOMAINS):
                dummy = np.zeros(384, dtype=np.float32)
                dummy[i * 50:(i + 1) * 50] = 1.0
                _domain_embeddings[domain] = dummy / np.linalg.norm(dummy)
    return _domain_embeddings


class VectorScorer:
    """Computes semantic similarity scores between a query and domain semantic profiles."""

    def __init__(self):
        self.domains = DOMAINS

    def score(self, query: str) -> Dict[str, float]:
        """
        Computes cosine similarity between query embedding and domain representations.
        Returns normalized scores summing to 1.0.
        """
        if not query or not query.strip():
            return {d: 0.25 for d in self.domains}

        try:
            from backend.knowledge_retrieval import get_embeddings
            embeddings = get_embeddings()
            q_emb = np.array(embeddings.embed_query(query), dtype=np.float32)
            norm = np.linalg.norm(q_emb)
            if norm > 0:
                q_emb = q_emb / norm
        except Exception:
            # Fallback simple token overlap for offline or uninitialized state
            scores = {}
            q_lower = query.lower()
            for d in self.domains:
                overlap = sum(1 for w in DOMAIN_PROFILES[d].lower().split() if w.strip(",.") in q_lower)
                scores[d] = float(overlap)
            total = sum(scores.values()) or 1.0
            return {d: scores[d] / total for d in self.domains}

        domain_embs = _get_domain_embeddings()
        raw_similarities: Dict[str, float] = {}

        for domain in self.domains:
            d_emb = domain_embs[domain]
            sim = float(np.dot(q_emb, d_emb))
            # Shift cosine similarity from [-1, 1] to positive range [0, 1]
            raw_similarities[domain] = max(0.0, sim)

        # Normalize via softmax or sum to ensure proper distribution
        exp_scores = {d: np.exp(sim * 5.0) for d, sim in raw_similarities.items()}
        total_exp = sum(exp_scores.values())
        if total_exp > 0:
            return {d: float(score / total_exp) for d, score in exp_scores.items()}

        return {d: 0.25 for d in self.domains}
