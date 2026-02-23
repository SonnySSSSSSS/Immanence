// Literal port of sandbox App structure.
// Owns its own Canvas + scene graph. Does NOT reuse BreathingRing's bloom system.
import * as THREE from 'three'
import { useRef, useEffect, Suspense, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import Number from './Text.jsx'
import ForeParticles from './Particles.jsx'
import BackParticles from './particleText/Particles.jsx'
import Sparks from './particleText/Sparks.jsx'
import Effects from './Effects.jsx'

// isMobile no longer needed (particleText handles coarse pointers internally).

// Legacy spark palette retained in git history; particleText uses accentColor directly.

function Scene({ digitTargetPx, displayNumber, accentColor, mousePx, mouseN }) {
  const centerRef = useRef(null)

  // Gentle “wiggle” so the digit feels alive at large sizes (kept subtle to avoid nausea).
  useFrame(({ clock }) => {
    const g = centerRef.current
    if (!g) return
    const t = clock.elapsedTime
    g.position.x = Math.sin(t * 0.55) * 0.10
    g.position.y = Math.cos(t * 0.42) * 0.08
    g.rotation.z = Math.sin(t * 0.38) * 0.03
    g.rotation.y = Math.cos(t * 0.31) * 0.04
  })

  return (
    <>
      <fog attach="fog" args={['white', 50, 190]} />
      <ambientLight intensity={0.18} color={accentColor} />
      <pointLight distance={100} intensity={4} color="white" position={[0, 0, 30]} />

      <group ref={centerRef}>
        <Suspense fallback={null}>
          <Number
            targetPixelHeight={digitTargetPx}
            displayNumber={displayNumber}
            color={accentColor}
          />
        </Suspense>

        {/* Back particle layer: numerous, soft, deep */}
        <BackParticles
          accentColor={accentColor}
          mouseRef={mouseN}
          opacity={0.05}
          fieldScale={1.85}
          depthScale={1.55}
          parallaxScale={0.06}
          countDesktop={14000}
          countMobile={4800}
        />

        {/* Foreground: chunky 3D particles with a moving light (reference look) */}
        <ForeParticles count={9500} mouse={mousePx} />

        {/* Centered spark streaks */}
        <Sparks accentColor={accentColor} mouseRef={mouseN} count={70} />
      </group>

      <Effects />
    </>
  )
}

function ParticleCountdownPreset({ digitTargetPx = 360, displayNumber = 0, accentColor = '#22d3ee', frameloop = "always" }) {
  const mousePx = useRef([0, 0])
  const mouseN = useRef([0, 0])

  // Synthesized virtual mouse — orbital motion replaces pointer tracking
  useEffect(() => {
    let frame
    const update = () => {
      const t = performance.now() * 0.001
      // Original sandbox uses pixel-ish values; our back layer uses normalized.
      const pxX = Math.sin(t * 0.18) * 400
      const pxY = Math.cos(t * 0.14) * 200
      mousePx.current = [pxX, pxY]
      mouseN.current = [pxX / 1200, pxY / 900]
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
        linear
        dpr={[1, 2]}
        camera={{ fov: 100, position: [0, 0, 30] }}
        onCreated={({ gl }) => {
          // Uncharted2 tone mapping was removed from newer Three; ACES is the closest stable option.
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
          gl.setClearColor(new THREE.Color('#020207'), 1)
        }}
      >
        <Scene
          digitTargetPx={digitTargetPx}
          displayNumber={displayNumber}
          accentColor={accentColor}
          mousePx={mousePx}
          mouseN={mouseN}
        />
      </Canvas>
    </div>
  )
}

export default memo(ParticleCountdownPreset)
