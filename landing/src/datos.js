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

export const RAICES = [
  { h: 'Acceso restringido', p: 'Restricciones comerciales y presupuestarias a plataformas avanzadas.' },
  { h: 'Sin software soberano', p: 'Falta desarrollo propio y auditable para arquitecturas distribuidas.' },
  { h: 'Baja resiliencia', p: 'Los sistemas convencionales fallan ante interferencia o caída de enlaces.' },
  { h: 'Sin control descentralizado', p: 'Sin consenso ni autonomía, la misión depende de un punto único.' },
]

export const OBJETIVO_GENERAL =
  'Diseñar conceptual y metodológicamente un sistema de monitoreo y control de drones para el contexto venezolano, enfocado en la defensa integral, la disuasión y la innovación híbrida.'

export const OBJETIVOS = [
  { h: 'Requerimientos operacionales', p: 'Determinar las especificaciones críticas del sistema.' },
  { h: 'Arquitectura SOA y gemelos digitales', p: 'Diseñar una arquitectura orientada a servicios para simular y controlar enjambres en tiempo real.' },
  { h: 'Control descentralizado y consenso', p: 'Formular el modelo y los algoritmos que garantizan autonomía y resiliencia ante pérdida de nodos o interferencia.' },
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
