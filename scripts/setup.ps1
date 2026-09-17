# ==============================================================================
# CampusOne — Unified Environment Setup Script (PowerShell)
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  CampusOne: One Front Door for Everything — PowerShell Setup" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..")
Set-Location $ProjectRoot

# 1. Dependency Checks
Write-Host "`n[1/5] Checking System Prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH. Install from: https://docs.docker.com/get-docker/"
}
if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Error "Python 3.10+ is required but not found in PATH."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 18+ is required but not found in PATH."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is required but not found in PATH."
}
Write-Host "✓ Prerequisites found." -ForegroundColor Green

# 2. Environment Configuration
Write-Host "`n[2/5] Configuring Environment Variables..." -ForegroundColor Yellow
$EnvPath = Join-Path $ProjectRoot "backend\.env"
$EnvExamplePath = Join-Path $ProjectRoot "backend\.env.example"

if (-not (Test-Path $EnvPath)) {
    if (Test-Path $EnvExamplePath) {
        Copy-Item $EnvExamplePath $EnvPath
        Write-Host "✓ Created backend/.env from template." -ForegroundColor Green
    } else {
        @"
POSTGRES_USER=campus_one
POSTGRES_PASSWORD=campus_one_secret
POSTGRES_DB=campus_one
DATABASE_URL=postgresql+psycopg://campus_one:campus_one_secret@localhost:5432/campus_one
GROQ_API_KEY=
"@ | Out-File -FilePath $EnvPath -Encoding utf8
        Write-Host "✓ Initialized default backend/.env." -ForegroundColor Green
    }
} else {
    Write-Host "✓ backend/.env already exists." -ForegroundColor Green
}

# 3. Start PostgreSQL container
Write-Host "`n[3/5] Starting PostgreSQL + pgvector Container..." -ForegroundColor Yellow
docker compose -f (Join-Path $ProjectRoot "backend\docker-compose.yml") up -d
Write-Host "✓ PostgreSQL container started." -ForegroundColor Green

# 4. Backend Python Virtual Environment
Write-Host "`n[4/5] Setting up Backend Python Virtual Environment..." -ForegroundColor Yellow
$VenvPath = Join-Path $ProjectRoot "backend\.venv"

if (-not (Test-Path $VenvPath)) {
    $PythonExe = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
    & $PythonExe -m venv $VenvPath
    Write-Host "✓ Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "✓ backend/.venv exists." -ForegroundColor Green
}

$IsWin = $env:OS -match "Windows"
$VenvPip = if ($IsWin) { Join-Path $VenvPath "Scripts\pip.exe" } else { Join-Path $VenvPath "bin/pip" }

Write-Host "Installing Python requirements..."
& $VenvPip install -r (Join-Path $ProjectRoot "backend\requirements.txt")
Write-Host "✓ Python dependencies installed." -ForegroundColor Green

# 5. Frontend Node Dependencies
Write-Host "`n[5/5] Installing Frontend Node Dependencies..." -ForegroundColor Yellow
$NodeModules = Join-Path $ProjectRoot "frontend\node_modules"

if (-not (Test-Path $NodeModules)) {
    Push-Location (Join-Path $ProjectRoot "frontend")
    npm install
    Pop-Location
    Write-Host "✓ Frontend dependencies installed." -ForegroundColor Green
} else {
    Write-Host "✓ frontend/node_modules exists." -ForegroundColor Green
}

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "🎉 Setup Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Run the entire stack with:" -ForegroundColor White
Write-Host "  .\scripts\start.ps1`n" -ForegroundColor Cyan
