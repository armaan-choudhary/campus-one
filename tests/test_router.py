"""Tests for Custom Routing Model and Scorers (Agent 2)."""
import pytest
from backend.routing.model import CustomRoutingModel
from backend.routing.inference import predict_domain_probabilities
from backend.routing.vector_scorer import VectorScorer
from backend.routing.lexical_scorer import LexicalScorer
from backend.routing.schemas import RoutingResult


class TestCustomRoutingModel:
    def test_model_training_and_prediction(self, tmp_path):
        """Test training custom model on minimal dataset and predicting probabilities."""
        texts = [
            "eduroam wifi password connection",
            "vpn network access",
            "annual salary payslip medical insurance",
            "maternity leave provident fund",
            "tuition fees payment receipt semester",
            "late fee refund installment",
            "hostel ac maintenance room plumbing",
            "gym timing sports badminton court",
        ]
        labels = ["it", "it", "hr", "hr", "fees", "fees", "facilities", "facilities"]

        model = CustomRoutingModel(model_path=tmp_path / "test_model.joblib")
        model.train(texts, labels)

        probs = model.predict_proba("How do I connect to wifi?")
        assert isinstance(probs, dict)
        assert set(probs.keys()) == {"it", "hr", "fees", "facilities"}
        assert probs["it"] > probs["hr"]
        assert probs["it"] > probs["fees"]
        assert probs["it"] > probs["facilities"]
        assert pytest.approx(sum(probs.values()), rel=1e-3) == 1.0

        # Save and reload
        model.save()
        loaded = CustomRoutingModel(model_path=tmp_path / "test_model.joblib")
        assert loaded.load() is True
        loaded_probs = loaded.predict_proba("How do I connect to wifi?")
        assert pytest.approx(loaded_probs["it"], rel=1e-3) == probs["it"]

    def test_inference_module(self):
        """Test the global inference prediction function."""
        probs = predict_domain_probabilities("hostel room ac broken")
        assert isinstance(probs, dict)
        assert set(probs.keys()) == {"it", "hr", "fees", "facilities"}
        assert probs["facilities"] > probs["hr"]


class TestScorers:
    def test_lexical_scorer(self):
        """Test lexical scorer matches tokens and normalizes correctly."""
        scorer = LexicalScorer()

        # Clear IT tokens
        it_scores = scorer.score("wifi password login error")
        assert it_scores["it"] > it_scores["fees"]
        assert pytest.approx(sum(it_scores.values()), rel=1e-3) == 1.0

        # Clear Fees tokens
        fee_scores = scorer.score("tuition fees payment receipt")
        assert fee_scores["fees"] > fee_scores["it"]
        assert pytest.approx(sum(fee_scores.values()), rel=1e-3) == 1.0

        # Empty query uniform score
        empty_scores = scorer.score("")
        assert empty_scores == {"it": 0.25, "hr": 0.25, "fees": 0.25, "facilities": 0.25}

    def test_vector_scorer(self):
        """Test vector scorer produces normalized semantic scores."""
        scorer = VectorScorer()
        scores = scorer.score("My laptop cannot connect to the eduroam wireless signal")
        assert isinstance(scores, dict)
        assert set(scores.keys()) == {"it", "hr", "fees", "facilities"}
        assert pytest.approx(sum(scores.values()), rel=1e-3) == 1.0
        assert scores["it"] > scores["hr"]
