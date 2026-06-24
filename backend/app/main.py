"""
SIMCODVE - API de servicios (FastAPI).

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
import csv
import io
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import escenarios
from .models import SwarmMode
from .simulation import CELDA_COBERTURA_M, DT, MUESTREO_HISTORIAL_S, SimulationEngine

app = FastAPI(title="SIMCODVE API", version="0.1.0")

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
        if not engine.pausado:
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


class PausaReq(BaseModel):
    pausado: bool


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


class UnirReq(BaseModel):
    ids: list[str]


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


@app.post("/api/config/pausa")
def set_pausa(req: PausaReq) -> dict:
    engine.set_pausa(req.pausado)
    return {"ok": True, "pausado": engine.pausado}


@app.post("/api/reset")
def reset() -> dict:
    engine.reset()
    return {"ok": True}


# --- Escenarios ---
@app.get("/api/escenarios")
def listar_escenarios() -> dict:
    return {"escenarios": escenarios.listar()}


@app.post("/api/escenarios/{escenario_id}/cargar")
def cargar_escenario(escenario_id: str) -> dict:
    ok = engine.cargar_escenario(escenario_id)
    return {"ok": ok}


# --- Exportacion del historial ---
# Columnas del historial: (clave, encabezado_legible, descripcion). Unica fuente de
# verdad para CSV y JSON; la clave coincide con la que guarda _muestrear_historial.
COLUMNAS_HISTORIAL: list[tuple[str, str, str]] = [
    ("tiempo_s", "tiempo_s",
     "Tiempo de simulacion transcurrido, en segundos."),
    ("drones_totales", "drones_totales",
     "Cantidad total de drones en la simulacion."),
    ("operativos", "operativos",
     "Drones ACTIVOS (enlace y senal normales)."),
    ("degradados", "degradados",
     "Drones DEGRADADOS por interferencia (senal y velocidad reducidas)."),
    ("perdidos", "perdidos",
     "Drones dados de baja por fallo de nodo."),
    ("pct_operativo", "pct_operativo",
     "Porcentaje de la flota operativa (operativos / total)."),
    ("conectividad_pct", "conectividad_pct",
     "Porcentaje de drones en el mayor componente conectado de la malla "
     "(100 = toda la flota se comunica)."),
    ("n_particiones", "n_particiones",
     "Numero de subredes desconectadas (1 = red integra; >1 = malla fragmentada)."),
    ("consenso_pct", "consenso_pct",
     "Consenso de rumbos: coherencia circular media por enjambre "
     "(100 = rumbos alineados, sin lider)."),
    ("cobertura_pct", "cobertura_pct",
     "Porcentaje del area de las zonas asignadas ya visitada al menos una vez."),
    ("celdas_cubiertas", "celdas_cubiertas",
     f"Celdas de {CELDA_COBERTURA_M:g} m visitadas dentro de las zonas asignadas."),
    ("n_enjambres", "n_enjambres",
     "Cantidad de enjambres activos."),
    ("n_jammers", "n_jammers",
     "Cantidad de zonas de interferencia activas."),
]


@app.get("/api/export/historial.json")
def export_historial_json() -> dict:
    return {
        "escenario": engine.escenario_actual,
        "muestreo_cada_s": MUESTREO_HISTORIAL_S,
        "n_muestras": len(engine.historial),
        "columnas": [{"clave": k, "descripcion": d} for k, _, d in COLUMNAS_HISTORIAL],
        "muestras": engine.historial,
    }


@app.get("/api/reporte/interferencia")
def reporte_interferencia() -> dict:
    return engine.reporte_interferencia()


@app.get("/api/export/interferencia.csv")
def export_interferencia_csv() -> Response:
    rep = engine.reporte_interferencia()
    columnas = ["id", "lat", "lon", "radio_m", "drones_afectados", "enjambres_cercanos"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["# Reporte de interferencia - SIMCODVE",
                f"t_simulacion_s={rep['t_simulacion_s']}", f"n_zonas={rep['n_zonas']}"])
    w.writerow(columnas)
    for z in rep["zonas"]:
        w.writerow([z["id"], z["lat"], z["lon"], z["radio_m"],
                    z["drones_afectados"], " | ".join(z["enjambres_cercanos"])])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=simced_interferencia.csv"},
    )


@app.get("/api/export/historial.csv")
def export_historial_csv() -> Response:
    claves = [k for k, _, _ in COLUMNAS_HISTORIAL]
    buf = io.StringIO()
    w = csv.writer(buf)
    # cabecera explicativa (lineas '#') para que el CSV sea autoexplicativo
    w.writerow(["# SIMCODVE - Historial de metricas (control descentralizado)"])
    w.writerow([f"# escenario={engine.escenario_actual}",
                f"muestreo_cada_s={MUESTREO_HISTORIAL_S:g}",
                f"n_muestras={len(engine.historial)}"])
    w.writerow(["# Significado de las columnas:"])
    for _, encabezado, desc in COLUMNAS_HISTORIAL:
        w.writerow([f"#   {encabezado}: {desc}"])
    # fila de encabezados y datos
    w.writerow([enc for _, enc, _ in COLUMNAS_HISTORIAL])
    for fila in engine.historial:
        w.writerow([fila.get(k, "") for k in claves])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=simced_historial.csv"},
    )


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


@app.post("/api/enjambres/unir")
def unir(req: UnirReq) -> dict:
    sw = engine.unir_enjambres(req.ids)
    return {"ok": sw is not None,
            "enjambre": sw.to_dict(len(engine.miembros(sw.id))) if sw else None}


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


@app.get("/api")
def raiz() -> dict:
    return {"servicio": "SIMCODVE API", "estado": "activo",
            "docs": "/docs", "telemetria": "/ws/telemetria"}


# ---------------------------------------------------------------------------
# Frontend compilado (build de Vite). Si existe frontend/dist, se sirve la SPA
# desde el MISMO origen que la API (despliegue de una sola URL, p.ej. en un
# Space de Hugging Face). En desarrollo no existe y este bloque no hace nada.
# Se monta al final para que las rutas /api/... y /ws/... tengan prioridad.
# ---------------------------------------------------------------------------
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="spa")
