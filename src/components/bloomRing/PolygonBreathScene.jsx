import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

// ─── POLYGON STABILITY LOCK ───────────────────────────────────────────────────
// These constraints MUST be preserved. See git history for X4008 / texSubImage
// context-loss investigation that led to this design.
//
// • No <Environment/> — no PMREM; keep scene.environment = null + scene.background = null
// • No shadows — keep gl.shadowMap.enabled = false; no ContactShadows
// • No steady-state texture uploads — CanvasTexture updates only on digit change
// • No envMap — material.envMap = null + envMapIntensity = 0 on all materials
// • Lighting via direct lights only (PolyLightRig); no IBL
// ─────────────────────────────────────────────────────────────────────────────

const POLYGON_DIGIT_TEXTURE_SIZE = 256
const POLYGON_DEBUG_LOGS = false
const POLYGON_DIGIT_TEXTURE_CACHE = new Map()
// Dev-only probe toggles. Keep both false for normal visuals.
const POLY_SAFE_GEOMETRY = false
const POLY_SAFE_DIGIT = false

// Direct-light rig for polygon preset — no IBL, no shadows, no helpers.
// All positions are in world space; three.js default target is [0,0,0].
function PolyLightRig({ accentColor }) {
  return (
    <>
      {/* Fill: raised ambient so unlit faces aren't near-black without IBL */}
      <ambientLight intensity={0.35} />
      {/* Key: front/upper/right — main face light, neutral white */}
      <directionalLight position={[2.5, 3.0, 2.5]} intensity={2.2} />
      {/* Rim: behind/upper/left — cool-blue edge separation */}
      <pointLight position={[-2.2, 2.0, -2.0]} intensity={0.8} color="#9ab8ff" />
      {/* Bounce: low warm ground fill tinted by accent */}
      <pointLight position={[0, -1.5, 0.5]} intensity={0.35} color={accentColor} />
    </>
  )
}

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
  const font = '700 170px Cinzel, Georgia, serif'

  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  // Orientation correction: no texture rotation.
  ctx.rotate(0)
  // Horizontal flip to correct mirrored/backwards glyph orientation.
  ctx.scale(-1, 1)
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.fillText(String(value), 0, 0)
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
  const { gl, size, scene, camera } = useThree()
  const stencilBits = useMemo(() => {
    try {
      const ctx = gl?.getContext?.()
      if (!ctx) return 0
      return Number(ctx.getParameter(ctx.STENCIL_BITS) || 0)
    } catch {
      return 0
    }
  }, [gl])
  const runtimeProbeFlags = useMemo(() => {
    if (typeof window === 'undefined') return { polyRuntimeSafe: false, polyRuntimeSafeDigit: false }
    const params = new URLSearchParams(window.location.search || '')
    return {
      polyRuntimeSafe: params.has('polySafe'),
      polyRuntimeSafeDigit: params.has('polySafeDigit'),
    }
  }, [])
  const useSafeGeometry = POLY_SAFE_GEOMETRY || runtimeProbeFlags.polyRuntimeSafe
  const useSafeDigit = POLY_SAFE_DIGIT || runtimeProbeFlags.polyRuntimeSafe || runtimeProbeFlags.polyRuntimeSafeDigit
  const modeLabel = useSafeGeometry ? 'POLY SAFE MODE' : 'POLY NORMAL MODE'

  useEffect(() => {
    if (POLYGON_DEBUG_LOGS) {
      console.debug(`[PolygonBreathScene] mounted mode=${modeLabel}`)
    }
  }, [modeLabel])

  // Permanent fix: disable shadows and environment for polygon preset stability
  useEffect(() => {
    gl.shadowMap.enabled = false
  }, [gl])

  // Permanent fix: disable environment/PMREM to prevent X4008 and context loss
  useEffect(() => {
    // Force environment/background to null
    scene.environment = null
    scene.background = null

    // Strip only envMap from all materials — do NOT touch metalness/roughness,
    // those are owned by JSX props and drive the direct-lighting response.
    scene.traverse((obj) => {
      if (!obj.material) return
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((m) => {
        m.envMap = null
        m.envMapIntensity = 0
      })
    })

    // Guard against environment leakage
    let lastCheckTime = 0
    const checkInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastCheckTime < 500) return
      lastCheckTime = now

      if (scene.environment !== null) {
        scene.environment = null
      }
      if (scene.background !== null) {
        scene.background = null
      }
    }, 500)

    return () => clearInterval(checkInterval)
  }, [scene])

  // Optional: cleanup detector for debug builds (can be disabled for production)
  useEffect(() => {
    if (!POLYGON_DEBUG_LOGS) return

    const glContext = gl?.getContext?.()
    if (!glContext) return undefined

    const originalTexSubImage2D = glContext.texSubImage2D
    const originalPixelStorei = glContext.pixelStorei
    if (typeof originalTexSubImage2D !== 'function' || typeof originalPixelStorei !== 'function') {
      return undefined
    }

    const PREMULT = glContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL
    const FLIPY = glContext.UNPACK_FLIP_Y_WEBGL
    let texSubImageCallCount = 0
    let pixelStoreiCallCount = 0
    const pixelStoreiLogMap = new Map()

    function wrappedPixelStorei(...args) {
      pixelStoreiCallCount += 1
      const pname = args[0]
      if (pname === PREMULT || pname === FLIPY) {
        const key = `${pname}:${args[1]}`
        const now = Date.now()
        if (!pixelStoreiLogMap.has(key) || now - pixelStoreiLogMap.get(key) > 2000) {
          pixelStoreiLogMap.set(key, now)
          console.debug('[Polygon] pixelStorei flag set', { pname, value: args[1] })
        }
      }
      return originalPixelStorei.apply(glContext, args)
    }

    function wrappedTexSubImage2D(...args) {
      texSubImageCallCount += 1
      return originalTexSubImage2D.apply(glContext, args)
    }

    glContext.pixelStorei = wrappedPixelStorei
    glContext.texSubImage2D = wrappedTexSubImage2D

    return () => {
      if (glContext.pixelStorei === wrappedPixelStorei) glContext.pixelStorei = originalPixelStorei
      if (glContext.texSubImage2D === wrappedTexSubImage2D) glContext.texSubImage2D = originalTexSubImage2D
    }
  }, [gl])


  // Breath driver ref sync (same pattern as TechInstrumentRND)
  const breathDriverRef = useRef(breathDriver)
  useEffect(() => {
    breathDriverRef.current = breathDriver
  }, [breathDriver])

  // Geometry — all created once, disposed on unmount
  const icoGeom = useMemo(() => new THREE.IcosahedronGeometry(0.88, 0), [])
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(icoGeom), [icoGeom])

  const lastLoggedDigitRef = useRef(null)
  const normalizedDisplayNumber = useMemo(() => {
    const n = Number(displayNumber)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  }, [displayNumber])

  const digitTexture = useMemo(() => {
    if (useSafeDigit) return null
    let nextTexture = POLYGON_DIGIT_TEXTURE_CACHE.get(normalizedDisplayNumber) || null
    if (!nextTexture) {
      nextTexture = createDigitTexture(normalizedDisplayNumber)
      if (nextTexture) POLYGON_DIGIT_TEXTURE_CACHE.set(normalizedDisplayNumber, nextTexture)
    }
    return nextTexture
  }, [normalizedDisplayNumber, useSafeDigit])

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
  const numberPlaneRef = useRef()   // billboarded digit (faces camera, depth-occluded)
  const reflectionRef = useRef()    // upright reflection below polygon

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

    // Billboard: copy camera quaternion so plane always faces viewer exactly
    if (numberPlaneRef.current) {
      // PROBE:plane-rotation-removal:START
      numberPlaneRef.current.quaternion.copy(camera.quaternion)
      numberPlaneRef.current.rotateZ(Math.PI)
      // PROBE:plane-rotation-removal:END
    }

    // P3 probe: make reflection face camera directly to verify transform legibility.
    if (reflectionRef.current) {
      reflectionRef.current.quaternion.copy(state.camera.quaternion)
    }

    // Reflection: fade with breath cycle for a gentle glimmer
    if (reflectionRef.current?.material) {
      reflectionRef.current.material.opacity = 0.20 + cycleProgress01 * 0.12
    }
  })

  if (size.width < 1 || size.height < 1) return null

  return (
    <>
      <PolyLightRig accentColor={accentColor} />

      {/* Subtle projector cues (replaced volumetric beam):

          Emitter glow — small plane at the source point (top),
          suggests projection origin without VFX look.

          Hit spot — small circular glyph at the digit, grounded cue
          that projection is targeting something inside the crystal. */}

      {/* Emitter glyph — very small, high above polygon, facing camera */}
      <mesh position={[0, 1.6, 0]}>
        <planeGeometry args={[0.08, 0.08]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.08}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>

      {/* Hit spot — centered at digit, facing camera, extremely subtle */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[0.14, 0.14]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.04}
          depthWrite={false}
          depthTest={true}
          toneMapped={false}
        />
      </mesh>

      <Html
        fullscreen
        style={{
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '10px',
            letterSpacing: '0.08em',
            fontFamily: 'monospace',
            color: useSafeGeometry ? '#ffcc66' : '#9ef0ff',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '4px 6px',
          }}
        >
          {modeLabel} · STENCIL: {stencilBits}
        </div>
      </Html>

      {/* Rotating polygon group — no digit here; digit is in world space below */}
      <group ref={groupRef}>
        <mesh geometry={icoGeom}>
          {useSafeGeometry ? (
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.22}
              depthWrite={false}
              toneMapped={false}
            />
          ) : (
            // Dielectric glass: low metalness gives Lambertian diffuse response visible
            // under raised ambient, keeping faces bright even without IBL.
            // clearcoat 0.7 adds a sharp gloss highlight from the key light.
            // depthWrite: true (default) — essential so polygon depth can occlude the digit plane.
            <meshPhysicalMaterial
              color={accentColor}
              metalness={0.08}
              roughness={0.22}
              clearcoat={0.7}
              clearcoatRoughness={0.12}
              envMap={null}
              envMapIntensity={0}
              transparent
              opacity={0.40}
              toneMapped={false}
            />
          )}
        </mesh>
        <lineSegments geometry={edgeGeom} scale={[1.003, 1.003, 1.003]} renderOrder={11}>
          <lineBasicMaterial color={useSafeGeometry ? '#ffffff' : accentColor} transparent opacity={0.55} toneMapped={false} />
        </lineSegments>
      </group>

      {/* PHASE 1 PROBE: Force visibility to confirm digit mesh is rendering.
          Temporarily: depthTest=false, renderOrder=999, opacity=1.0.
          After probe passes, revert to depthTest=true with small offset. */}
      {!useSafeDigit && digitTexture && (
        <mesh ref={numberPlaneRef} position={[0, 0, 0.03]} rotation={[0, 0, Math.PI]} renderOrder={10}>
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial
            map={digitTexture}
            color={accentColor}
            transparent
            opacity={1}
            depthTest
            depthWrite={false}
            alphaTest={0.01}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* P3 probe: exaggerated readable reflection clone below the polygon. */}
      {false && !useSafeDigit && digitTexture && (
        <mesh
          ref={reflectionRef}
          position={[0, -1.05, -0.04]}
          scale={[1, 1, 1]}
        >
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial
            map={digitTexture}
            color={accentColor}
            transparent
            opacity={0.26}
            alphaTest={0.02}
            toneMapped={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

    </>
  )
}
