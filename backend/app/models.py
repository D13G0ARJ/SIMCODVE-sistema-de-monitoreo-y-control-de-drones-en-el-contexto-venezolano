"""
Modelos de dominio de SIMCED.

Cada dron es un GEMELO DIGITAL: un objeto que representa virtualmente una unidad
tipo dron, con sus atributos, estado y telemetria sintetica. No hay drones fisicos
ni sensores reales: todos los datos son generados (sinteticos).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum


class DroneStatus(str, Enum):
    """Estado operativo de una unidad simulada."""
    ACTIVO = "activo"          # opera con normalidad
    DEGRADADO = "degradado"    # dentro de zona de interferencia / sin enlace
    PERDIDO = "perdido"        # nodo eliminado (baja del enjambre)


class SwarmMode(str, Enum):
    """
    Modos operativos configurables por enjambre o por dron.

    - PATRULLAJE: el enjambre se dispersa y barre el area de la zona asignada.
    - DEFENSA: el enjambre forma un perimetro defensivo (anillo) alrededor del
      centro de la zona y lo mantiene.
    - HIBRIDO: patrulla la zona pero conserva mayor cohesion para poder
      reaccionar y reagruparse (mezcla de los dos anteriores).
    """
    PATRULLAJE = "patrullaje"
    DEFENSA = "defensa"
    HIBRIDO = "hibrido"


@dataclass
class Zone:
    """Zona geografica asignada a un enjambre (centro + radio en metros)."""
    lat: float
    lon: float
    radio_m: float = 1500.0

    def to_dict(self) -> dict:
        return {"lat": self.lat, "lon": self.lon, "radio_m": self.radio_m}


@dataclass
class Drone:
    """Gemelo digital de una unidad tipo dron."""
    id: str
    swarm_id: str
    lat: float
    lon: float
    alt: float = 120.0                 # metros sobre el terreno (sintetico)
    heading: float = 0.0               # rumbo en grados (0 = norte)
    speed: float = 18.0                # m/s
    bateria: float = 100.0             # porcentaje
    senal: float = 100.0               # intensidad de enlace (%)
    status: DroneStatus = DroneStatus.ACTIVO
    mode: SwarmMode = SwarmMode.PATRULLAJE

    # velocidad interna en metros/seg en marco local ENU (este, norte)
    vx: float = 0.0
    vy: float = 0.0
    vecinos: list[str] = field(default_factory=list)  # ids con enlace mesh activo

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "swarm_id": self.swarm_id,
            "lat": round(self.lat, 6),
            "lon": round(self.lon, 6),
            "alt": round(self.alt, 1),
            "heading": round(self.heading, 1),
            "speed": round(self.speed, 1),
            "bateria": round(self.bateria, 1),
            "senal": round(self.senal, 0),
            "status": self.status.value,
            "mode": self.mode.value,
            "vecinos": self.vecinos,
        }


@dataclass
class Swarm:
    """
    Enjambre: conjunto de drones que operan coordinadamente bajo un mismo modo
    y hacia una misma zona. Puede dividirse en sub-enjambres.
    """
    id: str
    nombre: str
    mode: SwarmMode = SwarmMode.PATRULLAJE
    zona: Zone | None = None
    color: str = "#22d3ee"

    def to_dict(self, n_miembros: int) -> dict:
        return {
            "id": self.id,
            "nombre": self.nombre,
            "mode": self.mode.value,
            "zona": self.zona.to_dict() if self.zona else None,
            "color": self.color,
            "n_miembros": n_miembros,
        }


@dataclass
class Jammer:
    """Zona de interferencia electromagnetica (inyeccion de fallo simulada)."""
    id: str
    lat: float
    lon: float
    radio_m: float = 1200.0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "lat": self.lat,
            "lon": self.lon,
            "radio_m": self.radio_m,
        }


# ---------------------------------------------------------------------------
# Utilidades geograficas (conversion aproximada lat/lon <-> metros locales).
# Suficiente para una simulacion academica a escala local.
# ---------------------------------------------------------------------------
METROS_POR_GRADO_LAT = 111_320.0


def metros_por_grado_lon(lat: float) -> float:
    return 111_320.0 * math.cos(math.radians(lat))


def offset_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> tuple[float, float]:
    """Devuelve (este, norte) en metros del punto 2 respecto al punto 1."""
    norte = (lat2 - lat1) * METROS_POR_GRADO_LAT
    este = (lon2 - lon1) * metros_por_grado_lon(lat1)
    return este, norte


def distancia_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    este, norte = offset_metros(lat1, lon1, lat2, lon2)
    return math.hypot(este, norte)


def aplicar_offset(lat: float, lon: float, este_m: float, norte_m: float) -> tuple[float, float]:
    """Mueve un punto lat/lon por un desplazamiento en metros (este, norte)."""
    nueva_lat = lat + norte_m / METROS_POR_GRADO_LAT
    nueva_lon = lon + este_m / metros_por_grado_lon(lat)
    return nueva_lat, nueva_lon
