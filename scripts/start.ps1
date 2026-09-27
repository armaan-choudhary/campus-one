# ==============================================================================
# CampusOne — Application Launcher (PowerShell)
# ==============================================================================
[CmdletBinding()]
param()

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..")
Set-Location $ProjectRoot

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  CampusOne: One Front Door for Everything — PowerShell Launcher" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$EnvPath = Join-Path $ProjectRoot "backend\.env"
$VenvPath = Join-Path $ProjectRoot "backend\.venv"
$NodeModules = Join-Path $ProjectRoot "frontend\node_modules"
$FrontendEnv = Join-Path $ProjectRoot "frontend\.env.local"

if (-not (Test-Path $EnvPath) -or -not (Test-Path $VenvPath) -or -not (Test-Path $NodeModules) -or -not (Test-Path $FrontendEnv)) {
    Write-Host "[INFO] Environment not configured. Running scripts\setup.ps1...`n" -ForegroundColor Yellow
    & (Join-Path $ProjectRoot "scripts\setup.ps1")
}

Write-Host "`n▶ [1/3] Ensuring PostgreSQL pgvector container is running..." -ForegroundColor Yellow
docker compose -f (Join-Path $ProjectRoot "backend\docker-compose.yml") up -d

Write-Host "`n▶ [2/3] Launching FastAPI backend in background..." -ForegroundColor Yellow
$BackendJob = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -PassThru

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "🚀 CampusOne is Live!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  🌐 Web Client     : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🎓 Student Portal : http://localhost:3000/workspace" -ForegroundColor Cyan
Write-Host "  🛡️  Admin Console  : http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "  ⚙️  FastAPI Backend: http://127.0.0.1:8000/api/v1" -ForegroundColor Cyan
Write-Host "  🗄️  PostgreSQL     : localhost:5432 (database: campus_one)" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Press Ctrl+C to stop the frontend server.`n" -ForegroundColor White

Push-Location (Join-Path $ProjectRoot "frontend")
try {
    npm run dev
} finally {
    Pop-Location
}
