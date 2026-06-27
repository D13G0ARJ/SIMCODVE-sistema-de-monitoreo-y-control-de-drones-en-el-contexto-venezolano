/* Cinta infinita de términos técnicos. CSS puro, sin JS por frame. */
const terminos = [
  'Control descentralizado', 'Algoritmos de consenso', 'Enjambres de drones', 'Red mesh',
  'Gemelo digital', 'Telemetría sintética', 'Arquitectura SOA', 'Resiliencia operativa',
  'Soberanía tecnológica', 'Guerra electrónica', 'Disuasión', 'Boids', 'Conciencia situacional',
]

export default function Marquee() {
  const fila = [...terminos, ...terminos]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {fila.map((t, i) => (
          <span className="marquee-item" key={i}>
            {t}<i className="marquee-sep" />
          </span>
        ))}
      </div>
    </div>
  )
}
