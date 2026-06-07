"""
Motor de simulacion de SIMCED.

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
    METROS_POR_GRADO_LAT,
    Drone,
    DroneStatus,
    Jammer,
    Swarm,
    SwarmMode,
    Zone,
    aplicar_offset,
    distancia_metros,
    metros_por_grado_lon,
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
RADIO_BASE_M = 450.0             # radio de merodeo alrededor de la base
OMEGA_PATRULLA = 0.12            # velocidad angular del barrido (rad/s)

# Cobertura y resiliencia (objetivos de monitoreo / resiliencia de la tesis)
GRID_COBERTURA_GRADOS = 0.001    # ~110 m: tamano de celda de la rejilla de cobertura
UMBRAL_RECUPERACION = 0.92       # fraccion de conectividad previa que marca "reorganizado"
MUESTREO_HISTORIAL_S = 1.0       # cada cuantos seg de simulacion se guarda una muestra
MAX_HISTORIAL = 20000            # tope de muestras en memoria


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
        self.base = Zone(lat=10.344, lon=-67.041, radio_m=RADIO_BASE_M)
        self.factor = 1.0  # factor de tiempo (1x..8x)
        self.tiempo = 0.0  # tiempo de simulacion acumulado (s), para el barrido
        self.pausado = False
        # --- monitoreo / resiliencia ---
        self.cobertura: dict[tuple[int, int], int] = {}  # celda -> nº de visitas
        self.historial: list[dict] = []   # series temporales para exportar (M3)
        self.n_particiones = 1             # islas en el mesh (R2)
        self.conectividad = 1.0            # frac. del enjambre en el componente mayor
        self.coherencia = 1.0              # consenso: coherencia circular de rumbo (R=0..1)
        self.cobertura_pct = 0.0           # % de las zonas asignadas ya visitado (M2)
        self.n_disrupciones = 0            # eventos disruptivos acumulados (R1)
        self.t_recuperacion: float | None = None  # ultima recuperacion medida (s)
        self._t_disrupcion: float | None = None    # instante del ultimo evento disruptivo
        self._conect_previa: float | None = None    # conectividad antes de la disrupcion
        self._cayo = False                          # la conectividad llego a caer de verdad
        self._ultimo_muestreo = 0.0
        # generador propio sembrable -> corridas reproducibles (escenarios de tesis)
        self.semilla: int | None = None
        self._rng = random.Random()
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
        self.factor = max(0.5, min(8.0, factor))
        self._evento("config", f"Velocidad de simulacion: {self.factor:g}x.")

    def set_pausa(self, pausado: bool) -> None:
        self.pausado = pausado
        self._evento("config", "Simulacion en pausa." if pausado else "Simulacion reanudada.")

    def _limpiar(self) -> None:
        """Vacia todo el estado de la simulacion (sin crear nada)."""
        self.drones.clear()
        self.swarms.clear()
        self.jammers.clear()
        self.eventos.clear()
        self.base = Zone(lat=10.344, lon=-67.041, radio_m=RADIO_BASE_M)
        self.factor = 1.0
        self.tiempo = 0.0
        self.pausado = False
        self.cobertura.clear()
        self.historial.clear()
        self.n_particiones = 1
        self.conectividad = 1.0
        self.coherencia = 1.0
        self.cobertura_pct = 0.0
        self.n_disrupciones = 0
        self.t_recuperacion = None
        self._t_disrupcion = None
        self._conect_previa = None
        self._cayo = False
        self._ultimo_muestreo = 0.0
        self._cont_drone = _Contador()
        self._cont_swarm = _Contador()
        self._cont_jam = _Contador()
        self._cont_evt = _Contador()

    def _sembrar(self, semilla: int | None) -> None:
        """Fija la semilla del generador. Con la misma semilla + escenario, la
        corrida es bit a bit reproducible (posiciones, rumbos)."""
        self.semilla = semilla
        self._rng = random.Random(semilla)

    def reset(self, semilla: int | None = None) -> None:
        """Reinicia toda la simulacion al estado inicial (enjambre demo en la base).
        Si se da una semilla, el despliegue es reproducible."""
        self._limpiar()
        self._sembrar(semilla)
        self.crear_enjambre(count=8, mode=SwarmMode.PATRULLAJE)
        self._evento("config", "Simulacion reiniciada.")

    # ------------------------------------------------------------------
    # Escenarios precargados (S3): corridas reproducibles para demo / tesis
    # ------------------------------------------------------------------
    def cargar_escenario(self, spec: dict) -> None:
        """Reconstruye la simulacion desde un escenario declarativo (S3)."""
        self._limpiar()
        # semilla del escenario -> corrida reproducible para la demo/tesis
        self._sembrar(spec.get("seed"))
        b = spec.get("base")
        if b:
            self.base = Zone(lat=b["lat"], lon=b["lon"], radio_m=b.get("radio_m", RADIO_BASE_M))
        self.factor = max(0.5, min(8.0, float(spec.get("factor", 1.0))))

        for e in spec.get("enjambres", []):
            modo = SwarmMode(e.get("mode", "patrullaje"))
            sw = self.crear_enjambre(
                count=int(e.get("count", 6)),
                lat=e.get("lat"), lon=e.get("lon"),
                mode=modo, nombre=e.get("nombre"),
            )
            z = e.get("zona")
            if z:
                sw.zona = Zone(lat=z["lat"], lon=z["lon"], radio_m=z.get("radio_m", 1500.0))

        for j in spec.get("jammers", []):
            jid = self._cont_jam.siguiente("JAM")
            self.jammers[jid] = Jammer(
                id=jid, lat=j["lat"], lon=j["lon"], radio_m=j.get("radio_m", 1200.0)
            )

        # si el escenario arranca con interferencia, se cuenta como disrupcion:
        # asi al retirar el jammer se mide el tiempo de recuperacion (R1)
        if self.jammers:
            self._marcar_disrupcion()

        self._evento("escenario", f"Escenario cargado: {spec.get('nombre', 'sin nombre')}.", nivel="warn")

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
                ox, oy, self._rng.uniform(-120, 120), self._rng.uniform(-120, 120)
            )
            self.drones[did] = Drone(
                id=did, swarm_id=sid, lat=d_lat, lon=d_lon,
                heading=self._rng.uniform(0, 360), speed=VEL_CRUCERO, mode=mode,
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
        sw.zona = Zone(lat=lat, lon=lon, radio_m=radio_m)
        self._evento("mision", f"{sw.nombre} recibe orden de supervisar nueva zona.")

    def retornar_base(self, swarm_id: str) -> None:
        """Ordena al enjambre regresar a la base (quita la zona; vuelve a merodearla)."""
        sw = self.swarms.get(swarm_id)
        if sw:
            sw.zona = None
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

    # ------------------------------------------------------------------
    # Inyeccion de fallos (Objetivo 3: resiliencia)
    # ------------------------------------------------------------------
    def eliminar_nodo(self, drone_id: str) -> None:
        d = self.drones.get(drone_id)
        if d and d.status != DroneStatus.PERDIDO:
            self._marcar_disrupcion()
            d.status = DroneStatus.PERDIDO
            self._evento("fallo", f"Nodo {drone_id} eliminado. El enjambre se reorganiza.", nivel="error")

    def crear_jammer(self, lat: float, lon: float, radio_m: float = 1200.0) -> Jammer:
        self._marcar_disrupcion()
        jid = self._cont_jam.siguiente("JAM")
        jam = Jammer(id=jid, lat=lat, lon=lon, radio_m=radio_m)
        self.jammers[jid] = jam
        self._evento("fallo", f"Zona de interferencia {jid} activada.", nivel="error")
        return jam

    def _marcar_disrupcion(self) -> None:
        """Registra un evento disruptivo y guarda la conectividad previa para
        medir luego el tiempo de recuperacion (R1)."""
        self._t_disrupcion = self.tiempo
        self._conect_previa = self.conectividad
        self._cayo = False
        self.n_disrupciones += 1

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
        dt = DT * self.factor  # tiempo efectivo (acelera la simulacion)
        self.tiempo += dt
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
        self._calcular_particiones(activos)  # R2: islas / conectividad

        # 2) mover cada enjambre segun su modo
        for sw in self.swarms.values():
            miembros = [d for d in activos if d.swarm_id == sw.id]
            if miembros:
                self._mover_enjambre(sw, miembros, dt)

        self._calcular_consenso(activos)     # consenso: coherencia de rumbo
        self._registrar_cobertura(activos)   # M2: rejilla de cobertura

        # 3) telemetria: bateria (se recarga en la base sin mision; si no, descarga)
        for d in activos:
            sw = self.swarms.get(d.swarm_id)
            sin_mision = sw is None or sw.zona is None
            cerca_base = distancia_metros(
                d.lat, d.lon, self.base.lat, self.base.lon
            ) <= self.base.radio_m * 1.4
            if sin_mision and cerca_base:
                d.bateria = min(100.0, d.bateria + RECARGA_BATERIA * dt)
            else:
                d.bateria = max(0.0, d.bateria - DESCARGA_BATERIA * dt)

        # 4) autonomia: retorno automatico a la base por bateria baja
        for sw in self.swarms.values():
            if sw.zona is None:
                continue
            ms = [d for d in activos if d.swarm_id == sw.id]
            if ms and min(d.bateria for d in ms) < UMBRAL_RTB:
                sw.zona = None
                self._evento(
                    "autonomia",
                    f"{sw.nombre}: bateria baja, retorno automatico a la base.",
                    nivel="warn",
                )

        # 5) monitoreo / resiliencia: recuperacion y muestreo de metricas
        self._evaluar_recuperacion()  # R1
        self._muestrear_historial()   # M3

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

    def _calcular_particiones(self, activos: list[Drone]) -> None:
        """Componentes conexas del mesh (union-find). Reporta el nº de islas y la
        conectividad = fraccion de drones en el componente mayor. Un dron en zona
        de interferencia (DEGRADADO) no tiene enlaces -> queda aislado, lo que
        modela la perdida de cobertura de red (R2)."""
        if not activos:
            self.n_particiones = 0
            self.conectividad = 1.0
            return
        padre = {d.id: d.id for d in activos}

        def raiz(x: str) -> str:
            while padre[x] != x:
                padre[x] = padre[padre[x]]
                x = padre[x]
            return x

        for d in activos:
            for vid in d.vecinos:
                if vid in padre:
                    ra, rb = raiz(d.id), raiz(vid)
                    if ra != rb:
                        padre[ra] = rb

        tam: dict[str, int] = {}
        for d in activos:
            r = raiz(d.id)
            tam[r] = tam.get(r, 0) + 1
        self.n_particiones = len(tam)
        self.conectividad = max(tam.values()) / len(activos)

    def _calcular_consenso(self, activos: list[Drone]) -> None:
        """Consenso de rumbo descentralizado: coherencia circular R por enjambre,
        promediada. R = |media(e^{i·rumbo})| en [0,1]; 1 = todos alineados, 0 =
        rumbos dispersos. Mide cuanto converge la alineacion del enjambre (Boids +
        consenso promedio sobre vecinos) sin nodo central -> objetivo de tesis."""
        por_sw: dict[str, list[Drone]] = {}
        for d in activos:
            por_sw.setdefault(d.swarm_id, []).append(d)
        if not por_sw:
            self.coherencia = 1.0
            return
        cohs: list[float] = []
        for ms in por_sw.values():
            if len(ms) < 2:
                cohs.append(1.0)
                continue
            sx = sum(math.cos(math.radians(d.heading)) for d in ms)
            sy = sum(math.sin(math.radians(d.heading)) for d in ms)
            cohs.append(math.hypot(sx, sy) / len(ms))
        self.coherencia = sum(cohs) / len(cohs)

    def _calcular_cobertura_pct(self) -> None:
        """Eficacia de cobertura: fraccion de las celdas DENTRO de las zonas
        asignadas que ya fueron visitadas al menos una vez. Mide que tan bien el
        patrullaje barre el area encomendada (M2). Costoso -> se evalua al
        muestrear (1 Hz), no en cada paso."""
        objetivo: set[tuple[int, int]] = set()
        paso = GRID_COBERTURA_GRADOS
        for sw in self.swarms.values():
            z = sw.zona
            if not z:
                continue
            dlat = z.radio_m / METROS_POR_GRADO_LAT
            dlon = z.radio_m / metros_por_grado_lon(z.lat)
            gy0, gy1 = int((z.lat - dlat) / paso), int((z.lat + dlat) / paso)
            gx0, gx1 = int((z.lon - dlon) / paso), int((z.lon + dlon) / paso)
            for gy in range(gy0, gy1 + 1):
                for gx in range(gx0, gx1 + 1):
                    clat, clon = (gy + 0.5) * paso, (gx + 0.5) * paso
                    if distancia_metros(clat, clon, z.lat, z.lon) <= z.radio_m:
                        objetivo.add((gy, gx))
        if not objetivo:
            self.cobertura_pct = 0.0
            return
        cubiertas = sum(1 for c in objetivo if c in self.cobertura)
        self.cobertura_pct = 100.0 * cubiertas / len(objetivo)

    def _registrar_cobertura(self, activos: list[Drone]) -> None:
        """Acumula la presencia de drones en una rejilla geografica (M2)."""
        for d in activos:
            celda = (
                int(d.lat / GRID_COBERTURA_GRADOS),
                int(d.lon / GRID_COBERTURA_GRADOS),
            )
            self.cobertura[celda] = self.cobertura.get(celda, 0) + 1

    def _evaluar_recuperacion(self) -> None:
        """Si hubo una disrupcion, mide cuanto tarda la conectividad en volver al
        umbral de la conectividad previa -> tiempo de recuperacion (R1)."""
        if self._t_disrupcion is None:
            return
        objetivo = (self._conect_previa or 1.0) * UMBRAL_RECUPERACION
        if self.conectividad < objetivo:
            self._cayo = True   # la perturbacion si afecto la red
            return
        # conectividad por encima del umbral: solo cuenta como recuperacion si
        # antes hubo una caida real (evita medir 0s en perturbaciones sin efecto)
        if self._cayo:
            self.t_recuperacion = round(self.tiempo - self._t_disrupcion, 1)
            self._evento(
                "resiliencia",
                f"Red reorganizada en {self.t_recuperacion}s tras la perturbacion.",
            )
        self._t_disrupcion = None
        self._conect_previa = None
        self._cayo = False

    def _muestrear_historial(self) -> None:
        """Guarda una muestra de metricas cada MUESTREO_HISTORIAL_S (M3)."""
        if self.tiempo - self._ultimo_muestreo < MUESTREO_HISTORIAL_S:
            return
        self._ultimo_muestreo = self.tiempo
        self._calcular_cobertura_pct()   # eficacia de cobertura (costoso: 1 Hz)
        activos = [d for d in self.drones.values() if d.status != DroneStatus.PERDIDO]
        operativos = [d for d in activos if d.status == DroneStatus.ACTIVO]
        total = len(self.drones)
        self.historial.append({
            "t": round(self.tiempo, 1),
            "total": total,
            "activos": len(activos),
            "operativos": len(operativos),
            "pct_operativo": round(100.0 * len(operativos) / total, 1) if total else 0.0,
            "n_enjambres": len(self.swarms),
            "n_particiones": self.n_particiones,
            "conectividad": round(self.conectividad, 3),
            "coherencia": round(self.coherencia, 3),
            "cobertura_pct": round(self.cobertura_pct, 1),
            "celdas_cubiertas": len(self.cobertura),
        })
        if len(self.historial) > MAX_HISTORIAL:
            self.historial = self.historial[-MAX_HISTORIAL:]

    def _mover_enjambre(self, sw: Swarm, miembros: list[Drone], dt: float) -> None:
        # objetivo: la zona asignada, o la base si aun no hay mision (merodeo)
        objetivo = sw.zona if sw.zona else self.base
        for d in miembros:
            sep_e = sep_n = ali_e = ali_n = coh_e = coh_n = 0.0
            n_vec = 0
            for vid in d.vecinos:
                v = self.drones.get(vid)
                if not v:
                    continue
                este, norte = offset_metros(d.lat, d.lon, v.lat, v.lon)
                dist = math.hypot(este, norte) or 1.0
                # separacion: evitar colision con CUALQUIER dron cercano (otro enjambre incluido)
                if dist < 120.0:
                    sep_e -= este / dist
                    sep_n -= norte / dist
                # alineacion y cohesion: solo con el PROPIO enjambre (no se mezclan)
                if v.swarm_id == d.swarm_id:
                    ali_e += v.vx
                    ali_n += v.vy
                    coh_e += este
                    coh_n += norte
                    n_vec += 1
            if n_vec:
                ali_e /= n_vec; ali_n /= n_vec
                coh_e /= n_vec; coh_n /= n_vec

            obj_e, obj_n = self._objetivo_modo(d, objetivo, miembros)
            w = self._pesos_modo(d.mode)

            ax = (w["sep"] * sep_e + w["ali"] * ali_e * 0.05
                  + w["coh"] * coh_e * 0.01 + w["obj"] * obj_e)
            ay = (w["sep"] * sep_n + w["ali"] * ali_n * 0.05
                  + w["coh"] * coh_n * 0.01 + w["obj"] * obj_n)

            d.vx += ax * dt
            d.vy += ay * dt
            # suavizado (amortiguamiento) para un vuelo mas estable, menos jitter
            d.vx *= 0.96
            d.vy *= 0.96

            vmax = VEL_MAX * (0.4 if d.status == DroneStatus.DEGRADADO else 1.0)
            vel = math.hypot(d.vx, d.vy)
            if vel > vmax:
                d.vx = d.vx / vel * vmax
                d.vy = d.vy / vel * vmax

            d.lat, d.lon = aplicar_offset(d.lat, d.lon, d.vx * dt, d.vy * dt)
            d.speed = math.hypot(d.vx, d.vy)
            if d.speed > 0.1:
                d.heading = math.degrees(math.atan2(d.vx, d.vy)) % 360.0

    def _objetivo_modo(self, d: Drone, zona: Zone, miembros: list[Drone]) -> tuple[float, float]:
        """
        Devuelve la direccion objetivo (este, norte normalizado) del dron segun su modo.
        Cada dron toma una posicion angular DISTINTA alrededor de la zona (idx/N), de
        modo que el enjambre se reparte equitativamente y no se amontona.
        """
        este, norte = offset_metros(d.lat, d.lon, zona.lat, zona.lon)  # vector dron -> centro
        n = max(1, len(miembros))
        idx = miembros.index(d) if d in miembros else 0
        ang_base = 2 * math.pi * idx / n  # reparto equitativo

        if d.mode == SwarmMode.DEFENSA:
            # anillo perimetral estatico (mantiene posicion en el perimetro)
            r = zona.radio_m * 0.85
            ang = ang_base
        elif d.mode == SwarmMode.PATRULLAJE:
            # anillo amplio que ROTA -> barrido. La velocidad angular se limita
            # para que el punto objetivo no rebase al dron y este mantenga el radio.
            r = zona.radio_m * 0.8
            omega = min(OMEGA_PATRULLA, 0.6 * VEL_CRUCERO / max(r, 1.0))
            ang = ang_base + omega * self.tiempo
        else:  # HIBRIDO = mezcla real: mitad patrulla (anillo exterior que rota),
               # mitad defiende (anillo interior estatico)
            if idx % 2 == 0:
                r = zona.radio_m * 0.85
                omega = min(OMEGA_PATRULLA, 0.6 * VEL_CRUCERO / max(r, 1.0))
                ang = ang_base + omega * self.tiempo
            else:
                r = zona.radio_m * 0.4
                ang = ang_base

        # punto objetivo sobre el anillo, relativo al dron = (dron->centro) + (centro->punto)
        objetivo_e = este + math.cos(ang) * r
        objetivo_n = norte + math.sin(ang) * r
        m = math.hypot(objetivo_e, objetivo_n) or 1.0
        return objetivo_e / m, objetivo_n / m

    @staticmethod
    def _pesos_modo(mode: SwarmMode) -> dict[str, float]:
        if mode == SwarmMode.DEFENSA:
            return {"sep": 8.0, "ali": 0.6, "coh": 1.2, "obj": 6.0}
        if mode == SwarmMode.PATRULLAJE:
            return {"sep": 6.0, "ali": 1.0, "coh": 0.5, "obj": 4.0}
        return {"sep": 7.0, "ali": 1.2, "coh": 1.0, "obj": 5.0}

    # ------------------------------------------------------------------
    # Serializacion del estado para el frontend
    # ------------------------------------------------------------------
    def snapshot(self) -> dict:
        drones = [d.to_dict() for d in self.drones.values()]
        swarms = [s.to_dict(len(self.miembros(s.id))) for s in self.swarms.values()]
        activos = [d for d in self.drones.values() if d.status != DroneStatus.PERDIDO]
        operativos = [d for d in activos if d.status == DroneStatus.ACTIVO]
        total = len(self.drones)
        pct = round(100.0 * len(operativos) / total, 1) if total else 0.0
        return {
            "drones": drones,
            "swarms": swarms,
            "jammers": [j.to_dict() for j in self.jammers.values()],
            "base": self.base.to_dict(),
            "eventos": self.eventos[-20:],
            "config": {"factor": self.factor, "pausado": self.pausado},
            "metricas": {
                "total": total,
                "activos": len(activos),
                "operativos": len(operativos),
                "pct_operativo": pct,
                "n_enjambres": len(self.swarms),
                "n_particiones": self.n_particiones,
                "conectividad": round(100.0 * self.conectividad, 1),
                "coherencia": round(100.0 * self.coherencia, 1),
                "cobertura_pct": round(self.cobertura_pct, 1),
                "n_disrupciones": self.n_disrupciones,
                "t_recuperacion": self.t_recuperacion,
                "celdas_cubiertas": len(self.cobertura),
                "semilla": self.semilla,
            },
        }

    def cobertura_geojson(self) -> dict:
        """Rejilla de cobertura como lista de celdas {lat, lon, n} para el overlay (M2)."""
        if not self.cobertura:
            return {"paso": GRID_COBERTURA_GRADOS, "max": 0, "celdas": []}
        mx = max(self.cobertura.values())
        celdas = [
            {
                "lat": round((gy + 0.5) * GRID_COBERTURA_GRADOS, 6),
                "lon": round((gx + 0.5) * GRID_COBERTURA_GRADOS, 6),
                "n": n,
            }
            for (gy, gx), n in self.cobertura.items()
        ]
        return {"paso": GRID_COBERTURA_GRADOS, "max": mx, "celdas": celdas}
