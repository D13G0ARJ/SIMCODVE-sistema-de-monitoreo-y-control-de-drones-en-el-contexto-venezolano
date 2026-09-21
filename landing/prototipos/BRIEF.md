# BRIEF COMPARTIDO · Prototipos de landing SIMCODVE

Tres prototipos (a.html, b.html, c.html) de la landing de una tesis de grado. El jurado la abrirá
desde un QR en el celular. Cada prototipo es UN archivo HTML autocontenido (CSS y JS inline),
en `landing/prototipos/`. Se sirve con el dev server de Vite desde `landing/` en
`http://localhost:5174/prototipos/a.html` (las imágenes viven en `/sistema/webp/...`).

Idioma: TODO en español. Cero texto en inglés visible (salvo nombres propios: React, FastAPI, GitHub).

## Producto (verdad, no inventar)

- Nombre: **SIMCODVE**. Título completo de la tesis: "Diseño de un Sistema de Monitoreo y Control de
  Drones en el Contexto Venezolano: Un Enfoque Tecnológico para la Defensa, Disuasión e Innovación Híbrida".
- Qué es: prototipo académico que **simula** enjambres de drones sobre el mapa satelital real de
  Venezuela. Control descentralizado (Boids + consenso de rumbo entre vecinos), red mesh, inyección
  de fallos (pérdida de nodos, interferencia/jamming), batería y retorno a base, métricas de
  resiliencia exportables (CSV/JSON), modo pausa/reanudar, escenarios reproducibles con semilla.
  **100% datos sintéticos. No hay drones físicos, ni frecuencias reales, ni datos clasificados.**
- Autores: **Diego Rodríguez** (github.com/D13G0ARJ) y **Yoneiker Azocar** (github.com/AlexanderAzocar).
  Tutor: **Rodolfo Caccamo**. UNEFA, Núcleo Altos Mirandinos, Los Teques. Junio 2026.
  Título al que aspiran: Ingeniero de Sistemas.
- Repositorio: https://github.com/D13G0ARJ/SIMCODVE-sistema-de-monitoreo-y-control-de-drones-en-el-contexto-venezolano
- PDF de la tesis: `/TEG-SIMCODVE-Rodriguez-Azocar.pdf` (19,5 MB, 139 páginas). Avisar el peso.
- URL pública (todavía no desplegada): usar `https://simcodve.vercel.app` como valor
  configurable en una constante JS `URL_PUBLICA` para el QR.
- Logo UNEFA: `/sistema/webp/unefa.webp` (escudo a color 182x224).

### Problema (Capítulo I)
El reto ya no es construir el dron sino el software que monitorea y controla muchas unidades
a la vez y sigue operando ante fallas de enlace, pérdida de nodos o guerra electrónica.
En Venezuela esa capacidad soberana aún no existe. Raíces:
1. Acceso restringido: restricciones comerciales y presupuestarias a plataformas avanzadas.
2. Sin software soberano: falta desarrollo propio y auditable para arquitecturas distribuidas.
3. Baja resiliencia: los sistemas convencionales fallan ante interferencia o caída de enlaces.
4. Sin control descentralizado: sin consenso ni autonomía, la misión depende de un punto único.

Cambio de paradigma:
- Antes: un operador controla un solo dron (enlace punto a punto); software cerrado y extranjero;
  si cae el enlace cae la misión; vulnerable a interferencia.
- SIMCODVE: un operador coordina el enjambre completo en red; software propio y auditable;
  sin punto único de falla; resiliente a pérdida de nodos e interferencia.

Interrogante principal: ¿Cómo debe estructurarse el diseño conceptual y metodológico de un
sistema de monitoreo y control de drones que fortalezca la defensa integral, la capacidad de
disuasión y la innovación tecnológica híbrida en el contexto venezolano?

### Objetivos
General: Diseñar conceptual y metodológicamente un sistema de monitoreo y control de drones para
el contexto venezolano, enfocado en la defensa integral, la disuasión y la innovación híbrida.
Específicos:
1. Requerimientos operacionales: determinar las especificaciones críticas del sistema.
2. Arquitectura SOA + gemelos digitales: diseñar una arquitectura orientada a servicios para
   simular y controlar enjambres en tiempo real.
3. Control descentralizado y consenso: formular el modelo y los algoritmos que garantizan
   autonomía y resiliencia ante pérdida de nodos o interferencia.

### Conceptos clave (elegir 5 o 6, no los 9)
Enjambres de drones · Algoritmos de consenso · Control descentralizado · Arquitectura SOA ·
Gemelo digital · Telemetría sintética · Redes mesh y resiliencia · Soberanía tecnológica ·
Defensa integral y disuasión (enfoque defensivo, no ofensivo).

### Capacidades del prototipo (8)
Despliegue de enjambres sobre mapa satelital real · Telemetría y gemelo digital de cada unidad
(posición, velocidad, altitud, batería) · Modos patrullaje / defensa / híbrido · Inyección de
fallos y jamming · Batería y retorno a base · Alertas clasificadas · Métricas e historial
exportables (conectividad, cobertura, coherencia, recuperación) · Pausa, reanudar, reiniciar y
escenarios reproducibles con semilla.

### Stack REAL (no Tailwind, no Zod)
Frontend: React 18, Vite, Leaflet + imágenes Esri World Imagery. Backend: Python 3.11, FastAPI,
WebSocket de telemetría a 10 Hz. Despliegue: Docker. Todo software libre.

### Metodología
Proyecto factible, enfoque cuantitativo, aplicado y tecnológico-proyectivo. Desarrollo Rápido de
Aplicaciones (RAD) en cuatro fases: Requerimientos → Diseño con el usuario → Construcción
rápida → Transición y validación.

### Resultados (encuesta Likert a 12 especialistas de la UNEFA, de 25 convocados)
- 100 %: Necesidad del prototipo académico
- 100 %: Contribución a la formación tecnológica
- 100 %: Aporte a la soberanía tecnológica
- 100 %: Utilidad de la interfaz tipo radar
- 100 %: Ventajas de la arquitectura modular
- 91,67 %: Relación con la defensa integral
- 91,67 %: Adecuación de los datos sintéticos
- 8 de 12 ítems con aprobación unánime.

## Imágenes disponibles (todas en `/sistema/webp/`)

Capturas del simulador. Sufijo `-m` = versión móvil (900 px de ancho). Sufijo `-crop` = solo el
área del mapa sin paneles laterales (1090x865). Sufijo `-p` = recorte vertical del mapa para
celular (780x1038). Usar `<picture>` o `srcset` con la variante móvil bajo 768 px.

| archivo | contenido | tamaño base |
|---|---|---|
| g10_radar (.webp / -m / -crop / -p) | vista de radar verde con anillos de distancia y barrido | 1680x945 |
| g04_mapa_enjambres (+ -m / -crop / -p) | mapa satelital de Los Teques con tres enjambres y zonas | 1680x945 |
| g11_interferencia (+ -m / -crop / -p) | zona roja de jamming sobre el mapa | 1680x945 |
| g13_vista_nacional (+ -m / -crop / -p) | mapa de toda Venezuela con la base | 1680x945 |
| g09_modo_defensa (+ -m / -crop / -p) | anillo de defensa | 1680x945 |
| g01_pantalla_principal, g02_biblioteca_escenarios, g03_despliegue_escenario, g12_pausa (+ -m) | otras pantallas | 1680x945 |
| g05_panel_control, g06_estadisticas_alertas, g07_telemetria, g08_nuevo_enjambre | paneles laterales verticales | 290x864 |
| g14_buscador (+ -m) | buscador de lugares | 800x360 |
| diag_a, diag_b (+ -m) | diagramas de despliegue (fondo blanco, usarlos solo si el mundo es claro) | 1276x671 |
| unefa.webp | escudo UNEFA | 182x224 |

La paleta real del simulador: fondo azul casi negro (#070B14 / #0E1726), acento cian (#22D3EE),
verde radar (#34D399), rojo de alerta (#F43F5E), ámbar (#FBBF24). Cada prototipo puede tomar UNA
de esas como acento (o proponer otra si su mundo lo justifica).

## Reglas técnicas (obligatorias)

- Un solo archivo HTML. `<title>` corto. `lang="es"`. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Librerías SOLO desde estos CDN:
  - GSAP: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js` y
    `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js`
  - Iconos Phosphor (CSS): `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css`
    y se usan como `<i class="ph ph-download-simple"></i>`. Solo esta familia. Cero SVG dibujado a mano,
    cero emoji, cero glifos unicode como icono.
  - QR: `https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js`
    (uso: `const q = qrcode(0,'M'); q.addData(URL_PUBLICA); q.make(); el.innerHTML = q.createSvgTag({scalable:true, margin:0})`).
  - Fuentes: Google Fonts por `<link>` (en producción se autohospedarán). Elegir según el mundo.
- `gsap.registerPlugin(ScrollTrigger)`. Todo lo que anima con scroll usa ScrollTrigger; jamás
  `window.addEventListener('scroll')`.
- **El contenido es visible por defecto.** Animar con `gsap.from(...)` y solo después de que el DOM
  cargó. Si el JS falla, la página se lee completa. Nada de `opacity:0` en CSS esperando al JS.
- `@media (prefers-reduced-motion: reduce)`: si aplica, no registrar los tweens de scroll
  (`gsap.matchMedia()` con `(prefers-reduced-motion: no-preference)`), y desactivar loops.
- Hero: `min-height: 100dvh` (no `100vh`), padding superior máximo 6rem. En un celular de 390x844
  el título, el subtítulo y el botón principal DEBEN verse sin hacer scroll.
- Móvil primero: escribir el CSS para 390 px y ampliar con `@media (min-width: 768px)` y `(min-width: 1100px)`.
  Gutter lateral 20 px en móvil. Sin scroll horizontal de página. `max-width` del contenido 1180 px.
- Barra inferior fija en móvil con la acción principal ("Ver tesis en PDF") que aparece cuando el
  hero salió de pantalla (ScrollTrigger). En escritorio va en la barra de navegación.
- Imágenes: `<picture>` con la variante `-m` para `(max-width: 767px)`. Todas con `width` y `height`
  y `alt` en español. Solo la del hero es `loading="eager"` y `fetchpriority="high"`; el resto `loading="lazy"`.
- Botones: `:hover`, `:active` (scale .98), `:focus-visible` con anillo del color de acento.
- Tematizar `::selection`, scrollbar (`scrollbar-color` y `::-webkit-scrollbar`), y `text-underline-offset`.
- Tipografía: cuerpo 16-17 px, medida 60-70ch; titulares con `text-wrap: balance`; tracking entre
  -0.01em y -0.04em en display; nunca más de 6rem.
- Un solo sistema de radios (todo recto, o todo 12-16 px, o botones píldora + tarjetas 16 px, documentado en un comentario).
- Anclas obligatorias: `#problema`, `#objetivos`, `#sistema`, `#resultados`, `#autores`, `#tesis`.
- Navegación de una línea en escritorio, altura máxima 72 px. En móvil: solo marca + botón.
- Bloque final `#tesis`: botón "Ver tesis en PDF" (con aviso "PDF · 19,5 MB · 139 páginas"), botón
  "Repositorio en GitHub", y el QR generado de `URL_PUBLICA` con la leyenda "Escanea para abrir esta página".
- Pie: © 2026 Diego Rodríguez y Yoneiker Azocar · UNEFA, y la frase "Prototipo académico con datos 100 % sintéticos".
- Rendimiento: cero Three.js en a y b. Máximo 2 filtros `blur`/`backdrop-filter` en pantalla a la vez.
  `will-change` solo en lo que anima. Loops infinitos pausados cuando salen de pantalla.

## Prohibiciones de estilo (fallan la revisión)

- Kickers / eyebrows (etiqueta pequeña en mayúsculas encima de un título). Ninguno. El título habla solo.
- Texto con degradado. Glow neón exterior en botones o tarjetas. Halos de color con desenfoque cero.
- Pista de "Scroll" o flechita al pie del hero.
- Numeración decorativa de secciones (01 / 02 / 03), "Fase 01", "01 / 08" sobre imágenes. Excepción:
  el prototipo B puede numerar capítulos con números romanos porque la secuencia SÍ es información.
- Guion largo "—" y guion medio "–" en cualquier texto visible. Usar coma, punto o dos puntos.
- Punto medio "·" como separador universal. Máximo uno por línea, y solo en metadatos.
- Puntos de color decorativos ("punto vivo") delante de etiquetas.
- Grillas de tarjetas iguales (icono + título + texto) como estructura de más de UNA sección.
  Cada sección de la página usa una familia de layout distinta (el mismo layout no se repite).
- Etiquetas sobrepuestas encima de fotos. Pies de foto tipo "Figura 03 · archivo".
- Versiones ("v1.0") en el pie. Franjas de ciudad/hora/clima.
- Marquee: máximo uno por página.
- Mismo reveal (fade + subir) en todas las secciones. Un solo momento de animación "de autor" por
  página, y el resto sirve al contenido (ver dirección de cada prototipo).
- Barra de progreso con pista de fondo rellena para las comparaciones de porcentaje (los resultados
  se muestran con número grande o barra fina sin pista).
- Copy inventado: no agregar cifras, citas ni afirmaciones que no estén en este brief.
- Texto de relleno o lorem ipsum.

## Entrega

Al terminar, responder con: ruta del archivo, cuántas líneas, la lista de secciones en orden con la
familia de layout de cada una, cuál es el momento de animación de autor, y los tres riesgos que ves
en tu propio prototipo. Nada más.
