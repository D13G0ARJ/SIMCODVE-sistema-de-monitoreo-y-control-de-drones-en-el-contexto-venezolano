/* Datos centrales de la landing. Todo lo que aparece en pantalla sale de aquí. */

export const URL_PUBLICA = 'https://simcodve.vercel.app' // cambiar por la URL real de Vercel

export const PDF = '/TEG-SIMCODVE-Rodriguez-Azocar.pdf'
export const PDF_META = 'PDF · 3,6 MB · 139 páginas'

export const GITHUB = {
  diego: 'https://github.com/D13G0ARJ',
  yoneiker: 'https://github.com/AlexanderAzocar',
  repo: 'https://github.com/D13G0ARJ/SIMCODVE-sistema-de-monitoreo-y-control-de-drones-en-el-contexto-venezolano',
}

export const LOGO = '/sistema/webp/unefa-72.webp'

export const TITULO_TESIS =
  'Diseño de un Sistema de Monitoreo y Control de Drones en el Contexto Venezolano: Un Enfoque Tecnológico para la Defensa, Disuasión e Innovación Híbrida'

export const NAV = [
  { id: 'problema', t: 'Problema' },
  { id: 'sistema', t: 'Sistema' },
  { id: 'resultados', t: 'Resultados' },
  { id: 'autores', t: 'Autores' },
]

/* Escenas de la historia del enjambre (sección El problema). */
export const ESCENAS = [
  { h: 'Un operador, todo el enjambre.', p: 'Cada dron decide con sus vecinos: sin líder, sin punto único de falla.' },
  { h: 'Cambio de modo, misma red.', p: 'Patrullaje, defensa o híbrido: el consenso reordena la formación en segundos.' },
  { h: 'Cae el enlace, no la misión.', p: 'Una zona de interferencia degrada nodos. El resto de la malla enruta y sigue operando.' },
  { h: 'Se recupera y sigue.', p: 'Conectividad, particiones y tiempo de recuperación se miden y se exportan.' },
]

/* Capítulo I: planteamiento del problema (redacción de la tesis, condensada). */
export const PROBLEMA = {
  contexto:
    'El despliegue de drones y las operaciones en enjambre transformaron la doctrina de defensa, vigilancia y disuasión a nivel global. El desafío ya no está solo en el hardware: está en arquitecturas de monitoreo y control capaces de gestionar múltiples unidades a la vez y de seguir operando ante ataques cibernéticos, fallas de comunicación o guerra electrónica.',
  venezuela:
    'En el contexto venezolano, y en la investigación que impulsa la UNEFA, el uso de plataformas no tripuladas sigue limitado por esquemas fragmentados, procesos manuales, enlaces de radio punto a punto donde un operador controla un solo vehículo, y software comercial cerrado que no está hecho para enjambres en red ni para la topografía y el entorno radioeléctrico nacional.',
  consecuencias:
    'Sin un sistema unificado y adaptable se limita la coordinación de operaciones en enjambre y con ella la capacidad de supervisión, respuesta y disuasión. En lo académico, el rezago en paradigmas como la arquitectura orientada a servicios (SOA) y los gemelos digitales frena la producción de conocimiento endógeno y la innovación tecnológica híbrida.',
  interrogante:
    '¿Cómo debe estructurarse el diseño conceptual y metodológico de un sistema de monitoreo y control de drones que fortalezca la defensa integral, la capacidad de disuasión militar y la innovación tecnológica híbrida en el contexto venezolano?',
}

export const RAICES = [
  { h: 'Acceso restringido', p: 'Restricciones comerciales, presupuestarias y tecnológicas dificultan el acceso a plataformas avanzadas de monitoreo y control.' },
  { h: 'Sin software soberano', p: 'Carencia de desarrollo propio orientado a arquitecturas distribuidas que respondan a las necesidades del contexto venezolano.' },
  { h: 'Baja resiliencia', p: 'Los sistemas convencionales fallan ante interferencias electromagnéticas, pérdida de nodos o interrupciones en los enlaces de datos.' },
  { h: 'Sin control descentralizado', p: 'Las unidades operan de forma vulnerable y se compromete la continuidad de misiones de vigilancia, reconocimiento o defensa.' },
]

export const OBJETIVO_GENERAL =
  'Diseñar conceptual y metodológicamente un sistema de monitoreo y control de drones articulado para el contexto venezolano, enfocado en el fortalecimiento de la defensa integral, la capacidad de disuasión militar y el fomento de la innovación tecnológica híbrida.'

/* Objetivos específicos con la interrogante secundaria que responde cada uno. */
export const OBJETIVOS = [
  {
    v: 'Analizar',
    h: 'los requerimientos operacionales',
    p: 'para determinar las especificaciones críticas del sistema de monitoreo y control.',
    q: '¿Cuáles son los requerimientos operacionales que definen las especificaciones críticas del sistema?',
  },
  {
    v: 'Desarrollar',
    h: 'una arquitectura de software orientada a servicios (SOA) y basada en gemelos digitales',
    p: 'que permita la simulación, supervisión y control de enjambres de drones en tiempo real.',
    q: '¿Qué características debe poseer una arquitectura SOA basada en gemelos digitales para simular, supervisar y controlar enjambres en tiempo real?',
  },
  {
    v: 'Formular',
    h: 'un modelo de control descentralizado y algoritmos de consenso',
    p: 'que garanticen la autonomía y la resiliencia del enjambre ante la pérdida de nodos de comunicación o interferencia electromagnética activa.',
    q: '¿Cómo se debe estructurar un modelo de control descentralizado y algoritmos de consenso que garanticen la autonomía y resiliencia del enjambre?',
  },
]

/* Alcance y limitaciones (Capítulo I). */
export const ALCANCE = [
  { h: 'Sin hardware', p: 'Diseño conceptual, arquitectura de software y simulación virtual. No hay prototipos físicos ni pruebas de vuelo.' },
  { h: 'Interferencia simulada', p: 'La resiliencia se valida con inyección de fallos controlados en el simulador, no con inhibidores reales.' },
  { h: 'Datos sintéticos', p: 'Telemetría y datos topográficos generados de forma sintética o de código abierto. Nada clasificado, ninguna frecuencia real.' },
]

/* Capturas reales del simulador (WebP, con variante móvil -m). */
export const PANTALLAS = [
  { img: 'g04_mapa_enjambres', t: 'Mapa táctico: enjambres sobre imágenes satelitales reales', alt: 'Mapa satelital de Los Teques con tres enjambres de drones y sus zonas asignadas' },
  { img: 'g10_radar', t: 'Vista de radar con anillos de distancia y barrido en vivo', alt: 'Vista de radar con anillos de distancia y barrido en vivo' },
  { img: 'g09_modo_defensa', t: 'Modo defensa: perímetro estático alrededor del objetivo', alt: 'Enjambre en modo defensa formando un anillo estático alrededor del objetivo' },
  { img: 'g11_interferencia', t: 'Interferencia: una zona de guerra electrónica degrada los nodos', alt: 'Zona roja de interferencia sobre el mapa degradando los nodos del enjambre' },
]

export const CAPACIDADES = [
  'Despliegue de enjambres sobre mapa satelital real',
  'Telemetría y gemelo digital de cada unidad: posición, velocidad, altitud, batería',
  'Modos patrullaje, defensa e híbrido',
  'Inyección de fallos y jamming',
  'Batería y retorno a base',
  'Alertas clasificadas',
  'Métricas e historial exportables: conectividad, cobertura, coherencia, recuperación',
  'Pausa, reanudar, reiniciar y escenarios reproducibles con semilla',
]

export const STACK =
  'React, Vite y Leaflet con imágenes Esri en la interfaz. Python y FastAPI con WebSocket de telemetría en el servidor. Docker para desplegar.'

export const RESULTADOS = [
  { v: 100, t: 'Necesidad del prototipo académico' },
  { v: 100, t: 'Contribución a la formación tecnológica' },
  { v: 100, t: 'Aporte a la soberanía tecnológica' },
  { v: 100, t: 'Utilidad de la interfaz tipo radar' },
  { v: 100, t: 'Ventajas de la arquitectura modular' },
  { v: 91.67, t: 'Relación con la defensa integral' },
  { v: 91.67, t: 'Adecuación de los datos sintéticos' },
]

export const FASES = ['Requerimientos', 'Diseño con el usuario', 'Construcción rápida', 'Transición y validación']

export const AUTORES = [
  { ini: 'DR', nom: 'Diego Rodríguez', gh: GITHUB.diego, user: 'D13G0ARJ' },
  { ini: 'YA', nom: 'Yoneiker Azocar', gh: GITHUB.yoneiker, user: 'AlexanderAzocar' },
]
