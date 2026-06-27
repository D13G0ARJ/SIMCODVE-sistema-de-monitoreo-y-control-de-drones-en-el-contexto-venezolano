import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { IconDescarga } from './icons'
import { PDF, LOGO } from '../datos'

const enlaces = [
  { id: 'problema', t: 'Problema' },
  { id: 'conceptos', t: 'Conceptos' },
  { id: 'sistema', t: 'Sistema' },
  { id: 'resultados', t: 'Resultados' },
  { id: 'autores', t: 'Autores' },
]

export default function Nav() {
  const [solido, setSolido] = useState(false)
  const { scrollYProgress } = useScroll()
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    const onScroll = () => setSolido(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.div className="progreso" style={{ scaleX: x, right: 0 }} />
      <nav className={`nav ${solido ? 'solido' : ''}`}>
        <div className="contenedor nav-row">
          <a href="#top" className="marca">
            <img src={LOGO} alt="UNEFA" />
            <div>
              <b>SIMCODVE</b>
              <span>UNEFA · 2026</span>
            </div>
          </a>
          <div className="nav-links">
            {enlaces.map((e) => (
              <a key={e.id} href={`#${e.id}`}>{e.t}</a>
            ))}
          </div>
          <a className="btn btn-primario nav-cta" href={PDF} download>
            <IconDescarga width={18} height={18} /> Descargar tesis
          </a>
        </div>
      </nav>
    </>
  )
}
