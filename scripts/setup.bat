@echo off
REM ==============================================================================
REM CampusOne — Unified Environment Setup Script (Windows Command Prompt)
REM ==============================================================================
setlocal enabledelayedexpansion

echo ==================================================================
echo   CampusOne: One Front Door for Everything — Windows Setup
echo ==================================================================

cd /d "%~dp0.."

REM 1. Check Prerequisites
echo.
echo [1/5] Checking System Prerequisites...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ is required but not found in PATH.
    echo Please install Python: https://www.python.org/downloads/
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but not found in PATH.
    echo Please install Node.js: https://nodejs.org/
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is required but not found in PATH.
    exit /b 1
)

echo [OK] Docker, Python, Node, and npm found.

REM 2. Environment Configuration
echo.
echo [2/5] Configuring Environment Variables...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] Created backend\.env from backend\.env.example
    ) else (
        (
            echo POSTGRES_USER=campus_one
            echo POSTGRES_PASSWORD=campus_one_secret
            echo POSTGRES_DB=campus_one
            echo DATABASE_URL=postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one
            echo GROQ_API_KEY=
        ) > "backend\.env"
        echo [OK] Initialized default backend\.env
    )
) else (
    echo [OK] backend\.env already exists.
)

REM 3. Start PostgreSQL with pgvector
echo.
echo [3/5] Starting PostgreSQL + pgvector Container...
docker compose -f backend\docker-compose.yml up -d
if %errorlevel% neq 0 (
    echo [WARNING] Failed to start Docker container. Ensure Docker Desktop is running.
) else (
    echo [OK] PostgreSQL container started on port 5432.
)

REM 4. Backend Python Virtual Environment
echo.
echo [4/5] Setting up Backend Python Virtual Environment...
if not exist "backend\.venv" (
    echo Creating virtual environment in backend\.venv...
    python -m venv "backend\.venv"
    echo [OK] Virtual environment created.
) else (
    echo [OK] backend\.venv already exists.
)

echo Installing Python requirements...
call "backend\.venv\Scripts\activate.bat"
pip install -r "backend\requirements.txt"
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed to install.
) else (
    echo [OK] Backend dependencies installed successfully.
)

REM 5. Frontend Node Dependencies
echo.
echo [5/5] Installing Frontend Node Dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend packages installed.
) else (
    echo [OK] frontend\node_modules already exists.
)

echo.
echo ==================================================================
echo   Setup Completed Successfully!
echo ==================================================================
echo You can run the entire app anytime using:
echo   scripts\start.bat
echo.
echo Services:
echo   - Frontend Web App: http://localhost:3000
echo   - PostgreSQL:       localhost:5432 (db: campus_one)
echo ==================================================================
