@echo off
REM Oracle DB Monitoring Dashboard - Start Script (Windows Batch)
REM Spustí PowerShell skript start.ps1

echo ================================================
echo Oracle DB Monitoring Dashboard - START
echo ================================================
echo.

REM Spuštění PowerShell skriptu
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause
