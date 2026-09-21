import { Check } from '@phosphor-icons/react'
import { PANTALLAS, CAPACIDADES } from '../datos'

/* Galería de capturas reales. En móvil es un carrusel nativo con scroll-snap
   (swipe con el pulgar, sin JS). En escritorio GSAP la pinea y la desplaza
   en horizontal con el scroll (ver animaciones.js). */
export default function Sistema() {
  return (
    <section id="sistema" className="sistema">
      <div className="galeria">
        <div className="in galeria-cab">
          <h2>El sistema</h2>
          <p>
            Un prototipo académico que simula enjambres de drones sobre el mapa satelital real de Venezuela:
            control descentralizado, red mesh, inyección de fallos y métricas de resiliencia.
          </p>
        </div>
        <div className="pista">
          {PANTALLAS.map((p) => (
            <figure className="panel" key={p.img}>
              <picture>
                <source media="(max-width:767px)" srcSet={`/sistema/webp/${p.img}-m.webp`} />
                <img src={`/sistema/webp/${p.img}.webp`} width="1680" height="945" loading="lazy" decoding="async" alt={p.alt} />
              </picture>
              <figcaption>{p.t}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="in capacidades">
        <h3>Ocho capacidades del prototipo</h3>
        <ul className="lista-check">
          {CAPACIDADES.map((c) => (
            <li key={c}><Check size={20} weight="bold" aria-hidden="true" /><span>{c}</span></li>
          ))}
        </ul>
      </div>
    </section>
  )
}
