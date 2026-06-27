# SIMCODVE — Landing de la tesis

Landing page (SPA) de la tesis **“Diseño de un Sistema de Monitoreo y Control de
Drones en el Contexto Venezolano: Un Enfoque Tecnológico para la Defensa,
Disuasión e Innovación Híbrida.”**

Autores: **Diego Rodríguez** ([@D13G0ARJ](https://github.com/D13G0ARJ)) y
**Yoneiker Azocar** ([@AlexanderAzocar](https://github.com/AlexanderAzocar)) ·
UNEFA, Núcleo Altos Mirandinos · Junio 2026.

Incluye el PDF completo para descarga, animaciones de scroll (Framer Motion),
un hero 3D de enjambre en malla (Three.js / React Three Fiber) y un carrusel con
capturas reales del simulador. Pensada **mobile-first** para acceso por QR.

## Stack

- React 18 + Vite 5
- Framer Motion (animaciones / scroll)
- Three.js + @react-three/fiber (hero 3D)

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev -- --host  # exponer en la red local (ver desde el celular)
```

## Build de producción

```bash
npm run build        # genera dist/
npm run preview      # sirve dist/ localmente
```

## Despliegue en Vercel

Este proyecto vive dentro del monorepo de SIMCODVE, en la carpeta `landing/`.
En Vercel:

1. **New Project** → importar el repositorio.
2. **Root Directory:** `landing`
3. Framework: **Vite** (autodetectado). Build: `npm run build`. Output: `dist`.
4. Deploy. La SPA queda servida con el `vercel.json` incluido (rewrites a
   `index.html`).

> El PDF de la tesis se sirve desde `public/` y se descarga con el botón
> “Descargar tesis (PDF)”.

## Reemplazar el logo institucional

El logo se carga desde `public/unefa.png`. Para usar el logo oficial, sustituí
ese archivo (idealmente PNG con fondo transparente) conservando el nombre.

---

*Prototipo académico. Todos los datos son sintéticos: no hay drones físicos,
frecuencias reales ni información clasificada.*
