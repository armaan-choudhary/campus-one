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

## 4. Unit test suites (`backend/tests/`)

The active test suite (`PYTHONPATH=backend pytest backend/tests/`) contains 31 automated tests organized into three core test files:

### 1. Clarification & Routing (`backend/tests/test_clarification.py`)
- **Schema Validation:** Verifies `ClarificationOutput` structured outputs, option bounds ($\ge 2$ choices), and supported department validation.
- **Node Execution & Resilient Fallback:** Verifies structured LLM invocation and deterministic fallback options on model timeout or API errors.
- **Metadata Preservation:** Verifies router node preserves existing metadata keys across multi-turn sessions.
- **Clarification Loop Guard & General Exemption:** Verifies max attempt escalation for departmental queries, and confirms `General` campus/lost-property inquiries are exempt from auto-tickets.
- **Intra-Domain Gating:** Verifies that when all candidates collapse to a single department, the system routes directly without entering clarification.
- **Continuation Domain Preservation:** Verifies short conversational replies (*"nope"*, *"no"*) preserve active domain context rather than triggering clarification.

### 2. Ticket Lifecycle & Sanitization (`backend/tests/test_ticket_lifecycle.py`)
- **Receipt Flags & Metadata:** Verifies `create_ticket` sets unique ticket IDs (`TKT-XXXX`), marks `ticket_just_created=True`, and populates metadata.
- **Single-Turn Delivery vs Conversational Follow-up:** Verifies `respond` delivers formal receipt once on creation turn, and answers subsequent follow-up queries with real domain responses.
- **Conversational Ticket Commands:** Verifies `should_raise_ticket` recognizes colloquial commands (*"bro ticket"*, *"help me raise a ticket for the same"*, *"ticket"*).
- **Ticket Re-Creation:** Verifies fresh ticket generation is permitted when a user explicitly requests a ticket even if an earlier ticket existed on the thread.
- **Zero-Emoji & Markdown Formatting:** Verifies `_clean_content` converts keycap emoji numbers (`1️⃣`, `2️⃣`) into standard Markdown numbered lists and strips all emojis.

### 3. Authentication & RBAC (`backend/tests/test_auth.py`)
- **Password Security:** Verifies PBKDF2-HMAC-SHA256 password hashing, salt uniqueness, and constant-time verification.
- **User Registration & Duplicate Rejection:** Verifies self-service student registration, role assignment, and duplicate email rejection.
- **JWT & Role Matrix:** Verifies access token creation, claims encoding, expiration checking, token refresh, and RBAC permission enforcement (`student` vs `admin`).

## 5. API tests

Use the FastAPI test client with fake dependencies. Test every endpoint in [09 API Reference](09_API_Reference.md) for:

- **Authentication (`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/me`):**
  - seeded accounts authenticate with correct passwords;
  - invalid credentials and unknown emails return `401 invalid_credentials`;
  - new student registration (`POST /auth/register`) persists to `campus_users`, returns `201` with valid tokens, and enforces `student` role;
  - duplicate student email registration returns `409 email_already_registered`;
  - token verification and token refresh lifecycle.
- **Conversation (`/chat`, `/chat/history`):**
  - authenticated `POST /chat` resolves with answer, thread ID derived from `current_user.id`, routing metadata, and citations;
  - unauthenticated requests return `401`;
  - `GET /chat/history` returns the persisted message list for the authenticated thread;
  - checkpoint store unavailability returns `502 conversation_unavailable`.
- valid request and response schema;
- missing/invalid auth;
- role denial and route protection (HTTP 403 on `/admin`);
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

