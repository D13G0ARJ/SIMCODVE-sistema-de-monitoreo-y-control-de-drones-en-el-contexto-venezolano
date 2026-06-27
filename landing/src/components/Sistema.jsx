import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Reveal, { Stagger, itemUp } from './Reveal'
import Tilt from './Tilt'
import Carrusel from './Carrusel'
import {
  IconRadar, IconEscudo, IconRayo, IconBateria, IconAlerta,
  IconExportar, IconPausa, IconEnjambre, IconGemelo,
} from './icons'

const slides = [
  { img: 'g04_mapa_enjambres.png', t: 'Mapa táctico', d: 'Enjambres desplegados sobre imágenes satelitales reales.' },
  { img: 'g10_radar.png', t: 'Vista de radar', d: 'Barrido en vivo con anillos, trayectorias y zona protegida.' },
  { img: 'g09_modo_defensa.png', t: 'Modo Defensa', d: 'Perímetro estático de protección alrededor del objetivo.' },
  { img: 'g11_interferencia.png', t: 'Interferencia (jamming)', d: 'Zona de guerra electrónica que degrada los nodos internos.' },
  { img: 'g01_pantalla_principal.png', t: 'Pantalla principal', d: 'Herramientas, panel de control y telemetría en un vistazo.' },
  { img: 'g02_biblioteca_escenarios.png', t: 'Biblioteca de escenarios', d: 'Escenarios preconfigurados, reproducibles con semilla.' },
  { img: 'g03_despliegue_escenario.png', t: 'Despliegue de escenario', d: 'Configura unidades, zonas y condiciones de la misión.' },
  { img: 'g12_pausa.png', t: 'Control de simulación', d: 'Pausa, reanuda y reinicia el ciclo en cualquier momento.' },
]

const capacidades = [
  { Ico: IconEnjambre, b: 'Despliegue de enjambres', s: 'Configura unidades, zonas y modos de operación sobre mapa satelital real.' },
  { Ico: IconGemelo, b: 'Telemetría y gemelo digital', s: 'Posición, velocidad, altitud, batería y trayectoria de cada unidad en tiempo real.' },
  { Ico: IconEscudo, b: 'Modos: patrullaje, defensa, híbrido', s: 'Comportamiento decentralizado tipo Boids con consenso de rumbo entre vecinos.' },
  { Ico: IconRayo, b: 'Inyección de fallos y jamming', s: 'Elimina nodos o activa interferencia para estudiar la resiliencia del enjambre.' },
  { Ico: IconBateria, b: 'Batería y retorno a base (RTB)', s: 'Consumo en misión, recarga en base y retorno automático con batería baja.' },
  { Ico: IconAlerta, b: 'Alertas clasificadas', s: 'Batería baja, pérdida de comunicación, salida de zona o falla simulada.' },
  { Ico: IconExportar, b: 'Métricas e historial exportables', s: 'Conectividad, cobertura, coherencia y recuperación, en CSV o JSON.' },
  { Ico: IconPausa, b: 'Control total y modo headless', s: 'Pausa, reanuda, reinicia y reproduce escenarios bit a bit con semilla.' },
]

export default function Sistema() {
  const reduce = useReducedMotion()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-7%', '7%'])

  return (
    <section className="seccion" id="sistema">
      <div className="contenedor">
        <Reveal><span className="kicker">El sistema · SIMCODVE</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Un simulador táctico <span className="acento">sobre Venezuela real</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">
            Prototipo funcional construido con metodología RAD. Despliega enjambres con datos sintéticos sobre
            imágenes satelitales reales, visualiza telemetría e interferencia, y exporta métricas de resiliencia.
          </p>
        </Reveal>

        {/* Captura principal */}
        <Reveal delay={0.05}>
          <div className="sistema-hero" style={{ marginTop: 40 }} ref={heroRef}>
            <div className="marco-top">
              <span className="dot" style={{ background: '#F43F5E' }} />
              <span className="dot" style={{ background: '#FBBF24' }} />
              <span className="dot" style={{ background: '#34D399' }} />
              <span className="marco-lbl">simcodve · vista nacional</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <motion.img
                src="/sistema/g13_vista_nacional.png"
                alt="Vista nacional del territorio con enjambres desplegados sobre el mapa satelital de Venezuela"
                loading="lazy"
                style={{ y: imgY, scale: 1.14 }}
              />
            </div>
          </div>
        </Reveal>

        {/* Carrusel de capturas */}
        <Reveal delay={0.05}>
          <Carrusel slides={slides} />
        </Reveal>

        {/* Capacidades */}
        <Reveal delay={0.05}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.3rem,4vw,1.8rem)', marginTop: 64, letterSpacing: '-0.01em' }}>
            Capacidades del prototipo
          </h3>
        </Reveal>
        <Stagger className="capacidades" gap={0.05}>
          {capacidades.map((c, i) => (
            <Tilt className="cap" key={i} max={5} variants={itemUp}>
              <div className="cap-ico"><c.Ico width={19} height={19} /></div>
              <div>
                <b>{c.b}</b>
                <span>{c.s}</span>
              </div>
            </Tilt>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
