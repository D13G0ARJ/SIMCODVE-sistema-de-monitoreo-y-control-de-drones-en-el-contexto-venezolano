"""
Pruebas del motor de simulacion (SimulationEngine).

Validan las propiedades en las que se apoyan los resultados de la tesis:
reproducibilidad (semilla), red mesh, particiones (R2), consenso de rumbo,
cobertura de zona (M2) e inyeccion de fallos (R1). El motor solo depende de
stdlib + .models, asi que se prueba sin levantar FastAPI.

Ejecutar:  cd backend && python -m pytest
"""
from __future__ import annotations

import math

from app.models import DroneStatus, SwarmMode
from app.simulation import RANGO_COMUNICACION_M, SimulationEngine
from app.escenarios import ESCENARIOS


def _posiciones(eng: SimulationEngine) -> list[tuple[str, float, float]]:
    return [(d.id, d.lat, d.lon) for d in eng.drones.values()]


# --------------------------------------------------------------------------
# Reproducibilidad: misma semilla -> corrida identica
# --------------------------------------------------------------------------
def test_reset_con_semilla_es_reproducible():
    a, b = SimulationEngine(), SimulationEngine()
    a.reset(semilla=42)
    b.reset(semilla=42)
    for _ in range(60):
        a.step()
        b.step()
    assert _posiciones(a) == _posiciones(b)


def test_semillas_distintas_divergen():
    a, b = SimulationEngine(), SimulationEngine()
    a.reset(semilla=1)
    b.reset(semilla=2)
    assert _posiciones(a) != _posiciones(b)


def test_escenario_es_reproducible():
    spec = ESCENARIOS["operacion_multienjambre"]
    a, b = SimulationEngine(), SimulationEngine()
    a.cargar_escenario(spec)
    b.cargar_escenario(spec)
    for _ in range(40):
        a.step()
        b.step()
    assert _posiciones(a) == _posiciones(b)
    assert a.semilla == spec["seed"]


# --------------------------------------------------------------------------
# Red mesh (R2)
# --------------------------------------------------------------------------
def test_mesh_es_simetrico():
    eng = SimulationEngine()
    eng.reset(semilla=7)
    eng.step()
    por_id = {d.id: d for d in eng.drones.values()}
    for d in eng.drones.values():
        for vid in d.vecinos:
            assert d.id in por_id[vid].vecinos  # enlace bidireccional


def test_particiones_separadas():
    eng = SimulationEngine()
    eng.reset(semilla=3)
    # dos enjambres muy lejos -> sin enlace entre ellos
    eng.crear_enjambre(count=4, lat=11.5, lon=-66.0, mode=SwarmMode.PATRULLAJE)
    eng.step()
    assert eng.n_particiones >= 2
    assert 0.0 < eng.conectividad <= 1.0


# --------------------------------------------------------------------------
# Consenso de rumbo (coherencia circular)
# --------------------------------------------------------------------------
def test_coherencia_en_rango():
    eng = SimulationEngine()
    eng.reset(semilla=5)
    for _ in range(80):
        eng.step()
    assert 0.0 <= eng.coherencia <= 1.0 + 1e-9


def test_coherencia_un_solo_dron_es_uno():
    eng = SimulationEngine()
    eng.reset(semilla=9)
    activos = [d for d in eng.drones.values()]
    eng._calcular_consenso([activos[0]])  # un solo miembro -> R = 1
    assert eng.coherencia == 1.0


# --------------------------------------------------------------------------
# Cobertura de zona (M2)
# --------------------------------------------------------------------------
def test_cobertura_pct_sin_zona_es_cero():
    eng = SimulationEngine()
    eng.reset(semilla=11)  # demo orbita la base, sin zona asignada
    for _ in range(30):
        eng.step()
    eng._calcular_cobertura_pct()
    assert eng.cobertura_pct == 0.0


def test_cobertura_pct_aumenta_con_zona():
    eng = SimulationEngine()
    eng.reset(semilla=13)
    sid = next(iter(eng.swarms))
    eng.asignar_zona(sid, 10.355, -67.028, 1500.0)
    for _ in range(200):
        eng.step()
    eng._calcular_cobertura_pct()
    assert eng.cobertura_pct > 0.0


# --------------------------------------------------------------------------
# Inyeccion de fallos (R1)
# --------------------------------------------------------------------------
def test_eliminar_nodo_marca_perdido_y_disrupcion():
    eng = SimulationEngine()
    eng.reset(semilla=17)
    d0 = next(iter(eng.drones))
    eng.eliminar_nodo(d0)
    assert eng.drones[d0].status == DroneStatus.PERDIDO
    assert eng.n_disrupciones == 1


def test_jammer_degrada_y_cuenta_disrupcion():
    eng = SimulationEngine()
    eng.reset(semilla=19)
    eng.crear_jammer(eng.base.lat, eng.base.lon, radio_m=5000.0)
    eng.step()
    assert eng.n_disrupciones == 1
    assert any(d.status == DroneStatus.DEGRADADO for d in eng.drones.values())


# --------------------------------------------------------------------------
# Snapshot: contrato de metricas que consume el frontend
# --------------------------------------------------------------------------
def test_snapshot_expone_metricas_tesis():
    eng = SimulationEngine()
    eng.reset(semilla=23)
    eng.step()
    m = eng.snapshot()["metricas"]
    for clave in (
        "conectividad", "n_particiones", "coherencia", "cobertura_pct",
        "n_disrupciones", "t_recuperacion", "celdas_cubiertas", "semilla",
    ):
        assert clave in m
