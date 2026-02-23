// Literal port of sandbox App structure.
// Owns its own Canvas + scene graph. Does NOT reuse BreathingRing's bloom system.
import * as THREE from 'three'
import { useRef, useEffect, Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import Number from './Text.jsx'
import Particles from './Particles.jsx'
import Sparks from './Sparks.jsx'
import Effects from './Effects.jsx'

const isMobile = /iPhone|iPad|iPod|Android/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
)

const SPARK_COLORS = ['#ffffff', '#f3f6ff', '#e9f2ff', '#dfeaff']

function ParticleCountdownPreset({ digitTargetPx = 360, displayNumber = 0, accentColor = '#22d3ee', frameloop = "always" }) {
  const mouse = useRef([0, 0])

  // Synthesized virtual mouse — orbital motion replaces pointer tracking
  useEffect(() => {
    let frame
    const update = () => {
      const t = performance.now() * 0.001
      mouse.current = [
        Math.sin(t * 0.18) * 400,
        Math.cos(t * 0.14) * 200,
      ]
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: -1, minHeight: 0, overflow: 'hidden', background: '#020207' }}>
      <Canvas
        frameloop={frameloop}
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ fov: 100, position: [0, 0, 30] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.setClearColor(new THREE.Color('#020207'), 1)
        }}
      >
        <ambientLight intensity={0.2} color={accentColor} />
        <pointLight distance={100} intensity={1.2} color="white" />
        <Suspense fallback={null}>
          <Number
            targetPixelHeight={digitTargetPx}
            displayNumber={displayNumber}
            color={accentColor}
          />
        </Suspense>
        <Particles count={isMobile ? 5000 : 10000} mouse={mouse} />
        <Sparks mouse={mouse} count={20} colors={SPARK_COLORS} />
        <Effects />
      </Canvas>
    </div>
  )
}

export default memo(ParticleCountdownPreset)
