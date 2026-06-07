"""
Escenarios precargados de SIMCED (S3).

Cada escenario es una especificacion declarativa que el motor reconstruye con
SimulationEngine.cargar_escenario(). Sirven para demostraciones reproducibles
durante la defensa y para generar datos comparables entre corridas.

Coordenadas reales de Venezuela (zona de los Altos Mirandinos / centro-norte).
Todos los datos son sinteticos: no hay drones ni RF reales.
"""
from __future__ import annotations

# id -> especificacion del escenario
ESCENARIOS: dict[str, dict] = {
    "patrullaje_urbano": {
        "nombre": "Patrullaje urbano — Los Teques",
        "descripcion": "Un enjambre barre en patrullaje una zona urbana desde la base.",
        "base": {"lat": 10.344, "lon": -67.041},
        "factor": 2.0,
        "seed": 101,
        "enjambres": [
            {
                "nombre": "Patrulla Norte", "count": 8, "mode": "patrullaje",
                "zona": {"lat": 10.355, "lon": -67.028, "radio_m": 1600.0},
            },
        ],
        "jammers": [],
    },
    "defensa_instalacion": {
        "nombre": "Defensa de instalación",
        "descripcion": "Un enjambre forma un anillo perimetral estatico alrededor de un punto critico.",
        "base": {"lat": 10.344, "lon": -67.041},
        "factor": 2.0,
        "seed": 202,
        "enjambres": [
            {
                "nombre": "Anillo Defensivo", "count": 10, "mode": "defensa",
                "zona": {"lat": 10.330, "lon": -67.050, "radio_m": 1200.0},
            },
        ],
        "jammers": [],
    },
    "resiliencia_interferencia": {
        "nombre": "Resiliencia bajo interferencia",
        "descripcion": "Enjambre en patrullaje con una zona de interferencia activa sobre la mision: muestra degradacion y recuperacion.",
        "base": {"lat": 10.344, "lon": -67.041},
        "factor": 2.0,
        "seed": 303,
        "enjambres": [
            {
                "nombre": "Patrulla Resiliente", "count": 9, "mode": "hibrido",
                "zona": {"lat": 10.358, "lon": -67.020, "radio_m": 1700.0},
            },
        ],
        "jammers": [
            {"lat": 10.358, "lon": -67.020, "radio_m": 3000.0},
        ],
    },
    "operacion_multienjambre": {
        "nombre": "Operación multi-enjambre",
        "descripcion": "Tres enjambres en zonas y modos distintos coordinados por la red mesh global.",
        "base": {"lat": 10.344, "lon": -67.041},
        "factor": 4.0,
        "seed": 404,
        "enjambres": [
            {
                "nombre": "Alfa (patrullaje)", "count": 7, "mode": "patrullaje",
                "zona": {"lat": 10.360, "lon": -67.010, "radio_m": 1500.0},
            },
            {
                "nombre": "Bravo (defensa)", "count": 7, "mode": "defensa",
                "zona": {"lat": 10.320, "lon": -67.060, "radio_m": 1300.0},
            },
            {
                "nombre": "Charlie (híbrido)", "count": 7, "mode": "hibrido",
                "zona": {"lat": 10.335, "lon": -67.005, "radio_m": 1600.0},
            },
        ],
        "jammers": [],
    },
}


def listar() -> list[dict]:
    """Resumen de escenarios disponibles para el selector del frontend."""
    return [
        {"id": k, "nombre": v["nombre"], "descripcion": v["descripcion"]}
        for k, v in ESCENARIOS.items()
    ]
