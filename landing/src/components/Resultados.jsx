import { RESULTADOS } from '../datos'

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')) + ' %'

export default function Resultados() {
  return (
    <section id="resultados" className="seccion">
      <div className="in">
        <h2>Resultados</h2>
        <span className="gigante num" data-valor="100" data-dec="0">{fmt(100)}</span>
        <p className="frase">de aceptación en necesidad, formación y soberanía tecnológica</p>
        <p className="meta">12 especialistas de la UNEFA, escala Likert</p>
        <ul className="fichas">
          {RESULTADOS.map((r) => (
            <li key={r.t}>
              <span className="valor num" data-valor={r.v} data-dec={Number.isInteger(r.v) ? 0 : 2}>{fmt(r.v)}</span>
              <span className="item">{r.t}</span>
            </li>
          ))}
        </ul>
        <p className="meta nota">8 de 12 ítems con aprobación unánime</p>
      </div>
    </section>
  )
}
