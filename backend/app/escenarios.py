"""
Escenarios predefinidos de SIMCODVE (declarativos y reproducibles).

Cada escenario describe la base, los enjambres (con su modo y zona) y las zonas
de interferencia. Se cargan con engine.cargar_escenario(id) y, gracias a la
semilla, se reproducen igual en cada corrida (util para el Capitulo IV).

Coordenadas APROXIMADAS de instituciones venezolanas (faciles de ajustar):
  - UNEFA Nucleo Altos Mirandinos (Los Teques)
  - UNES  (Universidad Nacional Experimental de la Seguridad, Caracas)
  - UNETRANS (Universidad Nacional Experimental del Transporte, Caracas)
"""

UNEFA = {"lat": 10.34915, "lon": -67.02262}          # real (OpenStreetMap)
HOSPITAL_VS = {"lat": 10.35411, "lon": -67.03655}    # Hospital Victorino Santaella, Los Teques (real)
FUERTE_TIUNA = {"lat": 10.43700, "lon": -66.91072}   # Fuerte Tiuna, Caracas (real)

ESCENARIOS: dict[str, dict] = {
    # 1) El bueno: patrullaje urbano sobre Los Teques.
    "patrullaje_urbano": {
        "nombre": "Patrullaje urbano — Los Teques",
        "descripcion": "Un enjambre patrulla en barrido el casco urbano de Los Teques.",
        "seed": 1,
        "base": {"lat": UNEFA["lat"], "lon": UNEFA["lon"]},
        "swarms": [
            {"count": 8, "mode": "patrullaje", "nombre": "Patrulla Los Teques",
             "zona": {"lat": 10.3505, "lon": -67.0335, "radio_m": 1600}},
        ],
        "jammers": [],
    },

    # 2) Defensa de instalacion -> la UNEFA (perimetro cerrado sobre el campus).
    "defensa_unefa": {
        "nombre": "Defensa de instalación — UNEFA",
        "descripcion": "El enjambre forma un perímetro defensivo sobre el campus de la UNEFA.",
        "seed": 2,
        "base": {"lat": 10.344, "lon": -67.041},
        "swarms": [
            {"count": 8, "mode": "defensa", "nombre": "Defensa UNEFA",
             "zona": {"lat": UNEFA["lat"], "lon": UNEFA["lon"], "radio_m": 850}},
        ],
        "jammers": [],
    },

    # 3) Resiliencia bajo interferencia: el jammer cubre PARTE de la zona y el
    #    enjambre la rodea/evita, manteniendo la vigilancia del resto (resolucion).
    "resiliencia_interferencia": {
        "oculto": True,   # no se muestra en el listado (se puede reactivar quitando esto)
        "nombre": "Resiliencia bajo interferencia",
        "descripcion": "Una interferencia cubre parte de la zona; el enjambre la evita "
                       "y sigue patrullando el área libre (resiliencia).",
        "seed": 3,
        "base": {"lat": 10.344, "lon": -67.041},
        "swarms": [
            {"count": 9, "mode": "patrullaje", "nombre": "Patrulla resiliente",
             "zona": {"lat": 10.3520, "lon": -67.0280, "radio_m": 1600}},
        ],
        "jammers": [
            {"lat": 10.3560, "lon": -67.0205, "radio_m": 800},
        ],
    },

    # 4) Operacion multienjambre -> tres puntos: UNEFA Los Teques, Hospital
    #    Victorino Santaella y Fuerte Tiuna.
    "operacion_multienjambre": {
        "nombre": "Operación multienjambre — UNEFA · Hospital V. Santaella · Fuerte Tiuna",
        "descripcion": "Tres enjambres supervisan simultáneamente la UNEFA Los Teques, "
                       "el Hospital Victorino Santaella y el Fuerte Tiuna.",
        "seed": 4,
        "base": {"lat": UNEFA["lat"], "lon": UNEFA["lon"]},
        "swarms": [
            {"count": 6, "mode": "patrullaje", "nombre": "Enjambre UNEFA",
             "zona": {"lat": UNEFA["lat"], "lon": UNEFA["lon"], "radio_m": 1200}},
            {"count": 6, "mode": "hibrido", "nombre": "Enjambre Hospital V. Santaella",
             "zona": {"lat": HOSPITAL_VS["lat"], "lon": HOSPITAL_VS["lon"], "radio_m": 1000}},
            {"count": 6, "mode": "defensa", "nombre": "Enjambre Fuerte Tiuna",
             "zona": {"lat": FUERTE_TIUNA["lat"], "lon": FUERTE_TIUNA["lon"], "radio_m": 1200}},
        ],
        "jammers": [],
    },
}


def listar() -> list[dict]:
    """Lista resumida de escenarios visibles para el frontend (omite los ocultos)."""
    return [
        {"id": k, "nombre": v["nombre"], "descripcion": v["descripcion"]}
        for k, v in ESCENARIOS.items()
        if not v.get("oculto")
    ]
