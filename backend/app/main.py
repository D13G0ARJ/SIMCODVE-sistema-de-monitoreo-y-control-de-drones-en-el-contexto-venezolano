"""
SIMCED - API de servicios (FastAPI).

Expone el motor de simulacion como servicios (enfoque SOA):
  - Servicio de Telemetria      -> WebSocket /ws/telemetria (stream en tiempo real)
  - Servicio de Gestion de Enjambres -> /api/enjambres ...
  - Servicio de Control/Modos   -> /api/enjambres/{id}/modo, /dividir
  - Servicio de Inyeccion de Fallos  -> /api/fallos ...
  - Estado / metricas           -> /api/estado
"""
from __future__ import annotations

import asyncio
import contextlib

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import SwarmMode
from .simulation import DT, SimulationEngine

app = FastAPI(title="SIMCED API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationEngine()


# ---------------------------------------------------------------------------
# Bucle de simulacion en segundo plano + difusion a clientes WebSocket
# ---------------------------------------------------------------------------
class GestorConexiones:
    def __init__(self) -> None:
        self.activos: set[WebSocket] = set()

    async def conectar(self, ws: WebSocket) -> None:
        await ws.accept()
        self.activos.add(ws)

    def desconectar(self, ws: WebSocket) -> None:
        self.activos.discard(ws)

    async def difundir(self, mensaje: dict) -> None:
        muertos = []
        for ws in self.activos:
            try:
                await ws.send_json(mensaje)
            except Exception:
                muertos.append(ws)
        for ws in muertos:
            self.desconectar(ws)


gestor = GestorConexiones()


async def bucle_simulacion() -> None:
    while True:
        engine.step()
        await gestor.difundir(engine.snapshot())
        await asyncio.sleep(DT)


@app.on_event("startup")
async def _startup() -> None:
    # enjambre de demostracion inicial: sale de la base (Los Teques por defecto)
    engine.crear_enjambre(count=8, mode=SwarmMode.PATRULLAJE)
    app.state.tarea = asyncio.create_task(bucle_simulacion())


@app.on_event("shutdown")
async def _shutdown() -> None:
    tarea = getattr(app.state, "tarea", None)
    if tarea:
        tarea.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await tarea


# ---------------------------------------------------------------------------
# WebSocket de telemetria
# ---------------------------------------------------------------------------
@app.websocket("/ws/telemetria")
async def ws_telemetria(ws: WebSocket) -> None:
    await gestor.conectar(ws)
    try:
        await ws.send_json(engine.snapshot())
        while True:
            await ws.receive_text()  # mantiene viva la conexion
    except WebSocketDisconnect:
        gestor.desconectar(ws)
    except Exception:
        gestor.desconectar(ws)


# ---------------------------------------------------------------------------
# Modelos de peticion
# ---------------------------------------------------------------------------
class CrearEnjambreReq(BaseModel):
    count: int = 6
    lat: float | None = None   # si es None, el enjambre sale de la base
    lon: float | None = None
    mode: SwarmMode = SwarmMode.PATRULLAJE
    nombre: str | None = None


class BaseReq(BaseModel):
    lat: float
    lon: float


class VelocidadReq(BaseModel):
    factor: float = 1.0


class ZonaReq(BaseModel):
    lat: float
    lon: float
    radio_m: float = 1500.0


class RadioReq(BaseModel):
    radio_m: float


class ModoReq(BaseModel):
    mode: SwarmMode


class DividirReq(BaseModel):
    partes: int = 2
    zonas: list[ZonaReq] | None = None


class JammerReq(BaseModel):
    lat: float
    lon: float
    radio_m: float = 1200.0


class JammerUpdateReq(BaseModel):
    lat: float | None = None
    lon: float | None = None
    radio_m: float | None = None


class MoverZonaReq(BaseModel):
    lat: float
    lon: float


# ---------------------------------------------------------------------------
# Endpoints REST
# ---------------------------------------------------------------------------
@app.get("/api/estado")
def estado() -> dict:
    return engine.snapshot()


@app.post("/api/config/base")
def set_base(req: BaseReq) -> dict:
    engine.set_base(req.lat, req.lon)
    return {"ok": True}


@app.post("/api/config/velocidad")
def set_velocidad(req: VelocidadReq) -> dict:
    engine.set_velocidad(req.factor)
    return {"ok": True, "factor": engine.factor}


@app.post("/api/enjambres")
def crear_enjambre(req: CrearEnjambreReq) -> dict:
    sw = engine.crear_enjambre(req.count, req.lat, req.lon, req.mode, req.nombre)
    return {"ok": True, "enjambre": sw.to_dict(len(engine.miembros(sw.id)))}


@app.post("/api/enjambres/{swarm_id}/zona")
def asignar_zona(swarm_id: str, req: ZonaReq) -> dict:
    engine.asignar_zona(swarm_id, req.lat, req.lon, req.radio_m)
    return {"ok": True}


@app.post("/api/enjambres/{swarm_id}/radio")
def set_radio(swarm_id: str, req: RadioReq) -> dict:
    engine.set_radio_zona(swarm_id, req.radio_m)
    return {"ok": True}


@app.post("/api/enjambres/{swarm_id}/retornar")
def retornar(swarm_id: str) -> dict:
    engine.retornar_base(swarm_id)
    return {"ok": True}


@app.post("/api/enjambres/{swarm_id}/mover_zona")
def mover_zona(swarm_id: str, req: MoverZonaReq) -> dict:
    engine.mover_zona(swarm_id, req.lat, req.lon)
    return {"ok": True}


@app.post("/api/enjambres/{swarm_id}/modo")
def set_modo(swarm_id: str, req: ModoReq) -> dict:
    engine.set_modo(swarm_id, req.mode)
    return {"ok": True}


@app.post("/api/enjambres/{swarm_id}/dividir")
def dividir(swarm_id: str, req: DividirReq) -> dict:
    zonas = [z.model_dump() for z in req.zonas] if req.zonas else None
    nuevos = engine.dividir_enjambre(swarm_id, req.partes, zonas)
    return {"ok": True, "n": len(nuevos),
            "enjambres": [s.to_dict(len(engine.miembros(s.id))) for s in nuevos]}


@app.post("/api/drones/{drone_id}/modo")
def set_modo_dron(drone_id: str, req: ModoReq) -> dict:
    engine.set_modo_dron(drone_id, req.mode)
    return {"ok": True}


@app.post("/api/fallos/nodo/{drone_id}")
def eliminar_nodo(drone_id: str) -> dict:
    engine.eliminar_nodo(drone_id)
    return {"ok": True}


@app.post("/api/fallos/jammer")
def crear_jammer(req: JammerReq) -> dict:
    jam = engine.crear_jammer(req.lat, req.lon, req.radio_m)
    return {"ok": True, "jammer": jam.to_dict()}


@app.delete("/api/fallos/jammer/{jammer_id}")
def quitar_jammer(jammer_id: str) -> dict:
    engine.quitar_jammer(jammer_id)
    return {"ok": True}


@app.post("/api/fallos/jammer/{jammer_id}/actualizar")
def actualizar_jammer(jammer_id: str, req: JammerUpdateReq) -> dict:
    engine.actualizar_jammer(jammer_id, req.lat, req.lon, req.radio_m)
    return {"ok": True}


@app.get("/")
def raiz() -> dict:
    return {"servicio": "SIMCED API", "estado": "activo",
            "docs": "/docs", "telemetria": "/ws/telemetria"}
