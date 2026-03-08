/**
 * YinYang.jsx — replaces Prism.jsx in preset 5
 *
 * To revert: change two lines in RainbowPresetBreathScene.jsx:
 *   import { YinYang } from './YinYang.jsx'  →  import { Prism } from './Prism.jsx'
 *   <YinYang .../>                           →  <Prism .../>
 */

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'

const R     = 1.0     // outer radius
const DOT_R = R / 6   // inner dot radius
const DEPTH = 0.40    // extrusion depth
const N     = 96      // points per arc

// Parametric arc — reliable alternative to absarc; angles interpolate linearly
function arcPts(cx, cy, r, a0, a1, n = N, skipLast = false) {
  const pts = []
  const count = skipLast ? n : n + 1
  for (let i = 0; i < count; i++) {
    const a = a0 + (a1 - a0) * (i / n)
    pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return pts
}

// Dark (yin) half — CCW winding (verified)
// (0,R) → outer-left arc → (0,-R) → lower-right bump → (0,0) → upper-left dent → (0,R)
function buildDarkShape() {
  return new THREE.Shape([
    ...arcPts(0,      0,    R,   Math.PI / 2,       3 * Math.PI / 2,  N, true),
    ...arcPts(0, -R / 2, R / 2, -Math.PI / 2,       Math.PI / 2,     N, true),
    ...arcPts(0,  R / 2, R / 2, -Math.PI / 2,  -3 * Math.PI / 2),
  ])
}

// Light (yang) half — CCW winding (verified)
// (0,R) → upper-left dent → (0,0) → lower-right → (0,-R) → outer-right arc → (0,R)
function buildLightShape() {
  return new THREE.Shape([
    ...arcPts(0,  R / 2, R / 2,  Math.PI / 2,   3 * Math.PI / 2,  N, true),
    ...arcPts(0, -R / 2, R / 2,  Math.PI / 2,  -Math.PI / 2,      N, true),
    ...arcPts(0,      0,    R,  -Math.PI / 2,   Math.PI / 2),
  ])
}

// Large bevel so most visible surface is angled (catches light well, shows glass effect)
const EXTRUDE_OPTS = {
  depth: DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.18,
  bevelSize: 0.10,
  bevelSegments: 6,
  curveSegments: 1,
}

// transmission:0.6 — partial glass so specular highlights are visible even on flat faces.
// emissive provides base glow so the shape is visible before spotlight activates.
const DARK_MAT = {
  clearcoat: 1,
  transmission: 0.6,
  thickness: 0.5,
  roughness: 0.05,
  chromaticAberration: 1,
  color: '#180530',
  emissive: '#2a0850',
  emissiveIntensity: 0.55,
  toneMapped: false,
  samples: 6,
  resolution: 256,
}

const LIGHT_MAT = {
  clearcoat: 1,
  transmission: 0.6,
  thickness: 0.5,
  roughness: 0.05,
  chromaticAberration: 1,
  color: '#e8d4a8',
  emissive: '#c89030',
  emissiveIntensity: 0.40,
  toneMapped: false,
  samples: 6,
  resolution: 256,
}

export function YinYang({ onRayOver, onRayOut, onRayMove, quality = 'default', ...props }) {
  const visualRef = useRef(null)
  const useCheapMaterial = quality === 'stillness'

  const [darkGeo, lightGeo] = useMemo(() => [
    new THREE.ExtrudeGeometry(buildDarkShape(), EXTRUDE_OPTS),
    new THREE.ExtrudeGeometry(buildLightShape(), EXTRUDE_OPTS),
  ], [])

  // Visual rotates; hitbox stays stationary so normals are stable (no jitter)
  useFrame((state) => {
    if (visualRef.current) visualRef.current.rotation.z = -state.clock.elapsedTime * 0.15
  })

  const z0   = -DEPTH / 2
  const zDot =  DEPTH / 2 + 0.02

  return (
    <group {...props}>
      {/*
        Hitbox — IDENTICAL to Prism.jsx's hitbox.
        3-segment cylinder = 3 large flat faces → stable normals → no rainbow jitter.
        Kept outside the rotating visualRef so it never spins.
      */}
      <mesh
        visible={false}
        scale={1.9}
        rotation={[Math.PI / 2, Math.PI, 0]}
        onRayOver={onRayOver}
        onRayOut={onRayOut}
        onRayMove={onRayMove}
      >
        <cylinderGeometry args={[1, 1, 1, 3, 1]} />
      </mesh>

      {/* Visual — rotates independently of hitbox */}
      <group ref={visualRef}>
        <mesh geometry={darkGeo} position={[0, 0, z0]} dispose={null}>
          {useCheapMaterial ? (
            <meshPhysicalMaterial
              color={DARK_MAT.color}
              emissive={DARK_MAT.emissive}
              emissiveIntensity={DARK_MAT.emissiveIntensity}
              roughness={0.16}
              metalness={0.08}
              clearcoat={0.4}
              toneMapped={false}
            />
          ) : (
            <MeshTransmissionMaterial {...DARK_MAT} />
          )}
        </mesh>

        <mesh geometry={lightGeo} position={[0, 0, z0]} dispose={null}>
          {useCheapMaterial ? (
            <meshPhysicalMaterial
              color={LIGHT_MAT.color}
              emissive={LIGHT_MAT.emissive}
              emissiveIntensity={LIGHT_MAT.emissiveIntensity}
              roughness={0.14}
              metalness={0.08}
              clearcoat={0.4}
              toneMapped={false}
            />
          ) : (
            <MeshTransmissionMaterial {...LIGHT_MAT} />
          )}
        </mesh>

        {/* Light dot on dark half */}
        <mesh position={[0, R / 2, zDot]} renderOrder={11}>
          <circleGeometry args={[DOT_R, 48]} />
          <meshStandardMaterial color="#f0e2c4" metalness={0.5} roughness={0.1} toneMapped={false} />
        </mesh>

        {/* Dark dot on light half */}
        <mesh position={[0, -R / 2, zDot]} renderOrder={11}>
          <circleGeometry args={[DOT_R, 48]} />
          <meshStandardMaterial color="#0c0220" metalness={0.5} roughness={0.1} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
