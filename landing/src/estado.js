/* Estado compartido entre las animaciones de scroll (GSAP) y el enjambre (canvas).
   `fase` es continua: 0 disperso, 1 patrullaje, 2 defensa, 3 interferencia, 4 recuperación.
   `jam` va de 0 a 1 mientras dura la interferencia. `opacidad` atenúa el enjambre
   cuando el contenido necesita protagonismo. */
export const estado = { fase: 0, jam: 0, opacidad: 1 }

export const reducirMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const esMovil = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
