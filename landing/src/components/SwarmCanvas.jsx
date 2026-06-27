import { useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ----------------------------------------------------------------
   Enjambre en red: nodos (drones) con drift tipo boids + enlaces
   mesh que aparecen/desaparecen según la distancia. Es la metáfora
   visual de la tesis: control descentralizado y malla resiliente.
   ---------------------------------------------------------------- */

function spriteTextura() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(190,245,255,0.95)')
  grad.addColorStop(0.5, 'rgba(34,211,238,0.55)')
  grad.addColorStop(1, 'rgba(34,211,238,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function Enjambre({ cantidad, enlaceMax }) {
  const puntosRef = useRef()
  const lineasRef = useRef()
  const grupoRef = useRef()
  const tex = useMemo(spriteTextura, [])
  const { size } = useThree()

  // Caja de simulación
  const R = 9

  const datos = useMemo(() => {
    const pos = new Float32Array(cantidad * 3)
    const vel = []
    const col = new Float32Array(cantidad * 3)
    const cCian = new THREE.Color('#22D3EE')
    const cVerde = new THREE.Color('#34D399')
    for (let i = 0; i < cantidad; i++) {
      pos[i * 3] = (Math.random() - 0.5) * R * 2
      pos[i * 3 + 1] = (Math.random() - 0.5) * R * 1.2
      pos[i * 3 + 2] = (Math.random() - 0.5) * R * 1.4
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012))
      const c = Math.random() > 0.78 ? cVerde : cCian
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    // buffer de enlaces (máx pares)
    const maxPares = cantidad * 6
    const linePos = new Float32Array(maxPares * 2 * 3)
    const lineCol = new Float32Array(maxPares * 2 * 3)
    return { pos, vel, col, linePos, lineCol, maxPares }
  }, [cantidad])

  const mouse = useRef({ x: 0, y: 0 })
  useFrame((state) => {
    const { pos, vel, linePos, lineCol, maxPares } = datos
    // Drift acotado
    for (let i = 0; i < cantidad; i++) {
      const ix = i * 3
      pos[ix] += vel[i].x; pos[ix + 1] += vel[i].y; pos[ix + 2] += vel[i].z
      if (pos[ix] > R || pos[ix] < -R) vel[i].x *= -1
      if (pos[ix + 1] > R * 0.6 || pos[ix + 1] < -R * 0.6) vel[i].y *= -1
      if (pos[ix + 2] > R * 0.7 || pos[ix + 2] < -R * 0.7) vel[i].z *= -1
    }
    puntosRef.current.geometry.attributes.position.needsUpdate = true

    // Recalcular enlaces mesh
    let p = 0
    const maxD2 = enlaceMax * enlaceMax
    for (let i = 0; i < cantidad && p < maxPares; i++) {
      for (let j = i + 1; j < cantidad && p < maxPares; j++) {
        const dx = pos[i * 3] - pos[j * 3]
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < maxD2) {
          const a = 1 - Math.sqrt(d2) / enlaceMax
          const o = p * 6
          linePos[o] = pos[i * 3]; linePos[o + 1] = pos[i * 3 + 1]; linePos[o + 2] = pos[i * 3 + 2]
          linePos[o + 3] = pos[j * 3]; linePos[o + 4] = pos[j * 3 + 1]; linePos[o + 5] = pos[j * 3 + 2]
          for (let k = 0; k < 2; k++) {
            lineCol[o + k * 3] = 0.13 * a
            lineCol[o + k * 3 + 1] = 0.82 * a
            lineCol[o + k * 3 + 2] = 0.93 * a
          }
          p++
        }
      }
    }
    const lg = lineasRef.current.geometry
    lg.attributes.position.needsUpdate = true
    lg.attributes.color.needsUpdate = true
    lg.setDrawRange(0, p * 2)

    // Parallax + rotación lenta
    const t = state.clock.elapsedTime
    const mx = (state.pointer.x || 0)
    const my = (state.pointer.y || 0)
    if (grupoRef.current) {
      grupoRef.current.rotation.y = t * 0.04 + mx * 0.35
      grupoRef.current.rotation.x = Math.sin(t * 0.08) * 0.06 + my * 0.2
    }
  })

  return (
    <group ref={grupoRef}>
      <lineSegments ref={lineasRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={datos.maxPares * 2} array={datos.linePos} itemSize={3} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-color" count={datos.maxPares * 2} array={datos.lineCol} itemSize={3} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <points ref={puntosRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={cantidad} array={datos.pos} itemSize={3} usage={THREE.DynamicDrawUsage} />
          <bufferAttribute attach="attributes-color" count={cantidad} array={datos.col} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.55}
          map={tex}
          vertexColors
          transparent
          alphaTest={0.01}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

export default function SwarmCanvas() {
  // Escala según dispositivo (mobile = menos nodos)
  const esMovil = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const cantidad = esMovil ? 34 : 68
  const enlaceMax = esMovil ? 4.4 : 4.0

  return (
    <Canvas
      dpr={[1, esMovil ? 1.5 : 2]}
      camera={{ position: [0, 0, 16], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <Enjambre cantidad={cantidad} enlaceMax={enlaceMax} />
      </Suspense>
    </Canvas>
  )
}
