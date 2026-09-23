"""CampusOne Custom Lightweight Routing Model.
Implements a fast, calibrated classification model for domain routing without heavy generative LLMs.
"""
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "saved_model.joblib"
TRAIN_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "routing" / "train.jsonl"


class CustomRoutingModel:
    """Lightweight text classifier for domain routing across campus departments."""

    DOMAINS = ["it", "hr", "fees", "facilities"]

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.pipeline: Optional[Pipeline] = None
        self.classes_: List[str] = self.DOMAINS

    def train(self, texts: List[str], labels: List[str]) -> "CustomRoutingModel":
        """Trains the calibrated classification pipeline on text-label pairs."""
        # Filter out ambiguous/clarify labels for domain-discriminative training
        filtered_texts = []
        filtered_labels = []
        for t, l in zip(texts, labels):
            if l in self.DOMAINS:
                filtered_texts.append(t)
                filtered_labels.append(l)

        base_lr = LogisticRegression(
            C=2.5,
            max_iter=300,
            solver="lbfgs",
            class_weight="balanced",
            random_state=42,
        )

        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                lowercase=True,
                strip_accents="unicode",
                sublinear_tf=True,
            )),
            ("clf", base_lr),
        ])

        self.pipeline.fit(filtered_texts, filtered_labels)
        self.classes_ = list(self.pipeline.classes_)
        return self

    def predict_proba(self, query: str) -> Dict[str, float]:
        """Returns normalized probability distribution across all supported domains."""
        if self.pipeline is None:
            self.load_or_train()

        probs = self.pipeline.predict_proba([query])[0]
        prob_dict = {cls: float(prob) for cls, prob in zip(self.pipeline.classes_, probs)}

        # Guarantee all four domains exist in output
        result = {d: prob_dict.get(d, 0.0) for d in self.DOMAINS}
        total = sum(result.values())
        if total > 0:
            result = {d: val / total for d, val in result.items()}
        return result

    def predict(self, query: str) -> str:
        """Returns top predicted domain."""
        probs = self.predict_proba(query)
        return max(probs.items(), key=lambda x: x[1])[0]

    def save(self, path: Optional[Path] = None) -> None:
        """Serializes the trained pipeline."""
        target_path = path or self.model_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"pipeline": self.pipeline, "classes": self.classes_}, target_path)

    def load(self, path: Optional[Path] = None) -> bool:
        """Loads a pre-trained pipeline from disk."""
        target_path = path or self.model_path
        if target_path.exists():
            data = joblib.load(target_path)
            self.pipeline = data["pipeline"]
            self.classes_ = data["classes"]
            return True
        return False

    def load_or_train(self) -> "CustomRoutingModel":
        """Loads model if present, otherwise trains from train.jsonl."""
        if self.load():
            return self

        if TRAIN_DATA_PATH.exists():
            texts, labels = [], []
            with open(TRAIN_DATA_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        item = json.loads(line)
                        texts.append(item["query"])
                        labels.append(item["department"])
            self.train(texts, labels)
            try:
                self.save()
            except Exception:
                pass
            return self

        raise RuntimeError("No trained model found and train dataset does not exist.")
