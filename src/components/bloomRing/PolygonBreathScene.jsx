import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html } from '@react-three/drei'

const POLYGON_DIGIT_TEXTURE_SIZE = 256
const POLYGON_DEBUG_LOGS = false
const POLYGON_DIGIT_TEXTURE_CACHE = new Map()
const POLY_PROBE_SIGNATURE = 'PolygonBreathScene.jsx::forensics-v1'
// Dev-only probe toggles. Keep both false for normal visuals.
const POLY_SAFE_GEOMETRY = false
const POLY_SAFE_DIGIT = false

function summarizeWebGLArg(arg) {
  if (arg == null) return String(arg)
  const type = typeof arg
  if (type === 'number' || type === 'boolean') return `${type}:${arg}`
  if (type === 'string') return `string:${arg.slice(0, 64)}`
  if (ArrayBuffer.isView(arg)) {
    const ctor = arg.constructor?.name || 'TypedArray'
    return `${ctor}[${arg.byteLength}]`
  }
  if (typeof HTMLCanvasElement !== 'undefined' && arg instanceof HTMLCanvasElement) {
    return `HTMLCanvasElement(${arg.width}x${arg.height})`
  }
  if (typeof ImageBitmap !== 'undefined' && arg instanceof ImageBitmap) {
    return `ImageBitmap(${arg.width}x${arg.height})`
  }
  const ctor = arg?.constructor?.name || 'Object'
  return ctor
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
  const modeSuffix = (!useSafeGeometry && useSafeDigit) ? ' · DIGIT OFF' : ''

  useEffect(() => {
    console.info(`[POLY PROBE] ${POLY_PROBE_SIGNATURE} mounted mode=${modeLabel}${modeSuffix}`)
  }, [modeLabel, modeSuffix])

  useEffect(() => {
    const glContext = gl?.getContext?.()
    if (!glContext) return undefined

    const originalTexSubImage2D = glContext.texSubImage2D
    const originalPixelStorei = glContext.pixelStorei
    if (typeof originalTexSubImage2D !== 'function' || typeof originalPixelStorei !== 'function') {
      return undefined
    }

    const PREMULT = glContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL
    const FLIPY = glContext.UNPACK_FLIP_Y_WEBGL
    let texSubImageLogCount = 0

    function wrappedPixelStorei(...args) {
      const pname = args[0]
      if (pname === PREMULT || pname === FLIPY) {
        console.warn('[POLY PROBE] pixelStorei unpack flag set while polygon mounted', {
          signature: POLY_PROBE_SIGNATURE,
          mode: `${modeLabel}${modeSuffix}`,
          pname,
          value: args[1],
          stack: new Error().stack,
        })
      }
      return originalPixelStorei.apply(glContext, args)
    }

    function wrappedTexSubImage2D(...args) {
      if (texSubImageLogCount < 12) {
        texSubImageLogCount += 1
        console.warn('[POLY PROBE] texSubImage2D called', {
          signature: POLY_PROBE_SIGNATURE,
          mode: `${modeLabel}${modeSuffix}`,
          argTypes: args.map(summarizeWebGLArg),
          stack: new Error().stack,
          callIndex: texSubImageLogCount,
        })
      }
      return originalTexSubImage2D.apply(glContext, args)
    }

    glContext.pixelStorei = wrappedPixelStorei
    glContext.texSubImage2D = wrappedTexSubImage2D

    return () => {
      if (glContext.pixelStorei === wrappedPixelStorei) glContext.pixelStorei = originalPixelStorei
      if (glContext.texSubImage2D === wrappedTexSubImage2D) glContext.texSubImage2D = originalTexSubImage2D
    }
  }, [gl, modeLabel, modeSuffix])

  useEffect(() => {
    const originalWarn = console.warn
    const originalError = console.error
    const x4008Pattern = /X4008|C:\\fakepath\(210,11-125\)|floating point division by zero/i

    function wrapConsole(fn) {
      return (...args) => {
        const message = args.map((v) => String(v)).join(' ')
        if (x4008Pattern.test(message)) {
          originalWarn('[POLY PROBE] X4008 seen while polygon mounted', {
            signature: POLY_PROBE_SIGNATURE,
            mode: `${modeLabel}${modeSuffix}`,
            stack: new Error().stack,
          })
        }
        return fn.apply(console, args)
      }
    }

    const wrappedWarn = wrapConsole(originalWarn)
    const wrappedError = wrapConsole(originalError)
    console.warn = wrappedWarn
    console.error = wrappedError

    return () => {
      if (console.warn === wrappedWarn) console.warn = originalWarn
      if (console.error === wrappedError) console.error = originalError
    }
  }, [modeLabel, modeSuffix])

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
      {!useSafeGeometry && <Environment preset="city" />}

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
          {modeLabel}{modeSuffix}
        </div>
      </Html>

      {/* Rotating polygon group — digit rotates and can be occluded */}
      <group ref={groupRef}>
        <mesh geometry={icoGeom}>
          <meshBasicMaterial colorWrite={false} depthWrite />
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
          <lineBasicMaterial color={useSafeGeometry ? '#ffffff' : accentColor} transparent opacity={0.55} toneMapped={false} />
        </lineSegments>

        {!useSafeDigit && digitTexture && (
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

      {!useSafeGeometry && (
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
