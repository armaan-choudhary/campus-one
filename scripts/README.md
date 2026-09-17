# CampusOne — Scripts

Unified cross-platform setup and launcher scripts for the CampusOne full-stack application.

## Usage

Run these from the **repository root**:

| OS | Setup (first time) | Start App |
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

1. Runs setup if the environment is missing
2. Ensures the PostgreSQL container is running
3. Launches the Next.js frontend at `http://localhost:3000`
