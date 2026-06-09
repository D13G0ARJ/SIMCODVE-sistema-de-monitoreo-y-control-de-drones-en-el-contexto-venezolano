import { useRef, useState } from "react";
import { buscarLugares, CIUDADES } from "./api";

// Buscador tipo Google Maps: al escribir, despliega opciones (ciudades locales
// + resultados de geocodificacion) para elegir la correcta.
export default function Buscador() {
  const [q, setQ] = useState("");
  const [opciones, setOpciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const timer = useRef(null);

  function irA(lat, lon, zoom = 14) {
    window.__simcedMap?.flyTo([lat, lon], zoom);
    setAbierto(false);
  }

  function onChange(v) {
    setQ(v);
    clearTimeout(timer.current);
    const txt = v.trim();
    if (txt.length < 3) {
      setOpciones([]);
      setAbierto(false);
      return;
    }
    // coincidencias locales (instantáneas)
    const locales = CIUDADES
      .filter((c) => c.nombre.toLowerCase().includes(txt.toLowerCase()))
      .map((c) => ({ lat: c.lat, lon: c.lon, nombre: c.nombre, ciudad: true }));
    setOpciones(locales);
    setAbierto(true);
    setCargando(true);
    // geocodificación (con debounce para respetar el límite de OSM)
    timer.current = setTimeout(async () => {
      const r = await buscarLugares(txt, 6);
      setOpciones([...locales, ...r]);
      setCargando(false);
    }, 450);
  }

  function seleccionar(o) {
    setQ(o.nombre);
    irA(o.lat, o.lon);
  }

  return (
    <div className="buscador">
      <div className="buscador-box">
        <input
          value={q}
          placeholder="🔍 Buscar lugar (ej. UNETRANS, Plaza Bolívar)…"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (opciones.length) setAbierto(true); }}
          onBlur={() => setTimeout(() => setAbierto(false), 180)}
          onKeyDown={(e) => { if (e.key === "Enter" && opciones[0]) seleccionar(opciones[0]); }}
        />
        {abierto && (
          <ul className="buscador-lista">
            {opciones.map((o, i) => (
              <li key={i} onMouseDown={() => seleccionar(o)}>
                <span className="b-ico">{o.ciudad ? "🏙" : "📍"}</span>
                <span className="b-txt">{o.nombre}</span>
              </li>
            ))}
            {cargando && <li className="b-cargando">Buscando…</li>}
            {!cargando && opciones.length === 0 && <li className="b-cargando">Sin resultados</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
