# CampusOne — API Reference

The CampusOne REST API exposes conversational orchestration, departmental knowledge querying, and role-based access control.

**Base URL:** `/api/v1`

---

## 1. Authentication & Security

All authenticated endpoints require an RFC 6750 Bearer JWT token in the HTTP Authorization header:
```http
Authorization: Bearer <access_token>
```

### Supported Seed Accounts & Roles

| Email | Password | Role | Persona |
|:---|:---|:---|:---|
| `student@example.edu` | `student123` | `student` | Alex Rivera (Undergraduate Student) |
| `agent@example.edu` | `agent123` | `support_agent` | Sarah Jenkins (Support Specialist) |
| `admin.knowledge@example.edu` | `admin123` | `knowledge_admin` | Dr. Patricia Cole (Knowledge Administrator) |
| `executive@example.edu` | `exec123` | `analyst` | Dr. Marcus Vance (Executive / Analyst) |
| `admin@example.edu` | `admin123` | `admin` | System Administrator |

---

## 2. Conversational Orchestration API

### `POST /api/v1/chat`
Processes single-intent, ambiguous, or multi-domain queries through the LangGraph orchestration engine with persistent conversational state.

#### Request Headers
| Header | Value | Required | Description |
|:---|:---|:---:|:---|
| `Content-Type` | `application/json` | Yes | Request content type |
| `Authorization` | `Bearer <token>` | Yes | Valid access token |

#### Request Body (`ChatRequest`)
```json
{
  "query": "My scholarship hasn't been credited, I can't pay my semester fees, and I'm worried this will stop me from registering for my exams.",
  "conversation_id": "01946a32-7f91-728b-bc11-829d44f6c491"
}
```

| Field | Type | Required | Description |
|:---|:---:|:---:|:---|
| `query` | string | Yes | The user's conversational message (min length: 1). |
| `conversation_id` | string (UUID) | No | Optional conversation identifier. If omitted, a new UUID is generated. |

#### Response Body (`ChatResponse`)
```json
{
  "answer": "Issue 1 — Scholarship & Fees: ...\n\nIssue 2 — Exam Registration: ...\n\nSystem Dependencies:\n• Fee clearance unlocks student portal holds.",
  "conversation_id": "01946a32-7f91-728b-bc11-829d44f6c491",
  "route_mode": "multi",
  "domains": [
    {
      "department": "fees",
      "confidence": 0.95,
      "citations": [
        {
          "source": "scholarship_disbursement_policy.txt",
          "chunk_id": "fee_doc_1_c0",
          "text_preview": "Scholarship disbursements take 3-5 business days..."
        }
      ]
    },
    {
      "department": "it",
      "confidence": 0.90,
      "citations": [
        {
          "source": "exam_registration_portal_guide.txt",
          "chunk_id": "it_doc_2_c1",
          "text_preview": "Exam registration requires a zero-balance account..."
        }
      ]
    }
  ],
  "confidence": 0.925,
  "citations": [
    {
      "source": "scholarship_disbursement_policy.txt",
      "chunk_id": "fee_doc_1_c0",
      "department": "fees",
      "text_preview": "Scholarship disbursements take 3-5 business days..."
    },
    {
      "source": "exam_registration_portal_guide.txt",
      "chunk_id": "it_doc_2_c1",
      "department": "it",
      "text_preview": "Exam registration requires a zero-balance account..."
    }
  ],
  "next_steps": [
    "Contact Student Accounts to verify scholarship disbursement status.",
    "Pay any remaining balance via the student finance portal.",
    "Once the financial hold is released, proceed to exam registration."
  ],
  "requires_clarification": false,
  "human_required": false
}
```

#### Response Fields

| Field | Type | Description |
|:---|:---:|:---|
| `answer` | string | Grounded resolution text with issue breakdown and dependency notes. |
| `conversation_id` | string | Unique conversation session ID. |
| `route_mode` | string | Routing mode: `"single"`, `"multi"`, or `"clarify"`. |
| `domains` | list[DomainItem] | Per-domain breakdown containing department key, confidence score, and citations. |
| `confidence` | float | Overall answer confidence score ($0.0 \le c \le 1.0$). |
| `citations` | list[Citation] | Verifiable citations linking facts to specific policy documents and chunks. |
| `next_steps` | list[string] | Chronologically ordered action steps. |
| `requires_clarification` | boolean | `true` if Margin Guard determined the query is ambiguous. |
| `human_required` | boolean | `true` if escalated to a human support specialist queue. |

#### HTTP Status Codes
- `200 OK`: Successful turn processing.
- `401 Unauthorized`: Missing, expired, or invalid Bearer token.
- `422 Unprocessable Content`: Empty or malformed request payload.
- `500 Internal Server Error`: Unhandled orchestration or database exception.

---

## 3. Authentication & System Endpoints

### `POST /api/v1/auth/login`
Authenticates user credentials and issues a signed JWT access token.
```json
// Request
{
  "email": "student@example.edu",
  "password": "student123"
}

// Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_student_01",
    "email": "student@example.edu",
    "name": "Alex Rivera",
    "role": "student"
  }
}
```

### `GET /api/v1/auth/me`
Retrieves details and assigned permissions for the currently authenticated user.

### `GET /api/v1/health`
Health check verifying service status and database connectivity.
```json
{
  "status": "healthy",
  "auth_provider": "mock",
  "version": "1.0.0"
}
```
