# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SIMCED — academic prototype simulating drone swarms over a real satellite map of
Venezuela (decentralized control, consensus, fault injection). **All data is
synthetic.** No physical drones, no real RF/hardware, no military/classified
systems. Spanish is the language of the domain (code identifiers, events, UI).

## Commands

Backend (Python 3.11+):
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000   # http://127.0.0.1:8000 , docs at /docs
```

Frontend (Node 18+):
```bash
cd frontend
npm install
npm run dev      # Vite dev server, usually http://localhost:5173
npm run build    # production build
npm run lint     # eslint
```

The `.bat` files at the root (`iniciar-backend.bat`, `iniciar-frontend.bat`) do
the same on Windows.

Backend tests (pytest, engine-only — no FastAPI needed):
```bash
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest -q        # tests/test_simulation.py
```
The engine is seedable for reproducible runs: `engine.reset(semilla=N)` and
scenarios carry a `"seed"` key, so the same scenario replays bit-for-bit
(`step()` itself has no randomness — only swarm spawn uses `self._rng`).

## Architecture

SOA split: React frontend talks to a FastAPI backend over **REST** (commands) +
a single **WebSocket** (`/ws/telemetria`, telemetry stream). The simulation
loop owns all state; the frontend is a thin view that sends orders and renders
snapshots.

### Backend (`backend/app/`)

- `simulation.py` — `SimulationEngine`, the heart. Single in-memory instance,
  no DB. A background asyncio task (`bucle_simulacion` in `main.py`) calls
  `engine.step()` every `DT` (0.1s ≈ 10 Hz) and broadcasts `engine.snapshot()`
  to all WebSocket clients. `factor` (1x–8x) scales sim time inside `step`.
- `models.py` — dataclasses (`Drone`, `Swarm`, `Zone`, `Jammer`) + enums
  (`DroneStatus`, `SwarmMode`) + flat lat/lon↔meters helpers (local ENU
  approximation, good enough at this scale).
- `main.py` — FastAPI app, request models, REST endpoints, WebSocket, CORS
  open to `*`. Endpoints are thin wrappers over engine methods.
- `escenarios.py` — predefined scenarios (S3): `ESCENARIOS` dict of declarative
  specs (base, swarms, zonas, jammers) rebuilt via `engine.cargar_escenario()`.

Monitoring / resilience metrics live in the engine and surface in
`snapshot()["metricas"]`: `conectividad` (% of drones in the largest mesh
component), `n_particiones` (connected components via union-find in
`_calcular_particiones`), `t_recuperacion` (seconds for connectivity to recover
after a disruption — see `_marcar_disrupcion`/`_evaluar_recuperacion`),
`n_disrupciones`, `coherencia` (consensus: mean circular coherence of headings
per swarm, `_calcular_consenso`; 100% = aligned — naturally low for DEFENSA's
ring), `cobertura_pct` (efficacy: % of cells inside assigned zonas already
visited, `_calcular_cobertura_pct`, computed at sample rate since it's O(cells)),
`celdas_cubiertas`. Coverage is a presence grid
(`self.cobertura`) served separately at `/api/cobertura` (kept out of the WS
snapshot to stay light). Time-series samples accumulate in `self.historial`
(every `MUESTREO_HISTORIAL_S`) and are exported as CSV/JSON via
`/api/export/*`.

Movement model (in `_mover_enjambre` / `_objetivo_modo`): **Boids** (separation
/ alignment / cohesion) + average **consensus** on heading, fully decentralized
(each drone decides from its mesh neighbors, no leader). `_pesos_modo` returns
the force weights per `SwarmMode`:
- `PATRULLAJE` — rotating wide ring (sweep).
- `DEFENSA` — static perimeter ring.
- `HIBRIDO` — even-indexed drones patrol outer ring, odd-indexed hold inner ring.

Key behaviors to keep in mind when editing the engine:
- Drones deploy **from the base**; a swarm with no `zona` orbits the base
  (`RADIO_BASE_M`) and recharges battery there; with a zona it flies out and
  drains battery. Below `UMBRAL_RTB` (20%) it auto-returns (zona cleared).
- The mesh (`_calcular_mesh`) is **global** across swarms — any drone in
  `RANGO_COMUNICACION_M` links. But alignment/cohesion only apply within the
  same `swarm_id`; only separation crosses swarms (collision avoidance).
- Fault injection: `eliminar_nodo` sets status `PERDIDO` (dropped from swarm);
  a `Jammer` zone sets drones inside to `DEGRADADO` (signal drops, speed
  halved). `pct_operativo` in metrics = % of drones still `ACTIVO`.
- `dividir_enjambre` splits members round-robin into N sub-swarms, each getting
  its **own copy** of the zona (never share the `Zone` object — radius edits
  would leak across sub-swarms).

### Frontend (`frontend/src/`)

- `api.js` — single source for the backend URL (`BASE`/`WS` hardcoded to
  `127.0.0.1:8000`), the `api` REST client object, `conectarTelemetria`
  (auto-reconnecting WebSocket), and constants `CIUDADES` / `MODOS`.
- `App.jsx` — top-level state + control panel. Holds the latest `snapshot`,
  the active tool (`herramienta`: normal/zona/jammer/crear/base), and current
  selections. Uses refs (`herramientaRef`, `selRef`) so the map's click handler
  reads current values without stale closures.
- `MapaTactico.jsx` — Leaflet map (Esri World Imagery satellite tiles). Exposes
  the map instance as `window.__simcedMap` so `App` can `flyTo` / `fitBounds`.
- `Radar.jsx` — radar-style overlay view.

### Data flow

State lives only in the backend engine. Frontend never mutates locally: it
POSTs an order → engine updates → next snapshot over WebSocket re-renders the
UI. When adding a feature, add the engine method + REST endpoint + `api.js`
entry, then consume the new snapshot fields in the components.
