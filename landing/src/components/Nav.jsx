import { LOGO, NAV, PDF } from '../datos'

export default function Nav() {
  return (
    <header className="nav">
      <div className="in nav-in">
        <a className="marca" href="#top" aria-label="SIMCODVE, inicio">
          <img src={LOGO} width="58" height="72" alt="" />
          <span>SIMCODVE</span>
        </a>
        <nav className="nav-enlaces" aria-label="Secciones">
          {NAV.map((e) => <a key={e.id} href={`#${e.id}`}>{e.t}</a>)}
        </nav>
        <a className="boton primario nav-cta" href={PDF} target="_blank" rel="noopener">Ver tesis en PDF</a>
      </div>
    </header>
  )
}

/* Barra inferior fija en móvil: aparece cuando el hero sale de pantalla. */
export function BarraInferior() {
  return (
    <div className="barra">
      <a className="boton primario" href={PDF} target="_blank" rel="noopener">Ver tesis en PDF</a>
    </div>
  )
}
