import { GithubLogo } from '@phosphor-icons/react'
import { RAICES, OBJETIVO_GENERAL, OBJETIVOS, STACK, FASES, AUTORES } from '../datos'

export function Raices() {
  return (
    <section className="raices seccion">
      <div className="in">
        <h2>Cuatro raíces del problema</h2>
        <p className="intro">
          El reto ya no es construir el dron sino el software que monitorea y controla muchas unidades a la
          vez y sigue operando ante fallas de enlace, pérdida de nodos o guerra electrónica. En Venezuela esa
          capacidad soberana aún no existe.
        </p>
        <ul className="raices-lista">
          {RAICES.map((r) => (
            <li key={r.h}><strong>{r.h}</strong><span>{r.p}</span></li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Objetivos() {
  return (
    <section id="objetivos" className="seccion">
      <div className="in">
        <h2>Objetivos</h2>
        <p className="declaracion">{OBJETIVO_GENERAL}</p>
        <div className="especificos">
          {OBJETIVOS.map((o) => (
            <div key={o.h}>
              <h3>{o.h}</h3>
              <p>{o.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Libre() {
  return (
    <section className="libre seccion">
      <div className="in">
        <h2>Software libre</h2>
        <p className="stack">{STACK}</p>
      </div>
    </section>
  )
}

export function Metodologia() {
  return (
    <section className="metodo seccion">
      <div className="in">
        <h2>Metodología</h2>
        <p className="intro">
          Proyecto factible, de enfoque cuantitativo, aplicado y tecnológico-proyectivo, con Desarrollo Rápido
          de Aplicaciones (RAD) en cuatro fases.
        </p>
        <ol className="pasos">
          {FASES.map((f) => <li key={f}>{f}</li>)}
        </ol>
      </div>
    </section>
  )
}

export function Autores() {
  return (
    <section id="autores" className="seccion">
      <div className="in">
        <h2>Autores</h2>
        <div className="duo">
          {AUTORES.map((a) => (
            <div className="autor" key={a.user}>
              <div className="inicial" aria-hidden="true">{a.ini}</div>
              <div>
                <h3>{a.nom}</h3>
                <p>Aspirante a Ingeniero de Sistemas</p>
                <a href={a.gh} target="_blank" rel="noopener">
                  <GithubLogo size={18} aria-hidden="true" />github.com/{a.user}
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="tutor">Tutor: Rodolfo Caccamo. UNEFA, Núcleo Altos Mirandinos.</p>
      </div>
    </section>
  )
}
