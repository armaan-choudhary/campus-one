# CampusOne Repository Audit Prompt

Below is a copy-paste prompt tailored to the CampusOne repository.

You are a senior software architect, security auditor, QA engineer, UX reviewer, and AI/RAG systems specialist.

Your task is to perform a complete, evidence-based audit of the CampusOne project. Audit the actual implementation in the repository, not just the documentation. Inspect every relevant file and verify whether
the documented behavior, intended architecture, and real behavior match.

Do not make assumptions. For every finding, cite the exact file path, symbol/function/component, and line number when possible.

Do not expose chain-of-thought. Provide concise conclusions, evidence, risks, and recommended fixes.

## 1. PROJECT CONTEXT

Project name: CampusOne

Product purpose:

CampusOne is a university support platform that provides one conversational front door for students. A student asks a natural-language question without selecting a department. The system should:

1. Identify the user’s intent and department.
2. Route the request to the correct domain.
3. Retrieve university-approved knowledge.
4. Generate a grounded answer.
5. Attach verifiable citations.
6. Ask for clarification when confidence is low.
7. Escalate unsupported, sensitive, or unresolved requests.
8. Create and track support tickets.
9. Allow administrators to claim, resolve, and manage tickets.
10. Persist authentication, conversation state, retrieval information, citations, and ticket activity.

Supported domains:

- IT
- Finance
- Facilities
- Academics
- Administration

Primary roles:

- Student
- Administrator

Main user-facing routes:

- `/` — public landing page
- `/login` — authentication gateway
- `/workspace` — student assistant and ticket view
- `/admin` — administrator ticket console

Expected architecture:

- Next.js 16 frontend
- React 19
- FastAPI backend
- LangGraph orchestration
- PostgreSQL
- pgvector retrieval
- Groq/LLM integration
- Domain-isolated knowledge stores
- JWT-based authentication
- Role-based access control
- LangSmith observability
- Docker Compose for PostgreSQL and pgvector

Core product principles:

- One front door
- Evidence before prose
- Confidence-aware routing
- No hallucinated university-specific answers
- Domain isolation
- Stateful conversations
- Contextual human handoff
- Auditable citations
- Student/admin role separation
- Secure handling of sensitive requests

## 2. ACTUAL REPOSITORY STRUCTURE

Repository root:

- `README.md`
- `AGENTS.md`
- `package-lock.json`
- `assets/`
- `backend/`
- `frontend/`
- `docs/`
- `scripts/`
- Architecture artifacts:
- `campusone-architecture.json`
- `campusone-architecture.html`
- `campusone-architecture.visual-check.json`
- `campusone-architecture.visual-check.html`
- PNG visual exports

Backend:

- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/auth/jwt.py`
- `backend/app/auth/provider.py`
- `backend/app/auth/dependencies.py`
- `backend/app/auth/schemas.py`
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/api/v1/endpoints/chat.py`
- `backend/graph.py`
- `backend/graph_nodes.py`
- `backend/graph_state.py`
- `backend/knowledge_retrieval.py`
- `backend/index_documents.py`
- `backend/Prompts.py`
- `backend/streamlit_app.py`
- `backend/requirements.txt`
- `backend/docker-compose.yml`
- `backend/tests/test_auth.py`
- `backend/.env.example`
- `backend/README.md`

Frontend:

- `frontend/package.json`
- `frontend/next.config.ts`
- `frontend/tsconfig.json`
- `frontend/eslint.config.mjs`
- `frontend/src/app/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/workspace/page.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/loading.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/TicketContext.tsx`
- `frontend/src/hooks/useChat.ts`
- `frontend/src/hooks/useToast.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/demoFixtures.ts`
- `frontend/src/lib/utils.ts`
- `frontend/src/types/index.ts`
- `frontend/src/components/TopNav.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/StudentTicketsView.tsx`
- `frontend/src/components/AdminTicketPanel.tsx`
- `frontend/src/components/CitationDrawer.tsx`
- `frontend/src/components/MessageBubble.tsx`
- `frontend/src/components/MessageComposer.tsx`
- `frontend/src/components/auth/LoginModal.tsx`
- `frontend/src/components/home/*`
- `frontend/src/components/ui/*`
- `frontend/src/components/vectors/*`

Documentation:

- `docs/00_Project_Overview.md`
- `docs/01_Product_Requirements.md`
- `docs/02_System_Architecture.md`
- `docs/03_Routing_Engine.md`
- `docs/04_Domain_Skills.md`
- `docs/05_RAG_and_Knowledge_Base.md`
- `docs/06_Conversation_Orchestration.md`
- `docs/07_Fallback_and_Handoff.md`
- `docs/08_Database_Design.md`
- `docs/09_API_Reference.md`
- `docs/10_Frontend_Architecture.md`
- `docs/12_Security.md`
- `docs/13_Testing_Strategy.md`
- `docs/14_Deployment.md`
- `docs/15_Demo_Runbook.md`

Scripts:

- `scripts/start.sh`
- `scripts/start.ps1`
- `scripts/start.bat`
- `scripts/setup.sh`
- `scripts/setup.ps1`
- `scripts/setup.bat`

## 3. AUDIT METHOD

First, build a complete inventory of:

1. Pages and routes
2. API endpoints
3. Authentication flows
4. Authorization checks
5. Frontend components
6. React contexts and hooks
7. Backend modules
8. Graph nodes and transitions
9. Data models and schemas
10. External dependencies
11. Environment variables
12. Database interactions
13. LLM calls
14. Retrieval operations
15. Ticket lifecycle operations
16. Tests
17. Documentation claims
18. Undocumented behavior
19. Dead code and unused files
20. Missing functionality

For each feature, trace the full path:

User action
→ frontend component
→ frontend state
→ API client
→ HTTP endpoint
→ authentication/authorization
→ backend service
→ graph/orchestration
→ retrieval or database
→ LLM call
→ response transformation
→ frontend rendering
→ persistence or follow-up action

If any part of this chain is missing, mocked, disconnected, insecure, or inconsistent, report it.

## 4. AUDIT LAYERS

Audit the project layer by layer.

### LAYER 1: PRODUCT AND REQUIREMENTS

Check:

- Whether the implementation matches the product vision.
- Whether the one-front-door experience is real.
- Whether all documented roles exist.
- Whether all documented domains are supported.
- Whether MVP and non-goal boundaries are respected.
- Whether documented acceptance criteria are implemented.
- Whether the demo runbook can be executed.
- Whether the repository contains claimed features that are not implemented.
- Whether implementation contains undocumented behavior.
- Whether requirements contradict code or documentation.

Report:

- Implemented requirements
- Partially implemented requirements
- Missing requirements
- Contradictory requirements
- Features that appear cosmetic or demo-only
- Features that appear production-ready but are not

### LAYER 2: REPOSITORY AND ARCHITECTURE

Check:

- Separation between frontend and backend.
- Module boundaries.
- Dependency direction.
- Circular dependencies.
- Naming consistency.
- Separation of concerns.
- Configuration management.
- Coupling between UI and backend implementation.
- Domain extensibility.
- Whether adding a sixth domain requires unnecessary changes.
- Whether architecture diagrams match source code.
- Whether documentation matches actual module boundaries.

Look for:

- Large multipurpose files
- Hidden global state
- Hardcoded domain logic
- Hardcoded demo users
- Duplicated business logic
- Unused abstraction layers
- Dead modules
- Inconsistent naming
- Missing interfaces
- Fragile imports
- Environment-specific assumptions

### LAYER 3: FRONTEND APPLICATION

Audit all routes under `frontend/src/app`.

For every page, inspect:

- Rendering behavior
- Loading state
- Error state
- Empty state
- Authentication requirement
- Role requirement
- Navigation behavior
- Responsive behavior
- Accessibility
- Data dependencies
- Backend dependencies
- State persistence
- Refresh behavior
- Browser back/forward behavior
- Unauthorized access behavior

Audit all components under `frontend/src/components`.

Check:

- Component responsibility
- Reusability
- Prop typing
- State ownership
- Event handling
- Error handling
- Loading behavior
- Accessibility semantics
- Keyboard navigation
- Focus management
- Form validation
- Dangerous HTML rendering
- Citation rendering
- Message rendering
- Ticket status rendering
- Admin action handling
- Mobile behavior
- Visual consistency

Audit:

- `AuthContext`
- `TicketContext`
- `useChat`
- `useToast`
- API client
- Shared types
- Demo fixtures

Check for:

- Authentication state races
- Stale state
- Optimistic updates without rollback
- State lost after refresh
- Duplicate requests
- Missing cancellation
- Incorrect dependency arrays
- Hydration mismatches
- Client/server boundary mistakes
- Unhandled rejected promises
- Silent API failures
- Incorrect role redirects
- UI showing data to the wrong user
- Frontend-only security assumptions

### LAYER 4: AUTHENTICATION

Audit the complete authentication lifecycle:

- Registration
- Login
- JWT creation
- JWT verification
- Token storage
- Token expiry
- Token refresh behavior
- Logout
- Current-user retrieval
- Password validation
- Password hashing
- Duplicate registration
- Invalid credentials
- Disabled or unknown users
- Missing token handling
- Malformed token handling
- Expired token handling
- Frontend session restoration

Inspect:

- `backend/app/auth/*`
- Authentication endpoints
- `AuthContext`
- Login components
- API client
- Environment configuration

Check specifically:

- Algorithm confusion
- Weak JWT secret handling
- Insecure token storage
- Password leakage
- Timing issues
- Missing rate limits
- User enumeration
- Insecure default credentials
- Environment secrets committed to the repository
- Missing token audience/issuer validation
- Token claims validation
- Incorrect role claims
- Session fixation
- CSRF exposure where relevant
- CORS configuration
- Cookie security if cookies are used

### LAYER 5: AUTHORIZATION AND RBAC

Audit all role-based behavior.

Roles:

- Student
- Administrator

Check:

- Whether `/admin` is protected on the backend as well as the frontend.
- Whether a student can call admin APIs directly.
- Whether one student can access another student’s conversations or tickets.
- Whether ticket ownership is verified server-side.
- Whether role values are validated.
- Whether authorization is object-level or only route-level.
- Whether escalation and resolution actions are restricted.
- Whether administrator actions are auditable.
- Whether hidden frontend controls are incorrectly treated as security.
- Whether unauthorized responses use correct status codes.

Test scenarios:

1. Anonymous user accesses student workspace.
2. Anonymous user accesses admin page.
3. Student accesses admin UI.
4. Student directly calls admin endpoints.
5. Student accesses another student’s ticket.
6. Student modifies another student’s ticket.
7. Administrator accesses student-only resources.
8. Forged or modified JWT role.
9. Missing user identity.
10. Deleted or unknown user identity.

### LAYER 6: BACKEND API

Inventory every endpoint and document:

- HTTP method
- URL
- Request schema
- Response schema
- Authentication requirement
- Role requirement
- Status codes
- Error format
- Side effects
- Database operations
- LLM operations
- External calls

Audit:

- `backend/app/main.py`
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/api/v1/endpoints/chat.py`
- All schemas and dependencies

Check:

- Input validation
- Output validation
- Consistent response formats
- Error handling
- Exception leakage
- HTTP status correctness
- Timeouts
- Retry behavior
- Idempotency
- Pagination
- Filtering
- Sorting
- Request size limits
- Rate limiting
- CORS
- Health checks
- API versioning
- OpenAPI accuracy
- Logging of sensitive data
- Dependency injection
- Async/sync correctness
- Blocking operations inside async routes

### LAYER 7: CONVERSATION ORCHESTRATION

Audit:

- `backend/graph.py`
- `backend/graph_nodes.py`
- `backend/graph_state.py`
- `backend/Prompts.py`

Reconstruct the actual graph:

- Every node
- Every edge
- Entry point
- Exit points
- Conditional transitions
- Retry paths
- Error paths
- Clarification paths
- Handoff paths
- Multi-intent paths
- Topic-switch paths
- State mutations

Verify:

- Router behavior
- Confidence thresholds
- Margin guard behavior
- Negative anchors
- Domain selection
- Multi-domain handling
- Clarification behavior
- Fallback behavior
- Human handoff behavior
- Synthesis behavior
- Conversation history behavior
- Checkpointing behavior
- User/thread isolation
- State serialization
- Failure recovery
- Infinite-loop risk
- Duplicate responses
- Partial failures

For each graph node, provide:

- Purpose
- Inputs
- Outputs
- Side effects
- Dependencies
- Failure behavior
- Security risks
- Test coverage
- Whether documentation matches implementation

### LAYER 8: LLM AND PROMPTING

Audit all model calls and prompts.

Check:

- Model configuration
- Provider configuration
- Structured output handling
- Schema validation
- Retry behavior
- Timeout behavior
- Token limits
- Cost controls
- Prompt injection defenses
- System/user message separation
- Prompt leakage
- Sensitive data exposure
- Unsupported claims
- Citation enforcement
- Refusal behavior
- Determinism
- Temperature and sampling configuration
- Model fallback behavior
- Logging and trace handling

Inspect `backend/Prompts.py` and all prompt construction.

Test conceptually:

- User asks the model to ignore system instructions.
- Retrieved document contains malicious instructions.
- User asks for unsupported university policy.
- User asks for another student’s data.
- User asks for an external transaction to be performed.
- User asks a multi-domain question.
- User provides ambiguous or conflicting intent.
- Retrieval returns no evidence.
- Retrieval returns contradictory evidence.
- Model returns invalid structured JSON.
- Model returns unsupported citations.
- Model fabricates a citation.

### LAYER 9: RAG AND KNOWLEDGE RETRIEVAL

Audit:

- `backend/knowledge_retrieval.py`
- `backend/index_documents.py`
- Vector database setup
- Embedding configuration
- Chunking
- Metadata
- Domain isolation
- Retrieval filters
- MMR behavior
- Citation metadata
- No-evidence behavior

Check:

- Whether documents are actually present.
- Whether indexing works from a clean environment.
- Whether PDFs are discovered safely.
- Whether chunks preserve page metadata.
- Whether embeddings are compatible with the database schema.
- Whether domain filters are enforced server-side.
- Whether retrieval can cross-contaminate departments.
- Whether query normalization is safe.
- Whether retrieval failures are distinguishable from no results.
- Whether stale documents can be detected.
- Whether documents can be reindexed safely.
- Whether citations map to real sources.
- Whether page numbers are accurate.
- Whether source filenames are trustworthy.
- Whether the application answers without evidence.
- Whether retrieval quality is measurable.

Test scenarios:

1. Clear IT question.
2. Clear Finance question.
3. Ambiguous question.
4. Multi-domain question.
5. Unsupported question.
6. Empty knowledge base.
7. Wrong-domain document match.
8. Contradictory documents.
9. Malicious document content.
10. Retrieval/database outage.

### LAYER 10: DATABASE AND DATA MODEL

Audit every database interaction and compare it with:

- `docs/08_Database_Design.md`
- Backend implementation
- Docker Compose configuration
- Runtime initialization

Check:

- Tables
- Columns
- Primary keys
- Foreign keys
- Constraints
- Indexes
- pgvector indexes
- Migrations
- Connection pooling
- Transactions
- Commit/rollback behavior
- Race conditions
- Checkpoint persistence
- User persistence
- Ticket persistence
- Conversation persistence
- Citation persistence
- Event persistence
- Data retention
- PII handling
- Backup/recovery assumptions

Look for:

- Schema created implicitly without migrations
- Missing indexes
- Missing foreign keys
- Orphaned records
- Non-atomic ticket updates
- Lost updates
- Duplicate records
- Unsafe string-built SQL
- Connection leaks
- Unbounded history
- Missing tenant/user isolation
- Data written only to frontend memory
- Demo fixtures mistaken for persistent data

### LAYER 11: TICKETS AND HANDOFF

Audit the full ticket lifecycle:

- Ticket creation
- Context capture
- Student visibility
- Admin queue visibility
- Claiming
- In-progress state
- Resolution notes
- Resolution
- Student synchronization
- Duplicate ticket prevention
- Ownership checks
- Error recovery

Verify states such as:

- Pending
- In progress
- Resolved
- Any additional states found in code

Check:

- Valid state transitions
- Unauthorized transitions
- Concurrent claiming
- Concurrent resolution
- Empty resolution notes
- Ticket ownership
- Context completeness
- Sensitive data exposure
- Frontend/backend synchronization
- Refresh persistence
- Notification behavior
- Audit history

### LAYER 12: SECURITY

Perform a threat-model audit covering:

- Authentication
- Authorization
- JWT security
- Password security
- Secrets
- CORS
- CSRF
- XSS
- SQL injection
- Prompt injection
- Retrieval poisoning
- SSRF
- Path traversal
- File upload risks
- Malicious PDF/document handling
- Denial of service
- Rate limiting
- Resource exhaustion
- Sensitive logging
- PII exposure
- Error leakage
- Dependency vulnerabilities
- Insecure defaults
- Debug endpoints
- Streamlit exposure
- Docker exposure
- Environment file handling

Assign each finding:

- Severity: Critical / High / Medium / Low / Informational
- Exploitability
- Impact
- Affected component
- Evidence
- Recommended remediation
- Whether it is exploitable remotely

### LAYER 13: RELIABILITY AND FAILURE HANDLING

Check behavior when:

- PostgreSQL is unavailable.
- pgvector is unavailable.
- LLM provider is unavailable.
- Embedding provider fails.
- LangSmith is unavailable.
- A model returns malformed output.
- A request times out.
- A request is retried.
- A browser refreshes during a mutation.
- Two admins claim the same ticket.
- A user submits duplicate messages.
- A process restarts during a graph execution.
- A checkpoint cannot be loaded.
- A document is missing.
- An environment variable is absent.
- An external dependency changes behavior.

Audit:

- Timeouts
- Retries
- Backoff
- Circuit breakers
- Idempotency
- Transactions
- Recovery paths
- User-facing errors
- Logging
- Alerting
- Health checks
- Graceful degradation

### LAYER 14: TESTING AND QUALITY

Inventory all tests and compare them with the documented testing strategy.

Check coverage for:

- Authentication
- Registration
- JWT verification
- RBAC
- API endpoints
- Graph routing
- Confidence thresholds
- Clarification
- Handoff
- Retrieval
- Citation accuracy
- Prompt injection
- Multi-intent requests
- Topic switching
- Ticket lifecycle
- Database failures
- Frontend behavior
- Accessibility
- End-to-end flows
- Regression behavior

Identify:

- Missing tests
- Tests that do not run
- Tests that are too shallow
- Tests using mocks that hide integration failures
- Tests without assertions
- Flaky tests
- Unreachable branches
- Unverified documented claims
- Missing deterministic evaluation dataset
- Missing CI checks

For every important feature, classify test coverage:

- None
- Unit only
- Integration only
- End-to-end only
- Complete

### LAYER 15: DEPLOYMENT AND OPERATIONS

Audit:

- `backend/docker-compose.yml`
- Startup scripts
- Setup scripts
- Environment files
- Production configuration
- Frontend build
- Backend startup
- Database startup
- Health checks
- Service ordering
- Port exposure
- Volume persistence
- Secret injection
- Logging
- Monitoring
- LangSmith configuration
- Backup strategy
- Rollback strategy

Test the documented setup from a clean state if possible.

Check:

- Whether `scripts/start.*` actually works.
- Whether setup scripts are cross-platform.
- Whether dependencies are pinned.
- Whether `.env` files are safe.
- Whether production and development settings are separated.
- Whether frontend points to the correct backend.
- Whether Docker service names and ports match code.
- Whether database readiness is handled.
- Whether indexing is required before application startup.
- Whether failures are clearly reported.

### LAYER 16: USER EXPERIENCE AND ACCESSIBILITY

Audit the product as:

1. Anonymous visitor
2. Student
3. Administrator
4. User with slow network
5. User on mobile
6. Keyboard-only user
7. Screen-reader user
8. User receiving an error
9. User with no tickets
10. User with no retrieval results

Check:

- Information architecture
- Navigation
- Clear system status
- Feedback after actions
- Error messages
- Empty states
- Loading states
- Form usability
- Focus states
- Color contrast
- Keyboard navigation
- ARIA usage
- Semantic HTML
- Responsive layouts
- Touch target sizes
- Citation comprehension
- Ticket status comprehension
- Role clarity
- Trust and transparency around AI-generated responses

### LAYER 17: PERFORMANCE

Audit:

- Frontend bundle size
- Rendering strategy
- Client components
- Re-render patterns
- API request count
- Duplicate requests
- Database query efficiency
- Vector retrieval latency
- Embedding latency
- LLM latency
- Token usage
- Large conversation history
- Large documents
- Ticket list scaling
- Admin search/filter performance
- Memory usage
- Startup time

Identify:

- N+1 queries
- Unbounded queries
- Unbounded context windows
- Blocking operations
- Unnecessary client-side rendering
- Missing pagination
- Missing caching
- Missing debouncing
- Missing indexes
- Expensive repeated computations

### LAYER 18: DOCUMENTATION AND TRACEABILITY

Compare all documentation against implementation.

For every documented feature, label it:

- Verified implemented
- Partially implemented
- Not implemented
- Contradicted by code
- Cannot verify

Check:

- README accuracy
- API documentation accuracy
- Architecture document accuracy
- Security document accuracy
- Testing strategy accuracy
- Deployment instructions
- Demo runbook
- Environment variable documentation
- Setup commands
- Route documentation
- Domain documentation

## 5. FEATURE-BY-FEATURE AUDIT

Audit these features individually:

1. Public landing page
2. Login page
3. Student registration
4. Student authentication
5. Administrator authentication
6. Role-based redirects
7. Student workspace
8. Chat composer
9. Chat message submission
10. Conversation history
11. Conversation persistence
12. Intent routing
13. Confidence scoring
14. Margin guard
15. Negative anchors
16. Domain selection
17. Multi-intent handling
18. Topic switching
19. Domain knowledge retrieval
20. MMR retrieval
21. Domain isolation
22. Citation generation
23. Citation drawer
24. Clarification flow
25. No-answer behavior
26. Human handoff
27. Ticket creation
28. Student ticket view
29. Admin ticket queue
30. Ticket claiming
31. Ticket resolution
32. Resolution synchronization
33. Admin filters
34. Admin search
35. Toast/error feedback
36. LangSmith tracing
37. Streamlit debug app
38. Dockerized PostgreSQL
39. Document indexing
40. Startup scripts
41. Health/readiness behavior
42. Demo fixtures
43. Responsive UI
44. Accessibility
45. Security controls
46. Automated tests

For each feature, use this format:

Feature:
Expected behavior:
Actual implementation:
Files inspected:
Execution path:
Inputs:
Outputs:
Dependencies:
Happy path:
Failure paths:
Security considerations:
Data persistence:
Frontend behavior:
Backend behavior:
Test coverage:
Documentation match:
Issues:
Severity:
Recommended fix:
Confidence in finding:

## 6. REQUIRED OUTPUT

Produce the final audit using this structure:

### A. Executive summary

Include:

- Overall health rating from 0–10
- Production readiness rating from 0–10
- Demo readiness rating from 0–10
- Security posture rating from 0–10
- Most important strengths
- Most important risks
- Whether the documented architecture matches the implementation

### B. System inventory

Provide tables for:

- Routes
- API endpoints
- Backend modules
- Frontend components
- Graph nodes
- Data stores
- External services
- Environment variables
- Test files

### C. Architecture assessment

Explain:

- Actual architecture
- Intended architecture
- Differences
- Boundary violations
- Coupling problems
- Scalability limitations

### D. Feature audit

Audit every listed feature one by one.

### E. Security findings

Use this table:

| ID | Severity | Finding | Evidence | Impact | Exploitability | Recommended fix |
|----|----------|---------|----------|--------|----------------|-----------------|

### F. Functional defects

Use this table:

| ID | Severity | Feature | Defect | Reproduction steps | Expected | Actual | Fix |
|----|----------|---------|--------|--------------------|----------|--------|-----|

### G. Reliability and failure-mode findings

Include dependency outages, malformed model responses, database failures, retries, race conditions, and state recovery.

### H. Testing gap matrix

Use this table:

| Area | Existing coverage | Missing coverage | Recommended test |
|------|-------------------|------------------|------------------|

### I. Documentation drift

List every major mismatch between code and documentation.

### J. Prioritized remediation plan

Group fixes into:

P0 — critical security, data loss, or complete feature failure
P1 — major functional or reliability issues
P2 — important quality and maintainability issues
P3 — polish and optimization

For each fix include:

- Problem
- Affected files
- Why it matters
- Suggested implementation
- Verification method
- Estimated complexity: Small / Medium / Large

### K. End-to-end test scenarios

Provide executable or semi-executable scenarios for:

1. Student login and chat
2. Administrator login and ticket resolution
3. Unauthorized admin access
4. Student data isolation
5. Clear intent routing
6. Ambiguous clarification
7. Unsupported question and handoff
8. Citation verification
9. Multi-intent request
10. Topic switch
11. Database outage
12. LLM failure
13. Prompt injection
14. Malicious retrieval document
15. Browser refresh during ticket mutation

### L. Final verdict

Answer:

- Can this project safely be demoed?
- Can it be deployed for real users?
- What must be fixed before deployment?
- What is merely cosmetic?
- What is the single highest-risk issue?
- What is the single highest-value improvement?
- What evidence is still missing?

## 7. AUDIT RULES

Follow these rules strictly:

1. Inspect source code before making claims.
2. Treat documentation as a hypothesis that must be verified.
3. Do not assume a UI control is secure unless the backend enforces it.
4. Do not assume an API feature works because its route exists.
5. Do not assume data is persistent because a frontend context stores it.
6. Do not assume citations are valid because they are rendered.
7. Do not assume an LLM response is grounded without tracing retrieval and source validation.
8. Distinguish missing implementation from untested implementation.
9. Distinguish demo fixtures from production functionality.
10. Report both positive findings and defects.
11. Cite exact file paths and symbols.
12. Separate confirmed facts from reasonable inferences.
13. Do not recommend rewriting the entire project unless evidence justifies it.
14. Prioritize security, data integrity, authorization, and core user flows.
15. Never reveal hidden chain-of-thought.
16. If a command, dependency, environment variable, or service cannot be verified, explicitly say so.
17. End with a concise prioritized action plan.

This prompt is designed to make the reasoning model audit the project as a real system: product requirements, frontend, backend, AI orchestration, RAG, database, security, reliability, testing, deployment, UX,
and every individual feature.
