import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'

const POLYGON_DIGIT_TEXTURE_SIZE = 256
const POLYGON_DEBUG_LOGS = false
const POLYGON_DIGIT_TEXTURE_CACHE = new Map()
// Dev-only probe toggles. Keep both false for normal visuals.
const POLY_SAFE_GEOMETRY = false
const POLY_SAFE_DIGIT = false

function createDigitTexture(value) {
  // Use a real DOM canvas so CanvasTexture uploads stay on the DOM-backed texSubImage path.
  const canvas = document.createElement('canvas')
  canvas.width = POLYGON_DIGIT_TEXTURE_SIZE
  canvas.height = POLYGON_DIGIT_TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.shadowColor = 'rgba(0,0,0,0)'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.filter = 'none'
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const w = canvas.width
  const h = canvas.height
  const text = String(value)
  const font = '700 170px Cinzel, Georgia, serif'
  const x = w / 2
  const y = h / 2

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

  ctx.save()
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = 1.0
  ctx.fillStyle = '#ffffff'
  ctx.shadowBlur = 0
  ctx.fillText(text, x, y)
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.flipY = false
  tex.premultiplyAlpha = false
  tex.needsUpdate = true
  return tex
}

export function PolygonBreathSceneContent({ accentColor, breathDriver, displayNumber, reducedEffects = false }) {
  const { gl, size } = useThree()

  // Breath driver ref sync (same pattern as TechInstrumentRND)
  const breathDriverRef = useRef(breathDriver)
  useEffect(() => {
    breathDriverRef.current = breathDriver
  }, [breathDriver])

  // Geometry — two memoized geometries
  const icoGeom = useMemo(() => new THREE.IcosahedronGeometry(0.88, 0), [])
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(icoGeom), [icoGeom])

  const lastLoggedDigitRef = useRef(null)
  const normalizedDisplayNumber = useMemo(() => {
    const n = Number(displayNumber)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  }, [displayNumber])

  const digitTexture = useMemo(() => {
    if (POLY_SAFE_DIGIT) return null
    let nextTexture = POLYGON_DIGIT_TEXTURE_CACHE.get(normalizedDisplayNumber) || null
    if (!nextTexture) {
      nextTexture = createDigitTexture(normalizedDisplayNumber)
      if (nextTexture) POLYGON_DIGIT_TEXTURE_CACHE.set(normalizedDisplayNumber, nextTexture)
    }
    return nextTexture
  }, [normalizedDisplayNumber])

  // Keep renderer viewport/scissor synchronized during resize transitions.
  useEffect(() => {
    const safeW = Math.max(1, Math.floor(size.width || 1))
    const safeH = Math.max(1, Math.floor(size.height || 1))
    gl.setViewport(0, 0, safeW, safeH)
    gl.setScissor(0, 0, safeW, safeH)
    gl.setScissorTest(false)
  }, [gl, size.width, size.height])

  // Debug log is disabled by default; when enabled it logs only on value changes.
  useEffect(() => {
    if (!POLYGON_DEBUG_LOGS) return
    if (lastLoggedDigitRef.current === normalizedDisplayNumber) return
    lastLoggedDigitRef.current = normalizedDisplayNumber
    console.debug('[PolygonBreathScene] digit texture update', normalizedDisplayNumber)
  }, [normalizedDisplayNumber])

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
      for (const texture of POLYGON_DIGIT_TEXTURE_CACHE.values()) {
        try { texture?.dispose() } catch { /* suppress dispose errors */ }
      }
      POLYGON_DIGIT_TEXTURE_CACHE.clear()
      lastLoggedDigitRef.current = null
    }
  }, [])

  // useFrame refs and logic
  const groupRef = useRef()
  const scaleRef = useRef(1.0)
  const digitMeshRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    if (size.width < 1 || size.height < 1) return

    const bd = breathDriverRef.current
    const cycleProgress01 = bd?.cycleProgress01 ?? 0
    const phase = bd?.phase
    const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0.016

    const t = cycleProgress01
    const eased = t * t * (3 - 2 * t)
    groupRef.current.rotation.y = eased * Math.PI * 2 * 1.5
    groupRef.current.rotation.x += safeDelta * 0.08 * 1.5

    const atHold = phase === 'holdTop' || phase === 'holdBottom'
    const targetScale = atHold ? 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.022 : 1.0
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, safeDelta * 5)
    groupRef.current.scale.setScalar(scaleRef.current)

  })

  if (size.width < 1 || size.height < 1) return null

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[1.5, 2.5, 2]} intensity={0.9} color={accentColor} />
      {!POLY_SAFE_GEOMETRY && <Environment preset="city" />}

      {/* Rotating polygon group — digit rotates and can be occluded */}
      <group ref={groupRef}>
        <mesh geometry={icoGeom}>
          <meshBasicMaterial colorWrite={false} depthWrite />
        </mesh>
        <mesh geometry={icoGeom}>
          {POLY_SAFE_GEOMETRY ? (
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.22}
              depthWrite={false}
              toneMapped={false}
            />
          ) : (
            <meshPhysicalMaterial
              color={accentColor}
              metalness={0.18}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.12}
              transparent
              opacity={0.22}
              depthWrite={false}
              toneMapped={false}
            />
          )}
        </mesh>
        <lineSegments geometry={edgeGeom} scale={[1.003, 1.003, 1.003]}>
          <lineBasicMaterial color={POLY_SAFE_GEOMETRY ? '#ffffff' : accentColor} transparent opacity={0.55} toneMapped={false} />
        </lineSegments>

        {!POLY_SAFE_DIGIT && digitTexture && (
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

      {!POLY_SAFE_GEOMETRY && (
        <ContactShadows
          position={[0, -0.92, 0]}
          color={accentColor}
          opacity={0.60}
          blur={3.0}
          scale={3.4}
          far={2.8}
          frames={reducedEffects ? 1 : 6}
          resolution={128}
        />
      )}
    </>
  )
}
