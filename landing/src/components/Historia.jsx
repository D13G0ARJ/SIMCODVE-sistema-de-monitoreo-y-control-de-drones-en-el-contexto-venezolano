import { ESCENAS } from '../datos'

/* El problema, contado por el enjambre. Cuatro escenas de texto que GSAP
   sincroniza con la fase del enjambre (ver animaciones.js). Sin JS, se leen
   apiladas como texto normal. */
export default function Historia() {
  return (
    <section id="problema" className="historia" aria-label="El problema">
      <div className="pegado">
        {ESCENAS.map((e) => (
          <div className="escena" key={e.h}>
            <div className="in">
              <h2>{e.h}</h2>
              <p>{e.p}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
