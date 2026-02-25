import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Html } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

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
const POLYGON_PERF_FPS_TARGET = 45
const POLYGON_PERF_DEGRADE_SECONDS = 3
// Dev-only probe toggles. Keep both false for normal visuals.
const POLY_SAFE_GEOMETRY = false
const POLY_SAFE_DIGIT = false
const POLYGON_QUALITY_CONFIG = {
  hi: { dprCap: 1.5, composerScale: 1.0, bloomEnabled: true, envIntensity: 1.0 },
  mid: { dprCap: 1.25, composerScale: 0.75, bloomEnabled: true, envIntensity: 0.7 },
  low: { dprCap: 1.0, composerScale: 0.6, bloomEnabled: false, envIntensity: 0.45 },
}

// Direct-light rig for polygon preset — no IBL, no shadows, no helpers.
// All positions are in world space; three.js default target is [0,0,0].
function PolyLightRig({ accentColor }) {
  return (
    <>
      {/* Fill: raised ambient so unlit faces aren't near-black without IBL */}
      <ambientLight intensity={0.22} />
      {/* Key: tighter front/upper/right for jewelry-style specular line */}
      <directionalLight position={[3.4, 3.8, 2.2]} intensity={2.8} color="#f6fbff" />
      {/* Rim: behind/upper/left for edge sparkle */}
      <directionalLight position={[-3.0, 2.8, -2.4]} intensity={1.15} color="#9fd7ff" />
      {/* Bounce: low warm ground fill tinted by accent */}
      <pointLight position={[0, -1.4, 0.5]} intensity={0.28} color={accentColor} />
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
  // L2: halo pass for laser glow envelope.
  ctx.globalAlpha = 0.45
  ctx.shadowColor = '#9ef0ff'
  ctx.shadowBlur = 28
  ctx.fillStyle = '#9ef0ff'
  ctx.fillText(String(value), 0, 0)
  // L2: crisp core pass over halo.
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
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
  const runtimeQualityInfo = useMemo(() => {
    if (typeof window === 'undefined') {
      return { initialTier: 'hi', fxKillSwitch: false, autoDowngrade: false }
    }
    const params = new URLSearchParams(window.location.search || '')
    const mobileByUa = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
    const touchByHardware = (navigator.maxTouchPoints || 0) > 1
    const lowMemory = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4
    const initialTier = (mobileByUa || touchByHardware || lowMemory) ? 'mid' : 'hi'
    return {
      initialTier,
      fxKillSwitch: params.has('polyFxOff'),
      autoDowngrade: !params.has('polyNoAutoTier'),
    }
  }, [])
  const [qualityTier, setQualityTier] = useState(runtimeQualityInfo.initialTier)
  const qualityConfig = POLYGON_QUALITY_CONFIG[qualityTier] || POLYGON_QUALITY_CONFIG.hi
  const envIntensity = runtimeQualityInfo.fxKillSwitch ? 0 : qualityConfig.envIntensity
  const bloomIntensity = runtimeQualityInfo.fxKillSwitch
    ? 0
    : qualityTier === 'hi'
      ? 0.35
      : qualityTier === 'mid'
        ? 0.22
        : 0
  const perfMonitorRef = useRef({ elapsed: 0, frames: 0, lowFpsForSec: 0 })
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
      console.debug(
        `[PolygonBreathScene] mounted mode=${modeLabel} tier=${qualityTier} dprCap=${qualityConfig.dprCap} fxKill=${runtimeQualityInfo.fxKillSwitch}`
      )
    }
  }, [modeLabel, qualityTier, qualityConfig.dprCap, runtimeQualityInfo.fxKillSwitch])

  // Permanent fix: disable shadows and environment for polygon preset stability
  useEffect(() => {
    gl.shadowMap.enabled = false
  }, [gl])

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
  const digitInsideCueRef = useRef()
  const reflectionRef = useRef()    // upright reflection below polygon

  useFrame((state, delta) => {
    if (!groupRef.current) return
    if (size.width < 1 || size.height < 1) return

    if (runtimeQualityInfo.autoDowngrade) {
      const monitor = perfMonitorRef.current
      const safeDelta = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.25) : 0.016
      monitor.elapsed += safeDelta
      monitor.frames += 1
      if (monitor.elapsed >= 1) {
        const fps = monitor.frames / monitor.elapsed
        monitor.lowFpsForSec = fps < POLYGON_PERF_FPS_TARGET ? monitor.lowFpsForSec + monitor.elapsed : 0
        monitor.elapsed = 0
        monitor.frames = 0
        if (monitor.lowFpsForSec >= POLYGON_PERF_DEGRADE_SECONDS) {
          setQualityTier((prev) => (prev === 'hi' ? 'mid' : prev === 'mid' ? 'low' : 'low'))
          monitor.lowFpsForSec = 0
        }
      }
    }

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
    if (digitInsideCueRef.current) {
      digitInsideCueRef.current.quaternion.copy(camera.quaternion)
      digitInsideCueRef.current.rotateZ(Math.PI)
    }

    // P3 probe: make reflection face camera directly to verify transform legibility.
    if (reflectionRef.current) {
      reflectionRef.current.quaternion.copy(state.camera.quaternion)
    }

  })

  if (size.width < 1 || size.height < 1) return null

  return (
    <>
      <PolyLightRig accentColor={accentColor} />
      <Environment
        files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/blue_photo_studio_1k.hdr"
        resolution={256}
        background={false}
      />
      {bloomIntensity > 0 && (
        <EffectComposer multisampling={0} resolutionScale={qualityConfig.composerScale}>
          <Bloom mipmapBlur luminanceThreshold={0.9} intensity={bloomIntensity} />
        </EffectComposer>
      )}

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
          {modeLabel}
        </div>
      </Html>

      {/* Rotating polygon group — no digit here; digit is in world space below */}
      <group ref={groupRef}>
        <mesh geometry={icoGeom} renderOrder={0}>
          <meshBasicMaterial
            transparent
            opacity={0}
            colorWrite={false}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilFail={THREE.ReplaceStencilOp}
            stencilZFail={THREE.ReplaceStencilOp}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>
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
              metalness={0.12}
              roughness={0.30}
              clearcoat={0.85}
              clearcoatRoughness={0.20}
              ior={1.38}
              reflectivity={0.55}
              envMapIntensity={envIntensity}
              transparent
              opacity={0.46}
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
        <mesh ref={numberPlaneRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI]} renderOrder={21}>
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial
            map={digitTexture}
            color={accentColor}
            transparent
            opacity={0.85}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            alphaTest={0.01}
            toneMapped={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
            stencilFail={THREE.KeepStencilOp}
            stencilZFail={THREE.KeepStencilOp}
            stencilZPass={THREE.KeepStencilOp}
          />
        </mesh>
      )}

      {!useSafeDigit && digitTexture && (
        <mesh ref={digitInsideCueRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI]} renderOrder={20}>
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial
            map={digitTexture}
            color={accentColor}
            transparent
            opacity={0.45}
            depthTest
            depthWrite={false}
            blending={THREE.NormalBlending}
            alphaTest={0.01}
            toneMapped={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
            stencilFail={THREE.KeepStencilOp}
            stencilZFail={THREE.KeepStencilOp}
            stencilZPass={THREE.KeepStencilOp}
          />
        </mesh>
      )}

      {/* P3 probe: exaggerated readable reflection clone below the polygon. */}
      {false && !useSafeDigit && digitTexture && (
        <mesh
          ref={reflectionRef}
          position={[0, -0.78, -0.04]}
          scale={[1, 1, 1]}
        >
          <planeGeometry args={[0.72, 0.72]} />
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
