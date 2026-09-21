import { GithubLogo } from '@phosphor-icons/react'
import { PROBLEMA, RAICES, OBJETIVO_GENERAL, OBJETIVOS, ALCANCE, STACK, FASES, AUTORES } from '../datos'

/* Capítulo I: planteamiento del problema. */
export function Raices() {
  return (
    <section className="raices seccion">
      <div className="in">
        <h2>El problema</h2>
        <div className="prosa">
          <p>{PROBLEMA.contexto}</p>
          <p>{PROBLEMA.venezuela}</p>
        </div>
        <h3 className="sub">Cuatro raíces</h3>
        <ul className="raices-lista">
          {RAICES.map((r) => (
            <li key={r.h}><strong>{r.h}</strong><span>{r.p}</span></li>
          ))}
        </ul>
        <p className="consecuencia">{PROBLEMA.consecuencias}</p>
        <blockquote className="interrogante">
          <span className="meta">Interrogante principal</span>
          <p>{PROBLEMA.interrogante}</p>
        </blockquote>
      </div>
    </section>
  )
}

/* Capítulo I: objetivos, con la interrogante secundaria que responde cada específico, y alcance. */
export function Objetivos() {
  return (
    <section id="objetivos" className="seccion">
      <div className="in">
        <h2>Objetivos</h2>
        <span className="meta">Objetivo general</span>
        <p className="declaracion">{OBJETIVO_GENERAL}</p>
        <span className="meta sub">Objetivos específicos</span>
        <ol className="especificos">
          {OBJETIVOS.map((o) => (
            <li key={o.v}>
              <p className="pregunta">{o.q}</p>
              <h3><em>{o.v}</em> {o.h}</h3>
              <p>{o.p}</p>
            </li>
          ))}
        </ol>
        <h3 className="sub">Alcance y límites</h3>
        <ul className="alcance">
          {ALCANCE.map((a) => (
            <li key={a.h}><strong>{a.h}</strong><span>{a.p}</span></li>
          ))}
        </ul>
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
