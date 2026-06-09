# SIMCODVE
**Sistema de Monitoreo y Control de Drones — Contexto Venezolano**

Prototipo de software académico para el Trabajo Especial de Grado en Ingeniería de
Sistemas (UNEFA — Núcleo Altos Mirandinos). Simula el **monitoreo y control de enjambres
de drones** sobre un mapa satelital real de Venezuela, con **control descentralizado**,
**algoritmos de consenso** y **simulación de fallos** (pérdida de nodos e interferencia
electromagnética).

> ⚠️ **Alcance:** es un prototipo de **simulación con datos sintéticos**. No se conecta a
> drones físicos, hardware aeronáutico, sensores, frecuencias radioeléctricas reales,
> software militar operativo ni información clasificada. La cartografía proviene de
> servicios de mapas de acceso abierto.

---

## Arquitectura (enfoque SOA, cliente-servidor)

```
Frontend (React + Vite + Leaflet)        Backend (FastAPI + Uvicorn)
  ┌───────────────────────────┐  REST   ┌───────────────────────────────┐
  │ Vista Mapa / Vista Radar  │ ──────► │ Servicios REST (/api/...)     │
  │ Paneles, modal, búsqueda  │ ◄────── │ Servicio de Telemetría (WS)   │
  └───────────────────────────┘  WS     │ SimulationEngine (motor)      │
                                         │  Reynolds steering + consenso │
                                         │  modos · división · unión     │
                                         │  base · batería · mesh        │
                                         │ Inyección de fallos · Eventos │
                                         │ Escenarios · Métricas/CSV     │
                                         └───────────────────────────────┘
```

- **backend/** — Python + FastAPI. Motor de simulación, telemetría por WebSocket
  (`/ws/telemetria`, ~10 Hz) y endpoints REST.
- **frontend/** — React + Vite + Leaflet (satélite Esri, calles OpenStreetMap/CartoDB,
  geocodificación Nominatim).

### Pila tecnológica
| Capa | Tecnología | Versión |
|------|------------|---------|
| Servidor | Python · FastAPI · Uvicorn · Pydantic | 3.14 · 0.136 · 0.49 · 2.13 |
| Cliente | React · Vite · Leaflet | 19 · 8 · 1.9 |

---

## Funciones principales

- **Mapa satelital real de Venezuela** con drones como **gemelos digitales** en vivo, y
  **vista Radar** alterna (centrada en la base, con mapa real de calles de fondo).
- **Control descentralizado (steering de Reynolds):** separación, **alineación = consenso**
  de rumbo, cohesión, objetivo del modo (con llegada suave) y evasión de interferencia.
- **3 modos** por enjambre o por dron: **Patrullaje** (barrido del área), **Defensa**
  (anillo perimetral, centinelas) e **Híbrido** (mixto).
- **Base de operaciones:** los drones salen de la base, se estacionan al volver y siguen
  un **ciclo de batería**: misión → batería baja → retorno → recarga → retoma la misión
  (con alertas por unidad).
- **Enjambres divisibles y unibles:** dividir un enjambre en sub-enjambres y volver a
  unirlos.
- **Red mesh global** y **inyección de fallos:** eliminar un nodo y crear/mover/redimensionar
  zonas de interferencia; el enjambre las **rodea** y se mide el **% operativo**.
- **Escenarios preconfigurados reproducibles** (semilla): Patrullaje urbano (Los Teques),
  Defensa de instalación (UNEFA) y Operación multienjambre (UNEFA · Hospital V. Santaella ·
  Fuerte Tiuna).
- **Control de simulación:** pausa/reanudar, reinicio y **velocidad 1×–32×** (con sub-pasos).
- **Buscador de lugares** (geocodificación), **estadísticas por unidad**, **eventos/alertas**
  y **exportación a CSV** (historial de métricas y reporte de interferencia).

---

## Cómo ejecutarlo

Requisitos: **Python 3.11+** y **Node 18+**.

### 1) Backend
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Queda en http://127.0.0.1:8000 (documentación interactiva en `/docs`).

### 2) Frontend (en otra terminal)
```powershell
cd frontend
npm install
npm run dev
```
Abrir el navegador en la dirección que muestre Vite (normalmente http://localhost:5173).

> En Windows también pueden usarse los scripts `iniciar-backend.bat` e
> `iniciar-frontend.bat` (doble clic).

---

## Guion sugerido para la defensa

1. Abrir **Escenarios preconfigurados** y cargar uno (pantalla de carga con datos reales
   del despliegue).
2. Observar el enjambre en **Patrullaje** y cambiar el **modo** a **Defensa** / **Híbrido**
   (cambia el patrón: barrido del área vs. anillo perimetral).
3. **Dividir** un enjambre y luego **unirlo**; **asignar zonas** y moverlas.
4. Colocar una **zona de interferencia** → las unidades se degradan y la **rodean**; el
   **% operativo** baja y se recupera.
5. **Eliminar un nodo** → el enjambre se reorganiza y mantiene la misión (resiliencia).
6. Acelerar a **8×–32×** y observar el **ciclo de batería** (retorno → recarga → retoma).
7. Cambiar a **Vista Radar** y **exportar** el historial en CSV.

---

## Documentación de la tesis

- **`Capitulo_VI.md`** / **`Capitulo_VI.docx`** — Capítulo VI (desarrollo informático):
  metodología, requerimientos, casos de uso y trazabilidad, arquitectura SOA, modelo de
  control descentralizado, pruebas y validación. El `.docx` está en **Arial 12, justificado**.
- **`Capitulo_VI_diagramas/`** — 8 diagramas UML en `.puml` (editables) y `.png`: casos de
  uso, componentes, despliegue, clases, actividad, dos de secuencia y estados.

---

## Estructura del proyecto

```
backend/
  app/  models.py · simulation.py · main.py · escenarios.py
frontend/
  src/  App.jsx · MapaTactico.jsx · Radar.jsx · Buscador.jsx
        ModalEscenarios.jsx · PantallaCarga.jsx · AnimacionModo.jsx · api.js
Capitulo_VI.md · Capitulo_VI.docx · Capitulo_VI_diagramas/
```
