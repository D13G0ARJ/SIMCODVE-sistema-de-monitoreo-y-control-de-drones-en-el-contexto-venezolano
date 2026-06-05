# SIMCED
**Sistema de Simulación, Monitoreo y Control de Enjambres de Drones**

Prototipo de software académico para el Trabajo Especial de Grado en Ingeniería de
Sistemas (UNEFA – Núcleo Altos Mirandinos). Simula enjambres de drones sobre un
mapa satelital real de Venezuela, con control descentralizado, algoritmos de
consenso y simulación de fallos (pérdida de nodos e interferencia electromagnética).

> ⚠️ **Alcance:** es un prototipo de **simulación con datos sintéticos**. No se conecta
> a drones físicos, hardware aeronáutico, frecuencias radioeléctricas reales,
> software militar operativo ni información clasificada.

---

## Arquitectura (enfoque SOA)

```
Frontend (React + Leaflet)  ──REST──►  Backend (FastAPI)
        ▲                              ├─ Servicio de Simulación (motor)
        └────────WebSocket─────────────┤  Boids + consenso + modos
                 (telemetría)          ├─ Gestión de Enjambres / división
                                       ├─ Inyección de Fallos (jammer/nodo)
                                       └─ Alertas y Eventos
```

- **backend/** — Python + FastAPI. Motor de simulación, telemetría por WebSocket,
  endpoints REST.
- **frontend/** — React + Vite + Leaflet (capa satelital Esri World Imagery, gratuita).

## Funciones principales

- Mapa satelital real de Venezuela; drones como **gemelos digitales** moviéndose en vivo.
- **Enjambres** con comportamiento distribuido (Boids: separación / alineación / cohesión)
  y **consenso** de rumbo entre vecinos del enlace mesh.
- **3 modos** configurables por enjambre o por dron: **Patrullaje · Defensa · Híbrido**.
- **División de enjambres**: enviar un enjambre a una zona y luego dividirlo en 2 o 3
  sub-enjambres hacia otras zonas.
- **Resiliencia / inyección de fallos**: eliminar un nodo, colocar zona de interferencia
  (jammer); el enjambre se reorganiza y se mide el % operativo.
- Telemetría por unidad, red mesh, eventos y alertas.

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

---

## Guion sugerido para la defensa

1. Mostrar el enjambre de patrullaje moviéndose sobre Los Teques (botón **Ver Venezuela**
   para el contexto geográfico).
2. **Desplegar enjambre** en otra zona y cambiarle el **modo** (ver cómo cambia el patrón:
   defensa = anillo perimetral, patrullaje = barrido, híbrido = mixto).
3. **Asignar zona** a un enjambre y luego **Dividirlo en 2/3** → enviar los sub-enjambres
   a zonas distintas.
4. Colocar una **zona de interferencia** sobre un enjambre → las unidades se degradan
   (rojas) y la métrica "% operativo" baja; al salir, se recuperan.
5. **Eliminar un nodo** → el enjambre se reorganiza y mantiene la misión (resiliencia).
