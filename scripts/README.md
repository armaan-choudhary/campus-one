# CampusOne — Scripts

Unified cross-platform setup and launcher scripts for the CampusOne full-stack application.

## Usage

Run these from the **repository root**:

| OS | Setup (first time) | Start Full Stack |
|:---|:---|:---|
| **Linux / macOS** | `./scripts/setup.sh` | `./scripts/start.sh` |
| **Windows (CMD)** | `scripts\setup.bat` | `scripts\start.bat` |
| **Windows / Cross-platform (PowerShell)** | `.\scripts\setup.ps1` | `.\scripts\start.ps1` |

The **start** scripts automatically run setup if the environment is uninitialized.

## What setup does

1. Validates system prerequisites (Docker, Python 3.10+, Node.js 18+, npm)
2. Creates `backend/.env` from `backend/.env.example` if absent
3. Starts the PostgreSQL 16 + pgvector Docker container
4. Creates `backend/.venv` and installs Python dependencies
5. Indexes any PDF documents in `backend/Documents/` into pgvector
6. Installs `frontend/node_modules`

## What start does

1. Runs setup if any environment components are missing
2. Ensures the PostgreSQL pgvector container is running
3. Starts the FastAPI backend at `http://127.0.0.1:8000/api/v1`
4. Starts the Next.js frontend dev server at `http://localhost:3000`
5. Provides direct access to:
   - **Student Portal**: `http://localhost:3000/workspace`
   - **Admin Console**: `http://localhost:3000/admin`
   - **Swagger Docs**: `http://127.0.0.1:8000/docs`
