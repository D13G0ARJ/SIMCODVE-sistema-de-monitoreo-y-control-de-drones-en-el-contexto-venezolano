import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/sora'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

/* Service worker solo en producción: guarda imágenes, fuentes y scripts para
   que la segunda visita (o una visita sin señal) cargue al instante. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
