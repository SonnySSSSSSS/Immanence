import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, MeshTransmissionMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function PolygonBreathSceneContent({ accentColor, breathDriver, displayNumber, reducedEffects = false }) {
  // PROBE: track scene mounts
  useEffect(() => {
    console.count('Polygon Scene mount')
  }, [])

  // Breath driver ref sync (same pattern as TechInstrumentRND)
  const breathDriverRef = useRef(breathDriver)
  useEffect(() => {
    breathDriverRef.current = breathDriver
  }, [breathDriver])

  // Geometry — two memoized geometries
  const icoGeom = useMemo(() => new THREE.IcosahedronGeometry(0.88, 0), [])
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(icoGeom), [icoGeom])

  // Canvas texture — useState for init triggers re-render so `map` prop updates
  const [digitTexture, setDigitTexture] = useState(null)
  const digitCanvasRef = useRef(null)

  // Effect 1: init canvas + texture once on mount
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    digitCanvasRef.current = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.colorSpace = THREE.SRGBColorSpace   // keeps digit clean under bloom/sRGB output
    setDigitTexture(tex)    // triggers re-render → material gets map

  }, [])

  // Effect 2: redraw digit when displayNumber changes
  // React effect ordering guarantees Effect 1 runs before Effect 2 on mount
  useEffect(() => {
    console.count('Polygon digit redraw')
    const canvas = digitCanvasRef.current
    if (!canvas || !digitTexture) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Hard reset state to avoid cumulative glow
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.shadowColor = 'rgba(0,0,0,0)'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.filter = 'none'

    // PROBE: Use COPY compositing for hard overwrite (tests for H1 texture ghosting)
    ctx.globalCompositeOperation = 'copy'
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'

    // Shared typography
    const w = canvas.width
    const h = canvas.height
    const text = String(displayNumber ?? 0)
    const font = '700 170px Cinzel, Georgia, serif'
    const x = w / 2
    const y = h / 2

    // PASS 1: Glow aura (low, consistent)
    ctx.save()
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.28
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 14
    ctx.fillText(text, x, y)
    ctx.restore()

    // PASS 2: Dark stroke (shape separation)
    ctx.save()
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.85
    ctx.lineWidth = 10
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 0
    ctx.strokeText(text, x, y)
    ctx.restore()

    // PASS 3: Crisp core fill (readable glyph)
    ctx.save()
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 1.0
    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 0
    ctx.fillText(text, x, y)
    ctx.restore()

    // Mark both textures as needing update
    // eslint-disable-next-line react-hooks/immutability
    digitTexture.needsUpdate = true
  }, [displayNumber, digitTexture])

  // Geometry cleanup — independent of texture lifecycle
  useEffect(() => {
    return () => {
      try { edgeGeom.dispose() } catch { /* suppress dispose errors */ }
      try { icoGeom.dispose() } catch { /* suppress dispose errors */ }
    }
  }, [edgeGeom, icoGeom])

  // Texture cleanup — separate so geometry disposal doesn't depend on digitTexture
  useEffect(() => {
    return () => {
      try { digitTexture?.dispose() } catch { /* suppress dispose errors */ }
    }
  }, [digitTexture])

  // useFrame refs and logic
  const groupRef = useRef()
  const scaleRef = useRef(1.0)
  const digitMeshRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const bd = breathDriverRef.current
    const cycleProgress01 = bd?.cycleProgress01 ?? 0
    const phase = bd?.phase

    const t = cycleProgress01
    const eased = t * t * (3 - 2 * t)
    groupRef.current.rotation.y = eased * Math.PI * 2 * 1.5
    groupRef.current.rotation.x += delta * 0.08 * 1.5

    const atHold = phase === 'holdTop' || phase === 'holdBottom'
    const targetScale = atHold ? 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.022 : 1.0
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, delta * 5)
    groupRef.current.scale.setScalar(scaleRef.current)

  })

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[1.5, 2.5, 2]} intensity={0.9} color={accentColor} />
      <Environment preset="city" />

      {/* Rotating polygon group — digit rotates and can be occluded */}
      <group ref={groupRef}>
        <mesh geometry={icoGeom}>
          <meshBasicMaterial colorWrite={false} depthWrite />
        </mesh>
        <mesh geometry={icoGeom}>
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.65}
            roughness={0.08}
            ior={1.45}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.05}
            distortionScale={0.2}
            attenuationColor={accentColor}
            attenuationDistance={1.1}
            toneMapped={false}
            samples={6}
          />
        </mesh>
        <lineSegments geometry={edgeGeom} scale={[1.003, 1.003, 1.003]}>
          <lineBasicMaterial color={accentColor} transparent opacity={0.55} toneMapped={false} />
        </lineSegments>

        {digitTexture && (
          <mesh ref={digitMeshRef} position={[0, 0, 0.78]}>
            <planeGeometry args={[0.50, 0.50]} />
            <meshBasicMaterial
              map={digitTexture}
              color={accentColor}
              transparent
              alphaTest={0.02}
              toneMapped={false}
              depthWrite={false}
              depthTest
            />
          </mesh>
        )}
      </group>

      <ContactShadows
        position={[0, -0.92, 0]}
        color={accentColor}
        opacity={0.60}
        blur={3.0}
        scale={3.4}
        far={2.8}
        frames={reducedEffects ? 1 : Infinity}
        resolution={128}
      />

      {/* PROBE: disable bloom to isolate texture ghosting vs mesh stacking */}
      {/* <EffectComposer key="polygon-composer" multisampling={0}>
        <Bloom
          intensity={0.55}
          radius={0.42}
          luminanceThreshold={0.34}
          luminanceSmoothing={0.02}
          mipmapBlur
        />
      </EffectComposer> */}
    </>
  )
}
