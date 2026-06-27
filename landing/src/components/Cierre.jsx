import { lazy, Suspense, useRef, useEffect, useState } from 'react'
import { motion, useReducedMotion, useInView } from 'framer-motion'
import Reveal, { Stagger, itemUp } from './Reveal'
import Tilt from './Tilt'
import Aurora from './Aurora'
import { IconDescarga, IconGithub, IconRadar } from './icons'
import { PDF, GITHUB, LOGO } from '../datos'

const SwarmCanvas = lazy(() => import('./SwarmCanvas'))

/* ============================ STACK ============================ */
const stack = [
  { g: 'R', nom: 'React', rol: 'Interfaz' },
  { g: '{ }', nom: 'FastAPI', rol: 'Backend' },
  { g: '≈', nom: 'Tailwind', rol: 'Estilos' },
  { g: '◳', nom: 'Docker', rol: 'Despliegue' },
  { g: 'Z', nom: 'Zod', rol: 'Validación' },
  { g: '◎', nom: 'Leaflet · Esri', rol: 'Mapa satelital' },
]

export function Stack() {
  return (
    <section className="seccion" id="stack" style={{ paddingTop: 0 }}>
      <div className="contenedor">
        <Reveal><span className="kicker">Stack soberano</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Construido con <span className="acento">software libre</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">Herramientas abiertas y auditables que corren en un equipo convencional desde el navegador. Sin cajas negras, sin dependencia del exterior.</p>
        </Reveal>

        <Stagger className="stack-grid" gap={0.05}>
          {stack.map((s, i) => (
            <Tilt className="stack-item tarjeta" key={i} max={12} variants={itemUp}>
              <div className="stack-glyph">{s.g}</div>
              <div className="nom">{s.nom}</div>
              <div className="rol">{s.rol}</div>
            </Tilt>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ============================ RESULTADOS ============================ */
const barras = [
  { nom: 'Necesidad del prototipo académico', val: 100 },
  { nom: 'Contribución a la formación tecnológica', val: 100 },
  { nom: 'Aporte a la soberanía tecnológica', val: 100 },
  { nom: 'Utilidad de la interfaz tipo radar', val: 100 },
  { nom: 'Ventajas de la arquitectura modular', val: 100 },
  { nom: 'Relación con la defensa integral', val: 91.67 },
  { nom: 'Adecuación de los datos sintéticos', val: 91.67 },
]

/* Contador ligero (sin ref propio); arranca cuando `activo` es true. */
function ValorAnim({ valor, decimales = 0, activo, retraso = 0 }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!activo) return
    if (reduce) { setN(valor); return }
    let raf, t0
    const dur = 1300
    const tick = (t) => {
      if (t0 == null) t0 = t + retraso * 1000
      if (t < t0) { raf = requestAnimationFrame(tick); return }
      const p = Math.min((t - t0) / dur, 1)
      setN(valor * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [activo, valor, reduce, retraso])
  return <>{n.toFixed(decimales)}</>
}

function Barra({ nom, val, activo, index }) {
  const reduce = useReducedMotion()
  return (
    <div className="res-bar">
      <div className="top">
        <span className="nom">{nom}</span>
        <span className="val"><ValorAnim valor={val} decimales={val % 1 ? 2 : 0} activo={activo} retraso={index * 0.05} />%</span>
      </div>
      <div className="res-track">
        <motion.div
          className="res-fill"
          initial={false}
          animate={{ width: activo || reduce ? `${val}%` : '0%' }}
          transition={{ duration: 1.1, delay: index * 0.05, ease: [0.21, 0.6, 0.27, 1] }}
        />
      </div>
    </div>
  )
}

export function Resultados() {
  const ref = useRef(null)
  const enVista = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section className="seccion" id="resultados">
      <Aurora />
      <div className="contenedor">
        <Reveal><span className="kicker">Validación</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">El jurado experto <span className="acento">lo respalda</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">
            Encuesta tipo Likert a 12 informantes de la UNEFA (docentes, estudiantes avanzados y personal de
            defensa). La mayoría de los ítems superó el 90% de aprobación y ocho alcanzaron el 100%.
          </p>
        </Reveal>

        <div className="res-layout" style={{ marginTop: 44 }} ref={ref}>
          <Reveal className="res-destacado">
            <div className="gigante"><ValorAnim valor={100} activo={enVista} />%</div>
            <div className="pie">de aceptación en necesidad, formación y soberanía tecnológica</div>
          </Reveal>
          <div className="res-bars">
            {barras.map((b, i) => <Barra key={i} {...b} activo={enVista} index={i} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================ METODOLOGÍA ============================ */
const fases = [
  { n: 'Fase 01', h: 'Requerimientos', p: 'Planificación y análisis de las necesidades operacionales del sistema.' },
  { n: 'Fase 02', h: 'Diseño con el usuario', p: 'Modelado de arquitectura y validación con los actores académicos.' },
  { n: 'Fase 03', h: 'Construcción rápida', p: 'Desarrollo iterativo del prototipo funcional SIMCODVE.' },
  { n: 'Fase 04', h: 'Transición y validación', p: 'Pruebas, validación por expertos y exportación de resultados.' },
]

export function Metodologia() {
  return (
    <section className="seccion" id="metodologia" style={{ paddingTop: 0 }}>
      <div className="contenedor">
        <Reveal><span className="kicker">Metodología</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Proyecto factible · <span className="acento">desarrollo RAD</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">Enfoque cuantitativo, aplicado y tecnológico-proyectivo. El prototipo se construyó bajo Desarrollo Rápido de Aplicaciones en cuatro fases.</p>
        </Reveal>

        <Stagger className="fases" gap={0.08}>
          {fases.map((f, i) => (
            <Tilt className="fase tarjeta" key={i} variants={itemUp}>
              <div className="fase-n">{f.n}</div>
              <h4>{f.h}</h4>
              <p>{f.p}</p>
              <div className="fase-linea"><IconRadar width={16} height={16} /></div>
            </Tilt>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ============================ AUTORES ============================ */
const autores = [
  { ini: 'DR', nom: 'Diego Rodríguez', sub: 'Diego Armando Rodríguez Jiménez', gh: GITHUB.diego, user: 'D13G0ARJ' },
  { ini: 'YA', nom: 'Yoneiker Azocar', sub: 'Yoneiker Alexander Azocar Lozano', gh: GITHUB.yoneiker, user: 'AlexanderAzocar' },
]

export function Autores() {
  return (
    <section className="seccion" id="autores">
      <div className="contenedor">
        <Reveal><span className="kicker">Quiénes</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Autores de <span className="acento">la investigación</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">Aspirantes al título de Ingeniero de Sistemas · UNEFA, Núcleo Altos Mirandinos.</p>
        </Reveal>

        <Stagger className="autores-grid">
          {autores.map((a, i) => (
            <Tilt className="autor tarjeta" key={i} max={6} variants={itemUp}>
              <div className="autor-top">
                <div className="autor-avatar">{a.ini}</div>
                <div>
                  <h4>{a.nom}</h4>
                  <div className="rol">{a.sub}</div>
                </div>
              </div>
              <div className="autor-links">
                <a className="autor-link" href={a.gh} target="_blank" rel="noreferrer">
                  <IconGithub width={17} height={17} /> github.com/{a.user}
                </a>
              </div>
            </Tilt>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <p className="tutor-nota">Tutor: <b>Rodolfo Antonio Caccamo Bernal</b> · Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana</p>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================ DESCARGA ============================ */
export function Descarga() {
  const reduce = useReducedMotion()
  return (
    <section className="seccion" id="descarga" style={{ paddingTop: 0 }}>
      <div className="contenedor">
        <Reveal>
          <div className="descarga">
            {!reduce && (
              <div className="descarga-canvas" aria-hidden="true">
                <Suspense fallback={null}><SwarmCanvas /></Suspense>
              </div>
            )}
            <span className="kicker" style={{ justifyContent: 'center', display: 'inline-flex' }}>Documento completo</span>
            <h2>Lee la tesis completa</h2>
            <p>139 páginas de investigación: marco teórico, arquitectura, control descentralizado, validación por expertos y el prototipo SIMCODVE. Descárgala en PDF.</p>
            <div className="descarga-cta">
              <a className="btn btn-primario" href={PDF} download>
                <IconDescarga width={20} height={20} /> Descargar tesis (PDF)
              </a>
              <a className="btn btn-fantasma" href={GITHUB.repo} target="_blank" rel="noreferrer">
                <IconGithub width={18} height={18} /> Ver repositorio
              </a>
            </div>
            <div className="meta-pdf">PDF · ~18,6 MB · UNEFA · Los Teques, junio 2026</div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================ FOOTER ============================ */
export function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer-row">
          <div className="footer-brand">
            <div className="footer-marca">
              <img src={LOGO} alt="UNEFA" />
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.01em' }}>SIMCODVE</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10.5px', color: 'var(--tx-3)', letterSpacing: '0.12em' }}>UNEFA · 2026</div>
              </div>
            </div>
            <p className="footer-desc">
              Sistema de Monitoreo y Control de Drones en el Contexto Venezolano. Un enfoque tecnológico para la
              defensa, disuasión e innovación híbrida.
            </p>
          </div>

          <div className="footer-cols">
            <div>
              <h5>Secciones</h5>
              <a href="#problema">El problema</a>
              <a href="#conceptos">Conceptos</a>
              <a href="#sistema">El sistema</a>
              <a href="#resultados">Resultados</a>
            </div>

            <div>
              <h5>Enlaces</h5>
              <a href={PDF} download>Descargar tesis (PDF)</a>
              <a href={GITHUB.repo} target="_blank" rel="noreferrer">Repositorio del proyecto</a>
              <a href={GITHUB.diego} target="_blank" rel="noreferrer">GitHub · Diego</a>
              <a href={GITHUB.yoneiker} target="_blank" rel="noreferrer">GitHub · Yoneiker</a>
            </div>
          </div>
        </div>

        <div className="footer-base">
          <span>© 2026 · Diego Rodríguez &amp; Yoneiker Azocar · UNEFA</span>
          <span className="aviso-sintetico"><IconRadar width={14} height={14} /> Prototipo académico · 100% datos sintéticos</span>
        </div>
      </div>
    </footer>
  )
}
