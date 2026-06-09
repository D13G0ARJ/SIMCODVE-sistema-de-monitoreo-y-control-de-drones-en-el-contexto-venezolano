import { useEffect, useRef, useState } from "react";

// Overlay de carga: muestra DATOS REALES del escenario que se está cargando
// (base, enjambres, unidades, modos, enlaces mesh) en vez de texto genérico.
// Fases: carga -> completo ("DESPLIEGUE COMPLETO") -> saliendo (salida suave).
const DUR_CARGA = 7300;
const DUR_COMPLETO = 1000;
const DUR_SALIDA = 700;

function construirPasos(snap) {
  if (!snap || !snap.base) return [];
  const m = snap.metricas || {};
  const b = snap.base;
  const enlaces = Math.round(
    (snap.drones || []).reduce((a, d) => a + (d.vecinos?.length || 0), 0) / 2
  );
  const pasos = [
    `Base de operaciones · ${b.lat.toFixed(4)}, ${b.lon.toFixed(4)}`,
    `Enjambres desplegados · ${m.n_enjambres ?? 0}`,
    `Unidades tipo dron en vuelo · ${m.activos ?? 0}`,
  ];
  (snap.swarms || []).forEach((s) => {
    const z = s.zona ? ` → ${s.zona.lat.toFixed(3)}, ${s.zona.lon.toFixed(3)}` : "";
    pasos.push(`${s.nombre} · modo ${s.mode}${z}`);
  });
  pasos.push(`Red mesh distribuida · ${enlaces} enlaces activos`);
  pasos.push(`Telemetría en línea · ${m.activos ?? 0} gemelos digitales`);
  return pasos;
}

export default function PantallaCarga({ nombre, snapshot, onTerminar }) {
  const [fase, setFase] = useState("carga");
  const [pasos, setPasos] = useState([]);
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const finRef = useRef(onTerminar);
  finRef.current = onTerminar;

  useEffect(() => {
    // captura los datos reales una vez que el escenario ya se cargó (~400 ms)
    const tCap = setTimeout(() => setPasos(construirPasos(snapRef.current)), 450);
    const t1 = setTimeout(() => setFase("completo"), DUR_CARGA);
    const t2 = setTimeout(() => setFase("saliendo"), DUR_CARGA + DUR_COMPLETO);
    const t3 = setTimeout(() => finRef.current(), DUR_CARGA + DUR_COMPLETO + DUR_SALIDA);
    return () => [tCap, t1, t2, t3].forEach(clearTimeout);
  }, []);

  const completo = fase !== "carga";
  const clase =
    "ld-overlay" + (completo ? " completo" : "") + (fase === "saliendo" ? " saliendo" : "");

  return (
    <div className={clase}>
      <div className="ld-grid" />
      <div className="ld-scanlines" />

      <div className="ld-core">
        <div className="ld-radar">
          <span className="ld-ring r1" />
          <span className="ld-ring r2" />
          <span className="ld-ring r3" />
          <span className="ld-sweep" />
          <span className="ld-blip b1" />
          <span className="ld-blip b2" />
          <span className="ld-blip b3" />
          <span className="ld-cross" />
          {completo && <span className="ld-done">✓</span>}
        </div>

        <div className="ld-kicker">
          {completo ? "// SISTEMA OPERATIVO" : "// INICIALIZANDO SISTEMA TÁCTICO"}
        </div>
        <h1 className="ld-title">{completo ? "DESPLIEGUE COMPLETO" : "CONFIGURANDO ESCENARIO"}</h1>
        <div className="ld-target">{nombre}</div>

        <ul className={"ld-steps" + (completo ? " todo-ok" : "")}>
          {pasos.length === 0 && (
            <li><span className="ld-check">▸</span>
              <span className="ld-step-txt">Estableciendo enlace con el servidor…</span>
              <span className="ld-ok">···</span></li>
          )}
          {pasos.map((p, i) => (
            <li key={i} style={{ animationDelay: `${0.2 + i * 0.7}s` }}>
              <span className="ld-check">{completo ? "✓" : "▸"}</span>
              <span className="ld-step-txt">{p}</span>
              <span className="ld-ok">OK</span>
            </li>
          ))}
        </ul>

        <div className="ld-bar">
          <span className="ld-bar-fill" />
        </div>
        <div className="ld-foot">SIMCODVE v0.1 · ENLACE SEGURO · DATOS SINTÉTICOS</div>
      </div>
    </div>
  );
}
