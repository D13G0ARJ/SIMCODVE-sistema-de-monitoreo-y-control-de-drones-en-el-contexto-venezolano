// Cliente de los servicios SIMCODVE (REST + WebSocket).
//
// En desarrollo (vite dev) el backend corre aparte en 127.0.0.1:8000.
// En produccion (build servido por el propio backend, p.ej. en un Space de
// Hugging Face) usamos el MISMO origen: BASE vacio -> rutas relativas, y el
// WebSocket se deriva de la URL actual (ws:// o wss:// segun el protocolo).
const DEV = import.meta.env.DEV;
const BASE = DEV ? "http://127.0.0.1:8000" : "";
const WS = DEV
  ? "ws://127.0.0.1:8000/ws/telemetria"
  : (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws/telemetria";

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

async function del(path) {
  const r = await fetch(BASE + path, { method: "DELETE" });
  return r.json();
}

export const api = {
  crearEnjambre: (count, lat, lon, mode, nombre) =>
    post("/api/enjambres", { count, lat, lon, mode, nombre }),
  asignarZona: (id, lat, lon, radio_m) =>
    post(`/api/enjambres/${id}/zona`, { lat, lon, radio_m }),
  setRadio: (id, radio_m) => post(`/api/enjambres/${id}/radio`, { radio_m }),
  moverZona: (id, lat, lon) => post(`/api/enjambres/${id}/mover_zona`, { lat, lon }),
  retornarBase: (id) => post(`/api/enjambres/${id}/retornar`),
  actualizarJammer: (id, campos) => post(`/api/fallos/jammer/${id}/actualizar`, campos),
  setModo: (id, mode) => post(`/api/enjambres/${id}/modo`, { mode }),
  dividir: (id, partes, zonas) =>
    post(`/api/enjambres/${id}/dividir`, { partes, zonas }),
  unir: (ids) => post("/api/enjambres/unir", { ids }),
  setModoDron: (id, mode) => post(`/api/drones/${id}/modo`, { mode }),
  eliminarNodo: (id) => post(`/api/fallos/nodo/${id}`),
  crearJammer: (lat, lon, radio_m) =>
    post("/api/fallos/jammer", { lat, lon, radio_m }),
  quitarJammer: (id) => del(`/api/fallos/jammer/${id}`),
  setBase: (lat, lon) => post("/api/config/base", { lat, lon }),
  setVelocidad: (factor) => post("/api/config/velocidad", { factor }),
  setPausa: (pausado) => post("/api/config/pausa", { pausado }),
  reset: () => post("/api/reset"),
  cargarEscenario: (id) => post(`/api/escenarios/${id}/cargar`),
  exportar: (fmt) => window.open(`${BASE}/api/export/historial.${fmt}`, "_blank"),
  exportarInterferencia: () => window.open(`${BASE}/api/export/interferencia.csv`, "_blank"),
};

export async function listarEscenarios() {
  const r = await fetch(BASE + "/api/escenarios");
  return (await r.json()).escenarios;
}

// Geocodificacion abierta (OpenStreetMap / Nominatim): devuelve VARIAS opciones
// para que el usuario elija (autocompletado tipo Google Maps), priorizando Venezuela.
export async function buscarLugares(texto, limite = 6) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=" + limite +
    "&accept-language=es&countrycodes=ve&q=" +
    encodeURIComponent(texto);
  try {
    const r = await fetch(url);
    const arr = await r.json();
    return (arr || []).map((x) => ({
      lat: +x.lat,
      lon: +x.lon,
      nombre: x.display_name,
    }));
  } catch {
    return [];
  }
}

// Ciudades de Venezuela para el buscador (vuelo del mapa).
export const CIUDADES = [
  { nombre: "Caracas", lat: 10.4806, lon: -66.9036 },
  { nombre: "Maracaibo", lat: 10.6545, lon: -71.6406 },
  { nombre: "Valencia", lat: 10.162, lon: -68.0077 },
  { nombre: "Barquisimeto", lat: 10.0678, lon: -69.3467 },
  { nombre: "Maracay", lat: 10.2469, lon: -67.5958 },
  { nombre: "Los Teques", lat: 10.3439, lon: -67.041 },
  { nombre: "Ciudad Guayana", lat: 8.3533, lon: -62.6528 },
  { nombre: "San Cristóbal", lat: 7.7669, lon: -72.225 },
  { nombre: "Maturín", lat: 9.7457, lon: -63.1832 },
  { nombre: "Barcelona", lat: 10.134, lon: -64.6836 },
  { nombre: "Puerto La Cruz", lat: 10.213, lon: -64.6333 },
  { nombre: "Punto Fijo", lat: 11.6953, lon: -70.1996 },
  { nombre: "Mérida", lat: 8.5897, lon: -71.1561 },
  { nombre: "Cumaná", lat: 10.454, lon: -64.1674 },
  { nombre: "Coro", lat: 11.4045, lon: -69.6734 },
  { nombre: "La Guaira", lat: 10.6011, lon: -66.9336 },
  { nombre: "Guarenas", lat: 10.4717, lon: -66.611 },
  { nombre: "Petare", lat: 10.4761, lon: -66.8075 },
];

// Mantiene una conexion WebSocket viva y reconecta si se cae.
export function conectarTelemetria(onSnapshot) {
  let ws;
  let vivo = true;
  let pingTimer;

  function abrir() {
    ws = new WebSocket(WS);
    ws.onmessage = (e) => onSnapshot(JSON.parse(e.data));
    ws.onopen = () => {
      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 5000);
    };
    ws.onclose = () => {
      clearInterval(pingTimer);
      if (vivo) setTimeout(abrir, 1500);
    };
    ws.onerror = () => ws.close();
  }
  abrir();

  return () => {
    vivo = false;
    clearInterval(pingTimer);
    if (ws) ws.close();
  };
}

export const MODOS = [
  { id: "patrullaje", label: "Patrullaje", color: "#22d3ee" },
  { id: "defensa", label: "Defensa", color: "#f87171" },
  { id: "hibrido", label: "Híbrido", color: "#a78bfa" },
];
