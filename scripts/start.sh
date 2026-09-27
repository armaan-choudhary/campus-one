#!/usr/bin/env bash
# ==============================================================================
# CampusOne — Application Launcher (Linux / macOS)
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BOLD}${CYAN}"
echo "  ___                                 ___             "
echo " / __|__ _ _ __  _ __ _  _ ___ ___   / _ \ _ _  ___   "
echo "| (__/ _\` | '  \| '_ \ || (_-</ _ \ | (_) | ' \/ -_)  "
echo " \___\__,_|_|_|_| .__/\_,_/__/\___/  \___/|_||_\___|  "
echo "                |_|                                   "
echo -e "${NC}"
echo -e "${BOLD}Launching CampusOne Full Stack...${NC}"
echo "------------------------------------------------------------------"

# Detect if existing backend/.venv is broken (e.g. copied from another machine)
if [ -d "backend/.venv" ] && ! backend/.venv/bin/python --version >/dev/null 2>&1; then
    echo -e "${YELLOW}[WARN] backend/.venv is corrupted or was copied from another machine. Re-creating...${NC}"
    rm -rf "backend/.venv"
fi

# Auto-run setup if environment is uninitialized
if [ ! -f "backend/.env" ] || [ ! -d "backend/.venv" ] || [ ! -d "frontend/node_modules" ] || [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}[INFO] First-time setup detected. Running ./scripts/setup.sh...${NC}\n"
    ./scripts/setup.sh
fi

# Detect docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}[ERROR] Docker compose not found.${NC}"
    exit 1
fi

# 1. Ensure PostgreSQL container is running
echo -e "${BLUE}▶ [1/3] Checking PostgreSQL pgvector database...${NC}"
$DOCKER_COMPOSE -f backend/docker-compose.yml up -d

# Locate uvicorn executable across local, activated, and root virtual environments
UVICORN_BIN=""
if [ -x "$PROJECT_ROOT/backend/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$PROJECT_ROOT/backend/.venv/bin/uvicorn"
elif [ -n "$VIRTUAL_ENV" ] && [ -x "$VIRTUAL_ENV/bin/uvicorn" ]; then
    UVICORN_BIN="$VIRTUAL_ENV/bin/uvicorn"
elif [ -x "$PROJECT_ROOT/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$PROJECT_ROOT/.venv/bin/uvicorn"
elif command -v uvicorn &> /dev/null; then
    UVICORN_BIN="uvicorn"
else
    echo -e "${RED}[ERROR] Uvicorn could not be found. Running setup.sh to repair environment...${NC}"
    ./scripts/setup.sh
    UVICORN_BIN="$PROJECT_ROOT/backend/.venv/bin/uvicorn"
fi

# 2. Check and start FastAPI Backend if not already running on port 8000
BACKEND_PID=""
if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ [2/3] FastAPI backend is already running and healthy on port 8000.${NC}"
else
    echo -e "${BLUE}▶ [2/3] Starting FastAPI backend on port 8000 (0.0.0.0:8000)...${NC}"
    cd backend
    "$UVICORN_BIN" app.main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"

    echo -n "Waiting for FastAPI backend to be ready..."
    BACKEND_HEALTHY=false
    for i in {1..40}; do
        if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
            BACKEND_HEALTHY=true
            echo -e "\n${GREEN}✓ [2/3] FastAPI backend is live and healthy!${NC}"
            break
        fi

        # Verify backend process did not crash prematurely
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "\n${RED}[ERROR] FastAPI backend process terminated unexpectedly.${NC}"
            if [ -f "backend/uvicorn.log" ]; then
                echo -e "${RED}--- Diagnostic details from backend/uvicorn.log: ---${NC}"
                tail -n 25 backend/uvicorn.log
                echo -e "${RED}-----------------------------------------------------${NC}"
            fi
            exit 1
        fi

        sleep 0.5
        echo -n "."
    done

    if [ "$BACKEND_HEALTHY" != "true" ]; then
        echo -e "\n${RED}[ERROR] FastAPI backend failed to respond within 20s.${NC}"
        if [ -f "backend/uvicorn.log" ]; then
            echo -e "${RED}--- Diagnostic details from backend/uvicorn.log: ---${NC}"
            tail -n 25 backend/uvicorn.log
            echo -e "${RED}-----------------------------------------------------${NC}"
        fi
        exit 1
    fi
fi

# Cleanup hook on script termination
cleanup() {
    echo -e "\n${YELLOW}Shutting down CampusOne services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
        pkill -P "$BACKEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Print URLs and start frontend
echo -e "\n${BOLD}${GREEN}=================================================================="
echo -e "🚀 CampusOne is Live!"
echo -e "==================================================================${NC}"
echo -e "  🌐 Web Client     : ${BOLD}${BLUE}http://localhost:3000${NC}"
echo -e "  🎓 Student Portal : ${BOLD}${CYAN}http://localhost:3000/workspace${NC}"
echo -e "  🛡️  Admin Console  : ${BOLD}${CYAN}http://localhost:3000/admin${NC}"
echo -e "  ⚙️  FastAPI Backend: ${BOLD}${BLUE}http://127.0.0.1:8000/api/v1${NC}"
echo -e "  📖 Swagger Docs   : ${BOLD}${BLUE}http://127.0.0.1:8000/docs${NC}"
echo -e "  🗄️  PostgreSQL     : ${BOLD}${BLUE}localhost:5432${NC} (db: campus_one)"
echo -e "------------------------------------------------------------------"
echo -e "Press ${BOLD}Ctrl+C${NC} to stop services.\n"

cd frontend
npm run dev
