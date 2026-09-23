"""Tests for Hybrid Routing Engine and Margin Guard Policy (Agent 2)."""
import pytest
from unittest.mock import MagicMock, patch
from backend.routing.hybrid_router import (
    HybridRouter,
    route_query,
    MARGIN_THRESHOLD,
    DEFAULT_WEIGHTS,
)
from backend.routing.schemas import RoutingResult


class TestHybridRouter:
    def test_default_weights_proportions(self):
        """Verify weights are 55% vector, 25% lexical, 20% custom model."""
        router = HybridRouter()
        assert pytest.approx(router.weights["vector"], rel=1e-2) == 0.55
        assert pytest.approx(router.weights["lexical"], rel=1e-2) == 0.25
        assert pytest.approx(router.weights["model"], rel=1e-2) == 0.20

    def test_custom_weights_configuration(self):
        """Verify configurable weights are accepted and normalized."""
        custom_weights = {"vector": 0.40, "lexical": 0.40, "model": 0.20}
        router = HybridRouter(weights=custom_weights)
        assert pytest.approx(router.weights["vector"], rel=1e-2) == 0.40
        assert pytest.approx(router.weights["lexical"], rel=1e-2) == 0.40
        assert pytest.approx(router.weights["model"], rel=1e-2) == 0.20

    def test_margin_guard_boundary_below_threshold(self):
        """Test that margin < 0.15 triggers clarification and sets department='clarify'."""
        router = HybridRouter(margin_threshold=0.15)

        # Mock scorers to return scores where difference between top1 and top2 is 0.10 (< 0.15)
        with patch.object(router.vector_scorer, "score", return_value={"it": 0.40, "fees": 0.30, "hr": 0.15, "facilities": 0.15}), \
             patch.object(router.lexical_scorer, "score", return_value={"it": 0.40, "fees": 0.30, "hr": 0.15, "facilities": 0.15}), \
             patch("backend.routing.hybrid_router.predict_domain_probabilities", return_value={"it": 0.40, "fees": 0.30, "hr": 0.15, "facilities": 0.15}):

            res = router.route("Ambiguous query with close scores")
            assert res.department == "clarify"
            assert res.requires_clarification is True
            assert res.margin == pytest.approx(0.10, abs=1e-3)
            assert "Margin between top candidate" in res.reason

    def test_margin_guard_boundary_above_threshold(self):
        """Test that margin >= 0.15 routes cleanly to top department."""
        router = HybridRouter(margin_threshold=0.15)

        # Mock scorers to return scores where difference is 0.20 (> 0.15)
        with patch.object(router.vector_scorer, "score", return_value={"it": 0.55, "fees": 0.25, "hr": 0.10, "facilities": 0.10}), \
             patch.object(router.lexical_scorer, "score", return_value={"it": 0.60, "fees": 0.20, "hr": 0.10, "facilities": 0.10}), \
             patch("backend.routing.hybrid_router.predict_domain_probabilities", return_value={"it": 0.50, "fees": 0.30, "hr": 0.10, "facilities": 0.10}):

            res = router.route("Unambiguous IT request")
            assert res.department == "it"
            assert res.requires_clarification is False
            assert res.margin > 0.15
            assert "Routed to 'it'" in res.reason

    def test_routing_all_four_departments_unambiguous(self):
        """Test that each department is correctly routed for representative queries."""
        cases = [
            ("How do I connect to the Eduroam campus Wi-Fi network?", "it"),
            ("Where can I download my monthly salary payslip?", "hr"),
            ("What is the deadline for paying semester tuition fees?", "fees"),
            ("The air conditioning in my hostel room is leaking water.", "facilities"),
        ]

        for query, expected_dept in cases:
            res = route_query(query)
            assert isinstance(res, RoutingResult)
            assert res.department == expected_dept
            assert res.requires_clarification is False
            assert res.confidence > 0.45
            assert res.margin >= 0.15

    def test_ambiguous_query_triggers_clarification(self):
        """Test ambiguous query triggers clarification due to small margin."""
        query = "My account is blocked"
        res = route_query(query)
        assert res.requires_clarification is True
        assert res.department == "clarify"
        assert res.margin < MARGIN_THRESHOLD

    def test_empty_query_routing(self):
        """Test empty query produces clarify result with zero confidence."""
        res = route_query("")
        assert res.department == "clarify"
        assert res.requires_clarification is True
        assert res.confidence == 0.0

    def test_noisy_query_robustness(self):
        """Test that typos and noisy text are routed correctly."""
        res_it = route_query("wiffi not conneting in hostel 4")
        assert res_it.department == "it"

        res_fac = route_query("hostel room ac not cooling properly")
        assert res_fac.department == "facilities"
