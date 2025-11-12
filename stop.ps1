# Oracle DB Monitoring Dashboard - Stop Script
# Zastaví backend i frontend servery

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🛑 Oracle DB Monitoring Dashboard - STOP" -ForegroundColor Red
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Hledám běžící procesy..." -ForegroundColor Cyan
Write-Host ""

# Najdi a zastav Flask (Python) backend na portu 5000
$flaskProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($flaskProcess) {
    Write-Host "🐍 Zastavuji Backend (Flask) - PID: $flaskProcess" -ForegroundColor Yellow
    Stop-Process -Id $flaskProcess -Force
    Write-Host "✅ Backend zastaven" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend (port 5000) neběží" -ForegroundColor Gray
}

Write-Host ""

# Najdi a zastav Vite frontend na portu 5173
$viteProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($viteProcess) {
    Write-Host "⚛️  Zastavuji Frontend (Vite) - PID: $viteProcess" -ForegroundColor Yellow
    Stop-Process -Id $viteProcess -Force
    Write-Host "✅ Frontend zastaven" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend (port 5173) neběží" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Hotovo!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
pause
