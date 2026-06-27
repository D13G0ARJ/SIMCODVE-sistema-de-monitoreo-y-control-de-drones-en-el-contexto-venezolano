import { lazy, Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconDescarga, IconGithub, IconFlecha } from './icons'
import { PDF, GITHUB } from '../datos'

const SwarmCanvas = lazy(() => import('./SwarmCanvas'))

const aparece = {
  hidden: { opacity: 0, y: 30 },
  show: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.21, 0.6, 0.27, 1] } }),
}

export default function Hero() {
  const reduce = useReducedMotion()
  return (
    <header className="hero" id="top">
      {!reduce && (
        <div className="hero-canvas" aria-hidden="true">
          <Suspense fallback={null}>
            <SwarmCanvas />
          </Suspense>
        </div>
      )}
      <div className="hero-fade" aria-hidden="true" />

      <div className="contenedor hero-inner">
        <motion.div className="hero-badges" initial="hidden" animate="show">
          <motion.span className="chip" custom={0} variants={aparece}><span className="punto-vivo" /> Trabajo Especial de Grado</motion.span>
          <motion.span className="chip" custom={1} variants={aparece}>UNEFA · Ingeniería de Sistemas</motion.span>
          <motion.span className="chip" custom={2} variants={aparece}>Los Teques · Junio 2026</motion.span>
        </motion.div>

        <motion.h1 custom={3} variants={aparece} initial="hidden" animate="show">
          Monitoreo y control de <span className="grad">enjambres de drones</span> para la defensa nacional
        </motion.h1>

        <motion.p className="hero-sub" custom={4} variants={aparece} initial="hidden" animate="show">
          <b style={{ color: 'var(--tx)' }}>SIMCODVE</b> es un prototipo de simulación con control descentralizado,
          algoritmos de consenso y resiliencia ante la guerra electrónica. Software soberano, auditable y
          100% datos sintéticos.
        </motion.p>

        <motion.div className="hero-meta" custom={5} variants={aparece} initial="hidden" animate="show">
          <span>Autores: <b>Diego Rodríguez</b> · <b>Yoneiker Azocar</b></span>
          <span>Tutor: <b>Rodolfo Caccamo</b></span>
        </motion.div>

        <motion.div className="hero-cta" custom={6} variants={aparece} initial="hidden" animate="show">
          <a className="btn btn-primario" href={PDF} download>
            <IconDescarga width={19} height={19} /> Descargar tesis (PDF)
          </a>
          <a className="btn btn-fantasma" href="#sistema">
            Explorar el sistema <IconFlecha width={18} height={18} />
          </a>
          <a className="btn btn-fantasma" href={GITHUB.repo} target="_blank" rel="noreferrer">
            <IconGithub width={18} height={18} /> Ver repositorio
          </a>
        </motion.div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <div className="raton" />
        <span>Scroll</span>
      </div>
    </header>
  )
}
