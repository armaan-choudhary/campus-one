# CampusOne — Deployment

## 1. Environments

| Environment | Purpose | Data |
|---|---|---|
| local | development and deterministic demo | Docker PostgreSQL/pgvector, Redis, seeded mock data |
| staging | integrated rehearsal | managed services, synthetic student data, fake or restricted model key |
| production/demo | judged demonstration or pilot | managed PostgreSQL/pgvector, managed Redis, university-approved sources |

Never copy production student data into local or staging.

## 2. Local setup

Prerequisites: Docker, Docker Compose, Node.js 20+, Python 3.12+, and an OpenAI API key for model-backed mode. Fake mode runs without an external key.

```bash
cp .env.example .env
docker compose up -d db redis
cd backend && uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000
cd ../frontend && npm ci && npm run dev
```

Docker Compose services:

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment: { POSTGRES_DB: campusone, POSTGRES_USER: campusone, POSTGRES_PASSWORD: campusone }
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  api:
    build: ./backend
    depends_on: [db, redis]
  worker:
    build: ./backend
    command: python -m app.worker
    depends_on: [db, redis]
```

Do not commit actual secrets; the shown values are local-only.

## 3. Environment variables

Required backend values: `APP_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` or OIDC settings, `OPENAI_API_KEY` in model mode, model names, routing thresholds (`ROUTER_HIGH_CONFIDENCE_THRESHOLD=0.75`, `ROUTER_MARGIN_GUARD=0.15`), retrieval threshold (`RETRIEVAL_MIN_SCORE=0.65`), turn mutex lease (`REDIS_TURN_LOCK_TTL_SEC=15`), resilience flags (`CIRCUIT_BREAKER_TIMEOUT_MS=3500`, `PREWARM_DEMO_FIXTURES=true`), `CORS_ORIGINS`, and retention settings. Frontend exposes only `NEXT_PUBLIC_API_BASE_URL` and non-secret feature flags.

Startup validates required values and fails with a safe configuration error. It logs variable names, not values.

## 4. Database and vector setup

1. Provision PostgreSQL 16 with pgvector.
2. Run migrations in a release step, not on every web request.
3. Create HNSW and GIN indexes after initial fixture load or concurrently for large data.
4. Seed domain skills and demo users in local/staging only.
5. Run a retrieval smoke test after each knowledge publish.
6. Back up database and verify restore in production.

## 5. Knowledge ingestion

```bash
python -m app.knowledge.ingest --path knowledge/it/password-reset.md --domain it --version 2026.1 --status review
python -m app.knowledge.publish --document-id <uuid>
```

The API/worker path is preferred for shared environments. Ingestion is idempotent, observable, and never publishes a partial document. Store source files in controlled object storage in staging/production; database rows retain metadata and checksums.

## 6. Deployment topology

Recommended hackathon topology:

- Next.js on Vercel or a container platform;
- FastAPI web process on Render, Fly.io, Railway, or equivalent;
- one worker process on the same platform;
- managed PostgreSQL with pgvector;
- managed Redis;
- OpenAI API called only from backend.

The frontend uses one configured API origin. Configure HTTPS, CORS, cookie domain, health probes, and secrets per environment.

## 7. Production configuration

- `APP_ENV=production`, debug disabled.
- OIDC issuer/audience and strict JWT validation.
- Separate database user with least privilege for app and migration jobs.
- Restrict CORS to exact frontend origins.
- Enable secure cookies, HSTS, CSP, rate limits, and structured log shipping.
- Set worker concurrency and per-request timeouts conservatively.
- Set retention and redaction schedules.
- Disable mock login and fixture routes.

## 8. Health checks and monitoring

Kubernetes/container probes use `/health/live` for liveness and `/health/ready` for database/vector readiness. Monitor:

- API error rate and latency p50/p95;
- router schema failures and OpenAI errors;
- retrieval no-evidence/conflict rate;
- source coverage and citation validation failures;
- handoff/clarification/resolution trends;
- worker queue age and failed jobs;
- database CPU, connections, storage, and vector index health.

Alerts: sustained 5xx, readiness failures, queue age above five minutes, sudden source coverage drop, or false-routing regression in scheduled evaluation.

## 9. Logging

Emit JSON to stdout with `timestamp`, `level`, `service`, `request_id`, `conversation_id` where safe, `event`, `duration_ms`, `status`, `domain`, and `error_code`. Redact text, tokens, keys, and sensitive fields. Use a central log sink in staging/production with access controls.

## 10. CI/CD

Pull request pipeline:

1. format/lint/type checks;
2. backend unit/API tests;
3. frontend tests/build;
4. integration services and migrations;
5. security/dependency/secret scans;
6. deterministic evaluation gates.

Main branch pipeline:

1. build immutable backend/frontend images;
2. push registry artifacts;
3. run migration as a controlled release job;
4. deploy web and worker;
5. wait for readiness;
6. run smoke chat, citation, and handoff checks;
7. publish deployment metadata (commit, dataset, knowledge versions).

Rollback deploy artifacts without rolling back database migrations unless a reviewed reversible migration plan exists. Knowledge versions are independently reversible through archive/supersede operations.

## 11. Backup and recovery

Managed database point-in-time recovery is preferred. Target prototype RPO 24 hours/RTO 2 hours; pilot targets must be set with the university. Test restore of conversations, knowledge, and vector indexes before a judged demo if external services are used.

## 12. Deployment acceptance criteria

- A new environment can be started from documented commands and `.env.example`.
- Migrations are repeatable and health checks distinguish live from ready.
- Frontend contains no backend secrets.
- A knowledge source can be ingested, published, retrieved, and cited in staging.
- CI blocks a broken deterministic evaluation or missing citation coverage.

