#!/usr/bin/env bash
# ==============================================================================
# CampusOne — Unified Environment Setup Script (Linux / macOS)
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}"
echo "  ___                                 ___             "
echo " / __|__ _ _ __  _ __ _  _ ___ ___   / _ \ _ _  ___   "
echo "| (__/ _\` | '  \| '_ \ || (_-</ _ \ | (_) | ' \/ -_)  "
echo " \___\__,_|_|_|_| .__/\_,_/__/\___/  \___/|_||_\___|  "
echo "                |_|                                   "
echo -e "${NC}"
echo -e "${BOLD}One Front Door for Everything — Full Stack Automated Setup${NC}"
echo "=================================================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# ------------------------------------------------------------------------------
# 1. Dependency Checks
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/5] Checking System Prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}[ERROR] Docker daemon is not running.${NC}"
    echo "Please start the Docker Desktop / daemon service and retry."
    exit 1
fi

# Detect docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker & Compose found: $($DOCKER_COMPOSE version | head -n 1)${NC}"

# Check Python
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}[ERROR] Python 3.10+ is required but not found in PATH.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $($PYTHON_CMD --version)${NC}"

# Check Node & npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is required but not found in PATH.${NC}"
    echo "Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is required but not found in PATH.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node & npm found: Node $(node -v) / npm v$(npm -v)${NC}"

# ------------------------------------------------------------------------------
# 2. Environment Configuration
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/5] Configuring Environment Variables...${NC}"

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp "backend/.env.example" "backend/.env"
        echo -e "${GREEN}✓ Created backend/.env from backend/.env.example${NC}"
    else
        cat <<EOF > "backend/.env"
POSTGRES_USER=campus_one
POSTGRES_PASSWORD=campus_one_secret
POSTGRES_DB=campus_one
DATABASE_URL=postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one
GROQ_API_KEY=
EOF
        echo -e "${GREEN}✓ Initialized default backend/.env${NC}"
    fi
else
    echo -e "${GREEN}✓ backend/.env already exists.${NC}"
fi

# Check for GROQ_API_KEY
if grep -q "GROQ_API_KEY=$" "backend/.env" || grep -q "GROQ_API_KEY=your_groq_api_key_here" "backend/.env"; then
    echo -e "${YELLOW}[NOTE] GROQ_API_KEY is not configured yet in backend/.env.${NC}"
    echo -e "       Get your free API key at: https://console.groq.com/"
fi

# ------------------------------------------------------------------------------
# 3. Start PostgreSQL with pgvector
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/5] Starting PostgreSQL + pgvector Container...${NC}"

$DOCKER_COMPOSE -f backend/docker-compose.yml up -d

echo -n "Waiting for PostgreSQL database to be healthy..."
for i in {1..30}; do
    if docker exec campus-one-postgres pg_isready -U campus_one -d campus_one &> /dev/null; then
        echo -e "\n${GREEN}✓ PostgreSQL with pgvector is ready on port 5432!${NC}"
        break
    fi
    sleep 1
    echo -n "."
    if [ "$i" -eq 30 ]; then
        echo -e "\n${RED}[WARNING] Database took longer than expected to report ready. Proceeding...${NC}"
    fi
done

# ------------------------------------------------------------------------------
# 4. Backend Python Environment & Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/5] Setting up Backend Python Virtual Environment...${NC}"

if [ ! -d "backend/.venv" ]; then
    echo "Creating Python virtual environment in backend/.venv..."
    $PYTHON_CMD -m venv "backend/.venv"
    echo -e "${GREEN}✓ Virtual environment created.${NC}"
else
    echo -e "${GREEN}✓ Virtual environment backend/.venv exists.${NC}"
fi

VENV_PYTHON="$PROJECT_ROOT/backend/.venv/bin/python"
VENV_PIP="$PROJECT_ROOT/backend/.venv/bin/pip"

# Check if uv is available for faster install
if command -v uv &> /dev/null; then
    echo "Found 'uv' package installer. Installing dependencies quickly with uv..."
    uv pip install -r "backend/requirements.txt" --python "$VENV_PYTHON"
elif [ -f "$HOME/.local/bin/uv" ]; then
    echo "Found '$HOME/.local/bin/uv'. Installing dependencies..."
    "$HOME/.local/bin/uv" pip install -r "backend/requirements.txt" --python "$VENV_PYTHON"
else
    echo "Installing Python dependencies with pip (this may take 1-2 minutes)..."
    "$VENV_PIP" install -r "backend/requirements.txt"
fi
echo -e "${GREEN}✓ Backend dependencies installed successfully.${NC}"

# Check for document indexing
if [ -d "backend/Documents" ]; then
    PDF_COUNT=$(find backend/Documents -type f -name "*.pdf" 2>/dev/null | wc -l || echo 0)
    if [ "$PDF_COUNT" -gt 0 ]; then
        echo "Found $PDF_COUNT PDF document(s) in backend/Documents. Indexing into pgvector..."
        (cd backend && "$VENV_PYTHON" index_documents.py) || echo -e "${YELLOW}[WARN] Document indexing encountered an error; you can re-run manually later.${NC}"
    else
        echo -e "${YELLOW}[INFO] backend/Documents directory is empty. Add departmental PDFs to index them.${NC}"
    fi
fi

# ------------------------------------------------------------------------------
# 5. Frontend Node Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/5] Installing Frontend Node Dependencies...${NC}"

if [ ! -d "frontend/node_modules" ]; then
    echo "Running npm install in frontend/..."
    (cd frontend && npm install)
    echo -e "${GREEN}✓ Frontend packages installed.${NC}"
else
    echo -e "${GREEN}✓ frontend/node_modules already exists.${NC}"
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}${GREEN}=================================================================="
echo -e "🎉 Setup Completed Successfully!"
echo -e "==================================================================${NC}"
echo -e "You can now run the complete stack anytime with:"
echo -e "  ${BOLD}./start.sh${NC}"
echo ""
echo -e "Services configured:"
echo -e "  • Frontend Web Client : ${BLUE}http://localhost:3000${NC}"
echo -e "  • PostgreSQL pgvector : ${BLUE}localhost:5432${NC} (db: campus_one)"
echo -e "  • Backend Virtualenv  : ${BLUE}backend/.venv/${NC}"
echo ""
