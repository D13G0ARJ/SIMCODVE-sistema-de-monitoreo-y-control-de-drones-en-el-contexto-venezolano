// Modal táctico de "Escenarios preconfigurados" — estética HUD de sala de mando.
const ICONOS = {
  patrullaje_urbano: "◎",
  defensa_unefa: "⬡",
  operacion_multienjambre: "⟁",
};

export default function ModalEscenarios({ escenarios, onSelect, onClose }) {
  return (
    <div className="mx-overlay" onClick={onClose}>
      <div className="mx-grid" />
      <div className="mx-panel" onClick={(e) => e.stopPropagation()}>
        <span className="mx-bracket tl" />
        <span className="mx-bracket tr" />
        <span className="mx-bracket bl" />
        <span className="mx-bracket br" />

        <header className="mx-head">
          <div>
            <div className="mx-kicker">// SIMCODVE · BIBLIOTECA TÁCTICA</div>
            <h2 className="mx-title">ESCENARIOS PRECONFIGURADOS</h2>
          </div>
          <button className="mx-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        <div className="mx-status">
          <span className="mx-dot" /> SISTEMA EN LÍNEA
          <span className="mx-sep">·</span> {escenarios.length} OPERACIONES DISPONIBLES
          <span className="mx-sep">·</span> DATOS SINTÉTICOS
        </div>

        <div className="mx-cards">
          {escenarios.map((e, i) => (
            <button key={e.id} className="mx-card" onClick={() => onSelect(e)}>
              <span className="mx-bracket tl" />
              <span className="mx-bracket br" />
              <div className="mx-card-top">
                <span className="mx-glyph">{ICONOS[e.id] || "◆"}</span>
                <span className="mx-code">OP-{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mx-card-name">{e.nombre}</h3>
              <p className="mx-card-desc">{e.descripcion}</p>
              <div className="mx-card-cta">
                INICIAR DESPLIEGUE <span className="mx-arrow">→</span>
              </div>
              <span className="mx-scan" />
            </button>
          ))}
        </div>

        <footer className="mx-foot">
          <span>LAT 10.34 · LON -67.04 · ZONA: ALTOS MIRANDINOS</span>
          <span className="mx-blink">● REC</span>
        </footer>
      </div>
    </div>
  );
}
