// Overlay breve y profesional al cambiar el modo operativo de un enjambre.
export default function AnimacionModo({ data }) {
  return (
    <div className="am-overlay">
      <div className="am-card" style={{ "--mc": data.color }}>
        <span className="mx-bracket tl" />
        <span className="mx-bracket tr" />
        <span className="mx-bracket bl" />
        <span className="mx-bracket br" />
        <div className="am-spin" />
        <div className="am-kicker">// {data.nombre}</div>
        <div className="am-title">RECONFIGURANDO MODO</div>
        <div className="am-modo">{data.label}</div>
        <div className="am-bar"><span /></div>
      </div>
    </div>
  );
}
