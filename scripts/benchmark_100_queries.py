#!/usr/bin/env python3
"""CampusOne 100+ Query Comprehensive Routing Benchmark.
Measures routing accuracy, macro F1, per-domain metrics, clarification rate,
false-routing rate, category performance, and latency percentiles.
"""
import time
import json
import sys
from pathlib import Path
from typing import Dict, Any, List
from collections import defaultdict
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.routing.hybrid_router import route_query, DOMAINS

BENCHMARK_FILE = Path(__file__).resolve().parent.parent / "data" / "routing" / "benchmark_100.jsonl"


def run_benchmark(data_path: Path = BENCHMARK_FILE) -> Dict[str, Any]:
    queries = []
    with open(data_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                queries.append(json.loads(line))

    print(f"\n==================================================================")
    print(f"CAMPUSONE 100+ QUERY ROUTING BENCHMARK")
    print(f"Total benchmark queries: {len(queries)}")
    print(f"==================================================================")

    y_true: List[str] = []
    y_pred: List[str] = []
    latencies: List[float] = []
    category_stats = defaultdict(lambda: {"total": 0, "correct": 0})
    clarified_count = 0
    false_route_count = 0

    for item in queries:
        q = item["query"]
        expected = item["expected_department"]
        cat = item.get("category", "general")

        t0 = time.perf_counter()
        res = route_query(q)
        lat = (time.perf_counter() - t0) * 1000.0
        latencies.append(lat)

        actual = res.department
        y_true.append(expected)
        y_pred.append(actual)

        if actual == "clarify":
            clarified_count += 1

        is_correct = (actual == expected)
        if not is_correct and actual != "clarify" and expected != "clarify":
            false_route_count += 1

        category_stats[cat]["total"] += 1
        if is_correct:
            category_stats[cat]["correct"] += 1

    labels = sorted(list(set(y_true + y_pred)))
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    clarification_rate = clarified_count / len(queries)
    false_routing_rate = false_route_count / len(queries)

    lat_mean = float(np.mean(latencies))
    lat_p50 = float(np.percentile(latencies, 50))
    lat_p95 = float(np.percentile(latencies, 95))
    lat_p99 = float(np.percentile(latencies, 99))

    print(f"Overall Accuracy:          {acc:.4f} ({acc * 100:.1f}%)")
    print(f"Macro F1 Score:            {macro_f1:.4f}")
    print(f"Clarification Rate:        {clarification_rate:.4f} ({clarification_rate * 100:.1f}%)")
    print(f"False-Routing Rate:        {false_routing_rate:.4f} ({false_routing_rate * 100:.1f}%)")
    print("-" * 66)
    print(f"{'Domain':<14} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Count':<8}")
    print("-" * 66)
    for lbl in labels:
        row = report.get(lbl, {})
        print(f"{lbl:<14} {row.get('precision', 0):<12.3f} {row.get('recall', 0):<12.3f} {row.get('f1-score', 0):<12.3f} {int(row.get('support', 0)):<8}")
    print("-" * 66)

    print("\nConfusion Matrix (Rows=Actual, Columns=Predicted):")
    print(f"{'':<14}" + " ".join(f"{lbl:>10}" for lbl in labels))
    for i, row in enumerate(cm):
        print(f"{labels[i]:<14}" + " ".join(f"{val:>10}" for val in row))

    print("\nCategory Performance Breakdown:")
    for cat, stats in sorted(category_stats.items()):
        pct = (stats["correct"] / stats["total"]) * 100 if stats["total"] > 0 else 0.0
        print(f"  - {cat:<26}: {stats['correct']:>2}/{stats['total']:<2} ({pct:>5.1f}%)")

    print(f"\nInference Latencies:")
    print(f"  - Mean: {lat_mean:.2f} ms")
    print(f"  - p50:  {lat_p50:.2f} ms")
    print(f"  - p95:  {lat_p95:.2f} ms")
    print(f"  - p99:  {lat_p99:.2f} ms")
    print(f"==================================================================\n")

    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "clarification_rate": clarification_rate,
        "false_routing_rate": false_routing_rate,
        "classification_report": report,
        "category_stats": dict(category_stats),
        "latencies": {
            "mean_ms": lat_mean,
            "p50_ms": lat_p50,
            "p95_ms": lat_p95,
            "p99_ms": lat_p99,
        },
    }


if __name__ == "__main__":
    run_benchmark()
