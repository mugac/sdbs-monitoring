# Oracle DB Monitoring Dashboard - Start Script
# Spustí backend (Flask) i frontend (Vite) v samostatných oknech

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 Oracle DB Monitoring Dashboard - START" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Kontrola, zda existují potřebné složky
if (-not (Test-Path ".\backend\app.py")) {
    Write-Host "Error: backend\app.py not found!" -ForegroundColor Red
    Write-Host "Run this script from the project root folder (dbsmonitoring)." -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path ".\frontend\package.json")) {
    Write-Host "Error: frontend\package.json not found!" -ForegroundColor Red
    Write-Host "Run this script from the project root folder (dbsmonitoring)." -ForegroundColor Yellow
    pause
    exit 1
}

# Kontrola Python virtuálního prostředí
if (-not (Test-Path ".\backend\venv\Scripts\python.exe")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    Write-Host ""
    Set-Location backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    deactivate
    Set-Location ..
    Write-Host "Virtual environment created" -ForegroundColor Green
    Write-Host ""
}

# Kontrola .env souboru
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "File .env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".\backend\.env.example" ".\backend\.env"
    Write-Host ""
    Write-Host "IMPORTANT: Edit password in backend\.env!" -ForegroundColor Yellow
    Write-Host "Open the file and change ORACLE_PASSWORD" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue? (y/n)"
    if ($response -ne "y") {
        Write-Host "Cancelled by user" -ForegroundColor Red
        pause
        exit 0
    }
}

Write-Host "Starting Backend (Flask API)..." -ForegroundColor Cyan
Write-Host "   Port: 5000" -ForegroundColor Gray
Write-Host ""

$backendPath = "$PWD\backend"

# Spuštění backendu v novém okně PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\activate; python app.py"

Write-Host "Backend started in new window" -ForegroundColor Green
Write-Host ""

# Počkáme chvilku, aby se backend stihl nastartovat
Write-Host "Waiting 3 seconds for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Starting Frontend (React + Vite)..." -ForegroundColor Cyan
Write-Host "   Port: 5173" -ForegroundColor Gray
Write-Host ""

$frontendPath = "$PWD\frontend"

# Spuštění frontendu v novém okně PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "Frontend started in new window" -ForegroundColor Green
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:  " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:5000" -ForegroundColor White
Write-Host "Frontend:     " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard URL: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close PowerShell windows or use stop.bat" -ForegroundColor Gray
Write-Host ""

# Počkáme další chvilku a pak otevřeme prohlížeč
Write-Host "Waiting 5 seconds before opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Otevření prohlížeče s dashboardem
Write-Host "Opening dashboard in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Done! Application is running." -ForegroundColor Green
Write-Host ""
pause
