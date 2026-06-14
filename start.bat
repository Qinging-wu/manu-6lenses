@echo off
chcp 65001 >nul
title Manu AI - Starting...

cd /d "%~dp0backend"

echo.
echo   🏔️  Manu · 玛努 — Six Lenses
echo   ═══════════════════════════════
echo.
echo   Starting AI backend...
echo.

start "" http://localhost:3000/manu_six_lenses.html

node server.js

pause
