@echo off
title WeRecordIt Studio Launcher
cd /d "%~dp0"

echo ========================================================
echo  WeRecordIt Studio - Automation Video ^& Snipping Suite
echo ========================================================
echo.

if "%PORT%"=="" set PORT=4500
if "%HOST%"=="" set HOST=127.0.0.1
set APP_URL=http://%HOST%:%PORT%

echo [WeRecordIt] Memeriksa status server latar belakang...
powershell -Command "try { $r = Invoke-WebRequest -Uri '%APP_URL%/api/ping' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo [WeRecordIt] Server sudah aktif berjalan. Membuka jendela Studio...
    goto OpenApp
)

echo [WeRecordIt] Menjalankan server Studio di latar belakang...
start /min "WeRecordIt Studio Server" node src/studio/server.js

set RETRY=0
:WaitForServer
timeout /t 1 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri '%APP_URL%/api/ping' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 goto OpenApp

set /a RETRY+=1
if %RETRY% leq 6 goto WaitForServer

:OpenApp
echo [WeRecordIt] Membuka antarmuka WeRecordIt Studio...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=%APP_URL% --window-size=1366,800
    exit
)
start %APP_URL%
exit
