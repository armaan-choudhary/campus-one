#!/usr/bin/env python3
"""CampusOne End-to-End Latency Measurement Script.
Measures latency across Routing, Domain RAG, and End-to-End Workflow.
"""
import time
import sys
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.routing.hybrid_router import route_query
from backend.rag.engine import execute_domain_rag
from backend.graph import run_workflow
from backend.graph_state import AssistantState

SAMPLE_QUERIES = [
    ("How do I connect to campus Eduroam Wi-Fi?", "it"),
    ("Where can I download my monthly salary payslip?", "hr"),
    ("What is the deadline for paying semester tuition fees?", "fees"),
    ("The air conditioning in hostel room 204 is broken.", "facilities"),
    ("My account is blocked", "clarify"),
]


def measure_latencies(runs: int = 10) -> Dict[str, Any]:
    print(f"\nMeasuring system latencies across {runs} iterations per component...\n")

    router_latencies: List[float] = []
    rag_latencies: List[float] = []
    e2e_latencies: List[float] = []

    # Warmup
    _ = route_query("warmup query")

    # 1. Measure Router Latency
    for q, _ in SAMPLE_QUERIES:
        for _ in range(runs):
            t0 = time.perf_counter()
            _ = route_query(q)
            lat = (time.perf_counter() - t0) * 1000.0
            router_latencies.append(lat)

    # 2. Measure RAG Latency (for supported domains)
    for q, dept in SAMPLE_QUERIES:
        if dept != "clarify":
            for _ in range(runs):
                t0 = time.perf_counter()
                try:
                    _ = execute_domain_rag(query=q, department=dept)
                except Exception:
                    pass
                lat = (time.perf_counter() - t0) * 1000.0
                rag_latencies.append(lat)

    # 3. Measure End-to-End Workflow Latency
    for q, _ in SAMPLE_QUERIES:
        for _ in range(runs):
            t0 = time.perf_counter()
            state: AssistantState = {"current_query": q, "messages": []}
            try:
                _ = run_workflow(state, thread_id=f"lat_{time.time_ns()}")
            except Exception:
                pass
            lat = (time.perf_counter() - t0) * 1000.0
            e2e_latencies.append(lat)

    def stats(arr: List[float]) -> Dict[str, float]:
        return {
            "mean_ms": float(np.mean(arr)),
            "p50_ms": float(np.percentile(arr, 50)),
            "p95_ms": float(np.percentile(arr, 95)),
            "p99_ms": float(np.percentile(arr, 99)),
            "min_ms": float(np.min(arr)),
            "max_ms": float(np.max(arr)),
        }

    r_stats = stats(router_latencies)
    rag_stats = stats(rag_latencies)
    e2e_stats = stats(e2e_latencies)

    print("=" * 65)
    print("LATENCY MEASUREMENTS REPORT")
    print("=" * 65)
    print(f"{'Component':<18} {'Mean':<10} {'p50':<10} {'p95':<10} {'p99':<10}")
    print("-" * 65)
    print(f"{'Hybrid Router':<18} {r_stats['mean_ms']:<10.2f} {r_stats['p50_ms']:<10.2f} {r_stats['p95_ms']:<10.2f} {r_stats['p99_ms']:<10.2f}")
    print(f"{'Domain RAG':<18} {rag_stats['mean_ms']:<10.2f} {rag_stats['p50_ms']:<10.2f} {rag_stats['p95_ms']:<10.2f} {rag_stats['p99_ms']:<10.2f}")
    print(f"{'End-to-End':<18} {e2e_stats['mean_ms']:<10.2f} {e2e_stats['p50_ms']:<10.2f} {e2e_stats['p95_ms']:<10.2f} {e2e_stats['p99_ms']:<10.2f}")
    print("=" * 65 + "\n")

    return {
        "router": r_stats,
        "rag": rag_stats,
        "e2e": e2e_stats,
    }


if __name__ == "__main__":
    measure_latencies(runs=5)
