# CampusOne — API Reference

## 1. API conventions

Base path: `/api/v1`. Content type: `application/json`. Authentication: `Authorization: Bearer <access_token>` unless marked public. IDs are UUID strings. Timestamps are ISO-8601 UTC. All responses include `request_id` either as a field or response header `X-Request-ID`.

Error envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "message must not be empty",
    "field_errors": [{"field": "text", "message": "required"}],
    "request_id": "req_123"
  }
}
```

Common statuses: `400` malformed request, `401` missing/invalid token, `403` forbidden, `404` not found/hidden, `409` version or idempotency conflict, `422` validation, `429` rate limited, `500` unexpected error, `503` dependency unavailable.

## 2. Shared schemas

```typescript
type DomainKey = "it" | "finance" | "facilities" | "academics" | "administration";
type ResolutionState = "open" | "resolved" | "needs_clarification" | "handed_off" | "unresolved";

interface Citation {
  id: string; marker: string; domain: DomainKey; title: string;
  section?: string; page?: number; version_label: string;
  source_uri?: string; excerpt: string;
}
interface AssistantResponse {
  message_id: string; outcome: "answered" | "clarification" | "fallback" | "handoff" | "error";
  text: string; citations: Citation[]; domains: DomainKey[];
  resolution_state: ResolutionState; handoff?: HandoffSummary;
}
interface HandoffSummary { handoff_id: string; status: string; recommended_department?: string; reason_codes: string[]; }
```

## 3. Authentication endpoints

### `POST /auth/login`

**Auth:** public in mock mode; disabled in OIDC mode.

**Request:** `{ "email": "student@example.edu", "password": "demo-password" }`. Email max 254 chars; password max 128; no logging.

**Response 200:** `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "expires_in": 3600, "user": {"id":"...","email":"student@example.edu","role":"student"} }`.

**Errors:** `401 invalid_credentials`, `429 rate_limited`, `503 auth_provider_unavailable`.

**Example:**

```http
POST /api/v1/auth/login
{"email":"student@example.edu","password":"demo-password"}
```

```json
{"access_token":"ey...","refresh_token":"rt_...","token_type":"bearer","expires_in":3600,"user":{"id":"u1","email":"student@example.edu","role":"student"}}
```

### `POST /auth/refresh`

**Auth:** valid refresh token. **Request:** `{ "refresh_token": "..." }`. **Response 200:** new access/refresh token pair. **Errors:** `401 invalid_refresh_token`, `503 auth_provider_unavailable`. Refresh tokens are never placed in logs or URLs.

### `GET /auth/me`

**Auth:** any authenticated user. **Request:** none. **Response 200:** `{ "id", "email", "role", "department", "permissions": [] }`. **Errors:** `401 unauthorized`.

## 4. Conversation endpoints

### `POST /conversations`

**Auth:** student/staff. **Request:** `{ "title": "optional", "client_metadata": {} }`; title max 160 and metadata must not contain secrets. **Response 201:** `{ "conversation_id", "status":"open", "resolution_state":"open", "created_at" }`. **Errors:** `401`, `422 invalid_metadata`, `429`. **Example request/response:**

```json
{"title":"Fees and portal help","client_metadata":{"surface":"web"}}
```

```json
{"conversation_id":"c1","status":"open","resolution_state":"open","created_at":"2026-09-11T07:00:00Z"}
```

### `GET /conversations`

**Auth:** owner; agents/admins may use `scope=assigned` with permission. **Query:** `cursor`, `limit` 1–50, `status`, `resolution_state`. **Response 200:** `{ "items": [ConversationSummary], "next_cursor": null }`. **Errors:** `401`, `403`, `422 invalid_filter`. Example: `GET /api/v1/conversations?limit=20&resolution_state=open`.

### `GET /conversations/{conversation_id}`

**Auth:** owner, assigned agent, or admin. **Path validation:** UUID. **Response 200:** conversation summary, state, messages, citations, and handoff summary. **Errors:** `401`, `403`, `404 not_found`. Example response is the same shape as `ConversationDetail` in the frontend document.

### `POST /conversations/{conversation_id}/messages`

**Auth:** owner or authorised agent. **Headers:** `Idempotency-Key` required, 16–128 chars. **Request:** `{ "text": "...", "client_message_id": "optional UUID" }`; text 1–4,000 Unicode chars, trimmed, no control characters except newline. **Response 200:** `AssistantResponse` plus `routing` summary and `processing_ms`. **Errors:** `401`, `403`, `404`, `409 turn_in_progress` (lock held), `409 idempotency_conflict`, `409 conversation_version_conflict`, `422`, `429`, `503`. Example:

```http
POST /api/v1/conversations/c1/messages
Authorization: Bearer ey...
Idempotency-Key: 7f8f1b84-3a63-4a4b-8a1b-9b9b3b0cc111
{"text":"How do I reset my university password?"}
```

```json
{"message_id":"m2","outcome":"answered","text":"To reset ... [1]","citations":[{"id":"cit1","marker":"[1]","domain":"it","title":"IT Account Recovery Guide","section":"Password reset","version_label":"2026.1","excerpt":"..."}],"domains":["it"],"resolution_state":"resolved","processing_ms":1840}
```

### `POST /conversations/{conversation_id}/messages/stream` (SSE)

**Auth:** owner or authorised agent. **Headers:** `Accept: text/event-stream`, `Idempotency-Key` required. **Request:** identical to `/messages`. **Response 200:** `Transfer-Encoding: chunked`, `Content-Type: text/event-stream`. Emits progressive lifecycle events:

```http
POST /api/v1/conversations/c1/messages/stream
Accept: text/event-stream
Idempotency-Key: 7f8f1b84-3a63-4a4b-8a1b-9b9b3b0cc111
{"text":"How do I reset my university password?"}
```

```text
event: stage
data: {"stage": "routing", "timestamp": "2026-09-11T12:00:00.120Z"}

event: routed
data: {"domain": "it", "confidence": 0.95, "topic_switched": false}

event: stage
data: {"stage": "retrieving", "domain": "it"}

event: stage
data: {"stage": "generating"}

event: token
data: {"delta": "To reset your university password, visit "}

event: token
data: {"delta": "the self-service recovery portal [1]."}

event: citations
data: [{"id": "cit1", "marker": "[1]", "domain": "it", "title": "IT Account Recovery Guide", "version_label": "2026.1", "excerpt": "..."}]

event: done
data: {"message_id": "m2", "outcome": "answered", "resolution_state": "resolved", "processing_ms": 1780}
```

**Errors:** `401`, `403`, `404`, `409 turn_in_progress`, `422`, `429`. When an error occurs during streaming, a final `event: error` is emitted with the standard error envelope.

### `POST /conversations/{conversation_id}/resolve`

**Auth:** conversation owner or assigned agent. **Request:** `{ "resolution_state": "resolved" | "unresolved", "reason": "user_confirmed" }`; reason max 80. **Response 200:** `{ "conversation_id", "resolution_state", "event_id" }`. **Errors:** `401`, `403`, `404`, `409 invalid_transition`, `422`. Example request: `{ "resolution_state":"resolved","reason":"user_confirmed" }`; response: `{ "conversation_id":"c1","resolution_state":"resolved","event_id":"re1" }`.

## 5. Feedback endpoints

### `POST /messages/{message_id}/feedback`

**Auth:** message owner. **Request:** `{ "rating":"positive" | "negative", "reason":"wrong_domain|not_helpful|missing_source|other", "comment":"optional" }`; comment max 1,000 and is redacted. **Response 201:** `{ "feedback_id":"f1","message_id":"m2" }`. **Errors:** `401`, `403`, `404`, `409 feedback_exists`, `422`. Example: request `{ "rating":"negative","reason":"missing_source" }`; response `{ "feedback_id":"f1","message_id":"m2" }`.

## 6. Handoff endpoints

### `POST /conversations/{conversation_id}/handoff`

**Auth:** owner, assigned agent, or admin. **Request:** `{ "accept": true, "additional_note": "optional" }`; note max 1,000 and no credentials. **Response 201:** `HandoffSummary` plus `summary`, `reason_codes`, and `recommended_department`. **Errors:** `401`, `403`, `404`, `409 handoff_exists`, `422`, `503 external_ticket_unavailable` (only if external mode is required). Example response: `{ "handoff_id":"h1","status":"queued","recommended_department":"Finance Office","reason_codes":["no_evidence"] }`.

### `GET /handoffs`

**Auth:** support_agent/admin. **Query:** `status`, `department`, `limit`, `cursor`; limit 1–100. **Response 200:** `{ "items":[HandoffDetail],"next_cursor":null }`. **Errors:** `401`, `403`, `422`. Example: `GET /api/v1/handoffs?status=queued&department=Finance%20Office` returns a queue item without secrets.

### `PATCH /handoffs/{handoff_id}`

**Auth:** assigned agent/admin. **Request:** `{ "status":"assigned|in_progress|returned|resolved", "note":"optional" }`; only valid state transitions. **Response 200:** updated `HandoffDetail`. **Errors:** `401`, `403`, `404`, `409 invalid_transition`, `422`. Example request `{ "status":"assigned" }`; response `{ "handoff_id":"h1","status":"assigned","assigned_to_user_id":"agent1" }`.

## 7. Knowledge ingestion endpoints

### `POST /knowledge/documents`

**Auth:** knowledge_admin/admin. **Request:** multipart file plus metadata fields (`domain`, `title`, `document_type`, `version_label`, `effective_from`, `effective_until?`, `audience_roles`, `source_uri`, `owner_department`). File max 20 MB; allowed MIME types PDF/DOCX/Markdown/text; domain must be registered. **Response 202:** `{ "document_id":"d1","status":"processing","job_id":"j1" }`. **Errors:** `401`, `403`, `413`, `422 invalid_metadata`, `409 duplicate_version`, `503 queue_unavailable`. Example metadata: `domain=finance`, `title=Fee Payment Policy`, `version_label=2026.1`.

### `GET /knowledge/documents`

**Auth:** knowledge_admin/admin; analysts may read status. **Query:** `domain`, `status`, `cursor`, `limit`. **Response 200:** `{ "items":[DocumentSummary],"next_cursor":null }`. **Errors:** `401`, `403`, `422`. Example response: `{ "items":[{"id":"d1","domain":"finance","status":"review","chunk_count":18,"version_label":"2026.1"}],"next_cursor":null }`.

### `GET /knowledge/documents/{document_id}`

**Auth:** knowledge_admin/admin/analyst. **Response 200:** full metadata, ingestion status/error, chunk count, approval info. **Errors:** `401`, `403`, `404`; path must be UUID. Example response: `{ "id":"d1","status":"review","title":"Fee Payment Policy","ingestion_error":null,"chunk_count":18 }`.

### `POST /knowledge/documents/{document_id}/publish`

**Auth:** knowledge_admin/admin. **Request:** `{ "approval_note":"Reviewed against 2026 handbook" }`; note max 1,000. **Response 200:** `{ "document_id":"d1","status":"published","published_at":"...","superseded_document_id":"d0" }`. **Errors:** `401`, `403`, `404`, `409 not_ready|overlapping_version`, `422`. Example request `{ "approval_note":"QA complete" }`; response as above.

### `POST /knowledge/documents/{document_id}/archive`

**Auth:** knowledge_admin/admin. **Request:** `{ "reason":"policy withdrawn" }`, max 500. **Response 200:** `{ "document_id":"d1","status":"archived" }`. **Errors:** `401`, `403`, `404`, `409 already_archived`, `422`. Archive removes the document from retrieval but preserves audit history.

## 8. Analytics endpoints

### `GET /analytics/summary`

**Auth:** analyst/admin. **Query:** `from`, `to` ISO dates, optional `domain`; max range 366 days. **Response 200:** `{ "routing_accuracy":0.87,"resolution_rate":0.76,"clarification_rate":0.12,"handoff_rate":0.09,"source_coverage":0.98,"avg_response_ms":2140,"sample_size":120 }`. **Errors:** `401`, `403`, `422 invalid_range`. Example: `GET /api/v1/analytics/summary?from=2026-09-01&to=2026-09-11`.

### `GET /analytics/routing-errors`

**Auth:** analyst/admin. **Query:** same date range, `limit` 1–100. **Response 200:** `{ "items":[{"actual":"it","expected":"finance","count":4,"examples":["case-12"]}] }`. **Errors:** `401`, `403`, `422`. No raw student text is returned unless the caller has explicit audit permission.

### `GET /analytics/unresolved`

**Auth:** analyst/admin/support_agent. **Query:** `limit`, `cursor`, `domain`, `reason`. **Response 200:** `{ "items":[{"conversation_id":"c1","state":"handed_off","reason":"no_evidence","last_activity":"..."}],"next_cursor":null }`. **Errors:** `401`, `403`, `422`. Example response contains IDs and redacted summaries.

## 9. Evaluation endpoints

### `GET /evaluation/cases`

**Auth:** analyst/admin. **Query:** `dataset_version`, `tag`, `limit`, `cursor`. **Response 200:** `{ "items":[EvaluationCaseSummary],"next_cursor":null }`. **Errors:** `401`, `403`, `422`. Example: `GET /api/v1/evaluation/cases?dataset_version=v1`.

### `POST /evaluation/runs`

**Auth:** analyst/admin. **Request:** `{ "dataset_version":"v1", "case_ids":[], "config":{"router_model":"configured","threshold_high":0.75} }`; max 500 case IDs; config is allowlisted. **Response 202:** `{ "run_id":"run1","status":"queued","job_id":"job1" }`. **Errors:** `401`, `403`, `404 dataset_not_found`, `409 run_exists`, `422 invalid_config`, `503 queue_unavailable`. Example response as above.

### `GET /evaluation/runs/{run_id}`

**Auth:** analyst/admin. **Response 200:** `{ "run_id":"run1","status":"passed","dataset_version":"v1","metrics":{...},"confusion_matrix":{...},"completed_at":"..." }`. **Errors:** `401`, `403`, `404`; path UUID. Example metrics: `{ "routing_accuracy":0.88,"macro_f1":0.84,"resolution_rate":0.76 }`.

## 10. Health endpoints

### `GET /health/live`

**Auth:** public. **Response 200:** `{ "status":"ok" }`. No dependency checks. `503` only if process is not able to serve.

### `GET /health/ready`

**Auth:** public inside deployment network. **Response 200:** `{ "status":"ready","database":"ok","vector":"ok","openai":"configured" }`; `503` if required database/migration check fails. Never return secret values.

## 11. Rate limits and pagination

Default per-user limits: 30 chat messages/minute, 10 login attempts/15 minutes, 10 feedback submissions/minute, 20 ingestion requests/hour per admin, and 5 evaluation runs/hour. Use `Retry-After` on 429. Cursor pagination uses an opaque base64 cursor containing only stable sort keys.

