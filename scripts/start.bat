@echo off
REM ==============================================================================
REM CampusOne — Application Launcher (Windows Command Prompt)
REM ==============================================================================
setlocal enabledelayedexpansion

cd /d "%~dp0.."

echo ==================================================================
echo   CampusOne: One Front Door for Everything — Windows Launcher
echo ==================================================================

REM Auto-run setup if environment is missing
if not exist "backend\.env" goto run_setup
if not exist "backend\.venv" goto run_setup
if not exist "frontend\node_modules" goto run_setup
goto launch

:run_setup
echo [INFO] First-time setup detected. Running scripts\setup.bat...
call scripts\setup.bat
if %errorlevel% neq 0 (
    echo [ERROR] Setup encountered errors. Please check the logs.
    exit /b 1
)

:launch
echo.
echo [1/3] Ensuring PostgreSQL pgvector container is running...
docker compose -f backend\docker-compose.yml up -d

echo.
echo [2/3] Launching FastAPI backend in background window...
start "CampusOne FastAPI Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Starting Frontend Development Server...
echo ==================================================================
echo   CampusOne is Live!
echo   Web Client:      http://localhost:3000
echo   Student Portal:  http://localhost:3000/workspace
echo   Admin Console:   http://localhost:3000/admin
echo   FastAPI Backend: http://127.0.0.1:8000/api/v1
echo   PostgreSQL:      localhost:5432 (database: campus_one)
echo ==================================================================
echo Press Ctrl+C in this window to stop the frontend server.
echo.

cd frontend
call npm run dev
