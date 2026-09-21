import { useEffect, useRef } from 'react'
import Enjambre from './components/Enjambre'
import Nav, { BarraInferior } from './components/Nav'
import Hero from './components/Hero'
import Historia from './components/Historia'
import { Raices, Objetivos, Libre, Metodologia, Autores } from './components/Secciones'
import Sistema from './components/Sistema'
import Resultados from './components/Resultados'
import Tesis, { Footer } from './components/Tesis'
import { iniciarAnimaciones } from './animaciones'

export default function App() {
  const raiz = useRef(null)

  useEffect(() => iniciarAnimaciones(raiz.current), [])

  return (
    <div ref={raiz}>
      <Enjambre />
      <Nav />
      <main>
        <Hero />
        <Historia />
        <Raices />
        <Objetivos />
        <Sistema />
        <Libre />
        <Resultados />
        <Metodologia />
        <Autores />
        <Tesis />
      </main>
      <Footer />
      <BarraInferior />
    </div>
  )
}
