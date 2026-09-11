# CampusOne — Product Requirements

## 1. Requirement conventions

- **MUST:** required for the MVP acceptance gate.
- **SHOULD:** expected unless an explicit implementation tradeoff is recorded.
- **MAY:** optional enhancement.
- IDs are stable and used by tests and the implementation plan.

## 2. Functional requirements

### Identity and access

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-AUTH-001 | The system MUST expose an authentication abstraction so the conversation layer receives a `CurrentUser` independent of the identity provider. | MUST | Mock provider works in local/demo mode; provider interface has an OIDC implementation seam. |
| FR-AUTH-002 | A prototype user MUST be able to sign in with a seeded student account. | MUST | Login returns an access token and `/me` returns the seeded identity. |
| FR-AUTH-003 | Role checks MUST protect admin, ingestion, analytics, evaluation, and handoff-agent operations. | MUST | Student requests to admin endpoints receive 403. |
| FR-AUTH-004 | The system MUST minimise PII in messages, analytics, and logs. | MUST | Redaction tests pass and raw tokens are never logged. |

### Conversation

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-CONV-001 | A user MUST be able to create and list their conversations. | MUST | API and UI show only authorised conversations. |
| FR-CONV-002 | A user MUST send a message to one unified chat endpoint. | MUST | A single request produces one assistant turn and persisted metadata. |
| FR-CONV-003 | Conversation state MUST retain messages, active domain, previous domains, routing decisions, retrieval sources, resolution state, and handoff state. | MUST | State can be reconstructed from the API and database. |
| FR-CONV-004 | The system MUST detect a topic switch and re-route instead of blindly inheriting the previous domain. | MUST | IT then Finance fixture routes the second message to Finance. |
| FR-CONV-005 | The UI MUST show processing, clarification, citations, and handoff states. | MUST | Playwright flow covers each state. |

### Routing and confidence

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-ROUTE-001 | The router MUST support one or more candidate domains per message. | MUST | Single and multi-intent fixtures return expected domain sets. |
| FR-ROUTE-002 | Each candidate MUST have a confidence score in [0, 1]. | MUST | Schema validation rejects invalid scores. |
| FR-ROUTE-003 | Routing policy MUST use configurable high and low thresholds. | MUST | Environment/config change affects behavior without code edits. |
| FR-ROUTE-004 | High-confidence requests MUST invoke the selected skill automatically. | MUST | Clear IT fixture does not ask clarification. |
| FR-ROUTE-005 | Ambiguous requests MUST ask a targeted clarification question naming user-facing topics, not internal model reasoning. | MUST | `My account has a problem` asks a question instead of guessing. |
| FR-ROUTE-006 | Low-confidence unsupported requests MUST enter fallback or handoff. | MUST | Unknown-domain fixture does not invoke an arbitrary skill. |
| FR-ROUTE-007 | The router MUST expose machine-readable reason codes for analytics, without storing chain-of-thought. | MUST | Decision contains reason code and compact evidence labels. |

### Grounded domain answers

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-RAG-001 | Each domain MUST have its own published knowledge collection and retrieval filter. | MUST | A domain query cannot retrieve another domain's source by default. |
| FR-RAG-002 | University-specific factual claims MUST be supported by citations. | MUST | Citation coverage test passes. |
| FR-RAG-003 | Insufficient evidence MUST produce a no-answer, clarification, or handoff response. | MUST | Empty retrieval fixture has no invented policy details. |
| FR-RAG-004 | Answers MUST include source title, source reference, and relevant section/page metadata where available. | MUST | UI renders citation cards. |
| FR-RAG-005 | Domain prompts MUST define scope, safety rules, answer format, and escalation behavior. | MUST | Each registered skill passes prompt/config validation. |

### Multi-domain behavior

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-MULTI-001 | A message containing independent intents MUST invoke all selected eligible skills. | MUST | Fee issue plus portal login produces Finance and IT sub-answers. |
| FR-MULTI-002 | The orchestration layer MUST preserve which evidence supports which sub-answer. | MUST | Final citations have domain and sub-intent association. |
| FR-MULTI-003 | Conflicting evidence MUST be surfaced as uncertainty and escalated; it MUST NOT be silently merged. | MUST | Conflict fixture creates handoff reason `conflicting_knowledge`. |
| FR-MULTI-004 | The final response MUST be synthesised into one assistant message with numbered actions when useful. | MUST | UI does not render separate bot identities. |

### Fallback and handoff

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-HAND-001 | The user MAY explicitly request a human; when they do, the system MUST provide a handoff path. | MUST | Text such as `human please` creates a handoff. |
| FR-HAND-002 | A handoff MUST preserve conversation summary, recent messages, candidate domains, reason, and suggested department. | MUST | Handoff API record contains all fields. |
| FR-HAND-003 | Repeated failed resolution attempts MUST trigger handoff after a configurable limit. | MUST | Three unsuccessful attempts meet the configured policy. |
| FR-HAND-004 | Handoff UI MUST show next action and expected status, without claiming a ticket exists unless created. | MUST | Mock handoff displays reference only when generated. |

### Analytics and evaluation

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-AN-001 | The system MUST emit routing, retrieval, citation, response, feedback, handoff, and resolution events. | MUST | Event rows are present for a complete chat turn. |
| FR-AN-002 | Admin analytics MUST show routing accuracy, resolution rate, clarification rate, handoff rate, source coverage, latency, and routing errors. | MUST | Dashboard endpoint and UI expose each metric. |
| FR-AN-003 | The evaluation harness MUST run deterministic JSONL cases and produce machine-readable results. | MUST | `python -m app.evaluation.run` exits non-zero on failed gate. |
| FR-AN-004 | Routing metrics MUST be reported overall and by domain. | MUST | Output includes per-domain precision, recall, F1, and support. |

### Knowledge operations

| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-KB-001 | An authorised knowledge administrator MUST ingest a document with domain and metadata. | MUST | Ingestion creates versioned document and chunks. |
| FR-KB-002 | Documents MUST have draft, published, superseded, and archived lifecycle states. | MUST | Retrieval only considers published current versions by default. |
| FR-KB-003 | A failed embedding or parse MUST leave a visible failed ingestion record and MUST NOT publish partial content. | MUST | Failure test confirms atomic publish behavior. |
| FR-KB-004 | Retired or stale sources MUST stop being retrieved after the configured effective date. | MUST | Expiry fixture excludes stale evidence. |

## 3. Non-functional requirements

| ID | Requirement | Target / acceptance |
|---|---|---|
| NFR-PERF-001 | First response latency for a clear single-domain request | p95 <= 8 seconds in demo environment; measured server-side. |
| NFR-PERF-002 | Multi-domain latency | p95 <= 12 seconds with a maximum of three parallel skills. |
| NFR-REL-001 | API availability | Health endpoint responds even when LLM dependency is unavailable; degraded mode is explicit. |
| NFR-SEC-001 | Secrets | No secret in frontend bundle, source control, prompt, or analytics payload. |
| NFR-SEC-002 | Authorisation | Every conversation, knowledge, analytics, and evaluation resource is checked server-side. |
| NFR-OBS-001 | Correlation | Every request has `request_id`; every turn has `conversation_id` and `message_id`. |
| NFR-MAINT-001 | Testability | Routing, retrieval, orchestration, and skills accept injected clients and deterministic fakes. |
| NFR-MAINT-002 | Configuration | Thresholds, models, prompts, limits, and source rules are typed settings, not scattered constants. |
| NFR-DATA-001 | Retention | Raw message retention is configurable; aggregate metrics remain after redaction. |
| NFR-UX-001 | Accessibility | Keyboard navigation, visible focus, semantic status labels, and contrast-compliant states. |

## 4. Personas and critical journeys

### Student: clear request

1. Sign in.
2. Ask, `How do I reset my university password?`
3. See `IT` as a subtle status label and a cited answer.
4. Mark resolved or provide feedback.

### Student: topic switch

1. Ask an IT question.
2. Ask, `Also, where can I check my semester fees?`
3. Router detects Finance, updates active domain, and does not reuse IT evidence.

### Student: ambiguity

1. Ask, `My account has a problem.`
2. See a concise choice or question such as `Is this about signing in, a fee/payment account, or updating your student information?`
3. Reply; the next turn uses the clarification as routing context.

### Student: unsupported request

1. Ask for a process absent from the published knowledge base.
2. See a transparent no-answer and an offer to hand off.
3. Handoff context is persisted for an agent.

## 5. Product acceptance gate

The MVP is accepted when all MUST requirements above have automated coverage or a documented manual check, the demo runbook completes without fabricated university facts, and the evaluation harness produces a report with formulas defined in [11 Analytics and Evaluation](11_Analytics_and_Evaluation.md).

