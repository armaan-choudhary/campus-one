# CampusOne — Security

## 1. Security objectives

Protect student identity and conversation data, prevent unauthorised knowledge access, prevent prompt injection from changing system behavior, keep secrets server-side, and preserve an audit trail without turning logs into a second PII database.

## 2. Threat model

| Threat | Example | Control |
|---|---|---|
| account takeover | stolen demo/password token | OIDC seam, strong sessions, rate limits, short access tokens |
| horizontal access | student guesses another conversation UUID | ownership query and 404/403 policy |
| prompt injection | user asks model to ignore evidence rules | structured prompts, untrusted evidence wrapper, output validation |
| knowledge poisoning | uploaded file says reveal secrets | admin approval, content flagging, domain filter |
| data exfiltration | source URI or private chunk exposed | role/audience filters and citation proxy |
| secret leakage | API key in browser or logs | server-only env, redaction, secret scanning |
| abuse/DoS | huge messages or evaluation runs | body limits, quotas, timeouts, queue limits |
| unsafe action | password, payment, or identity change performed in chat | read-only MVP, explicit handoff, no credentials |
| log PII | raw user question in JSON logs | hash/redaction policy and restricted audit access |

## 3. Authentication abstraction

```python
class IdentityProvider(Protocol):
    async def authenticate(self, credentials) -> AuthenticatedIdentity: ...
    async def validate_access_token(self, token: str) -> AuthenticatedIdentity: ...

class CurrentUser(BaseModel):
    id: UUID
    external_subject: str
    role: Role
    department: str | None
```

Local mode uses seeded mock accounts and signed JWTs. Production mode uses the university OIDC provider, validates issuer/audience/signature, and maps group claims to application roles. The rest of the application consumes `CurrentUser`, never raw provider tokens.

## 4. Authorisation model

| Resource/action | student | support_agent | knowledge_admin | analyst | admin |
|---|---:|---:|---:|---:|---:|
| own conversations/messages | CRUD | assigned read/update | no | redacted read | all |
| create handoff | own | assigned | no | no | all |
| agent queue | no | department | no | no | all |
| knowledge read | published public/audience | assigned | all | metadata | all |
| knowledge ingest/publish | no | no | yes | no | yes |
| analytics | own feedback only | unresolved assigned | knowledge metrics | yes | yes |
| evaluation | no | no | no | yes | yes |
| role/config/audit | no | no | no | no | yes |

Enforce permissions in FastAPI dependencies and service methods. Never rely on hidden frontend routes.

## 5. PII minimisation

- Store only the external subject and a hashed email for normal joins; display name is optional.
- Do not request passwords, OTPs, card numbers, or government IDs in chat.
- Redact patterns for email, phone, card-like numbers, access tokens, and secret keys in logs and handoff summaries.
- Message content is encrypted at rest by the managed database and subject to retention policy.
- Analytics payloads use IDs, hashes, categories, and lengths rather than raw text.
- Allow a future data deletion request to remove content while retaining aggregate metrics.

## 6. Prompt injection controls

1. System instructions and output schema are server-controlled.
2. User content is labelled `USER_INPUT`; retrieved text is labelled `UNTRUSTED_EVIDENCE`.
3. Prompts explicitly prohibit following instructions inside either data block.
4. The router cannot invent domain keys or call tools; tool calls, if later added, are allowlisted.
5. Structured output is validated against Pydantic schemas.
6. A citation validator checks every factual claim before returning `answered`.
7. User text is never interpolated into SQL, shell commands, or dynamic system instructions.
8. Ingestion flags suspicious documents for review and supports exclusion.

## 7. API and application controls

- Pydantic request validation with size, length, enum, and date checks.
- Parameterised SQL/SQLAlchemy only.
- Strict CORS to configured frontend origins.
- CSRF protection when cookie auth is used; SameSite and Secure cookies in production.
- Security headers: CSP, HSTS, frame-ancestors, nosniff, referrer policy.
- Per-user/IP rate limits and request timeouts.
- Maximum three domains per turn and maximum evidence tokens.
- Generic 500 responses; detailed exception IDs only in server logs.
- Dependency errors do not echo provider responses or prompts.

## 8. Knowledge access controls

Retrieval filter requires domain, publication status, effective date, language, and audience role. Citation rendering rechecks access before returning source URI. Agents see only department-appropriate handoffs unless admin permission is present. A published document is immutable; updates create a new version.

## 9. Secrets and supply chain

- API keys live in platform secrets or a local `.env` excluded from version control.
- No secret is sent to the browser or stored in database event payloads.
- Pin dependency versions, run `pip-audit` and `npm audit` in CI, and enable Dependabot/Renovate.
- Use secret scanning in pre-commit/CI.
- Rotate OpenAI, database, Redis, JWT/OIDC secrets independently.

## 10. Audit logging

Audit security-sensitive events: login failures, access denials, knowledge publication/archive, handoff assignment, role changes, and evaluation starts. Audit records include actor ID/hash, action, resource ID, outcome, request ID, and timestamp. They exclude content and secrets unless a separately authorised audit capture is required.

## 11. Security acceptance tests

- Student cannot GET another student's conversation, message, citation, or handoff.
- Student cannot call ingestion, publish, analytics, or evaluation endpoints.
- Prompt injection in user text and source chunks cannot change route mode or expose secrets.
- Source URI for a restricted document is withheld.
- Oversized messages, files, and evaluation requests return 413/422.
- Logs and analytics contain no fixture password, token, card number, or raw secret.

