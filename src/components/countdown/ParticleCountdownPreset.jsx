// Literal port of sandbox App structure.
// Owns its own Canvas + scene graph. Does NOT reuse BreathingRing's bloom system.
import * as THREE from 'three'
import { useRef, useEffect, Suspense, memo, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Trail, Float } from '@react-three/drei'
import Number from './Text.jsx'
import ForeParticles from './Particles.jsx'
import BackParticles from './particleText/Particles.jsx'
import Sparks from './particleText/Sparks.jsx'
import Effects from './Effects.jsx'

// isMobile no longer needed (particleText handles coarse pointers internally).

// Legacy spark palette retained in git history; particleText uses accentColor directly.

function Electron({ orbitRadius = 10, speed = 6, accentColor = '#22d3ee', ...props }) {
  const ref = useRef()
  // Trail: same hue shifted slightly toward blue, desaturated — distinct "cool wake" shade
  const trailColor = useMemo(() => {
    const c = new THREE.Color(accentColor)
    c.offsetHSL(0.05, -0.1, 0)
    c.multiplyScalar(2)
    return c
  }, [accentColor])
  // Ball: pure accent, very bright — distinct bloom dot vs trail and digit
  const ballColor = useMemo(() => {
    const c = new THREE.Color(accentColor)
    c.multiplyScalar(8)
    return c
  }, [accentColor])
  // XZ orbit: electron genuinely sweeps into/out of screen depth each cycle.
  // Combined with Z-axis group rotations (0°, +60°, -60°), this produces the
  // classic atom look with three tilted elliptical rings around the digit.
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed
    ref.current.position.set(
      Math.cos(t) * orbitRadius,   // x: sweeps left-right
      0,                            // y: plane is flat; group rotation handles tilt
      Math.sin(t) * orbitRadius    // z: sweeps in/out of screen — the key "orbiting" axis
    )
  })
  return (
    <group {...props}>
      <Trail local width={2} length={8} color={trailColor} attenuation={(t) => t * t}>
        <mesh ref={ref}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshBasicMaterial color={ballColor} toneMapped={false} />
        </mesh>
      </Trail>
    </group>
  )
}

function Scene({ digitTargetPx, displayNumber, accentColor, mousePx, mouseN }) {
  const centerRef = useRef(null)
  const { viewport, size } = useThree()

  // Digit scaled down to fit inside the atom orbit.
  const atomDigitPx = Math.max(80, Math.min(180, digitTargetPx * 0.35))
  // Derive orbit radius in world units from actual viewport mapping, then clamp.
  const digitWorldHalfHeight = (atomDigitPx / Math.max(1, size.height)) * viewport.height * 0.5
  const orbitRadius = Math.max(0.4, Math.min(viewport.height * 0.45, digitWorldHalfHeight * 2.2))

  // Gentle "wiggle" on the outer group (keeps particles + atom drifting together).
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
        {/* Atom: 3 electron orbits + digit in center, all floating together */}
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
          <Electron speed={6} accentColor={accentColor} orbitRadius={orbitRadius} />
          <Electron rotation={[0, 0, Math.PI / 3]} speed={6.5} accentColor={accentColor} orbitRadius={orbitRadius} />
          <Electron rotation={[0, 0, -Math.PI / 3]} speed={7} accentColor={accentColor} orbitRadius={orbitRadius} />
          <Suspense fallback={null}>
            <Number
              targetPixelHeight={atomDigitPx}
              minPixelHeight={80}
              maxPixelHeight={180}
              displayNumber={displayNumber}
              color={accentColor}
            />
          </Suspense>
        </Float>

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
