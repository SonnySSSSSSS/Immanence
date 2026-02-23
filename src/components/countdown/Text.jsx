// Numeric text geometry for preset #3.
import * as THREE from 'three'
import { forwardRef, useLayoutEffect, useRef, useMemo, useState } from 'react'
import { useLoader, extend, useThree } from '@react-three/fiber'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

extend({ TextGeometry })

function isFiniteNumber(v) {
  return typeof v === 'number' && globalThis.isFinite(v)
}

// Optical centering compensation for glyphs that read left-biased (especially "1").
// Values are fractions of the rendered text height (stable across font sizes).
const OPTICAL_X_OFFSET_BY_VALUE = Object.freeze({
  '1': -0.070,
  '10': -0.030,
  '11': -0.050,
  '12': -0.026,
  '13': -0.026,
  '14': -0.026,
  '15': -0.026,
  '16': -0.026,
  '17': -0.026,
  '18': -0.026,
  '19': -0.026,
})

function getOpticalOffsetFactor(textValue) {
  if (Object.prototype.hasOwnProperty.call(OPTICAL_X_OFFSET_BY_VALUE, textValue)) {
    return OPTICAL_X_OFFSET_BY_VALUE[textValue]
  }
  // Fallback: "1" anywhere tends to read right-heavy; shift left a bit per occurrence.
  const ones = (textValue.match(/1/g) || []).length
  if (ones > 0) return -0.012 * ones
  return 0
}

const TextMesh = forwardRef(({ children, vAlign = 'center', hAlign = 'center', size = 1, color = '#22d3ee', onBoundsChange, ...props }, ref) => {
  const font = useLoader(FontLoader, import.meta.env.BASE_URL + 'gentilis_regular.typeface.json')
  const config = useMemo(() => ({ font, size: 40, height: 14 }), [font])
  const mesh = useRef()
  useLayoutEffect(() => {
    const sz = new THREE.Vector3()
    mesh.current.geometry.computeBoundingBox()
    mesh.current.geometry.boundingBox.getSize(sz)
    mesh.current.position.x = hAlign === 'center' ? -sz.x / 2 : hAlign === 'right' ? 0 : -sz.x
    mesh.current.position.y = vAlign === 'center' ? -sz.y / 2 : vAlign === 'top' ? 0 : -sz.y
    if (typeof onBoundsChange === 'function') {
      onBoundsChange({
        width: Math.max(0.0001, sz.x * 0.1 * size),
        height: Math.max(0.0001, sz.y * 0.1 * size),
      })
    }
  }, [children, hAlign, onBoundsChange, size, vAlign])
  return (
    <group ref={ref} {...props} scale={[0.1 * size, 0.1 * size, 0.1]}>
      <mesh ref={mesh}>
        <textGeometry args={[children, config]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.22}
          metalness={0.04}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

export default function Number({
  displayNumber = 0,
  color = '#22d3ee',
  targetPixelHeight = 360,
  minPixelHeight = 220,
  maxPixelHeight = 680,
  maxWidthRatio = 0.80,
}) {
  // Use a fixed reference string for height normalization so 2-digit values don't "read smaller"
  // just because their glyph bounds differ. Width squeezing uses live bounds.
  const [refWorldBounds, setRefWorldBounds] = useState({ width: 1, height: 1 })
  const [liveWorldBounds, setLiveWorldBounds] = useState({ width: 1, height: 1 })
  const { viewport, size } = useThree()

  const safeNumber = isFiniteNumber(displayNumber) ? Math.max(0, Math.round(displayNumber)) : 0
  const textValue = String(safeNumber)

  const clampedTargetPx = Math.max(minPixelHeight, Math.min(maxPixelHeight, targetPixelHeight))
  const pxToWorldY = size.height > 0 ? viewport.height / size.height : 0
  const pxToWorldX = size.width > 0 ? viewport.width / size.width : 0
  const targetWorldHeight = clampedTargetPx * pxToWorldY
  const targetWorldWidth = Math.max(0, size.width * maxWidthRatio) * pxToWorldX

  const safeRefHeight = Math.max(0.0001, refWorldBounds.height)
  const safeLiveWidth = Math.max(0.0001, liveWorldBounds.width)
  const heightScale = targetWorldHeight > 0 ? targetWorldHeight / safeRefHeight : 1
  // Keep vertical size consistent across 1- and 2-digit values.
  // If width would exceed the container, squeeze X only (avoid shrinking Y).
  const xSqueeze = targetWorldWidth > 0 ? Math.min(1, targetWorldWidth / (safeLiveWidth * heightScale)) : 1
  const scaleX = heightScale * xSqueeze
  const scaleY = heightScale
  const opticalOffsetWorld = getOpticalOffsetFactor(textValue) * targetWorldHeight

  return (
    <group scale={[scaleX, scaleY, 1]} position={[opticalOffsetWorld, 0, 0]}>
      {/* Hidden reference: establishes consistent height across glyphs. */}
      <group visible={false}>
        <TextMesh size={10} color={color} onBoundsChange={setRefWorldBounds}>
          88
        </TextMesh>
      </group>

      <TextMesh size={10} color={color} onBoundsChange={setLiveWorldBounds}>
        {textValue}
      </TextMesh>
    </group>
  )
}
