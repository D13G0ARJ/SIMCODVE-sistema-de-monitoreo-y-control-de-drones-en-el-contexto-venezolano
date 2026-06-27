import { motion, useReducedMotion } from 'framer-motion'

/* Revelado al hacer scroll. Respeta prefers-reduced-motion. */
export default function Reveal({ children, delay = 0, y = 28, className, as = 'div' }) {
  const reduce = useReducedMotion()
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.6, 0.27, 1] }}
    >
      {children}
    </M>
  )
}

/* Contenedor con escalonado para hijos <Reveal> o motion. */
export function Stagger({ children, className, gap = 0.09 }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: reduce ? 0 : gap } } }}
    >
      {children}
    </motion.div>
  )
}

export const itemUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.21, 0.6, 0.27, 1] } },
}
