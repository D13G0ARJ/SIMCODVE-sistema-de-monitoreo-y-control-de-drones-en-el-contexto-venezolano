import { motion } from 'framer-motion'
import Reveal, { Stagger, itemUp } from './Reveal'
import Contador from './Contador'
import Tilt from './Tilt'
import Aurora from './Aurora'
import {
  IconCheck, IconX, IconFlecha, IconDron, IconConsenso, IconCapas, IconGemelo,
  IconRed, IconResiliencia, IconRadar, IconSoberania, IconEscudo, IconAlerta,
} from './icons'

/* ============================ ESTADÍSTICAS ============================ */
const stats = [
  { n: 100, u: '%', d: 'Aceptación en necesidad, formación y soberanía tecnológica' },
  { n: 8, sep: '/12', d: 'Ítems del estudio con aprobación unánime de los expertos' },
  { n: 12, u: '', d: 'Especialistas UNEFA validaron la propuesta (de 25)' },
  { n: 0, u: '', d: 'Drones físicos, frecuencias o datos reales: todo sintético' },
]

export function Stats() {
  return (
    <section className="seccion" style={{ paddingTop: 0 }}>
      <div className="contenedor">
        <Stagger className="stats-banda">
          {stats.map((s, i) => (
            <motion.div className="stat-celda" key={i} variants={itemUp}>
              <div className="stat-num">
                <Contador valor={s.n} />{s.sep && <span style={{ WebkitTextFillColor: 'rgba(107,124,149,.7)' }}>{s.sep}</span>}{s.u && <span className="u">{s.u}</span>}
              </div>
              <div className="stat-lbl">{s.d}</div>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ============================ PROBLEMA ============================ */
const antes = [
  'Un operador controla un solo dron (enlace punto a punto)',
  'Software comercial cerrado y dependiente del exterior',
  'Punto único de falla: si cae el enlace, cae la misión',
  'Vulnerable a interferencia y guerra electrónica',
]
const ahora = [
  'Un operador coordina el enjambre completo en red',
  'Software propio, soberano y auditable',
  'Control descentralizado: sin punto único de falla',
  'Resiliencia ante pérdida de nodos e interferencia',
]

// Raíces del problema (Capítulo I de la tesis)
const causas = [
  { Ico: IconAlerta, h: 'Acceso restringido', p: 'Restricciones comerciales, presupuestarias y tecnológicas dificultan el acceso a plataformas avanzadas de monitoreo y control.' },
  { Ico: IconSoberania, h: 'Sin software soberano', p: 'Falta desarrollo propio y auditable orientado a arquitecturas distribuidas y adaptado al contexto venezolano.' },
  { Ico: IconResiliencia, h: 'Baja resiliencia', p: 'Los sistemas convencionales fallan ante interferencia electromagnética, pérdida de nodos o caída de los enlaces de datos.' },
  { Ico: IconRed, h: 'Sin control descentralizado', p: 'Sin consenso ni autonomía, las unidades operan de forma vulnerable y comprometen la continuidad de la misión.' },
]

export function Problema() {
  return (
    <section className="seccion" id="problema">
      <div className="contenedor">
        <Reveal><span className="kicker">El problema</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">El desafío ya no es el <span className="acento">hardware</span>, es el software</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">
            El despliegue de drones y las operaciones en enjambre transformaron la doctrina de defensa, vigilancia
            y disuasión a nivel global. El reto contemporáneo no está en construir el dron, sino en la arquitectura
            de software capaz de monitorear y controlar muchas unidades a la vez, garantizando su operatividad ante
            ataques cibernéticos, fallas de comunicación o guerra electrónica. En Venezuela —y en la UNEFA— esa
            capacidad soberana aún no existe.
          </p>
        </Reveal>

        {/* Raíces del problema */}
        <Reveal className="sub-rotulo">
          <span className="kicker">Las raíces</span>
          <h3>¿Por qué ocurre?</h3>
        </Reveal>
        <Stagger className="causas" gap={0.06}>
          {causas.map((c, i) => (
            <Tilt className="causa tarjeta" key={i} max={5} variants={itemUp}>
              <div className="causa-ico"><c.Ico width={22} height={22} /></div>
              <div>
                <h4>{c.h}</h4>
                <p>{c.p}</p>
              </div>
            </Tilt>
          ))}
        </Stagger>

        {/* Cambio de paradigma */}
        <Reveal className="sub-rotulo">
          <span className="kicker">El cambio de paradigma</span>
          <h3>Del control punto a punto al enjambre en red</h3>
        </Reveal>
        <div className="comparativa">
          <Reveal className="comp-card antes">
            <h4><IconX width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Situación actual</h4>
            <div className="comp-big">1 operador → 1 dron</div>
            <ul>
              {antes.map((t, i) => (
                <li key={i}><IconX width={17} height={17} style={{ color: 'var(--rojo)' }} /><span>{t}</span></li>
              ))}
            </ul>
          </Reveal>

          <div className="comp-flecha"><IconFlecha width={30} height={30} /></div>

          <Reveal delay={0.12} className="comp-card ahora">
            <h4><IconCheck width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Propuesta SIMCODVE</h4>
            <div className="comp-big">1 operador → enjambre en red</div>
            <ul>
              {ahora.map((t, i) => (
                <li key={i}><IconCheck width={17} height={17} style={{ color: 'var(--verde)' }} /><span>{t}</span></li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Interrogante central */}
        <Reveal className="sub-rotulo">
          <span className="kicker">La pregunta que guía la tesis</span>
        </Reveal>
        <Reveal className="interrogante">
          <span className="qmark" aria-hidden="true">?</span>
          <span className="et">Interrogante principal</span>
          <p>
            ¿Cómo debe estructurarse el diseño conceptual y metodológico de un sistema de monitoreo y control de
            drones que fortalezca la defensa integral, la capacidad de disuasión militar y la innovación tecnológica
            híbrida en el contexto venezolano?
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================ OBJETIVOS ============================ */
const especificos = [
  { h: 'Requerimientos operacionales', p: 'Analizar y determinar las especificaciones críticas del sistema de monitoreo y control.' },
  { h: 'Arquitectura SOA + gemelos digitales', p: 'Diseñar una arquitectura orientada a servicios para simular y controlar enjambres en tiempo real.' },
  { h: 'Control descentralizado y consenso', p: 'Formular un modelo y algoritmos que garanticen autonomía y resiliencia ante pérdida de nodos o interferencia.' },
]

export function Objetivos() {
  return (
    <section className="seccion" id="objetivos" style={{ paddingTop: 0 }}>
      <div className="contenedor">
        <Reveal><span className="kicker">Objetivos</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Qué propone <span className="acento">la investigación</span></h2>
        </Reveal>

        <Reveal delay={0.1} className="obj-general">
          <span className="et">Objetivo general</span>
          <p>
            Diseñar conceptual y metodológicamente un sistema de monitoreo y control de drones para el contexto
            venezolano, enfocado en la defensa integral, la disuasión militar y la innovación tecnológica híbrida.
          </p>
        </Reveal>

        <Reveal className="sub-rotulo">
          <span className="kicker">Objetivos específicos</span>
          <h3>Tres metas para lograrlo</h3>
        </Reveal>
        <Stagger className="obj-grid">
          {especificos.map((o, i) => (
            <Tilt className="obj-card tarjeta" key={i} variants={itemUp}>
              <div className="obj-top">
                <div className="obj-num">0{i + 1}</div>
                <span className="obj-tag">Objetivo específico</span>
              </div>
              <h4>{o.h}</h4>
              <p>{o.p}</p>
            </Tilt>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ============================ CONCEPTOS ============================ */
const cards = [
  { Ico: IconDron, h: 'Enjambres de drones', p: 'Conjunto de UAV que operan coordinada y distribuidamente para una misión común, con comportamiento colectivo emergente.' },
  { Ico: IconConsenso, h: 'Algoritmos de consenso', p: 'Permiten que múltiples nodos acuerden una decisión común —dirección, formación— sin un controlador central.' },
  { Ico: IconRed, h: 'Control descentralizado', p: 'Distribuye la toma de decisiones entre los nodos: elimina el punto único de falla y sostiene la operación.' },
  { Ico: IconCapas, h: 'Arquitectura SOA', p: 'Organiza el sistema como servicios independientes e interoperables: telemetría, simulación, visualización, alertas.' },
  { Ico: IconGemelo, h: 'Gemelo digital', p: 'Representación virtual de cada unidad que reproduce su comportamiento para simular y analizar sin equipos reales.' },
  { Ico: IconRadar, h: 'Telemetría sintética', p: 'Datos generados artificialmente —posición, batería, señal, estado— que alimentan el modelo sin información clasificada.' },
  { Ico: IconResiliencia, h: 'Redes mesh y resiliencia', p: 'Cada nodo enruta a otros: rutas alternativas y tolerancia a fallos para mantener la misión ante interferencia.' },
  { Ico: IconSoberania, h: 'Soberanía tecnológica', p: 'Capacidad de desarrollar y controlar tecnología propia y auditable, reduciendo la dependencia externa.' },
  { Ico: IconEscudo, h: 'Defensa integral y disuasión', p: 'Prevenir amenazas mediante preparación y fortaleza tecnológica, abordadas de forma defensiva, no ofensiva.' },
]

export function Conceptos() {
  return (
    <section className="seccion" id="conceptos">
      <Aurora />
      <div className="contenedor">
        <Reveal><span className="kicker">Marco teórico</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="titulo-seccion">Los pilares <span className="acento">conceptuales</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="subtitulo-seccion">Nueve ideas que sostienen el diseño del sistema, del enjambre biológico a la soberanía del software.</p>
        </Reveal>

        <Stagger className="conceptos-grid" gap={0.06}>
          {cards.map((c, i) => (
            <Tilt className="concepto tarjeta" key={i} variants={itemUp}>
              <div className="concepto-ico"><c.Ico width={24} height={24} /></div>
              <h4>{c.h}</h4>
              <p>{c.p}</p>
            </Tilt>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
