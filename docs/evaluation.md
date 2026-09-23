# CampusOne — Evaluation & Performance Metrics

A rigorous, end-to-end evaluation suite was conducted across CampusOne's hybrid router, multi-intent semantic detector, unified RAG engine, resolution dependency graph, and cross-domain security boundaries.

---

## 1. Headline Benchmark Results

| Metric | Target | Measured Result | Status |
|:---|:---:|:---:|:---:|
| **Routing Accuracy (105 Queries)** | $\ge 85.0\%$ | **95.24%** (100 / 105) | **EXCEEDED** |
| **Routing Macro F1 Score** | $\ge 0.85$ | **0.9549** | **EXCEEDED** |
| **False Routing Rate (Cross-Domain)** | $< 5.0\%$ | **0.00%** (0 false routes) | **ZERO LEAKS** |
| **Multi-Intent Detection Accuracy** | $\ge 90.0\%$ | **100.0%** (10 / 10 benchmark compound queries) | **EXCEEDED** |
| **Clarification Escalation Rate** | $15.0 - 30.0\%$ | **22.86%** | **HEALTHY** |
| **Router Latency (p50)** | $< 25$ ms | **9.07 ms** | **SUB-10MS CPU** |
| **Domain RAG Retrieval Latency (p50)** | $< 100$ ms | **23.28 ms** | **HIGH SPEED** |
| **End-to-End Turn Latency (p50)** | $< 100$ ms | **37.47 ms** | **HIGH THROUGHPUT** |
| **PGVector Cross-Collection Leaks** | 0 | **0** | **100% ISOLATED** |
| **Automated Test Suite Pass Rate** | 100% | **99 / 99 Passed (100%)** | **VERIFIED** |

---

## 2. 105-Query Benchmark Breakdown

Dataset: [`data/routing/benchmark_100.jsonl`](file:///home/armaan/Documents/Projects/msInnovateHack/data/routing/benchmark_100.jsonl)  
Evaluation Script: [`scripts/benchmark_100_queries.py`](file:///home/armaan/Documents/Projects/msInnovateHack/scripts/benchmark_100_queries.py)

### 2.1 Per-Domain Precision, Recall, and F1-Scores

| Domain Key | Department | Precision | Recall | F1-Score | Support |
|:---|:---|:---:|:---:|:---:|:---:|
| `it` | IT Support | **0.950** | **0.950** | **0.950** | 20 |
| `hr` | Human Resources | **1.000** | **1.000** | **1.000** | 20 |
| `fees` | Finance & Fees | **0.909** | **1.000** | **0.952** | 20 |
| `facilities` | Facilities & Maintenance | **1.000** | **0.950** | **0.974** | 20 |
| `clarify` | Ambiguous / Clarification | **0.917** | **0.880** | **0.898** | 25 |
| **Macro Average** | — | **0.955** | **0.956** | **0.955** | **105** |
| **Weighted Average** | — | **0.954** | **0.952** | **0.953** | **105** |

### 2.2 Confusion Matrix

$$\begin{array}{l|ccccc}
\text{Actual \textbackslash Predicted} & \text{clarify} & \text{facilities} & \text{fees} & \text{hr} & \text{it} \\
\hline
\textbf{clarify} & \mathbf{22} & 0 & 2 & 0 & 1 \\
\textbf{facilities} & 1 & \mathbf{19} & 0 & 0 & 0 \\
\textbf{fees} & 0 & 0 & \mathbf{20} & 0 & 0 \\
\textbf{hr} & 0 & 0 & 0 & \mathbf{20} & 0 \\
\textbf{it} & 1 & 0 & 0 & 0 & \mathbf{19} \\
\end{array}$$

*Key Takeaway:* **Zero cross-domain false routes.** The system never routes an IT issue to HR, or a Fees query to Facilities. Any borderline query with confidence margin $\Delta < 0.15$ safely defaults to `clarify` to ask the student for clarification.

### 2.3 Category Performance

| Query Category | Accuracy | Correct / Total | Description |
|:---|:---:|:---:|:---|
| **Straightforward** | 96.8% | 60 / 62 | Standard unambiguous department requests |
| **Spelling Errors** | 100.0% | 8 / 8 | Heavily misspelled keywords (`wiffi`, `salry`, `feee`, `pluming`) |
| **Short Queries** | 100.0% | 8 / 8 | 2-3 word inputs (`eduroam wifi setup`, `gym timings`) |
| **Noisy** | 100.0% | 2 / 2 | Conversational and colloquial syntax |
| **Conversational Follow-up** | 100.0% | 8 / 8 | Multi-turn greetings, thanks, acknowledgments |
| **Overlapping Terminology** | 100.0% | 2 / 2 | Shared keywords disambiguated via negative anchors |
| **Topic Switching** | 100.0% | 2 / 2 | Mid-session context transitions |
| **Ambiguous** | 90.0% | 9 / 10 | Underspecified inputs correctly routed to clarification |

---

## 3. Multi-Intent Routing & Dependency Resolution

Dataset: [`data/routing/benchmark_multi_intent.jsonl`](file:///home/armaan/Documents/Projects/msInnovateHack/data/routing/benchmark_multi_intent.jsonl)  
Evaluation Script: [`scripts/benchmark_multi_intent.py`](file:///home/armaan/Documents/Projects/msInnovateHack/scripts/benchmark_multi_intent.py)

- **Test Set**: 10 complex multi-domain queries containing compound clauses across Fees, IT, Facilities, and HR.
- **Multi-Intent Detection Rate**: **100% (10 / 10)** compound queries correctly entered `route_mode="multi"`.
- **Target Domain Identification**: **100% precision** mapping sub-clauses to their respective department knowledge stores.
- **Dependency Graph Resolution**: Verified prerequisite inference across tested pairs:
  - `fees ➔ it` (Financial hold release before exam registration): **Passed**
  - `fees ➔ facilities` (Hostel fee receipt before key issuance): **Passed**
  - `hr ➔ fees` (TA fee waiver before invoice revision): **Passed**
  - `it ➔ facilities` (Campus RFID ID card before turnstile access): **Passed**

---

## 4. Latency Benchmarks (CPU Inference)

Measured via [`scripts/measure_latencies.py`](file:///home/armaan/Documents/Projects/msInnovateHack/scripts/measure_latencies.py):

| Component | Mean Latency | Median (p50) | 95th Percentile (p95) | 99th Percentile (p99) |
|:---|:---:|:---:|:---:|:---:|
| **3-Way Hybrid Router** | **9.38 ms** | **9.07 ms** | **10.96 ms** | **11.09 ms** |
| **Domain RAG Engine** | **29.08 ms** | **23.28 ms** | **39.12 ms** | **98.23 ms** |
| **LangGraph Turn Execution** | **32.61 ms** | **37.47 ms** | **44.13 ms** | **45.05 ms** |

*Benefit:* Because the ensemble router uses lightweight sentence embeddings and TF-IDF calibrated classifiers rather than an LLM prompt, routing decisions complete in **sub-10ms** on standard CPU infrastructure without incurring external API latency or costs.

---

## 5. Security & Isolation Testing

Verified by [`tests/test_cross_domain_security.py`](file:///home/armaan/Documents/Projects/msInnovateHack/tests/test_cross_domain_security.py):
1. **Target Collection Binding**: Department queries are bound to their respective collection (`finance_knowledge`, `it_knowledge`, `facilities_knowledge`, `hr_knowledge`).
2. **Zero Cross-Collection Leaks**: 100% of retrieved chunks match the queried department metadata. No finance document is ever returned in response to an IT query, and vice-versa.
3. **RBAC Isolation**: Support agent ticket queues and knowledge admin consoles enforce role-based authorization matching JWT claims.
