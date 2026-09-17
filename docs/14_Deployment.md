# CampusOne — Deployment

## 1. Environments

| Environment | Purpose | Data |
|---|---|---|
| local | development and deterministic demo | Docker PostgreSQL/pgvector, Redis, seeded mock data |
| staging | integrated rehearsal | managed services, synthetic student data, fake or restricted model key |
| production/demo | judged demonstration or pilot | managed PostgreSQL/pgvector, managed Redis, university-approved sources |

Never copy production student data into local or staging.

## 2. Local setup

Prerequisites: Docker, Docker Compose, Node.js 20+, Python 3.10+, and a [Groq API Key](https://console.groq.com/).

```bash
# 1. Start PostgreSQL 16 + pgvector container
cd backend
docker compose up -d

# 2. Setup Python virtual environment & install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure backend/.env
# GROQ_API_KEY=your_groq_api_key_here
# DATABASE_URL=postgresql+psycopg://campus_one:your_password@localhost:5432/campus_one
# POSTGRES_DB=campus_one
# POSTGRES_USER=campus_one
# POSTGRES_PASSWORD=your_password

# 4. Ingest and index department PDFs (IT, HR, Finance, Facilities)
python index_documents.py

# 5. Optional: Run test & evaluation notebook
jupyter notebook test.ipynb

# 6. Start Frontend Development Server
cd ../frontend
npm install
npm run dev # Runs on http://localhost:3000
```

`backend/docker-compose.yml` service definition:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: campus-one-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - campus_one_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U campus_one -d campus_one"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  campus_one_postgres_data:
```

## 3. Environment variables

Required backend values (in `backend/.env`):
- `GROQ_API_KEY`: Groq API key for high-throughput LLM reasoning (`openai/gpt-oss-120b`).
- `DATABASE_URL`: SQLAlchemy/psycopg connection URI (e.g. `postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one`).
- `POSTGRES_DB`: Default database name (`campus_one`).
- `POSTGRES_USER`: Database username (`campus_one`).
- `POSTGRES_PASSWORD`: Database password.

Startup validates required values and fails with a safe configuration error if `DATABASE_URL` or `GROQ_API_KEY` is missing.

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

