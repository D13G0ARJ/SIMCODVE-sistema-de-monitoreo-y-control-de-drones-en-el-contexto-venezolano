# Folleto de la defensa

Dos formatos para repartir el día de la defensa, ambos con el QR que abre la
landing de la tesis:

- **Media carta** (`media.html` → `salida/Media-carta-SIMCODVE.pdf`): volante
  sencillo de 8,5 x 5,5 in. La página trae dos copias con línea de corte:
  se imprime y se corta por la mitad. El más económico de repartir.
- **Hoja única** (`hoja.html` → `salida/Hoja-SIMCODVE.pdf`): carta vertical,
  una sola cara, con todo el contenido (problema, objetivos, resultados).
- **Tríptico** (`folleto.html` → `salida/Triptico-SIMCODVE.pdf`): carta
  apaisado, dos caras, tres paneles por cara.

`generar.mjs` exporta los PDF y sus vistas previas PNG con Chrome.

## Generar

```bash
npm install
node generar.mjs https://URL-REAL-DE-LA-LANDING media     # solo media carta
node generar.mjs https://URL-REAL-DE-LA-LANDING hoja      # solo la hoja
node generar.mjs https://URL-REAL-DE-LA-LANDING triptico  # solo el tríptico
node generar.mjs https://URL-REAL-DE-LA-LANDING           # los dos
```

**Importante:** sin el argumento, el QR apunta a la dirección provisional
`https://simcodve.vercel.app`. Pasa la URL real de Vercel antes de imprimir y
comprueba el QR con el celular sobre la vista previa `salida/vista-exterior.png`.

## Cómo imprimir

**Media carta:** papel carta, vertical, una cara, escala 100 %, a color.
Cortar por la línea punteada del centro: salen dos volantes por hoja.

**Hoja única:** papel carta, orientación vertical, una cara, escala 100 % (sin
"ajustar a la página"), a color. Activar impresión de fondos si el visor lo
pregunta. Papel de 120 a 160 g/m² se siente mejor en la mano que el papel común.

**Tríptico:** papel carta, orientación horizontal, **doble cara volteando por
el borde corto**, escala 100 %, papel de 150 a 200 g/m². Página 1 = cara
exterior [solapa interior | contraportada con QR | portada]; página 2 = cara
interior [el problema | objetivos y método | sistema y resultados]. Doblar en
tres: primero la solapa hacia adentro, luego la portada encima. Las marcas
finas del borde superior e inferior señalan los pliegues.

## Contenido

Todo sale de la tesis (Capítulo I y validación) y coincide con la landing: qué
es SIMCODVE y sus ocho capacidades, el problema con sus cuatro raíces y la
interrogante principal, objetivo general y específicos, metodología RAD,
alcance y límites, cuatro capturas del simulador y los resultados de la encuesta
a 12 especialistas.
