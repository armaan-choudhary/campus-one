#!/usr/bin/env python3
"""CampusOne Hybrid Router Evaluation Script.
Measures accuracy, Macro F1, per-domain precision/recall, confusion matrix,
ambiguous query resolution, and inference latency.
"""
import time
import json
import numpy as np
import sys
from pathlib import Path
from typing import Dict, Any, List
from collections import defaultdict
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.routing.hybrid_router import route_query, DOMAINS

TEST_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "routing" / "test.jsonl"


def load_test_dataset(path: Path) -> List[Dict[str, Any]]:
    """Loads JSONL test queries."""
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))
    return items


def run_evaluation(data_path: Path = TEST_DATA_PATH) -> Dict[str, Any]:
    """Runs evaluation benchmark over the test dataset."""
    dataset = load_test_dataset(data_path)
    print(f"\nEvaluating Hybrid Router on {len(dataset)} examples from {data_path.name}...")

    y_true: List[str] = []
    y_pred: List[str] = []
    latencies_ms: List[float] = []

    categories = defaultdict(lambda: {"total": 0, "correct": 0})
    details = []

    for item in dataset:
        query = item["query"]
        expected = item["department"]
        cat = item.get("category", "standard")

        t0 = time.perf_counter()
        result = route_query(query)
        latency = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(latency)

        actual = result.department
        y_true.append(expected)
        y_pred.append(actual)

        is_correct = (actual == expected)
        categories[cat]["total"] += 1
        if is_correct:
            categories[cat]["correct"] += 1

        details.append({
            "query": query,
            "expected": expected,
            "actual": actual,
            "confidence": result.confidence,
            "margin": result.margin,
            "requires_clarification": result.requires_clarification,
            "latency_ms": round(latency, 2),
            "correct": is_correct,
            "category": cat,
        })

    # Metrics
    all_labels = sorted(list(set(y_true + y_pred)))
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")

    report = classification_report(y_true, y_pred, labels=all_labels, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=all_labels)

    latency_p50 = float(np.percentile(latencies_ms, 50))
    latency_p95 = float(np.percentile(latencies_ms, 95))
    latency_p99 = float(np.percentile(latencies_ms, 99))
    latency_mean = float(np.mean(latencies_ms))

    # Print summary
    print("\n" + "=" * 65)
    print("HYBRID ROUTER EVALUATION REPORT")
    print("=" * 65)
    print(f"Total Test Samples:        {len(dataset)}")
    print(f"Overall Accuracy:          {acc:.4f} ({acc * 100:.1f}%)")
    print(f"Macro F1 Score:            {macro_f1:.4f}")
    print("-" * 65)
    print(f"{'Domain':<14} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<8}")
    print("-" * 65)
    for lbl in all_labels:
        row = report.get(lbl, {})
        print(f"{lbl:<14} {row.get('precision', 0):<12.3f} {row.get('recall', 0):<12.3f} {row.get('f1-score', 0):<12.3f} {int(row.get('support', 0)):<8}")
    print("-" * 65)

    print("\nConfusion Matrix (Rows=True, Cols=Pred):")
    print(f"{'':<14}" + " ".join(f"{lbl:>10}" for lbl in all_labels))
    for i, row in enumerate(cm):
        print(f"{all_labels[i]:<14}" + " ".join(f"{val:>10}" for val in row))

    print("\nPerformance by Query Category:")
    for cat, stats in sorted(categories.items()):
        pct = (stats["correct"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        print(f"  - {cat:<16}: {stats['correct']}/{stats['total']} ({pct:.1f}%)")

    print(f"\nInference Latency (ms):")
    print(f"  - Mean: {latency_mean:.2f} ms")
    print(f"  - p50:  {latency_p50:.2f} ms")
    print(f"  - p95:  {latency_p95:.2f} ms")
    print(f"  - p99:  {latency_p99:.2f} ms")
    print("=" * 65 + "\n")

    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "labels": all_labels,
        "category_performance": dict(categories),
        "latency_stats": {
            "mean_ms": latency_mean,
            "p50_ms": latency_p50,
            "p95_ms": latency_p95,
            "p99_ms": latency_p99,
        },
        "details": details,
    }


if __name__ == "__main__":
    run_evaluation()
