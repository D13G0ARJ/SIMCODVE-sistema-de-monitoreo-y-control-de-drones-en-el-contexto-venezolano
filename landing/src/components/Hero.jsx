import { PDF } from '../datos'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="in">
        <p className="meta hero-meta">Trabajo Especial de Grado · UNEFA 2026</p>
        <h1>Diseño de un Sistema de Monitoreo y Control de Drones en el Contexto Venezolano</h1>
        <p className="lead">
          SIMCODVE simula enjambres con control descentralizado y consenso sobre el mapa real de
          Venezuela. Todo con datos sintéticos.
        </p>
        <div className="acciones">
          <a className="boton primario" href={PDF} target="_blank" rel="noopener">Ver tesis en PDF</a>
          <a className="boton fantasma" href="#sistema">Explorar el sistema</a>
        </div>
      </div>
    </section>
  )
}
