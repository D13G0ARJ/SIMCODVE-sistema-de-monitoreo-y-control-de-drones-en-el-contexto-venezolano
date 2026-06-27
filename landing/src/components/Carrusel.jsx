import { useEffect, useRef, useState, useCallback } from 'react'
import { IconFlecha } from './icons'

/* Carrusel con scroll-snap nativo (swipe fluido en móvil) + flechas y
   puntos sincronizados. Muestra un "peek" del siguiente slide. */
export default function Carrusel({ slides }) {
  const trackRef = useRef(null)
  const [activo, setActivo] = useState(0)

  const irA = useCallback((i) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.children[i]
    if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }, [])

  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const centro = track.scrollLeft + track.clientWidth / 2
    let mejor = 0, dist = Infinity
    for (let i = 0; i < track.children.length; i++) {
      const c = track.children[i]
      const cc = c.offsetLeft - track.offsetLeft + c.clientWidth / 2
      const d = Math.abs(cc - centro)
      if (d < dist) { dist = d; mejor = i }
    }
    setActivo(mejor)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf
    const handler = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(onScroll) }
    track.addEventListener('scroll', handler, { passive: true })
    return () => { track.removeEventListener('scroll', handler); cancelAnimationFrame(raf) }
  }, [onScroll])

  const prev = () => irA(Math.max(0, activo - 1))
  const next = () => irA(Math.min(slides.length - 1, activo + 1))

  return (
    <div className="carrusel">
      <button className="carrusel-btn prev" onClick={prev} aria-label="Anterior" disabled={activo === 0}>
        <IconFlecha width={22} height={22} style={{ transform: 'rotate(180deg)' }} />
      </button>

      <div className="carrusel-track" ref={trackRef}>
        {slides.map((s, i) => (
          <figure className="carrusel-slide" key={i}>
            <div className="carrusel-img">
              <span className="carrusel-tag">{String(i + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
              <img src={`/sistema/${s.img}`} alt={s.t} loading="lazy" />
            </div>
            <figcaption>
              <b>{s.t}</b>
              {s.d && <span>{s.d}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <button className="carrusel-btn next" onClick={next} aria-label="Siguiente" disabled={activo === slides.length - 1}>
        <IconFlecha width={22} height={22} />
      </button>

      <div className="carrusel-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === activo ? 'on' : ''}`}
            onClick={() => irA(i)}
            aria-label={`Ir a la imagen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
