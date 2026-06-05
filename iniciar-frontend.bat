@echo off
REM Inicia el frontend de SIMCED (React + Vite + Leaflet)
cd /d "%~dp0frontend"
if not exist node_modules ( npm install )
npm run dev
pause
