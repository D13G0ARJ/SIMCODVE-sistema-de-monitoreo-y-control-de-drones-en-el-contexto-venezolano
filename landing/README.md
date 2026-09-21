# SIMCODVE — Landing de la tesis

Landing page (SPA) de la tesis **"Diseño de un Sistema de Monitoreo y Control de
Drones en el Contexto Venezolano: Un Enfoque Tecnológico para la Defensa,
Disuasión e Innovación Híbrida."**

Autores: **Diego Rodríguez** ([@D13G0ARJ](https://github.com/D13G0ARJ)) y
**Yoneiker Azocar** ([@AlexanderAzocar](https://github.com/AlexanderAzocar)) ·
UNEFA, Núcleo Altos Mirandinos · Junio 2026.

Pensada **mobile-first** para abrirse desde un QR en el celular del jurado, con
poca señal. Un enjambre dibujado en Canvas 2D de fondo cambia de formación con el
scroll (disperso, patrullaje, defensa, interferencia, recuperación) y cuenta el
problema de la tesis. El resto son las capturas reales del simulador, los
objetivos, los resultados de la validación y la descarga del PDF.

## Stack

- React 18 + Vite 5
- GSAP 3 + ScrollTrigger (toda la animación de scroll)
- Canvas 2D para el enjambre (sin Three.js, sin WebGL)
- Fuentes autohospedadas: Sora y Manrope variables, solo subconjunto latino
- Iconos: Phosphor (`@phosphor-icons/react`, solo los tres que se usan)
- `qrcode-generator` para el QR de la propia página (carga bajo demanda)

## Optimización para señal mala

- Peso inicial de la página ≈ 175 KB comprimidos (scripts, CSS, fuentes y logo).
  Las capturas del simulador están en WebP en dos tamaños (móvil y escritorio),
  con carga perezosa. El PDF de la tesis pesa 3,6 MB (comprimido de 19,5 MB).
- `public/sw.js`: service worker que guarda en caché scripts, fuentes e imágenes.
  La segunda visita abre al instante y sin conexión. El PDF no se cachea.
- `vercel.json`: cabeceras `Cache-Control` inmutables para `/assets` y `/sistema`.
- Cero peticiones a terceros (ni Google Fonts ni CDN).

## Desarrollo

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # exponer en la red local (ver desde el celular)
npm run build          # genera dist/
npm run preview        # sirve dist/ localmente
```

## Estructura

```
src/
  datos.js            todo el texto y los datos de la página (una sola fuente)
  estado.js           estado compartido enjambre <-> scroll (fase, jam, opacidad)
  animaciones.js      GSAP: hero, historia del enjambre, galería, contadores
  components/
    Enjambre.jsx      canvas 2D con proyección en perspectiva
    Nav.jsx           barra superior + barra inferior fija en móvil
    Hero.jsx  Historia.jsx  Secciones.jsx  Sistema.jsx  Resultados.jsx  Tesis.jsx
public/
  sistema/webp/       capturas del simulador (webp, -m móvil, -crop, -p vertical)
  sw.js               service worker
prototipos/           los tres prototipos HTML que se compararon antes de construir
```

## URL pública y QR

La constante `URL_PUBLICA` en `src/datos.js` es la dirección que codifica el QR
del bloque final. Cambiarla por la URL real de Vercel después del primer deploy.

## Despliegue en Vercel

1. **New Project** → importar el repositorio.
2. **Root Directory:** `landing`
3. Framework: **Vite** (autodetectado). Build: `npm run build`. Output: `dist`.
4. Deploy. El `vercel.json` incluido trae los rewrites de la SPA y las cabeceras
   de caché.

---

*Prototipo académico. Todos los datos son sintéticos: no hay drones físicos,
frecuencias reales ni información clasificada.*
