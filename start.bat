@echo off
REM ==============================================================================
REM CampusOne — Application Launcher (Windows Command Prompt)
REM ==============================================================================
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==================================================================
echo   CampusOne: One Front Door for Everything — Windows Launcher
echo ==================================================================

REM Auto-run setup if environment is missing
if not exist "backend\.env" goto run_setup
if not exist "backend\.venv" goto run_setup
if not exist "frontend\node_modules" goto run_setup
goto launch

:run_setup
echo [INFO] First-time setup detected. Running setup.bat...
call setup.bat
if %errorlevel% neq 0 (
    echo [ERROR] Setup encountered errors. Please check the logs.
    exit /b 1
)

:launch
echo.
echo [1/2] Ensuring PostgreSQL pgvector container is running...
docker compose -f backend\docker-compose.yml up -d

echo.
echo [2/2] Starting Frontend Development Server...
echo ==================================================================
echo   CampusOne is Live!
echo   Web Client:  http://localhost:3000
echo   PostgreSQL:  localhost:5432 (database: campus_one)
echo ==================================================================
echo Press Ctrl+C in this window to stop the server.
echo.

cd frontend
call npm run dev
