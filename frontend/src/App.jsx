import { useEffect, useRef, useState } from "react";
import MapaTactico from "./MapaTactico";
import Radar from "./Radar";
import { api, conectarTelemetria, MODOS, CIUDADES } from "./api";
import "./App.css";

// Venezuela (para el boton "Ver Venezuela")
const VENEZUELA_BOUNDS = [
  [0.6, -73.4],
  [12.5, -59.8],
];
const VELOCIDADES = [1, 2, 4, 8];

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [herramienta, setHerramienta] = useState("normal"); // normal | zona | jammer | crear
  const [enjambreSel, setEnjambreSel] = useState(null);
  const [dronSel, setDronSel] = useState(null);
  const [modoNuevo, setModoNuevo] = useState("patrullaje");
  const [conteoNuevo, setConteoNuevo] = useState(6);
  const [radar, setRadar] = useState(false);
  const [jammerSel, setJammerSel] = useState(null);
  const [escenarios, setEscenarios] = useState([]);
  const [verCobertura, setVerCobertura] = useState(false);
  const [cobertura, setCobertura] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [leyendaAbierta, setLeyendaAbierta] = useState(true);
  const herramientaRef = useRef(herramienta);
  herramientaRef.current = herramienta;
  const selRef = useRef({ enjambreSel, modoNuevo, conteoNuevo });
  selRef.current = { enjambreSel, modoNuevo, conteoNuevo };

  useEffect(() => conectarTelemetria(setSnapshot, setConectado), []);

  // catalogo de escenarios precargados (S3)
  useEffect(() => {
    api.escenarios().then((r) => setEscenarios(r.escenarios || [])).catch(() => {});
  }, []);

  // sondea la rejilla de cobertura mientras el heatmap este activo (M2)
  useEffect(() => {
    if (!verCobertura) return;
    let vivo = true;
    const tick = () =>
      api.cobertura().then((c) => { if (vivo) setCobertura(c); }).catch(() => {});
    tick();
    const t = setInterval(tick, 2000);
    return () => { vivo = false; clearInterval(t); setCobertura(null); };
  }, [verCobertura]);

  // primer enjambre seleccionado por defecto
  useEffect(() => {
    if (snapshot && !enjambreSel && snapshot.swarms.length) {
      setEnjambreSel(snapshot.swarms[0].id);
    }
  }, [snapshot, enjambreSel]);

  async function onMapClick(latlng) {
    const h = herramientaRef.current;
    const { enjambreSel } = selRef.current;
    if (h === "jammer") {
      await api.crearJammer(latlng.lat, latlng.lng, 1200);
    } else if (h === "zona" && enjambreSel) {
      await api.asignarZona(enjambreSel, latlng.lat, latlng.lng, 1500);
      setHerramienta("normal");
    } else if (h === "base") {
      await api.setBase(latlng.lat, latlng.lng);
      setHerramienta("normal");
    }
  }

  function buscarCiudad(texto) {
    const c = CIUDADES.find(
      (x) => x.nombre.toLowerCase() === texto.trim().toLowerCase()
    );
    if (c) window.__simcedMap?.flyTo([c.lat, c.lon], 13);
  }

  function onDronClick(d) {
    setDronSel(d);
    setEnjambreSel(d.swarm_id);
  }

  const swarms = snapshot?.swarms || [];
  const metricas = snapshot?.metricas || {};
  const eventos = snapshot?.eventos || [];
  const factorSim = snapshot?.config?.factor ?? 1;
  const pausado = snapshot?.config?.pausado ?? false;
  const enjambre = swarms.find((s) => s.id === enjambreSel);
  const dronVivo = dronSel
    ? snapshot?.drones.find((x) => x.id === dronSel.id)
    : null;
  const miembros = (snapshot?.drones || []).filter(
    (d) => d.swarm_id === enjambreSel && d.status !== "perdido"
  );
  const jammerVivo = jammerSel
    ? snapshot?.jammers.find((j) => j.id === jammerSel)
    : null;

  const verVenezuela = () => window.__simcedMap?.fitBounds(VENEZUELA_BOUNDS);
  const centrarBase = () => {
    if (snapshot?.base) window.__simcedMap?.setView([snapshot.base.lat, snapshot.base.lon], 13);
  };
  const centrarEnjambre = () => {
    const z = enjambre?.zona || snapshot?.base;
    if (z) window.__simcedMap?.setView([z.lat, z.lon], 13);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="marca">
          <span className="logo">◎</span>
          <div>
            <strong>SIMCED</strong>
            <small>Simulación · Monitoreo · Control de Enjambres</small>
          </div>
        </div>
        <div className={"enlace " + (conectado ? "on" : "off")}>
          <span className="enlace-led" />
          {conectado ? "Telemetría activa" : "Sin enlace"}
        </div>
        <div className="buscador">
          <input
            list="ciudades"
            placeholder="Ir a ciudad — ej. Caracas"
            onChange={(e) => buscarCiudad(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscarCiudad(e.target.value); }}
          />
          <datalist id="ciudades">
            {CIUDADES.map((c) => <option key={c.nombre} value={c.nombre} />)}
          </datalist>
        </div>
        <div className="sim-ctrl">
          <button className={"sim-btn " + (pausado ? "play" : "")} onClick={() => api.setPausa(!pausado)}
            title={pausado ? "Reanudar" : "Pausar"}>
            {pausado ? "▶" : "⏸"}
          </button>
          <button className="sim-btn" onClick={() => api.reset()} title="Reiniciar simulación">⟳</button>
          <div className="vel-seg">
            {VELOCIDADES.map((v) => (
              <button key={v} className={factorSim === v ? "on" : ""} onClick={() => api.setVelocidad(v)}>{v}x</button>
            ))}
          </div>
        </div>
      </header>

      <div className="metric-strip">
        <Metric label="Enjambres" val={metricas.n_enjambres ?? 0} />
        <Metric label="Unidades" val={metricas.activos ?? 0} />
        <Metric label="Operativo" val={`${metricas.pct_operativo ?? 0}%`}
          warn={(metricas.pct_operativo ?? 100) < 70} />
        <Metric label="Conectividad" val={`${metricas.conectividad ?? 100}%`}
          warn={(metricas.conectividad ?? 100) < 70} />
        <Metric label="Consenso" val={`${metricas.coherencia ?? 100}%`}
          warn={(metricas.coherencia ?? 100) < 50} />
        <Metric label="Particiones" val={metricas.n_particiones ?? 1}
          warn={(metricas.n_particiones ?? 1) > 1} />
        <Metric label="Disrupciones" val={metricas.n_disrupciones ?? 0} />
        <Metric label="Recuperación"
          val={metricas.t_recuperacion != null ? `${metricas.t_recuperacion}s` : "—"} />
        <Metric label="Cobertura zona" val={`${metricas.cobertura_pct ?? 0}%`} />
        <Metric label="Celdas" val={metricas.celdas_cubiertas ?? 0} />
      </div>

      <div className="cuerpo">
        <aside className="rail rail-left">
          <Seccion titulo="Herramientas">
            <div className="grid2">
              <Boton act={herramienta === "crear"} onClick={() => setHerramienta(herramienta === "crear" ? "normal" : "crear")}>
                + Desplegar enjambre
              </Boton>
              <Boton act={herramienta === "zona"} onClick={() => setHerramienta(herramienta === "zona" ? "normal" : "zona")} disabled={!enjambreSel}>
                ◎ Asignar zona
              </Boton>
              <Boton act={herramienta === "base"} onClick={() => setHerramienta(herramienta === "base" ? "normal" : "base")}>
                ⬢ Establecer base
              </Boton>
              <Boton act={herramienta === "jammer"} onClick={() => setHerramienta(herramienta === "jammer" ? "normal" : "jammer")} danger>
                ⚡ Interferencia
              </Boton>
              <Boton onClick={verVenezuela}>🗺 Ver Venezuela</Boton>
              <Boton onClick={centrarBase}>⊙ Ir a la base</Boton>
            </div>
            {herramienta !== "normal" && herramienta !== "crear" && (
              <p className="ayuda">
                {herramienta === "zona" && "Clic en el mapa para fijar la zona a supervisar."}
                {herramienta === "base" && "Clic en el mapa para reubicar la base. Los próximos enjambres saldrán de ahí."}
                {herramienta === "jammer" && "Clic en el mapa para colocar una zona de interferencia."}
              </p>
            )}
          </Seccion>

          {escenarios.length > 0 && (
            <Seccion titulo="Escenarios">
              <div className="escenarios">
                {escenarios.map((e) => (
                  <button key={e.id} className="escenario" title={e.descripcion}
                    onClick={() => api.cargarEscenario(e.id)}>
                    {e.nombre}
                  </button>
                ))}
              </div>
              <p className="ayuda">Carga una configuración predefinida (base, enjambres, zonas e interferencias) para una demostración reproducible.</p>
            </Seccion>
          )}

          {herramienta === "crear" && (
            <Seccion titulo="Nuevo enjambre">
              <label className="campo">
                Unidades: {conteoNuevo}
                <input type="range" min="3" max="20" value={conteoNuevo}
                  onChange={(e) => setConteoNuevo(+e.target.value)} />
              </label>
              <span className="etq">Modo</span>
              <div className="modos">
                {MODOS.map((m) => (
                  <button key={m.id} className={"modo " + (modoNuevo === m.id ? "on" : "")}
                    style={{ "--mc": m.color }} onClick={() => setModoNuevo(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <Boton act onClick={async () => {
                await api.crearEnjambre(conteoNuevo, null, null, modoNuevo);
                setHerramienta("normal");
              }}>
                ▲ Desplegar desde la base
              </Boton>
              <p className="ayuda">El enjambre sale de la base. Luego usa “Asignar zona” para enviarlo a supervisar un área.</p>
            </Seccion>
          )}

          <Seccion titulo="Enjambres">
            {swarms.length === 0 && <p className="vacio">Sin enjambres desplegados.</p>}
            {swarms.map((s) => (
              <div key={s.id} className={"enjambre " + (enjambreSel === s.id ? "sel" : "")}
                onClick={() => { setEnjambreSel(s.id); setDronSel(null); }}>
                <span className="punto" style={{ background: s.color }} />
                <div className="enj-info">
                  <strong>{s.nombre}</strong>
                  <small>{s.n_miembros} unidades · {s.mode}</small>
                </div>
              </div>
            ))}
          </Seccion>

          <Seccion titulo="Monitoreo y datos">
            <Boton act={verCobertura} onClick={() => setVerCobertura((v) => !v)}>
              {verCobertura ? "◼ Ocultar cobertura" : "▦ Heatmap de cobertura"}
            </Boton>
            <span className="etq" style={{ marginTop: 10 }}>Exportar resultados</span>
            <div className="grid2">
              <Boton onClick={() => api.exportarHistorial()}>⭳ Historial CSV</Boton>
              <Boton onClick={() => api.exportarTelemetria()}>⭳ Telemetría CSV</Boton>
              <Boton onClick={() => api.exportarEstado()}>⭳ Estado JSON</Boton>
            </div>
            <p className="ayuda">El historial registra series temporales (operativo, conectividad, particiones, cobertura) para el análisis de resultados.</p>
          </Seccion>
        </aside>

        <main className="mapa-wrap">
          <MapaTactico
            snapshot={snapshot}
            herramienta={herramienta}
            cobertura={verCobertura ? cobertura : null}
            onMapClick={onMapClick}
            onDronClick={onDronClick}
            onZonaMove={(id, lat, lon) => api.moverZona(id, lat, lon)}
            onZonaClick={(id) => { setEnjambreSel(id); setDronSel(null); setJammerSel(null); }}
            onJammerMove={(id, lat, lon) => api.actualizarJammer(id, { lat, lon })}
            onJammerClick={(id) => setJammerSel(id)}
          />
          {radar && <Radar snapshot={snapshot} />}
          {pausado && <div className="pausa-ind">⏸ PAUSA</div>}
          {!conectado && snapshot && <div className="reconectando">⟳ Reconectando telemetría…</div>}
          <div className="vista-toggle">
            <button className={radar ? "" : "on"} onClick={() => setRadar(false)}>🗺 Mapa</button>
            <button className={radar ? "on" : ""} onClick={() => setRadar(true)}>📡 Radar</button>
          </div>
          <Leyenda swarms={swarms} abierta={leyendaAbierta} onToggle={() => setLeyendaAbierta((v) => !v)} />
          {!snapshot && <div className="cargando">Conectando con el servicio de telemetría…</div>}
        </main>

        <aside className="rail rail-right">
          <div className="inspector">
            {dronVivo ? (
              <Seccion titulo={`Unidad · ${dronVivo.id}`}>
                <Telemetria d={dronVivo} />
                <span className="etq">Modo de la unidad</span>
                <div className="modos">
                  {MODOS.map((m) => (
                    <button key={m.id} className={"modo " + (dronVivo.mode === m.id ? "on" : "")}
                      style={{ "--mc": m.color }} onClick={() => api.setModoDron(dronVivo.id, m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <Boton danger onClick={() => { api.eliminarNodo(dronVivo.id); setDronSel(null); }}>
                  ✕ Eliminar nodo (simular pérdida)
                </Boton>
                <Boton onClick={() => setDronSel(null)}>← Volver al enjambre</Boton>
              </Seccion>
            ) : jammerVivo ? (
              <Seccion titulo={`Interferencia · ${jammerVivo.id}`}>
                <label className="campo">
                  Radio: {Math.round(jammerVivo.radio_m)} m
                  <input type="range" min="300" max="4000" step="100"
                    value={jammerVivo.radio_m}
                    onChange={(e) => api.actualizarJammer(jammerVivo.id, { radio_m: +e.target.value })} />
                </label>
                <p className="ayuda">Arrastra el ✛ en el mapa para moverla.</p>
                <Boton danger onClick={() => { api.quitarJammer(jammerVivo.id); setJammerSel(null); }}>
                  ✕ Quitar interferencia
                </Boton>
              </Seccion>
            ) : enjambre ? (
              <>
                <Seccion titulo={`Control · ${enjambre.nombre}`}>
                  <span className="etq">Modo operativo</span>
                  <div className="modos">
                    {MODOS.map((m) => (
                      <button key={m.id} className={"modo " + (enjambre.mode === m.id ? "on" : "")}
                        style={{ "--mc": m.color }} onClick={() => api.setModo(enjambre.id, m.id)}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid2" style={{ marginTop: 8 }}>
                    <Boton onClick={() => api.dividir(enjambre.id, 2)} disabled={enjambre.n_miembros < 2}>
                      ⋔ Dividir en 2
                    </Boton>
                    <Boton onClick={() => api.dividir(enjambre.id, 3)} disabled={enjambre.n_miembros < 3}>
                      ⋔ Dividir en 3
                    </Boton>
                    <Boton onClick={centrarEnjambre}>⊙ Centrar</Boton>
                    <Boton danger onClick={() => api.retornarBase(enjambre.id)} disabled={!enjambre.zona}>
                      🗑 Eliminar zona
                    </Boton>
                  </div>
                  {enjambre.zona && (
                    <label className="campo" style={{ marginTop: 10 }}>
                      Radio de zona: {Math.round(enjambre.zona.radio_m)} m
                      <input type="range" min="500" max="5000" step="100"
                        value={enjambre.zona.radio_m}
                        onChange={(e) => api.setRadio(enjambre.id, +e.target.value)} />
                    </label>
                  )}
                </Seccion>
                {miembros.length > 0 && (
                  <Seccion titulo="Telemetría por unidad">
                    <table className="stats">
                      <thead>
                        <tr><th>Unidad</th><th>Vel</th><th>Bat</th><th>Señal</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                        {miembros.map((d) => (
                          <tr key={d.id} className={(dronSel?.id === d.id ? "sel " : "") + d.status}
                            onClick={() => setDronSel(d)}>
                            <td>{d.id}</td>
                            <td>{d.speed}</td>
                            <td>{d.bateria}%</td>
                            <td>{d.senal}%</td>
                            <td><span className={"badge " + d.status}>{d.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Seccion>
                )}
              </>
            ) : (
              <div className="inspector-vacio">
                <span className="iv-ico">⌖</span>
                <p>Selecciona un enjambre, unidad o interferencia para inspeccionarlo.</p>
              </div>
            )}
          </div>

          <Seccion titulo="Eventos y alertas">
            {eventos.length === 0 && <p className="vacio">Sin eventos.</p>}
            <div className="lista-eventos">
              {[...eventos].reverse().map((e) => (
                <div key={e.id} className={"evento " + e.nivel}>
                  <span className="evt-tipo">{e.tipo}</span>
                  <span>{e.mensaje}</span>
                </div>
              ))}
            </div>
          </Seccion>
        </aside>
      </div>
    </div>
  );
}

function Leyenda({ swarms, abierta, onToggle }) {
  return (
    <div className={"leyenda " + (abierta ? "" : "cerrada")}>
      <button className="ly-cab" onClick={onToggle}>
        <strong>Leyenda</strong>
        <span className="ly-chevron">{abierta ? "▾" : "▸"}</span>
      </button>
      {abierta && (
        <div className="ly-cuerpo">
          <div className="ly-fila"><span className="ly-ico" style={{ color: "#fbbf24" }}>⬢</span> Base de operaciones</div>
          <div className="ly-fila"><span className="ly-ico" style={{ color: "#ef4444" }}>▲</span> Dron degradado / interferencia</div>
          <div className="ly-fila"><span className="ly-linea" /> Enlace mesh (mismo enjambre)</div>
          <div className="ly-fila"><span className="ly-linea blanca" /> Enlace entre enjambres</div>
          <div className="ly-fila"><span className="ly-circ" style={{ borderColor: "#ef4444" }} /> Zona de interferencia</div>
          <div className="ly-fila"><span className="ly-circ" style={{ borderColor: "#38bdf8", borderStyle: "dashed" }} /> Zona asignada</div>
          {swarms.length > 0 && <div className="ly-sep">Enjambres</div>}
          {swarms.map((s) => (
            <div className="ly-fila" key={s.id}>
              <span className="ly-ico" style={{ color: s.color }}>▲</span> {s.nombre}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, val, warn }) {
  return (
    <div className={"metric " + (warn ? "warn" : "")}>
      <strong>{val}</strong>
      <small>{label}</small>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="seccion">
      <h3>{titulo}</h3>
      {children}
    </section>
  );
}

function Boton({ children, onClick, act, danger, disabled }) {
  return (
    <button
      className={"btn " + (act ? "act " : "") + (danger ? "danger" : "")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Telemetria({ d }) {
  const filas = [
    ["Estado", d.status],
    ["Modo", d.mode],
    ["Latitud", d.lat],
    ["Longitud", d.lon],
    ["Altitud", d.alt + " m"],
    ["Rumbo", d.heading + "°"],
    ["Velocidad", d.speed + " m/s"],
    ["Batería", d.bateria + " %"],
    ["Señal", d.senal + " %"],
    ["Vecinos (mesh)", d.vecinos.length],
  ];
  return (
    <table className="tele">
      <tbody>
        {filas.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>{String(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
