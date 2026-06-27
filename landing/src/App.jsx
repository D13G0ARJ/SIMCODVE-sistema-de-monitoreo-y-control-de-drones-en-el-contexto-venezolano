import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import { Stats, Problema, Objetivos, Conceptos } from './components/Secciones'
import Sistema from './components/Sistema'
import { Stack, Resultados, Metodologia, Autores, Descarga, Footer } from './components/Cierre'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Problema />
        <Objetivos />
        <Conceptos />
        <Marquee />
        <Sistema />
        <Stack />
        <Resultados />
        <Metodologia />
        <Autores />
        <Descarga />
      </main>
      <Footer />
    </>
  )
}
