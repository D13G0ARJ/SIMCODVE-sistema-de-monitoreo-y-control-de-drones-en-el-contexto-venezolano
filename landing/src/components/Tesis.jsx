import { useEffect, useRef } from 'react'
import { FilePdf, GithubLogo } from '@phosphor-icons/react'
import { PDF, PDF_META, GITHUB, URL_PUBLICA, TITULO_TESIS } from '../datos'

export default function Tesis() {
  const qr = useRef(null)

  /* El QR se genera en el navegador (5 KB de librería, cargada bajo demanda). */
  useEffect(() => {
    let vivo = true
    import('qrcode-generator').then(({ default: qrcode }) => {
      if (!vivo || !qr.current) return
      const q = qrcode(0, 'M')
      q.addData(URL_PUBLICA)
      q.make()
      qr.current.innerHTML = q.createSvgTag({ scalable: true, margin: 0 })
    }).catch(() => {})
    return () => { vivo = false }
  }, [])

  return (
    <section id="tesis" className="tesis">
      <div className="in">
        <div className="tesis-caja">
          <div>
            <h2>Lee la tesis completa</h2>
            <p>139 páginas del Trabajo Especial de Grado «{TITULO_TESIS}».</p>
            <div className="acciones">
              <a className="boton primario" href={PDF} target="_blank" rel="noopener">
                <FilePdf size={20} aria-hidden="true" />Ver tesis en PDF
              </a>
              <span className="meta">{PDF_META}</span>
              <a className="boton fantasma" href={GITHUB.repo} target="_blank" rel="noopener">
                <GithubLogo size={20} aria-hidden="true" />Repositorio en GitHub
              </a>
            </div>
          </div>
          <div className="qr">
            <div className="qr-svg" ref={qr} role="img" aria-label="Código QR con la dirección de esta página" />
            <span className="meta">Escanea para abrir esta página</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer>
      <div className="in">
        <span>© 2026 Diego Rodríguez y Yoneiker Azocar · UNEFA</span>
        <span>Prototipo académico con datos 100 % sintéticos</span>
      </div>
    </footer>
  )
}
