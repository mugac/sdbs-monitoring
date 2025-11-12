@echo off
REM Oracle DB Monitoring Dashboard - Stop Script (Windows Batch)
REM Zastaví backend i frontend servery

echo ================================================
echo Oracle DB Monitoring Dashboard - STOP
echo ================================================
echo.

REM Spuštění PowerShell skriptu
powershell.exe -ExecutionPolicy Bypass -File "%~dp0stop.ps1"

pause
