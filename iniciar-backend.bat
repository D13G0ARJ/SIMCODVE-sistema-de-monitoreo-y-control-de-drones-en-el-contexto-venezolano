@echo off
REM Inicia el servicio backend de SIMCED (FastAPI + simulacion)
cd /d "%~dp0backend"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
