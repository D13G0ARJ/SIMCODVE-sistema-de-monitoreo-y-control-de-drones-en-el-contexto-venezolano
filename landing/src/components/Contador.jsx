import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/* Cuenta animada de 0 a `valor` cuando entra en viewport. */
export default function Contador({ valor, decimales = 0, duracion = 1500 }) {
  const ref = useRef(null)
  const enVista = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!enVista) return
    if (reduce) { setN(valor); return }
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min((t - t0) / duracion, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setN(valor * ease)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enVista, valor, duracion, reduce])

  return <span ref={ref}>{n.toFixed(decimales)}</span>
}
