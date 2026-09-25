# CampusOne — Analytics and Evaluation

## 1. Measurement principles

Measure the complete path from message to supported outcome. Model confidence alone is not success. A high-confidence answer with no source is a failure; a clarification that safely prevents a wrong answer is a positive outcome for an ambiguous case.

All dashboards identify dataset/configuration versions and time windows. Metrics are computed from immutable event records and can be reproduced by the evaluation harness.

## 2. Event model

Each event has:

```json
{
  "event_id": "e1",
  "event_type": "routing_decision_created",
  "event_version": 1,
  "occurred_at": "2026-09-11T07:00:00Z",
  "request_id": "req1",
  "conversation_id": "c1",
  "message_id": "m1",
  "user_id_hash": "sha256...",
  "domain": "finance",
  "outcome": "answered",
  "latency_ms": 1840,
  "payload": {"reason_code":"two_explicit_domain_signals"}
}
```

Allowed event types:

`conversation_created`, `message_received`, `routing_decision_created`, `clarification_requested`, `retrieval_completed`, `citation_attached`, `response_generated`, `handoff_created`, `feedback_submitted`, `resolution_changed`, `knowledge_ingested`, `knowledge_published`, `evaluation_run_completed`.

Payloads are allowlisted, size-limited, and PII-redacted. Store hashes or IDs instead of raw message text in aggregate analytics.

## 3. Metric definitions

Let `N` be the evaluated case set and `D` the domain set.

### Routing

For single-intent case `i`, `correct_i = 1` if predicted primary domain equals expected domain and route mode is compatible.

```text
single_intent_accuracy = sum(correct_i) / count(single_intent_cases)
```

For multi-label routing, let `Y_i` be expected domain set and `P_i` predicted set:

```text
set_exact_match = count(P_i == Y_i) / count(multi_intent_cases)
example_precision_i = |P_i ∩ Y_i| / |P_i|       (0 when |P_i| = 0)
example_recall_i = |P_i ∩ Y_i| / |Y_i|
```

For every domain `d`:

```text
precision_d = TP_d / (TP_d + FP_d)
recall_d = TP_d / (TP_d + FN_d)
F1_d = 2 * precision_d * recall_d / (precision_d + recall_d)
macro_F1 = mean(F1_d for d in D)
```

`routing_accuracy` on the dashboard is single-intent accuracy for production-labelled samples; the evaluation report shows exact-match and macro F1 separately.

### Confidence calibration

Bin predicted confidence into `M=10` equal-width bins. For bin `b`, `conf_b` is mean confidence and `acc_b` is empirical correctness.

```text
ECE = sum((n_b / N) * abs(acc_b - conf_b), b=1..M)
Brier = mean((confidence_i - correctness_i)^2)
```

### Clarification and false routing

```text
clarification_rate = clarification_turns / all_user_turns
ambiguous_clarification_recall = correctly_clarified_ambiguous_cases / ambiguous_cases
false_routing_rate = confidently_routed_incorrect_cases / all_cases
```

### Grounding

At claim level:

```text
source_coverage = factual_claims_with_valid_citation / factual_claims
citation_precision = citations_supporting_claim / all_citations
```

The evaluation annotator supplies expected source IDs or source tags. A citation is valid only when its chunk is in the retrieved evidence and supports the claim.

### Handoff and latency

```text
handoff_rate = handoff_conversations / conversations
avg_response_time = mean(response_completed_at - message_received_at)
p95_response_time = 95th percentile of the same durations
```

### True end-to-end resolution

Each case has a rubric with `answer_supported`, `actionable_next_step`, `unnecessary_handoff`, and `user_satisfied_or_expected_state`. A case is resolved when:

```text
resolved_i = answer_supported_i
             AND actionable_next_step_i
             AND NOT unnecessary_handoff_i
             AND expected_resolution_state_i is met
```

```text
resolution_rate = sum(resolved_i) / count(answerable_cases)
```

Unsupported and deliberately no-evidence cases are scored on safe fallback behavior, not on whether they resolve without handoff.

## 4. Evaluation dataset

Store one JSON object per line in `backend/app/evaluation/datasets/v1.jsonl`:

```json
{
  "case_id": "it-clear-001",
  "category": "clear_it",
  "input": "How do I reset my university password?",
  "conversation_context": {"active_domain": null,"messages": []},
  "expected_domains": ["it"],
  "expected_confidence_range": [0.75, 1.0],
  "expected_behavior": "answer",
  "expected_source_tags": ["it-account-recovery"],
  "expected_answer_characteristics": ["reset steps","official support path","citation"],
  "expected_resolution_state": "resolved",
  "tags": ["demo"]
}
```

Required categories and minimum seed counts:

| Category | Minimum cases |
|---|---:|
| clear IT, Finance, Facilities, Academics, Administration | 10 each |
| ambiguous | 10 |
| multi-domain | 10 |
| topic-switching conversations | 5 sequences |
| unsupported | 8 |
| insufficient knowledge | 8 |
| adversarial ambiguity | 8 |

Each case must include input, context, expected domain(s), confidence range, behavior, answer characteristics/source tags, and resolution state.

Representative cases:

```json
{"case_id":"multi-001","category":"multi_domain","input":"My fee payment failed and I also cannot log into the portal.","conversation_context":{},"expected_domains":["finance","it"],"expected_confidence_range":[0.65,1.0],"expected_behavior":"multi_answer","expected_source_tags":["finance-payment-failure","it-portal-login"],"expected_answer_characteristics":["two_issue_sections","two_citation_groups"],"expected_resolution_state":"resolved"}
{"case_id":"amb-001","category":"ambiguous","input":"My account has a problem.","conversation_context":{},"expected_domains":["it","finance","administration"],"expected_confidence_range":[0.0,0.74],"expected_behavior":"clarify","expected_source_tags":[],"expected_answer_characteristics":["targeted_question","no_guess"],"expected_resolution_state":"needs_clarification"}
{"case_id":"safe-001","category":"unsupported","input":"Tell me the process for a campus service that is not in the knowledge base.","conversation_context":{},"expected_domains":[],"expected_confidence_range":[0.0,0.44],"expected_behavior":"fallback_or_handoff","expected_source_tags":[],"expected_answer_characteristics":["no_fabrication","next_action"],"expected_resolution_state":"handed_off"}
```

## 5. Harness architecture

The harness runs the same router, retrieval policy, and orchestration interfaces with deterministic fakes:

```text
load JSONL -> validate cases -> seed fake knowledge -> run case -> score route
           -> score answer/citations -> score resolution -> aggregate metrics
           -> write JSON + Markdown report -> apply quality gates
```

Commands:

```bash
python -m app.evaluation.run --dataset backend/evaluation/datasets/v1.jsonl --output artifacts/eval/v1.json
python -m app.evaluation.report artifacts/eval/v1.json
```

The harness exits 1 when configured gates fail. Model-backed runs are optional and labelled; the deterministic run is the release gate.

## 6. Dashboard views

- Summary cards and date/domain filters.
- Routing accuracy and macro F1 by domain.
- Confusion matrix and most common wrong routes.
- Clarification and false-routing trends.
- Source coverage, citation precision, and no-evidence safety results.
- Handoff rate and recent unresolved conversations.
- p50/p95 response time and multi-domain latency.

Dashboard queries use pre-aggregated daily views when data grows; MVP can query indexed event tables directly.

## 7. Evaluation acceptance gates

- All deterministic cases run and are validated against the JSON schema.
- No-evidence and prompt-injection safety tests have zero fabricated factual claims.
- Routing confusion matrix is emitted.
- Every factual expected answer has valid citation coverage.
- A run identifies model, prompt, threshold, knowledge, and dataset versions.

