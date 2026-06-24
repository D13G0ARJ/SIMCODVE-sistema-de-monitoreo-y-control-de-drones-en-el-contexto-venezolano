"""
Motor de simulacion de SIMCODVE.

Implementa el comportamiento del enjambre mediante:
  - Boids (Reynolds): separacion, alineacion y cohesion -> control DESCENTRALIZADO
    (cada dron decide localmente a partir de sus vecinos, sin nodo central).
  - Consenso promedio: los drones de un enjambre convergen a un rumbo comun
    promediando el de sus vecinos conectados (mantiene coherencia sin lider).
  - Modos operativos (patrullaje / defensa / hibrido) que modifican el objetivo.
  - Base de operaciones: los drones se despliegan DESDE la base y vuelan a la
    zona asignada; sin zona, orbitan (merodean) la base.
  - Red mesh dinamica + inyeccion de fallos (nodo, jammer).
  - Factor de tiempo para acelerar la simulacion (1x..8x).

Todo opera con datos sinteticos. No hay hardware, sensores ni RF reales.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

from .models import (
    Drone,
    DroneStatus,
    Jammer,
    Swarm,
    SwarmMode,
    Zone,
    aplicar_offset,
    distancia_metros,
    offset_metros,
)

# Parametros globales de simulacion
RANGO_COMUNICACION_M = 1200.0   # alcance de enlace mesh
DT = 0.1                         # paso de tiempo base (s) -> ~10 Hz
VEL_MAX = 25.0                   # m/s
VEL_CRUCERO = 18.0               # m/s
DESCARGA_BATERIA = 0.05          # % por segundo (en mision)
RECARGA_BATERIA = 0.6            # % por segundo (en la base)
UMBRAL_RTB = 20.0                # % de bateria que dispara el retorno automatico
UMBRAL_RECARGADO = 95.0          # % de bateria con el que el enjambre retoma su mision
RADIO_BASE_M = 450.0             # radio de merodeo alrededor de la base
BASE_DEFECTO = {"lat": 10.34915, "lon": -67.02262}   # UNEFA Nucleo Altos Mirandinos (Los Teques)
OMEGA_PATRULLA = 0.12            # velocidad angular del barrido (rad/s)
CELDA_COBERTURA_M = 150.0        # lado de cada celda de la grilla de cobertura (m)
MUESTREO_HISTORIAL_S = 5.0       # cada cuantos segundos (de simulacion) se guarda una muestra
MARGEN_EVASION_M = 250.0         # banda fina de seguridad pegada al borde del jammer
MARGEN_CORDON = 150.0            # a que distancia FUERA del borde rojo se ubica el objetivo
PESO_EVASION = 2.5              # prioridad de la evasion de interferencia

# Modelo de direccion de Reynolds (steering behaviors):
# cada comportamiento produce fuerza = velocidad_deseada - velocidad_actual,
# limitada a MAX_FUERZA. Esto da un vuelo estable y sin oscilaciones.
MAX_FUERZA = 7.0                 # aceleracion maxima de direccion (m/s^2)
DIST_SEPARACION = 130.0          # distancia minima entre drones antes de separarse
RADIO_LLEGADA = 180.0            # radio de frenado suave al acercarse al objetivo (arrival)
CORREA_EXTRA_M = 1500.0          # mas alla de (zona + esto) el dron solo regresa (evita "cometas")


@dataclass
class _Contador:
    n: int = 0

    def siguiente(self, prefijo: str) -> str:
        self.n += 1
        return f"{prefijo}-{self.n:03d}"


class SimulationEngine:
    """Estado y avance de la simulacion del enjambre."""

    def __init__(self) -> None:
        self.drones: dict[str, Drone] = {}
        self.swarms: dict[str, Swarm] = {}
        self.jammers: dict[str, Jammer] = {}
        self.eventos: list[dict] = []
        # base de operaciones por defecto: Los Teques (Altos Mirandinos)
        self.base = Zone(lat=BASE_DEFECTO["lat"], lon=BASE_DEFECTO["lon"], radio_m=RADIO_BASE_M)
        self.factor = 1.0  # factor de tiempo (1x..8x)
        self.tiempo = 0.0  # tiempo de simulacion acumulado (s), para el barrido
        self.pausado = False
        self.historial: list[dict] = []      # serie temporal de metricas (para exportar)
        self._ultima_muestra = 0.0
        # celdas (grilla) ya visitadas por algun dron -> base de la metrica de cobertura
        self.cobertura: set[tuple[int, int]] = set()
        self.escenario_actual: str | None = None
        self._cont_drone = _Contador()
        self._cont_swarm = _Contador()
        self._cont_jam = _Contador()
        self._cont_evt = _Contador()
        self._paleta = [
            "#22d3ee", "#f59e0b", "#a78bfa", "#34d399",
            "#f472b6", "#60a5fa", "#fb7185", "#facc15",
        ]

    # ------------------------------------------------------------------
    # Registro de eventos / alertas
    # ------------------------------------------------------------------
    def _evento(self, tipo: str, mensaje: str, nivel: str = "info") -> None:
        evt = {
            "id": self._cont_evt.siguiente("EVT"),
            "tipo": tipo,
            "nivel": nivel,
            "mensaje": mensaje,
        }
        self.eventos.append(evt)
        self.eventos = self.eventos[-100:]

    # ------------------------------------------------------------------
    # Configuracion (base / velocidad)
    # ------------------------------------------------------------------
    def set_base(self, lat: float, lon: float) -> None:
        self.base = Zone(lat=lat, lon=lon, radio_m=RADIO_BASE_M)
        self._evento("base", "Base de operaciones reubicada.")

    def set_velocidad(self, factor: float) -> None:
        self.factor = max(0.5, min(32.0, factor))
        self._evento("config", f"Velocidad de simulacion: {self.factor:g}x.")

    def set_pausa(self, pausado: bool) -> None:
        self.pausado = pausado
        self._evento("config", "Simulacion en pausa." if pausado else "Simulacion reanudada.")

    def _limpiar(self, base: Zone | None = None, semilla: int | None = None) -> None:
        """Deja la simulacion en blanco (sin enjambres). Base y semilla opcionales."""
        self.drones.clear()
        self.swarms.clear()
        self.jammers.clear()
        self.eventos.clear()
        self.base = base or Zone(lat=BASE_DEFECTO["lat"], lon=BASE_DEFECTO["lon"], radio_m=RADIO_BASE_M)
        self.factor = 1.0
        self.tiempo = 0.0
        self.pausado = False
        self.historial = []
        self._ultima_muestra = 0.0
        self.cobertura = set()
        self.escenario_actual = None
        self._cont_drone = _Contador()
        self._cont_swarm = _Contador()
        self._cont_jam = _Contador()
        self._cont_evt = _Contador()
        if semilla is not None:
            random.seed(semilla)

    def reset(self) -> None:
        """Reinicia toda la simulacion al estado inicial (enjambre demo en la base)."""
        self._limpiar()
        self.crear_enjambre(count=8, mode=SwarmMode.PATRULLAJE)
        self._evento("config", "Simulacion reiniciada.")

    def cargar_escenario(self, escenario_id: str) -> bool:
        """Carga un escenario predefinido (declarativo) de forma reproducible."""
        from .escenarios import ESCENARIOS
        esc = ESCENARIOS.get(escenario_id)
        if not esc:
            return False
        b = esc["base"]
        self._limpiar(
            base=Zone(lat=b["lat"], lon=b["lon"], radio_m=RADIO_BASE_M),
            semilla=esc.get("seed"),
        )
        self.escenario_actual = escenario_id
        for spec in esc["swarms"]:
            modo = SwarmMode(spec["mode"])
            sw = self.crear_enjambre(spec["count"], mode=modo, nombre=spec.get("nombre"))
            z = spec.get("zona")
            if z:
                self.asignar_zona(sw.id, z["lat"], z["lon"], z.get("radio_m", 1500.0))
        for j in esc.get("jammers", []):
            self.crear_jammer(j["lat"], j["lon"], j.get("radio_m", 1200.0))
        self._evento("escenario", f"Escenario cargado: {esc['nombre']}.")
        return True

    # ------------------------------------------------------------------
    # Creacion de enjambres
    # ------------------------------------------------------------------
    def crear_enjambre(
        self,
        count: int,
        lat: float | None = None,
        lon: float | None = None,
        mode: SwarmMode = SwarmMode.PATRULLAJE,
        nombre: str | None = None,
    ) -> Swarm:
        # si no se indica origen, los drones SALEN DE LA BASE
        ox = self.base.lat if lat is None else lat
        oy = self.base.lon if lon is None else lon

        sid = self._cont_swarm.siguiente("ENJ")
        color = self._paleta[(self._cont_swarm.n - 1) % len(self._paleta)]
        swarm = Swarm(
            id=sid,
            nombre=nombre or f"Enjambre {self._cont_swarm.n}",
            mode=mode,
            zona=None,  # sin mision: merodea la base hasta que se le asigne zona
            color=color,
        )
        self.swarms[sid] = swarm

        for _ in range(count):
            did = self._cont_drone.siguiente("UAV")
            d_lat, d_lon = aplicar_offset(
                ox, oy, random.uniform(-120, 120), random.uniform(-120, 120)
            )
            self.drones[did] = Drone(
                id=did, swarm_id=sid, lat=d_lat, lon=d_lon,
                heading=random.uniform(0, 360), speed=VEL_CRUCERO, mode=mode,
            )
        self._evento("enjambre", f"{swarm.nombre} desplegado desde la base con {count} unidades en modo {mode.value}.")
        return swarm

    def miembros(self, swarm_id: str) -> list[Drone]:
        return [d for d in self.drones.values()
                if d.swarm_id == swarm_id and d.status != DroneStatus.PERDIDO]

    # ------------------------------------------------------------------
    # Ordenes del operador
    # ------------------------------------------------------------------
    def asignar_zona(self, swarm_id: str, lat: float, lon: float, radio_m: float = 1500.0) -> None:
        sw = self.swarms.get(swarm_id)
        if not sw:
            return
        z = Zone(lat=lat, lon=lon, radio_m=radio_m)
        ms = self.miembros(swarm_id)
        bat_min = min((d.bateria for d in ms), default=100.0)
        en_base = bool(ms) and all(
            distancia_metros(d.lat, d.lon, self.base.lat, self.base.lon) <= self.base.radio_m * 1.6
            for d in ms
        )
        if en_base and bat_min < UMBRAL_RTB:
            # bateria muy baja en la base: recargar primero y desplegar al cargar
            sw.zona = None
            sw.mision_pendiente = z
            self._evento(
                "mision",
                f"{sw.nombre}: batería baja, recargando antes de desplegar a la zona.",
                nivel="warn",
            )
        else:
            sw.zona = z
            sw.mision_pendiente = None
            self._evento("mision", f"{sw.nombre} recibe orden de supervisar nueva zona.")

    def retornar_base(self, swarm_id: str) -> None:
        """Ordena al enjambre regresar a la base (quita la zona; vuelve a merodearla)."""
        sw = self.swarms.get(swarm_id)
        if sw:
            sw.zona = None
            sw.mision_pendiente = None  # retorno manual: no retoma mision despues
            self._evento("mision", f"{sw.nombre} retorna a la base.")

    def set_radio_zona(self, swarm_id: str, radio_m: float) -> None:
        """Ajusta el tamano de la zona asignada (sin registrar evento; para el slider)."""
        sw = self.swarms.get(swarm_id)
        if sw and sw.zona:
            sw.zona.radio_m = max(300.0, min(6000.0, radio_m))

    def mover_zona(self, swarm_id: str, lat: float, lon: float) -> None:
        """Reubica la zona asignada conservando su radio (sin evento; para arrastrar)."""
        sw = self.swarms.get(swarm_id)
        if sw and sw.zona:
            sw.zona.lat = lat
            sw.zona.lon = lon

    def set_modo(self, swarm_id: str, mode: SwarmMode) -> None:
        sw = self.swarms.get(swarm_id)
        if not sw:
            return
        sw.mode = mode
        for d in self.miembros(swarm_id):
            d.mode = mode
        self._evento("modo", f"{sw.nombre} cambia a modo {mode.value}.")

    def set_modo_dron(self, drone_id: str, mode: SwarmMode) -> None:
        d = self.drones.get(drone_id)
        if d:
            d.mode = mode
            self._evento("modo", f"{d.id} configurado en modo {mode.value}.")

    def dividir_enjambre(
        self,
        swarm_id: str,
        partes: int = 2,
        zonas: list[dict] | None = None,
    ) -> list[Swarm]:
        miembros = self.miembros(swarm_id)
        sw = self.swarms.get(swarm_id)
        if not sw or len(miembros) < partes or partes < 2:
            return []

        grupos: list[list[Drone]] = [[] for _ in range(partes)]
        for i, d in enumerate(miembros):
            grupos[i % partes].append(d)

        nuevos: list[Swarm] = [sw]
        for k in range(1, partes):
            nid = self._cont_swarm.siguiente("ENJ")
            color = self._paleta[(self._cont_swarm.n - 1) % len(self._paleta)]
            # cada sub-enjambre recibe su PROPIA copia de la zona (no compartir
            # el objeto, o ajustar el radio de uno afectaria a los demas)
            zona_copia = (
                Zone(lat=sw.zona.lat, lon=sw.zona.lon, radio_m=sw.zona.radio_m)
                if sw.zona else None
            )
            sub = Swarm(
                id=nid, nombre=f"{sw.nombre}.{k+1}",
                mode=sw.mode, zona=zona_copia, color=color,
            )
            self.swarms[nid] = sub
            for d in grupos[k]:
                d.swarm_id = nid
            nuevos.append(sub)

        if zonas:
            for sub, z in zip(nuevos, zonas):
                sub.zona = Zone(lat=z["lat"], lon=z["lon"], radio_m=z.get("radio_m", 1500.0))

        self._evento("division", f"{sw.nombre} se divide en {partes} sub-enjambres.", nivel="warn")
        return nuevos

    def unir_enjambres(self, ids: list[str]) -> Swarm | None:
        """Une varios enjambres en uno solo (inverso de dividir). Los miembros pasan
        al primer enjambre de la lista; el resto se elimina."""
        ids = [i for i in ids if i in self.swarms]
        if len(ids) < 2:
            return None
        destino = self.swarms[ids[0]]
        for oid in ids[1:]:
            for d in self.drones.values():
                if d.swarm_id == oid:
                    d.swarm_id = destino.id
                    d.mode = destino.mode   # adoptan el modo del enjambre destino
            del self.swarms[oid]
        self._evento("union", f"{len(ids)} enjambres unidos en {destino.nombre}.", nivel="warn")
        return destino

    # ------------------------------------------------------------------
    # Inyeccion de fallos (Objetivo 3: resiliencia)
    # ------------------------------------------------------------------
    def eliminar_nodo(self, drone_id: str) -> None:
        d = self.drones.get(drone_id)
        if d and d.status != DroneStatus.PERDIDO:
            d.status = DroneStatus.PERDIDO
            self._evento("fallo", f"Nodo {drone_id} eliminado. El enjambre se reorganiza.", nivel="error")

    def crear_jammer(self, lat: float, lon: float, radio_m: float = 1200.0) -> Jammer:
        jid = self._cont_jam.siguiente("JAM")
        jam = Jammer(id=jid, lat=lat, lon=lon, radio_m=radio_m)
        self.jammers[jid] = jam
        self._evento(
            "fallo",
            f"Interferencia {jid} detectada en {lat:.5f}, {lon:.5f} (radio {round(radio_m)} m).",
            nivel="error",
        )
        return jam

    def reporte_interferencia(self) -> dict:
        """Reporte de las zonas de interferencia detectadas y su impacto actual."""
        zonas = []
        for jam in self.jammers.values():
            afectados = [
                d.id for d in self.drones.values()
                if d.status != DroneStatus.PERDIDO
                and distancia_metros(d.lat, d.lon, jam.lat, jam.lon) <= jam.radio_m
            ]
            enjambres = sorted({
                self.swarms[d.swarm_id].nombre
                for d in self.drones.values()
                if d.swarm_id in self.swarms
                and distancia_metros(d.lat, d.lon, jam.lat, jam.lon) <= jam.radio_m + jam.radio_m
            })
            zonas.append({
                "id": jam.id,
                "lat": round(jam.lat, 6),
                "lon": round(jam.lon, 6),
                "radio_m": round(jam.radio_m, 1),
                "drones_afectados": len(afectados),
                "enjambres_cercanos": enjambres,
            })
        return {
            "t_simulacion_s": round(self.tiempo, 1),
            "n_zonas": len(zonas),
            "zonas": zonas,
        }

    def quitar_jammer(self, jammer_id: str) -> None:
        if jammer_id in self.jammers:
            del self.jammers[jammer_id]
            self._evento("fallo", f"Zona de interferencia {jammer_id} desactivada.")

    def actualizar_jammer(
        self, jammer_id: str,
        lat: float | None = None, lon: float | None = None,
        radio_m: float | None = None,
    ) -> None:
        """Mueve y/o redimensiona una zona de interferencia existente."""
        j = self.jammers.get(jammer_id)
        if not j:
            return
        if lat is not None:
            j.lat = lat
        if lon is not None:
            j.lon = lon
        if radio_m is not None:
            j.radio_m = max(200.0, min(6000.0, radio_m))

    def _en_interferencia(self, d: Drone) -> bool:
        for jam in self.jammers.values():
            if distancia_metros(d.lat, d.lon, jam.lat, jam.lon) <= jam.radio_m:
                return True
        return False

    # ------------------------------------------------------------------
    # Avance de la simulacion
    # ------------------------------------------------------------------
    def step(self) -> None:
        total_dt = DT * self.factor  # tiempo efectivo total de este paso
        self.tiempo += total_dt
        activos = [d for d in self.drones.values() if d.status != DroneStatus.PERDIDO]

        # 1) estado de enlace (mesh) e interferencia
        for d in activos:
            if self._en_interferencia(d):
                d.status = DroneStatus.DEGRADADO
                d.senal = max(0.0, d.senal - 8.0)
            else:
                d.status = DroneStatus.ACTIVO
                d.senal = min(100.0, d.senal + 6.0)

        self._calcular_mesh(activos)
        self._actualizar_cobertura(activos)   # marca las celdas pisadas este paso

        # agrupar miembros por enjambre (una sola vez)
        grupos: dict[str, list[Drone]] = {}
        for d in activos:
            grupos.setdefault(d.swarm_id, []).append(d)

        # 2) mover con SUB-PASOS: a alta velocidad (x16/x32) se divide el paso en
        #    tramos pequenos para que el vuelo siga siendo estable y no oscile.
        n_sub = max(1, math.ceil(self.factor / 4))
        dt = total_dt / n_sub
        for _ in range(n_sub):
            for sid, ms in grupos.items():
                sw = self.swarms.get(sid)
                if sw and ms:
                    self._mover_enjambre(sw, ms, dt)

        # 3) telemetria: bateria (usa el tiempo total del paso)
        for d in activos:
            sw = self.swarms.get(d.swarm_id)
            sin_mision = sw is None or sw.zona is None
            cerca_base = distancia_metros(
                d.lat, d.lon, self.base.lat, self.base.lon
            ) <= self.base.radio_m * 1.4
            if sin_mision and cerca_base:
                if d.bateria < 100.0:
                    if not d.cargando:               # alerta al EMPEZAR a recargar
                        d.cargando = True
                        self._evento("bateria",
                                     f"Dron {d.id} recargando en base ({round(d.bateria)}%).")
                    d.bateria = min(100.0, d.bateria + RECARGA_BATERIA * total_dt)
                    if d.bateria >= 100.0:
                        d.cargando = False
                else:
                    d.cargando = False
            else:
                d.cargando = False
                d.bateria = max(0.0, d.bateria - DESCARGA_BATERIA * total_dt)

        # 4) autonomia: ciclo de bateria
        #    - en mision con bateria baja  -> guarda la zona y vuelve a la base
        #    - en base ya recargado        -> retoma automaticamente su mision
        for sw in self.swarms.values():
            ms = grupos.get(sw.id, [])
            if not ms:
                continue
            bat_min = min(d.bateria for d in ms)
            # ya salio de la base? (evita que el RTB se dispare al re-desplegar)
            lejos_de_base = any(
                distancia_metros(d.lat, d.lon, self.base.lat, self.base.lon) > self.base.radio_m * 1.6
                for d in ms
            )
            if sw.zona is not None and bat_min < UMBRAL_RTB and lejos_de_base:
                sw.mision_pendiente = sw.zona      # recuerda el objetivo
                sw.zona = None                      # regresa a la base
                self._evento(
                    "autonomia",
                    f"⚠ {sw.nombre}: batería baja ({round(bat_min)}%), regresando a la base.",
                    nivel="warn",
                )
            elif sw.zona is None and sw.mision_pendiente is not None and bat_min >= UMBRAL_RECARGADO:
                sw.zona = sw.mision_pendiente        # retoma el objetivo
                sw.mision_pendiente = None
                self._evento(
                    "autonomia",
                    f"{sw.nombre}: batería recargada, retornando al objetivo.",
                    nivel="info",
                )

        # 5) historial: muestra periodica de metricas (cada MUESTREO_HISTORIAL_S)
        if self.tiempo - self._ultima_muestra >= MUESTREO_HISTORIAL_S:
            self._ultima_muestra = self.tiempo
            self._muestrear_historial()

    def _muestrear_historial(self) -> None:
        """Guarda una fila de la serie temporal de metricas (cada MUESTREO_HISTORIAL_S).
        Las claves coinciden con las columnas del CSV/JSON exportado."""
        total = len(self.drones)
        activos = [d for d in self.drones.values() if d.status != DroneStatus.PERDIDO]
        operativos = [d for d in activos if d.status == DroneStatus.ACTIVO]
        degradados = [d for d in activos if d.status == DroneStatus.DEGRADADO]
        pct = round(100.0 * len(operativos) / total, 1) if total else 0.0
        conect, n_part = self._calcular_particiones(activos)
        consenso = self._calcular_consenso()
        cob_pct, celdas = self._calcular_cobertura_pct()
        self.historial.append({
            "tiempo_s": round(self.tiempo, 1),
            "drones_totales": total,
            "operativos": len(operativos),
            "degradados": len(degradados),
            "perdidos": total - len(activos),
            "pct_operativo": pct,
            "conectividad_pct": conect,
            "n_particiones": n_part,
            "consenso_pct": consenso,
            "cobertura_pct": cob_pct,
            "celdas_cubiertas": celdas,
            "n_enjambres": len(self.swarms),
            "n_jammers": len(self.jammers),
        })
        self.historial = self.historial[-2000:]

    # ------------------------------------------------------------------
    # Metricas de control descentralizado (resiliencia / consenso / eficacia)
    # ------------------------------------------------------------------
    def _calcular_particiones(self, activos: list[Drone]) -> tuple[float, int]:
        """Sobre la malla (vecinos), con union-find: devuelve
        (conectividad % = drones en el mayor componente conectado, n_particiones).
        100% y 1 particion = toda la flota se comunica; valores menores = la red
        se fragmento (drones aislados o subgrupos sin enlace)."""
        n = len(activos)
        if n == 0:
            return 0.0, 0
        padre = {d.id: d.id for d in activos}

        def find(x: str) -> str:
            while padre[x] != x:
                padre[x] = padre[padre[x]]
                x = padre[x]
            return x

        for d in activos:
            for vid in d.vecinos:
                if vid in padre:
                    ra, rb = find(d.id), find(vid)
                    if ra != rb:
                        padre[ra] = rb

        tam: dict[str, int] = {}
        for d in activos:
            r = find(d.id)
            tam[r] = tam.get(r, 0) + 1
        mayor = max(tam.values())
        return round(100.0 * mayor / n, 1), len(tam)

    def _calcular_consenso(self) -> float:
        """Consenso de rumbos: coherencia circular media de los headings por enjambre
        (0..100%). 100% = todos los drones del enjambre apuntan al mismo rumbo
        (consenso logrado sin lider); valores bajos = rumbos dispersos. Promedio
        sobre los enjambres con 2+ unidades."""
        coherencias: list[float] = []
        for sw in self.swarms.values():
            ms = [d for d in self.miembros(sw.id) if d.status != DroneStatus.PERDIDO]
            if len(ms) < 2:
                continue
            sx = sum(math.cos(math.radians(d.heading)) for d in ms)
            sy = sum(math.sin(math.radians(d.heading)) for d in ms)
            coherencias.append(math.hypot(sx, sy) / len(ms))
        if not coherencias:
            return 0.0
        return round(100.0 * sum(coherencias) / len(coherencias), 1)

    def _celda(self, lat: float, lon: float) -> tuple[int, int]:
        """Indice (i, j) de la celda de la grilla de cobertura para una posicion."""
        e, n = offset_metros(self.base.lat, self.base.lon, lat, lon)
        return (math.floor(e / CELDA_COBERTURA_M), math.floor(n / CELDA_COBERTURA_M))

    def _actualizar_cobertura(self, activos: list[Drone]) -> None:
        """Marca como visitadas las celdas donde hay drones en este paso."""
        for d in activos:
            self.cobertura.add(self._celda(d.lat, d.lon))

    def _calcular_cobertura_pct(self) -> tuple[float, int]:
        """Eficacia de barrido: de las celdas que caen DENTRO de las zonas asignadas,
        que porcentaje ya fue visitado al menos una vez. Devuelve (%, celdas_visitadas
        dentro de las zonas). Sin zonas asignadas devuelve (0, 0)."""
        objetivo: set[tuple[int, int]] = set()
        for sw in self.swarms.values():
            z = sw.zona
            if z is None:
                continue
            ce, cn = offset_metros(self.base.lat, self.base.lon, z.lat, z.lon)
            ci, cj = math.floor(ce / CELDA_COBERTURA_M), math.floor(cn / CELDA_COBERTURA_M)
            rad = math.ceil(z.radio_m / CELDA_COBERTURA_M)
            r2 = (z.radio_m / CELDA_COBERTURA_M) ** 2
            for i in range(ci - rad, ci + rad + 1):
                for j in range(cj - rad, cj + rad + 1):
                    if (i - ci) ** 2 + (j - cj) ** 2 <= r2:
                        objetivo.add((i, j))
        if not objetivo:
            return 0.0, 0
        cubiertas = objetivo & self.cobertura
        return round(100.0 * len(cubiertas) / len(objetivo), 1), len(cubiertas)

    def _calcular_mesh(self, activos: list[Drone]) -> None:
        """Red mesh GLOBAL: cualquier dron en rango se enlaza, sin importar el
        enjambre (modela una red mallada real entre grupos)."""
        for d in activos:
            d.vecinos = []
        for i, a in enumerate(activos):
            if a.status == DroneStatus.DEGRADADO:
                continue
            for b in activos[i + 1:]:
                if b.status == DroneStatus.DEGRADADO:
                    continue
                if distancia_metros(a.lat, a.lon, b.lat, b.lon) <= RANGO_COMUNICACION_M:
                    a.vecinos.append(b.id)
                    b.vecinos.append(a.id)

    def _mover_enjambre(self, sw: Swarm, miembros: list[Drone], dt: float) -> None:
        """Mueve el enjambre con direccion de Reynolds (steering behaviors)."""
        objetivo = sw.zona if sw.zona else self.base
        en_base = sw.zona is None   # sin mision: estacionado en la base
        idx_de = {m.id: i for i, m in enumerate(miembros)}  # posicion de cada dron
        for d in miembros:
            vmax = VEL_MAX * (0.4 if d.status == DroneStatus.DEGRADADO else 1.0)
            w = self._pesos_modo(d.mode)

            # un dron que se alejo demasiado del objetivo deja de "hacer bandada"
            # y solo regresa (asi dos unidades aisladas no se arrastran entre si)
            dist_obj = distancia_metros(d.lat, d.lon, objetivo.lat, objetivo.lon)
            en_formacion = dist_obj <= objetivo.radio_m + CORREA_EXTRA_M

            # acumular vecindario (separacion con todos; alineacion/cohesion LOCAL del propio enjambre)
            sep_x = sep_y = ali_x = ali_y = coh_x = coh_y = 0.0
            n_flock = 0
            for vid in d.vecinos:
                v = self.drones.get(vid)
                if not v:
                    continue
                ex, ey = offset_metros(d.lat, d.lon, v.lat, v.lon)  # dron -> vecino
                dist = math.hypot(ex, ey) or 1.0
                if dist < DIST_SEPARACION:
                    sep_x -= ex / dist
                    sep_y -= ey / dist
                # alineacion/cohesion solo dentro del propio enjambre; en HIBRIDO,
                # ademas solo con el MISMO anillo (misma paridad de indice), para que
                # el anillo exterior (barrido) y el interior (defensa estatica) no se
                # arrastren entre si y la formacion no se desestabilice ("cizalla").
                if v.swarm_id == d.swarm_id:
                    if d.mode == SwarmMode.HIBRIDO and \
                            idx_de.get(v.id, 0) % 2 != idx_de.get(d.id, 0) % 2:
                        continue
                    ali_x += v.vx
                    ali_y += v.vy
                    coh_x += ex
                    coh_y += ey
                    n_flock += 1

            ax = ay = 0.0
            if sep_x or sep_y:                              # separacion (siempre)
                sx, sy = self._steer(sep_x, sep_y, d.vx, d.vy, vmax)
                ax += sx * w["sep"]; ay += sy * w["sep"]
            # alineacion/cohesion solo en mision (estacionados no "hacen bandada")
            if n_flock and en_formacion and not en_base:
                sx, sy = self._steer(ali_x, ali_y, d.vx, d.vy, vmax)
                ax += sx * w["ali"]; ay += sy * w["ali"]
                sx, sy = self._seek(coh_x / n_flock, coh_y / n_flock, d.vx, d.vy, vmax)
                ax += sx * w["coh"]; ay += sy * w["coh"]

            # objetivo: en mision -> anillo del modo; en base -> plaza de estacionamiento fija
            if en_base:
                ox, oy = self._objetivo_base(d, miembros)
            else:
                ox, oy = self._objetivo_modo(d, objetivo, miembros)
            sx, sy = self._seek(ox, oy, d.vx, d.vy, vmax, llegada=True)
            ax += sx * w["obj"]; ay += sy * w["obj"]

            # evasion de interferencia (prioridad alta: nunca entrar al rojo)
            ev_x = ev_y = 0.0
            for jam in self.jammers.values():
                jx, jy = offset_metros(d.lat, d.lon, jam.lat, jam.lon)
                dj = math.hypot(jx, jy) or 1.0
                limite = jam.radio_m + MARGEN_EVASION_M
                if dj < limite:
                    f = (limite - dj) / limite
                    ev_x -= jx / dj * f
                    ev_y -= jy / dj * f
            if ev_x or ev_y:
                sx, sy = self._steer(ev_x, ev_y, d.vx, d.vy, vmax)
                ax += sx * PESO_EVASION; ay += sy * PESO_EVASION

            # integrar: la fuerza ya es (vel_deseada - vel_actual), no hace falta amortiguar
            d.vx += ax * dt
            d.vy += ay * dt
            sp = math.hypot(d.vx, d.vy)
            if sp > vmax:
                d.vx = d.vx / sp * vmax
                d.vy = d.vy / sp * vmax

            d.lat, d.lon = aplicar_offset(d.lat, d.lon, d.vx * dt, d.vy * dt)
            d.speed = math.hypot(d.vx, d.vy)
            # centinela (mira hacia afuera): toda DEFENSA y el anillo interior estatico
            # del HIBRIDO (indice impar), que se queda fijo sosteniendo el nucleo.
            es_centinela = d.mode == SwarmMode.DEFENSA or (
                d.mode == SwarmMode.HIBRIDO and idx_de.get(d.id, 0) % 2 == 1)
            if es_centinela and sw.zona is not None:
                # centinela: mira hacia afuera (del centro de la zona hacia el dron)
                oe, on = offset_metros(sw.zona.lat, sw.zona.lon, d.lat, d.lon)
                if math.hypot(oe, on) > 1.0:
                    d.heading = math.degrees(math.atan2(oe, on)) % 360.0
            elif d.speed > 0.1:
                d.heading = math.degrees(math.atan2(d.vx, d.vy)) % 360.0

    @staticmethod
    def _steer(dx: float, dy: float, vx: float, vy: float, vmax: float) -> tuple[float, float]:
        """Fuerza de direccion de Reynolds hacia una direccion deseada (dx,dy)."""
        dl = math.hypot(dx, dy)
        if dl < 1e-9:
            return 0.0, 0.0
        sx = dx / dl * vmax - vx
        sy = dy / dl * vmax - vy
        sl = math.hypot(sx, sy)
        if sl > MAX_FUERZA:
            sx = sx / sl * MAX_FUERZA
            sy = sy / sl * MAX_FUERZA
        return sx, sy

    @staticmethod
    def _seek(tx: float, ty: float, vx: float, vy: float, vmax: float,
              llegada: bool = False) -> tuple[float, float]:
        """Busca un punto objetivo (tx,ty relativo al dron); con 'llegada' frena al acercarse."""
        dist = math.hypot(tx, ty)
        if dist < 1e-6:
            return 0.0, 0.0
        velocidad = vmax
        if llegada and dist < RADIO_LLEGADA:
            velocidad = vmax * (dist / RADIO_LLEGADA)   # frenado suave (arrival)
        dvx = tx / dist * velocidad
        dvy = ty / dist * velocidad
        sx = dvx - vx
        sy = dvy - vy
        sl = math.hypot(sx, sy)
        if sl > MAX_FUERZA:
            sx = sx / sl * MAX_FUERZA
            sy = sy / sl * MAX_FUERZA
        return sx, sy

    def _objetivo_base(self, d: Drone, miembros: list[Drone]) -> tuple[float, float]:
        """Plaza de estacionamiento FIJA en la base: cada dron a su slot, y se detiene."""
        n = max(1, len(miembros))
        idx = miembros.index(d) if d in miembros else 0
        ang = 2 * math.pi * idx / n
        r = self.base.radio_m * 0.6
        este, norte = offset_metros(d.lat, d.lon, self.base.lat, self.base.lon)  # dron -> base
        return este + math.cos(ang) * r, norte + math.sin(ang) * r

    def _objetivo_modo(self, d: Drone, zona: Zone, miembros: list[Drone]) -> tuple[float, float]:
        """
        Devuelve el PUNTO objetivo (este, norte en metros, relativo al dron) segun su
        modo. Cada dron toma una posicion angular DISTINTA en el anillo (idx/N) para
        repartirse equitativamente; si el punto cae en interferencia, se proyecta al borde.
        """
        este, norte = offset_metros(d.lat, d.lon, zona.lat, zona.lon)  # vector dron -> centro
        n = max(1, len(miembros))
        idx = miembros.index(d) if d in miembros else 0
        ang_base = 2 * math.pi * idx / n  # reparto equitativo

        if d.mode == SwarmMode.DEFENSA:
            # DEFENSA: anillo cerrado en el BORDE, estatico (proteger un punto).
            # Los drones quedan fijos en el perimetro mirando hacia afuera (centinelas).
            r = zona.radio_m * 0.9
            ang = ang_base
        elif d.mode == SwarmMode.PATRULLAJE:
            # PATRULLAJE: cubrir TODA el area. Cada dron toma un RADIO distinto
            # (del centro al borde) y el conjunto ROTA -> barrido del disco completo.
            frac = idx / (n - 1) if n > 1 else 0.5
            r = zona.radio_m * (0.32 + 0.62 * frac)
            omega = min(OMEGA_PATRULLA, 0.5 * VEL_CRUCERO / (zona.radio_m * 0.95))
            ang = ang_base + omega * self.tiempo
        else:  # HIBRIDO = dos anillos concentricos: exterior patrulla, interior defiende.
            # Con cohesion baja (ver _pesos_modo) el objetivo domina, asi que cada anillo
            # se mantiene firme en su radio (como DEFENSA) en vez de colapsar al centro.
            if idx % 2 == 0:
                # EXTERIOR: barrido rotatorio que cubre el perimetro.
                r = zona.radio_m * 0.9
                omega = min(OMEGA_PATRULLA, 0.5 * VEL_CRUCERO / (zona.radio_m * 0.9))
                ang = ang_base + omega * self.tiempo
            else:
                # INTERIOR: anillo defensivo ESTATICO que sostiene el nucleo.
                r = zona.radio_m * 0.5
                ang = ang_base

        # punto objetivo sobre el anillo, relativo al dron = (dron->centro) + (centro->punto)
        objetivo_e = este + math.cos(ang) * r
        objetivo_n = norte + math.sin(ang) * r

        # Si el punto objetivo cae dentro de una zona de interferencia, se PROYECTA
        # al borde seguro (mismo rumbo desde el jammer, a rsafe). Asi el dron va al
        # borde rojo en lugar de adentro, y como cada dron tiene su propio angulo,
        # el enjambre se reparte de forma uniforme alrededor de la interferencia.
        for jam in self.jammers.values():
            jx, jy = offset_metros(d.lat, d.lon, jam.lat, jam.lon)  # dron -> jammer
            tx, ty = objetivo_e - jx, objetivo_n - jy              # jammer -> punto objetivo
            dtj = math.hypot(tx, ty) or 1.0
            rsafe = jam.radio_m + MARGEN_CORDON
            if dtj < rsafe:
                k = rsafe / dtj
                objetivo_e = jx + tx * k
                objetivo_n = jy + ty * k

        return objetivo_e, objetivo_n   # PUNTO objetivo relativo al dron (sin normalizar)

    @staticmethod
    def _pesos_modo(mode: SwarmMode) -> dict[str, float]:
        # prioridades relativas (cada fuerza ya viene limitada por MAX_FUERZA)
        if mode == SwarmMode.DEFENSA:
            return {"sep": 1.6, "ali": 0.6, "coh": 1.0, "obj": 1.5}
        if mode == SwarmMode.PATRULLAJE:
            return {"sep": 1.5, "ali": 1.0, "coh": 0.7, "obj": 1.2}
        # HIBRIDO: cohesion BAJA y objetivo fuerte para que los dos anillos no se
        # fundan ni colapsen al centro (mantienen radios firmes, como DEFENSA).
        return {"sep": 1.6, "ali": 0.6, "coh": 0.3, "obj": 1.7}

    # ------------------------------------------------------------------
    # Serializacion del estado para el frontend
    # ------------------------------------------------------------------
    def snapshot(self) -> dict:
        drones = [d.to_dict() for d in self.drones.values()]
        swarms = [s.to_dict(len(self.miembros(s.id))) for s in self.swarms.values()]
        activos = [d for d in self.drones.values() if d.status != DroneStatus.PERDIDO]
        operativos = [d for d in activos if d.status == DroneStatus.ACTIVO]
        degradados = [d for d in activos if d.status == DroneStatus.DEGRADADO]
        total = len(self.drones)
        pct = round(100.0 * len(operativos) / total, 1) if total else 0.0
        conect, n_part = self._calcular_particiones(activos)
        consenso = self._calcular_consenso()
        cob_pct, celdas = self._calcular_cobertura_pct()
        return {
            "drones": drones,
            "swarms": swarms,
            "jammers": [j.to_dict() for j in self.jammers.values()],
            "base": self.base.to_dict(),
            "eventos": self.eventos[-20:],
            "config": {"factor": self.factor, "pausado": self.pausado,
                       "escenario": self.escenario_actual},
            "metricas": {
                "total": total,
                "activos": len(activos),
                "operativos": len(operativos),
                "degradados": len(degradados),
                "perdidos": total - len(activos),
                "pct_operativo": pct,
                "conectividad_pct": conect,
                "n_particiones": n_part,
                "consenso_pct": consenso,
                "cobertura_pct": cob_pct,
                "celdas_cubiertas": celdas,
                "n_enjambres": len(self.swarms),
                "n_muestras": len(self.historial),
            },
        }
