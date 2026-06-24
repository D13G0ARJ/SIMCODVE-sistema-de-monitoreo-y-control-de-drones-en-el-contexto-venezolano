---
title: SIMCODVE
emoji: 🛰️
colorFrom: blue
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# SIMCODVE
**Sistema de Monitoreo y Control de Drones — Contexto Venezolano**

Prototipo de software académico para el Trabajo Especial de Grado en Ingeniería de
Sistemas (UNEFA — Núcleo Altos Mirandinos). Simula el **monitoreo y control de enjambres
de drones** sobre un mapa satelital real de Venezuela, aplicando **control
descentralizado**, **algoritmos de consenso** y **simulación de fallos** (pérdida de
nodos e interferencia electromagnética).

La idea central es demostrar que un enjambre puede **coordinarse sin un nodo central**:
cada dron decide su movimiento mirando solo a sus vecinos en la red de comunicaciones, y
aun así el conjunto patrulla, defiende, mantiene la conectividad y se recupera de fallos.

> ⚠️ **Alcance.** Es un prototipo de **simulación con datos sintéticos**. No se conecta a
> drones físicos, hardware aeronáutico, sensores, frecuencias radioeléctricas reales,
> software militar operativo ni información clasificada. La cartografía proviene de
> servicios de mapas de acceso abierto.

---

## Arquitectura (enfoque SOA, cliente-servidor)

El estado vive **solo en el backend**. El frontend es una vista delgada: envía órdenes
por REST y dibuja los *snapshots* que recibe por WebSocket; nunca modifica el estado
localmente.

```
Frontend (React + Vite + Leaflet)        Backend (FastAPI + Uvicorn)
  ┌───────────────────────────┐  REST   ┌───────────────────────────────┐
  │ Vista Mapa / Vista Radar  │ ──────► │ Servicios REST (/api/...)     │
  │ Paneles, modal, búsqueda  │ ◄────── │ Servicio de Telemetría (WS)   │
  └───────────────────────────┘   WS    │ SimulationEngine (motor)      │
                                         │  Reynolds (boids) + consenso  │
                                         │  modos · división · unión     │
                                         │  base · batería · red mesh    │
                                         │  inyección de fallos · eventos│
                                         │  escenarios · métricas · CSV  │
                                         └───────────────────────────────┘
```

- **backend/** — Python + FastAPI. Aloja el `SimulationEngine` (única instancia en
  memoria, sin base de datos). Una tarea de fondo llama a `engine.step()` cada `DT`
  (0,1 s ≈ **10 Hz**) y transmite `engine.snapshot()` a todos los clientes WebSocket.
- **frontend/** — React + Vite + Leaflet (satélite Esri, calles OpenStreetMap/CartoDB,
  geocodificación Nominatim).

### Pila tecnológica
| Capa     | Tecnología                              |
|----------|------------------------------------------|
| Servidor | Python 3.11+ · FastAPI · Uvicorn · Pydantic |
| Cliente  | React 19 · Vite 8 · Leaflet 1.9          |

---

## Modelo de simulación

Cada dron se mueve con **dirección de Reynolds (boids / *steering behaviors*)**, donde
cada comportamiento produce una fuerza `velocidad_deseada − velocidad_actual` acotada, lo
que da un vuelo estable y sin oscilaciones. Las fuerzas que se combinan son:

- **Separación** — evita colisiones (actúa entre **todos** los drones cercanos, incluso de
  enjambres distintos).
- **Alineación = consenso de rumbo** — cada dron promedia el rumbo de sus vecinos del
  **mismo enjambre**; así el grupo converge a una dirección común **sin líder**.
- **Cohesión** — mantiene al enjambre agrupado.
- **Objetivo del modo** — empuja al dron a su posición dentro del patrón (con frenado
  suave al llegar).
- **Evasión de interferencia** — prioridad alta: el dron nunca entra a una zona de
  interferencia, la bordea.

### Red mesh
La red de comunicaciones es **global**: cualquier par de drones a menos de
**1200 m** (`RANGO_COMUNICACION_M`) queda enlazado, sin importar su enjambre (modela una
malla real entre grupos). Sobre esa malla se calculan la conectividad y las particiones.
La alineación y la cohesión solo aplican **dentro del mismo enjambre**; solo la separación
cruza enjambres.

### Base de operaciones y ciclo de batería
Los drones **se despliegan desde la base**. Un enjambre sin zona asignada orbita la base y
**recarga**; con una zona, vuela a ella y **descarga** batería. El ciclo es autónomo:

```
misión ──(batería < 20%)──► retorno a base ──► recarga ──(batería ≥ 95%)──► retoma la misión
```

con alertas por unidad en cada transición.

---

## Modos operativos

Se asignan por enjambre o por dron individual. Cada modo cambia el **patrón objetivo**
sobre la zona asignada (de radio `R`):

| Modo | Patrón | Comportamiento |
|------|--------|----------------|
| **Patrullaje** | Barrido del disco | Cada dron toma un **radio distinto** (de ~0,32 R a ~0,94 R) y el conjunto **rota** → barre toda el área asignada. |
| **Defensa** | Anillo perimetral | Anillo **estático** a ~0,9 R; los drones quedan fijos como **centinelas mirando hacia afuera**. |
| **Híbrido** | Dos anillos concéntricos | **Exterior** (~0,9 R) **rota** patrullando el perímetro; **interior** (~0,5 R) **estático** defendiendo el núcleo. Cada anillo se coordina solo con su propio anillo, así no se desestabilizan entre sí. |

Además, un enjambre puede **dividirse** en sub-enjambres (reparto *round-robin*, cada uno
con su propia copia de la zona) y volver a **unirse**.

---

## Métricas de monitoreo

El motor calcula, en vivo y como serie temporal exportable, indicadores del desempeño del
control descentralizado:

| Métrica | Significado |
|---------|-------------|
| **% operativo** | Porcentaje de la flota en estado `ACTIVO` (no degradada ni perdida). |
| **Conectividad** | % de drones que están en el **mayor componente conectado** de la malla. 100 % = toda la flota se comunica. |
| **Particiones** | Número de **subredes desconectadas** (1 = red íntegra; >1 = malla fragmentada). |
| **Consenso** | **Coherencia circular media** de los rumbos por enjambre (100 % = rumbos alineados, logrado sin líder). |
| **Cobertura** | % del área de las zonas asignadas ya **visitada** al menos una vez (eficacia del barrido). |

Estas métricas se acumulan en un historial (una muestra cada 5 s de simulación) y se
exportan en **CSV/JSON autoexplicativos** (con cabecera que describe cada columna), junto
con un **reporte de interferencia** en CSV.

---

## Escenarios preconfigurados

Declarativos y **reproducibles** (cada uno lleva una semilla, así replican igual en cada
corrida). La base por defecto del sistema es la **UNEFA** (Núcleo Altos Mirandinos).

| Escenario | Descripción |
|-----------|-------------|
| **Patrullaje urbano — Los Teques** | Un enjambre patrulla en barrido el casco urbano. |
| **Defensa de instalación — UNEFA** | Un enjambre forma un perímetro defensivo sobre el campus. |
| **Operación multienjambre** | Tres enjambres supervisan a la vez la **UNEFA**, el **Hospital Victorino Santaella** y **Fuerte Tiuna**, con modos distintos (patrullaje / híbrido / defensa). |

---

## Funciones principales

- **Mapa satelital real de Venezuela** con los drones como **gemelos digitales** en vivo, y
  **vista Radar** alterna (centrada en la base, con mapa real de calles de fondo y anillos
  de alcance a distancias reales).
- **Control descentralizado** completo (boids + consenso, descrito arriba).
- **3 modos** por enjambre o por dron (patrullaje / defensa / híbrido).
- **Enjambres divisibles y unibles.**
- **Asignación de zonas** a supervisar (crear, mover, redimensionar).
- **Inyección de fallos:** eliminar un nodo (pérdida) y crear/mover/redimensionar **zonas
  de interferencia**, que degradan a los drones dentro (señal y velocidad reducidas) y son
  **rodeadas** por el enjambre.
- **Control de simulación:** pausa/reanudar, reinicio y **velocidad 1×–32×** (con
  sub-pasos para mantener el vuelo estable a alta velocidad).
- **Buscador de lugares** (geocodificación), **estadísticas por unidad**, ficha de
  **telemetría** del dron seleccionado y registro de **eventos/alertas**.
- **Exportación a CSV/JSON** del historial de métricas y del reporte de interferencia.

---

## API de servicios

El backend expone el motor como servicios (REST + un WebSocket). Documentación interactiva
automática en `/docs`.

| Tipo | Endpoint | Función |
|------|----------|---------|
| WS   | `/ws/telemetria` | Stream de *snapshots* (~10 Hz). |
| GET  | `/api/estado` | Estado/métricas actuales. |
| POST | `/api/config/base · /velocidad · /pausa` · `/api/reset` | Control de la simulación. |
| GET / POST | `/api/escenarios` · `/api/escenarios/{id}/cargar` | Listar y cargar escenarios. |
| POST | `/api/enjambres` · `.../{id}/zona · /radio · /modo · /retornar · /mover_zona · /dividir` · `/api/enjambres/unir` | Gestión de enjambres. |
| POST | `/api/drones/{id}/modo` | Modo de un dron individual. |
| POST | `/api/fallos/nodo/{id}` · `/api/fallos/jammer` · `.../{id}/actualizar` | Inyección de fallos. |
| GET  | `/api/export/historial.{csv,json}` · `/api/export/interferencia.csv` · `/api/reporte/interferencia` | Exportación de datos. |

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

## Recorrido de demostración

1. Abrir **Escenarios preconfigurados** y cargar uno.
2. Observar el enjambre en **Patrullaje** y cambiar el **modo** a **Defensa** / **Híbrido**
   (cambia el patrón: barrido del área vs. anillo perimetral vs. dos anillos).
3. **Dividir** un enjambre y luego **unirlo**; **asignar zonas** y moverlas.
4. Colocar una **zona de interferencia** → las unidades se degradan y la **rodean**; el
   **% operativo** baja y se recupera.
5. **Eliminar un nodo** → el enjambre se reorganiza y mantiene la misión (resiliencia).
6. Acelerar a **8×–32×** y observar el **ciclo de batería** (retorno → recarga → retoma).
7. Cambiar a **Vista Radar** y **exportar** el historial de métricas en CSV.

---

## Estructura del proyecto

```
backend/
  app/
    models.py        dataclasses (Drone, Swarm, Zone, Jammer) + enums + helpers geo
    simulation.py    SimulationEngine: movimiento, mesh, modos, batería, métricas
    main.py          FastAPI: endpoints REST + WebSocket de telemetría
    escenarios.py    escenarios predefinidos (declarativos, reproducibles)
frontend/
  src/
    App.jsx          estado de alto nivel + panel de control
    MapaTactico.jsx  mapa Leaflet (satélite Esri)
    Radar.jsx        vista tipo radar
    api.js           cliente REST + WebSocket (URLs y constantes)
    ModalEscenarios.jsx · PantallaCarga.jsx · AnimacionModo.jsx · Buscador.jsx
```
