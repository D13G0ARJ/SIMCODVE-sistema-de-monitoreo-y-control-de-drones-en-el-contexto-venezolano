import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { estado } from './estado'

gsap.registerPlugin(ScrollTrigger)

/* Parte un titular en líneas reales (medidas) para revelarlas con máscara. */
function partirLineas(el) {
  const palabras = el.textContent.trim().split(/\s+/)
  el.innerHTML = palabras.map((p) => `<span class="w">${p}</span>`).join(' ')
  const lineas = []
  let top = null
  el.querySelectorAll('.w').forEach((w) => {
    if (w.offsetTop !== top) { top = w.offsetTop; lineas.push([]) }
    lineas[lineas.length - 1].push(w.textContent)
  })
  el.innerHTML = lineas.map((l) => `<span class="lin"><span class="lin-in">${l.join(' ')}</span></span>`).join('')
}

const formatear = (v, dec) => v.toFixed(dec).replace('.', ',') + ' %'

/* Todas las animaciones de la página. Devuelve la función de limpieza. */
export function iniciarAnimaciones(raiz) {
  if (!raiz) return () => {}

  const ctx = gsap.context(() => {
    /* Navegación y barra inferior: solo clases, sin tweens. */
    ScrollTrigger.create({ trigger: document.body, start: 24, end: 'max', toggleClass: { targets: '.nav', className: 'solida' } })
    ScrollTrigger.create({
      trigger: document.body, start: () => window.innerHeight * 0.8, end: 'max',
      toggleClass: { targets: '.barra', className: 'ver' },
    })

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      /* Carga del hero: líneas del título con máscara, luego párrafo y botones. */
      const h1 = raiz.querySelector('.hero h1')
      const original = h1.innerHTML
      const fuentes = document.fonts
        ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
        : Promise.resolve()
      let tlHero
      const ocultos = ['.hero .hero-meta', '.hero .lead', '.hero .acciones']
      gsap.set(ocultos, { autoAlpha: 0 })
      /* Seguro: si el temporizador no avanza (pestaña en segundo plano, red lenta),
         a los 3,5 s todo queda visible sin esperar a la animación. */
      const seguro = setTimeout(() => {
        if (tlHero) tlHero.progress(1)
        else gsap.set(ocultos, { autoAlpha: 1, y: 0 })
      }, 3500)
      fuentes.then(() => {
        if (!h1.isConnected) return
        partirLineas(h1)
        tlHero = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { h1.innerHTML = original } })
        tlHero
          .to('.hero .hero-meta', { autoAlpha: 1, duration: 0.6 }, 0)
          .from(h1.querySelectorAll('.lin-in'), { yPercent: 100, duration: 0.9, stagger: 0.08 }, 0.1)
          .fromTo(['.hero .lead', '.hero .acciones'], { y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.6)
      })

      /* Hero: de disperso a patrullaje mientras sale de pantalla. */
      gsap.fromTo(estado, { fase: 0 }, {
        fase: 1, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      })

      /* Momento de autor: la historia del enjambre. */
      const historia = raiz.querySelector('.historia')
      historia.classList.add('js')
      const escenas = gsap.utils.toArray('.escena')
      gsap.set(escenas.slice(1), { autoAlpha: 0, y: 24 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: historia, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
      })
      tl.to(escenas[0], { autoAlpha: 0, y: -24, duration: 0.6 }, 1.8)
        .fromTo(estado, { fase: 1 }, { fase: 2, duration: 1.4, immediateRender: false }, 2.0)
        .to(escenas[1], { autoAlpha: 1, y: 0, duration: 0.6 }, 2.4)
        .to(escenas[1], { autoAlpha: 0, y: -24, duration: 0.6 }, 4.3)
        .fromTo(estado, { fase: 2, jam: 0 }, { fase: 3, jam: 1, duration: 1.2, immediateRender: false }, 4.6)
        .to(escenas[2], { autoAlpha: 1, y: 0, duration: 0.6 }, 4.9)
        .to(escenas[2], { autoAlpha: 0, y: -24, duration: 0.6 }, 6.8)
        .fromTo(estado, { fase: 3, jam: 1 }, { fase: 4, jam: 0, duration: 1.2, immediateRender: false }, 7.1)
        .to(escenas[3], { autoAlpha: 1, y: 0, duration: 0.6 }, 7.4)
        .to(escenas[3], { autoAlpha: 0, y: -24, duration: 0.5 }, 9.5)
        .to({}, { duration: 0.01 }, 10)

      /* Continuidad: el resto de la página en patrullaje atenuado; la tesis vuelve a disperso. */
      gsap.fromTo(estado, { fase: 4, opacidad: 1 }, {
        fase: 1, opacidad: 0.3, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.raices', start: 'top bottom', end: 'top 25%', scrub: 0.8 },
      })
      gsap.fromTo(estado, { fase: 1, opacidad: 0.3 }, {
        fase: 0, opacidad: 1, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '#tesis', start: 'top 85%', end: 'top 30%', scrub: 0.8 },
      })

      /* Contadores de resultados, una sola vez. */
      gsap.utils.toArray('.num').forEach((el) => {
        const valor = parseFloat(el.getAttribute('data-valor'))
        const dec = parseInt(el.getAttribute('data-dec'), 10) || 0
        const o = { v: 0 }
        gsap.to(o, {
          v: valor, duration: 1.6, ease: 'power2.out',
          onUpdate: () => { el.textContent = formatear(o.v, dec) },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

      return () => {
        historia.classList.remove('js')
        clearTimeout(seguro)
        if (tlHero) tlHero.kill()
        if (h1.isConnected) h1.innerHTML = original
      }
    })

    /* Galería horizontal pineada solo en escritorio. En móvil es un carrusel nativo con snap. */
    mm.add('(min-width: 1100px) and (prefers-reduced-motion: no-preference)', () => {
      const galeria = raiz.querySelector('.galeria')
      const pista = galeria.querySelector('.pista')
      galeria.classList.add('pan')
      gsap.to(pista, {
        x: () => -(pista.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: galeria, start: 'top top',
          end: () => '+=' + (pista.scrollWidth - window.innerWidth),
          pin: true, scrub: 1, invalidateOnRefresh: true,
        },
      })
      return () => galeria.classList.remove('pan')
    })
  }, raiz)

  const refrescar = () => ScrollTrigger.refresh()
  window.addEventListener('load', refrescar)

  return () => {
    window.removeEventListener('load', refrescar)
    ctx.revert()
  }
}
