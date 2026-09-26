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

# Auto-run setup if environment is uninitialized
if [ ! -f "backend/.env" ] || [ ! -d "backend/.venv" ] || [ ! -d "frontend/node_modules" ]; then
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

# 2. Check and start FastAPI Backend if not already running on port 8000
BACKEND_PID=""
if curl -s http://127.0.0.1:8000/docs >/dev/null 2>&1; then
    echo -e "${GREEN}✓ [2/3] FastAPI backend is already running on port 8000.${NC}"
else
    echo -e "${BLUE}▶ [2/3] Starting FastAPI backend on port 8000...${NC}"
    cd backend
    ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload >/dev/null 2>&1 &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"
    sleep 2
fi

# Cleanup hook on script termination
cleanup() {
    echo -e "\n${YELLOW}Shutting down CampusOne services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
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
