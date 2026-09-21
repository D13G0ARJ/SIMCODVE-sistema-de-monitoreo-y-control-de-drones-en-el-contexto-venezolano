import { useEffect, useRef } from 'react'
import { estado, reducirMovimiento, esMovil } from '../estado'

/* ------------------------------------------------------------------
   Enjambre de fondo en Canvas 2D con proyección en perspectiva.
   Sustituye a Three.js (600 KB) por ~4 KB: mismo aspecto, cero WebGL,
   cero dependencias. Lee `estado.fase` / `estado.jam` / `estado.opacidad`
   que GSAP mueve con el scroll (ver animaciones.js).
   Fases: 0 disperso, 1 patrullaje (anillo que rota), 2 defensa (anillo
   doble y quieto), 3 interferencia (25 % de nodos degradados),
   4 recuperación.
------------------------------------------------------------------- */

const DOS_PI = Math.PI * 2
const CAMARA_Z = 6
const CIAN = '34,211,238'
const ROJO = '244,63,94'

function sprite(rgb) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.28, `rgba(${rgb},.95)`)
  gr.addColorStop(0.6, `rgba(${rgb},.35)`)
  gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr
  g.fillRect(0, 0, 64, 64)
  return c
}

const suave = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x) }

export default function Enjambre() {
  const ref = useRef(null)

  useEffect(() => {
    const lienzo = ref.current
    const ctx = lienzo && lienzo.getContext('2d', { alpha: true })
    if (!ctx) { document.documentElement.classList.add('sin-enjambre'); return }

    const movil = esMovil()
    const reducido = reducirMovimiento()
    const N = movil ? 42 : 80
    const R = movil ? 0.95 : 1.7
    const ENLACE2 = (R * 0.34) ** 2
    const TAM = movil ? 0.13 : 0.15

    /* Generador determinista: la misma formación en cada visita. */
    let semilla = 20260621
    const azar = () => {
      semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0
      let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    const caja = new Float32Array(N * 3)
    const defensa = new Float32Array(N * 3)
    const ang = new Float32Array(N)
    const alt = new Float32Array(N)
    const brillo = new Float32Array(N)
    const umbral = new Float32Array(N)
    const esJam = new Uint8Array(N)
    const caido = new Uint8Array(N)
    const pos = new Float32Array(N * 3)
    const dib = new Float32Array(N * 3)   // posición dibujada (con vibración)
    const px = new Float32Array(N * 2)    // proyección en pantalla
    const pz = new Float32Array(N)        // escala por profundidad
    const kj = new Float32Array(N)        // grado de degradación

    let nInt = 0
    for (let i = 0; i < N; i++) if (i % 3 === 2) nInt++
    const nExt = N - nInt
    let iE = 0, iI = 0
    for (let i = 0; i < N; i++) {
      const i3 = i * 3
      ang[i] = (i / N) * DOS_PI + (azar() - 0.5) * 0.05
      alt[i] = (azar() - 0.5) * 0.18
      brillo[i] = 0.68 + azar() * 0.32
      caja[i3] = (azar() - 0.5) * R * 3.2
      caja[i3 + 1] = (azar() - 0.5) * R * 1.6
      caja[i3 + 2] = (azar() - 0.5) * R * 2.2
      const interno = i % 3 === 2
      let a, r, y
      if (interno) { a = (iI++ / nInt) * DOS_PI + 0.2; r = R * 0.36; y = alt[i] + 0.16 }
      else { a = (iE++ / nExt) * DOS_PI; r = R * 0.72; y = alt[i] }
      defensa[i3] = Math.cos(a) * r
      defensa[i3 + 1] = y
      defensa[i3 + 2] = Math.sin(a) * r
      const an = ((a % DOS_PI) + DOS_PI) % DOS_PI
      esJam[i] = an >= 0.35 && an < 0.35 + Math.PI / 2 ? 1 : 0
      umbral[i] = 0.3 + azar() * 0.45
    }

    const spCian = sprite(CIAN)
    const spRojo = sprite(ROJO)
    const obj = [0, 0, 0], objB = [0, 0, 0]
    const puntero = { x: 0, y: 0, ox: 0, oy: 0 }
    const desplazamiento = { x: 0, y: 0 }
    let w = 0, h = 0, rot = 0, giro = 0, rafId = 0, anterior = 0, t0 = 0

    function objetivo(fase, i, out) {
      const i3 = i * 3
      if (fase <= 0) { out[0] = caja[i3]; out[1] = caja[i3 + 1]; out[2] = caja[i3 + 2] }
      else if (fase === 1) { const a = ang[i] + rot; out[0] = Math.cos(a) * R; out[1] = alt[i]; out[2] = Math.sin(a) * R }
      else { out[0] = defensa[i3]; out[1] = defensa[i3 + 1]; out[2] = defensa[i3 + 2] }
    }

    function tamano() {
      w = window.innerWidth; h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr)
      lienzo.style.width = w + 'px'; lienzo.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      /* Móvil: el enjambre vive en el tercio superior; escritorio: a la derecha del texto. */
      if (w < 768) { desplazamiento.x = 0; desplazamiento.y = 1.05 }
      else { desplazamiento.x = Math.min(1.9, (w / h - 1) * 2.4); desplazamiento.y = 0 }
      if (reducido) { actualizar(0, 0, 1, 1); dibujar() }
    }

    function actualizar(dt, t, k, escala) {
      rot += dt * 0.00035
      giro += dt * 0.00004
      const f = Math.max(0, Math.min(4, estado.fase))
      const fa = Math.floor(f), ft = f - fa
      const jam = estado.jam

      for (let i = 0; i < N; i++) {
        const i3 = i * 3
        objetivo(fa, i, obj)
        if (ft > 0) {
          objetivo(fa + 1, i, objB)
          obj[0] += (objB[0] - obj[0]) * ft
          obj[1] += (objB[1] - obj[1]) * ft
          obj[2] += (objB[2] - obj[2]) * ft
        }
        pos[i3] += (obj[0] - pos[i3]) * k
        pos[i3 + 1] += (obj[1] - pos[i3 + 1]) * k
        pos[i3 + 2] += (obj[2] - pos[i3 + 2]) * k

        let g = 0
        if (esJam[i]) g = suave((jam - umbral[i] + 0.15) / 0.3)
        kj[i] = g
        caido[i] = g > 0.5 ? 1 : 0
        const tr = g * 0.045
        dib[i3] = pos[i3] + Math.sin(t * 0.9 + i * 1.7) * 0.02 + (tr ? Math.sin(t * 37 + i) * tr : 0)
        dib[i3 + 1] = pos[i3 + 1] + Math.cos(t * 0.7 + i * 2.3) * 0.02 + (tr ? Math.cos(t * 41 + i * 1.3) * tr : 0)
        dib[i3 + 2] = pos[i3 + 2] + Math.sin(t * 0.8 + i * 3.1) * 0.02 + (tr ? Math.sin(t * 29 + i * 0.7) * tr : 0)
      }

      /* Rotación del grupo (Y y luego inclinación X) + proyección en perspectiva. */
      puntero.x += (puntero.ox - puntero.x) * 0.05
      puntero.y += (puntero.oy - puntero.y) * 0.05
      const ry = giro + puntero.x * 0.15, rx = 0.75 + puntero.y * 0.1
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx)
      /* Cámara con 50° de campo vertical (como el prototipo): focal = (h/2) / tan(25°).
         El tamaño de los nodos usa h/2, igual que los puntos de Three.js. */
      const foco = (h / 2) / 0.4663
      const medio = h / 2
      for (let i = 0; i < N; i++) {
        const i3 = i * 3
        const x0 = dib[i3] * escala, y0 = dib[i3 + 1] * escala, z0 = dib[i3 + 2] * escala
        const x1 = x0 * cy + z0 * sy
        const z1 = -x0 * sy + z0 * cy
        const y2 = y0 * cx - z1 * sx
        const z2 = y0 * sx + z1 * cx
        const prof = CAMARA_Z - z2
        const s = foco / prof
        px[i * 2] = w / 2 + (x1 + desplazamiento.x) * s
        px[i * 2 + 1] = h / 2 - (y2 + desplazamiento.y) * s
        pz[i] = medio / prof
      }
    }

    function dibujar() {
      ctx.clearRect(0, 0, w, h)
      const op = estado.opacidad
      if (op <= 0.01) return

      /* Enlaces mesh por distancia (en espacio 3D); los nodos degradados los pierden. */
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        if (caido[i]) continue
        const i3 = i * 3
        const ix = dib[i3], iy = dib[i3 + 1], iz = dib[i3 + 2]
        for (let j = i + 1; j < N; j++) {
          if (caido[j]) continue
          const j3 = j * 3
          const dx = ix - dib[j3], dy = iy - dib[j3 + 1], dz = iz - dib[j3 + 2]
          if (dx * dx + dy * dy + dz * dz < ENLACE2) {
            ctx.moveTo(px[i * 2], px[i * 2 + 1])
            ctx.lineTo(px[j * 2], px[j * 2 + 1])
          }
        }
      }
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${CIAN},${0.22 * op})`
      ctx.stroke()

      /* Nodos: sprite radial, suma de luz. */
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < N; i++) {
        const x = px[i * 2], y = px[i * 2 + 1]
        const d = TAM * pz[i] * 1.35
        if (x < -d || y < -d || x > w + d || y > h + d) continue
        const a = brillo[i] * op
        const g = kj[i]
        if (g < 1) { ctx.globalAlpha = a * (1 - g); ctx.drawImage(spCian, x - d / 2, y - d / 2, d, d) }
        if (g > 0) { ctx.globalAlpha = a * g; ctx.drawImage(spRojo, x - d / 2, y - d / 2, d, d) }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    function cuadro(ahora) {
      rafId = requestAnimationFrame(cuadro)
      const dt = Math.min(48, ahora - anterior)
      anterior = ahora
      const p = Math.min(1, (ahora - t0) / 1200)
      const escala = 0.6 + 0.4 * (1 - Math.pow(2, -10 * p))
      actualizar(dt, ahora * 0.001, 1 - Math.pow(0.96, dt / 16.7), escala)
      dibujar()
    }
    function arrancar() {
      if (rafId || reducido) return
      anterior = performance.now()
      if (!t0) t0 = anterior
      rafId = requestAnimationFrame(cuadro)
    }
    function parar() { if (rafId) cancelAnimationFrame(rafId); rafId = 0 }
    const visibilidad = () => (document.hidden ? parar() : arrancar())
    const mover = (e) => {
      puntero.ox = (e.clientX / w - 0.5) * 2
      puntero.oy = (e.clientY / h - 0.5) * 2
    }

    /* Posición inicial. */
    const faseInicial = reducido ? 1 : 0
    for (let i = 0; i < N; i++) { objetivo(faseInicial, i, obj); pos[i * 3] = obj[0]; pos[i * 3 + 1] = obj[1]; pos[i * 3 + 2] = obj[2] }
    if (reducido) { estado.fase = 1; estado.opacidad = 0.5 }

    window.addEventListener('resize', tamano)
    tamano()
    if (!reducido) {
      document.addEventListener('visibilitychange', visibilidad)
      if (!movil) window.addEventListener('pointermove', mover, { passive: true })
      arrancar()
    }

    return () => {
      parar()
      window.removeEventListener('resize', tamano)
      document.removeEventListener('visibilitychange', visibilidad)
      window.removeEventListener('pointermove', mover)
    }
  }, [])

  return <canvas ref={ref} className="enjambre" aria-hidden="true" />
}
