import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

/* Tarjeta con inclinación 3D + brillo que sigue al cursor.
   El tilt solo se activa con puntero fino (desktop). En móvil se
   comporta como un motion.div normal, conservando variants/stagger. */
export default function Tilt({ children, className, max = 9, glare = true, style, ...rest }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const finePointer = typeof window !== 'undefined'
    && window.matchMedia('(pointer: fine)').matches

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 220, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 220, damping: 18 })
  const glareX = useTransform(mx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(my, [0, 1], ['0%', '100%'])
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(420px circle at ${gx} ${gy}, rgba(34,211,238,0.16), transparent 45%)`
  )

  if (!finePointer || reduce) {
    return <motion.div ref={ref} className={className} style={style} {...rest}>{children}</motion.div>
  }

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => { mx.set(0.5); my.set(0.5) }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ ...style, rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      {...rest}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', background: glareBg }}
        />
      )}
    </motion.div>
  )
}
