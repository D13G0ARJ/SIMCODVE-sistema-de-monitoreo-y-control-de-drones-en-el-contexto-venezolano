# SIMCODVE - imagen unica: compila el frontend (Vite) y lo sirve desde el
# backend (FastAPI). Pensada para un Space de Hugging Face (SDK: docker),
# que expone el puerto 7860.

# ---- Etapa 1: compilar el frontend ----
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Etapa 2: backend + estaticos ----
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
# El build del frontend acaba en /app/frontend/dist, que main.py detecta y sirve.
COPY --from=frontend /frontend/dist ./frontend/dist

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "7860"]
