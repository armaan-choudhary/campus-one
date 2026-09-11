# CampusOne — Testing Strategy

## 1. Test goals

Tests must prove correct routing, safe uncertainty, grounded answers, citation integrity, state transitions, access control, and measurable resolution. LLM variability is isolated behind interfaces; deterministic fixtures are the release gate.

## 2. Test pyramid

```text
                 E2E / demo flows (small, real browser)
              API + orchestration integration tests
        retrieval, database, and domain contract tests
 routing/policy/citation/security unit tests (large base)
```

Recommended stack: `pytest`, `pytest-asyncio`, `httpx` test client, `testcontainers` or Docker PostgreSQL for integration, `vitest` for frontend logic, and Playwright for browser flows.

## 3. Deterministic test doubles

- `FakeIdentityProvider`: seeded identities and roles.
- `FakeRouter`: returns fixture decisions for exact messages or invokes deterministic lexical classifier.
- `FakeEmbedder`: stable vectors derived from token hashes.
- `FakeRetriever`: fixture evidence by domain/intent; can return empty/conflict/stale sets.
- `FakeGenerator`: produces claim/citation structures from evidence and deliberately fails when evidence is absent.
- `FakeQueue`: inline job execution with recorded submissions.
- `FrozenClock`: controls effective dates, retention, and latency metrics.

## 4. Unit test suites

### Routing

- score fusion returns [0,1] and clamps invalid components;
- thresholds are loaded from settings;
- high confidence routes automatically;
- ambiguous top-two margin asks clarification;
- low score produces fallback;
- human request overrides classifier;
- multi-intent requires independent domain signals;
- active domain does not suppress explicit topic switch;
- unknown model domain is rejected;
- schema error invokes deterministic fallback.

### Retrieval and citations

- domain/status/role/effective-date filters are applied before rank;
- stale and archived documents are excluded;
- vector + lexical merge is deterministic;
- evidence score threshold controls answerability;
- citation points to a returned chunk;
- every factual claim has a citation;
- conflicting evidence produces conflict outcome;
- source URI is filtered by audience.

### Domain skills

For each of the five skills:

- descriptor keys/intents are valid;
- clear intent produces the right query scope;
- no evidence returns no-answer;
- injection-like evidence is treated as data;
- sensitive request triggers skill policy;
- citations preserve domain and document metadata.

### Orchestration and state

- append user and assistant messages in order;
- idempotency key returns the same response;
- optimistic version conflict returns 409;
- clarification state carries candidate domains into the next turn;
- multi-domain skills execute concurrently;
- skill timeout preserves successful sibling result;
- answer transitions resolution appropriately;
- handoff is required after repeated failures.

## 5. API tests

Use the FastAPI test client with fake dependencies. Test every endpoint in [09 API Reference](09_API_Reference.md) for:

- valid request and response schema;
- missing/invalid auth;
- role denial;
- ownership denial;
- malformed and boundary values;
- idempotency and conflict behavior;
- rate limit behavior;
- safe error envelope and request ID.

## 6. Retrieval tests

Seed one published and one superseded document per domain. Queries must show:

| Case | Expected |
|---|---|
| Finance payment question | current Finance chunk in top results |
| IT password question | no Finance chunk |
| student + staff-only source | staff-only chunk excluded |
| effective date before policy | old policy excluded after expiry |
| empty collection | `has_evidence=false` |
| conflicting current policies | `conflict_detected=true` |
| citation | exact chunk/document metadata |

## 7. Routing and evaluation tests

The test suite must emit a confusion matrix with rows expected and columns predicted for `it`, `finance`, `facilities`, `academics`, `administration`, `clarify`, and `fallback`. Include clear, ambiguous, multi-domain, switch, unsupported, insufficient evidence, and adversarial cases.

The evaluation harness tests:

- JSONL schema validation;
- exact domain set and macro metrics;
- confidence range compliance;
- expected clarification/fallback;
- source tags and citation validity;
- resolution rubric;
- threshold gate failure exit code.

## 8. Integration tests

Run against PostgreSQL + pgvector:

1. apply migrations and seed domains;
2. ingest/publish a fixture document;
3. create a conversation;
4. send a message through the real service wiring with fake LLM;
5. verify messages, routing decision, retrieval event, citation, resolution event;
6. query analytics and assert aggregates.

Include transaction rollback and worker retry tests.

## 9. End-to-end tests

Playwright scenarios:

- login and clear IT answer;
- topic switch IT → Finance;
- multi-domain fee + portal request;
- clarification and follow-up;
- no-evidence handoff;
- citation expansion;
- feedback and mark resolved;
- admin analytics visibility/role denial.

E2E tests use a seeded local database, fake OpenAI mode, and stable test selectors such as `data-testid="message-composer"`.

## 10. Security tests

- IDOR attempts for every resource;
- role matrix endpoint checks;
- prompt injection in user message and document;
- XSS/Markdown sanitisation;
- SQL injection strings in all text fields;
- file type/size/path traversal checks;
- rate limiting and timeout checks;
- secret/PII redaction assertions over captured logs.

## 11. Commands and CI gates

```bash
cd backend && pytest -q
cd frontend && npm run test
npx playwright test
python -m app.evaluation.run --dataset evaluation/datasets/v1.jsonl --quality-gate
```

CI gates: formatting/lint, type checking, unit tests, API/integration tests with services, security scans, frontend build, and deterministic evaluation. E2E may run on pull requests touching frontend/backend and is mandatory before release.

## 12. Definition of done for a feature

A feature is done only when its success and error paths have tests, access control is covered, events/metrics are emitted where relevant, docs/API schemas are updated, and the deterministic evaluation remains green.

