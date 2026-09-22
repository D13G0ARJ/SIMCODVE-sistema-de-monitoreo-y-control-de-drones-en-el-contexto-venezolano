/* Genera los PDF del folleto y sus vistas previas PNG.
   Uso:  node generar.mjs [URL de la landing] [hoja | triptico | todo]
   Ej.:  node generar.mjs https://simcodve.vercel.app hoja
   Por defecto genera los dos formatos. Requiere Google Chrome instalado
   (o pasar CHROME=ruta\al\chrome.exe). */
import puppeteer from 'puppeteer-core'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const url = args.find((a) => /^https?:\/\//.test(a)) || 'https://simcodve.vercel.app'
const que = args.find((a) => ['hoja', 'media', 'triptico', 'todo'].includes(a)) || 'todo'
const chrome = process.env.CHROME
  || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
    .find((p) => fs.existsSync(p))
if (!chrome) { console.error('No encuentro Chrome. Define CHROME=ruta\\chrome.exe'); process.exit(1) }

if (url.includes('simcodve.vercel.app')) {
  console.warn('\nAVISO: el QR apunta a la URL provisional https://simcodve.vercel.app.')
  console.warn('       Pasa la URL real como argumento antes de imprimir: node generar.mjs https://tu-url\n')
}

const FORMATOS = {
  hoja: { html: 'hoja.html', pdf: 'Hoja-SIMCODVE.pdf', ancho: '8.5in', alto: '11in', vistas: ['vista-hoja'], px: [816, 1056] },
  media: { html: 'media.html', pdf: 'Media-carta-SIMCODVE.pdf', ancho: '8.5in', alto: '11in', vistas: ['vista-media'], px: [816, 1056] },
  triptico: { html: 'folleto.html', pdf: 'Triptico-SIMCODVE.pdf', ancho: '11in', alto: '8.5in', vistas: ['vista-triptico-exterior', 'vista-triptico-interior'], px: [1056, 816] },
}

const salida = path.join(aqui, 'salida')
fs.mkdirSync(salida, { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--hide-scrollbars'] })

for (const nombre of que === 'todo' ? ['hoja', 'media', 'triptico'] : [que]) {
  const f = FORMATOS[nombre]
  const page = await browser.newPage()
  await page.goto(pathToFileURL(path.join(aqui, f.html)).href + '?url=' + encodeURIComponent(url), { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => window.__listo === true, { timeout: 15000 })

  await page.pdf({
    path: path.join(salida, f.pdf), width: f.ancho, height: f.alto,
    printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  /* Vistas previas a 200 dpi. */
  await page.setViewport({ width: f.px[0], height: f.px[1], deviceScaleFactor: 2.08 })
  await page.emulateMediaType('print')
  const hojas = await page.$$('.hoja')
  for (let i = 0; i < hojas.length; i++) {
    await hojas[i].screenshot({ path: path.join(salida, `${f.vistas[i] || nombre + '-' + i}.png`) })
  }
  await page.close()
  console.log(`Listo: salida/${f.pdf} (+ ${f.vistas.join(', ')}.png)`)
}
await browser.close()
console.log('QR codificado:', url)
