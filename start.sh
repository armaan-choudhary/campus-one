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

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
    echo -e "${YELLOW}[INFO] First-time setup detected. Running ./setup.sh...${NC}\n"
    ./setup.sh
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

# Ensure PostgreSQL container is running
echo -e "${BLUE}▶ Checking PostgreSQL pgvector database...${NC}"
$DOCKER_COMPOSE -f backend/docker-compose.yml up -d

# Cleanup hook on script termination
cleanup() {
    echo -e "\n${YELLOW}Shutting down CampusOne services...${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo -e "\n${BOLD}${GREEN}=================================================================="
echo -e "🚀 CampusOne is Live!"
echo -e "==================================================================${NC}"
echo -e "  🌐 Web Client : ${BOLD}${BLUE}http://localhost:3000${NC}"
echo -e "  🗄️  PostgreSQL : ${BOLD}${BLUE}localhost:5432${NC} (db: campus_one)"
echo -e "  🧠 Model      : Groq (openai/gpt-oss-120b) + HuggingFace Embeddings"
echo -e "------------------------------------------------------------------"
echo -e "Press ${BOLD}Ctrl+C${NC} to stop the frontend server.\n"

# Start Frontend Dev Server
cd frontend
npm run dev
