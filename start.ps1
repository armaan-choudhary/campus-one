# ==============================================================================
# CampusOne — Application Launcher (PowerShell)
# ==============================================================================
[CmdletBinding()]
param()

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  CampusOne: One Front Door for Everything — PowerShell Launcher" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Check if setup is needed
$EnvPath = Join-Path $ProjectRoot "backend\.env"
$VenvPath = Join-Path $ProjectRoot "backend\.venv"
$NodeModules = Join-Path $ProjectRoot "frontend\node_modules"

if (-not (Test-Path $EnvPath) -or -not (Test-Path $VenvPath) -or -not (Test-Path $NodeModules)) {
    Write-Host "[INFO] Environment not fully configured. Running setup.ps1...`n" -ForegroundColor Yellow
    & (Join-Path $ProjectRoot "setup.ps1")
}

# Ensure PostgreSQL is running
Write-Host "▶ Ensuring PostgreSQL pgvector container is running..." -ForegroundColor Yellow
docker compose -f (Join-Path $ProjectRoot "backend\docker-compose.yml") up -d

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "🚀 CampusOne is Live!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  🌐 Web Client : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🗄️  PostgreSQL : localhost:5432 (database: campus_one)" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Press Ctrl+C in this terminal to stop the frontend server.`n" -ForegroundColor White

Push-Location (Join-Path $ProjectRoot "frontend")
try {
    npm run dev
}
finally {
    Pop-Location
}
