// JeweledBraceletRND.jsx — Preset 1: Jeweled Bracelet
//
// Identity: Organic unity. Wearable object responding to breath.
//
// Geometry:
//   • Thin base torus (wire).
//   • 20 evenly-spaced node spheres embedded at outer circumference.
//   • Soft outer glow shell (very faint additive corona).
//
// Animation contract (all nodes identical, no directional movement):
//   INHALE   – ringScale 1.00→1.03 (easeInOut), nodeEmissive increases.
//   HOLD     – ringScale fixed, single synchronized pulse (peak at holdProgress≈0.5).
//   EXHALE   – ringScale 1.03→1.00 (easeInOut), nodeEmissive decreases.
//
// No bloom, no postprocessing, no rotation.

import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constants ────────────────────────────────────────────────────────────────
const NODE_COUNT    = 20;
const RING_RADIUS   = 1.0;
const RING_TUBE     = 0.038;   // thin wire
const NODE_RADIUS   = 0.042;   // jewel size — slightly proud of ring outer edge
const GLOW_TUBE     = 0.20;    // outer corona tube radius (very low opacity)

// AutoFit: nodes at R=1.0, outer edge = 1.042 → maxRadius 1.12
const BRACELET_MAX_RADIUS = 1.12;
const BRACELET_FILL       = 0.86;

// Smoothstep easing [0,1] → [0,1]
function easeInOut(p) {
  const c = Math.max(0, Math.min(1, p));
  return c * c * (3 - 2 * c);
}

// ── AutoFitScene ─────────────────────────────────────────────────────────────
function AutoFitScene({ maxRadius, fillFactor, children }) {
  const rootRef = useRef(null);
  useFrame(({ viewport }) => {
    if (!rootRef.current) return;
    const minV = Math.min(viewport.width, viewport.height);
    if (Number.isFinite(minV) && minV > 0) {
      rootRef.current.scale.setScalar((minV * fillFactor) / 2 / maxRadius);
    }
  });
  return <group ref={rootRef}>{children}</group>;
}

// ── JeweledBraceletScene ─────────────────────────────────────────────────────
function JeweledBraceletScene({ accentColor, breathDriver }) {
  const ringGroupRef = useRef(null);  // gets scale-animated by breath
  const glowMatRef   = useRef(null);
  const nodeRef      = useRef(null);  // instancedMesh for the 20 jewels
  const dummy        = useMemo(() => new THREE.Object3D(), []);

  // Shared node material — emissiveIntensity updated per-frame
  const nodeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:            '#d8f8f4',
    emissive:         new THREE.Color('#22d3ee'),
    emissiveIntensity: 0.6,
    roughness:         0.12,
    metalness:         0.15,
    toneMapped:        false,
  }), []);
  const nodeMatRef = useRef(nodeMat);

  // Node positions: evenly distributed on main ring circumference
  const nodeAngles = useMemo(() =>
    Array.from({ length: NODE_COUNT }, (_, i) => (i / NODE_COUNT) * Math.PI * 2),
  []);

  // Set instanced node matrices ONCE at mount (positions never change)
  useEffect(() => {
    if (!nodeRef.current) return;
    for (let i = 0; i < NODE_COUNT; i++) {
      const a = nodeAngles[i];
      dummy.position.set(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      nodeRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodeRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, nodeAngles]);

  useFrame(() => {
    const phase = breathDriver?.phase ?? 'inhale';
    const pp    = breathDriver?.phaseProgress01 ?? 0;
    const ep    = easeInOut(pp);

    // ── Ring scale ──────────────────────────────────────────────────────────
    let ringScale;
    if (phase === 'inhale')       ringScale = 1.00 + 0.030 * ep;
    else if (phase === 'holdTop') ringScale = 1.030; // peak, fixed
    else if (phase === 'exhale')  ringScale = 1.030 - 0.030 * ep;
    else                          ringScale = 1.000; // holdBottom: base

    if (ringGroupRef.current) {
      ringGroupRef.current.scale.setScalar(ringScale);
    }

    // ── Node emissive intensity ─────────────────────────────────────────────
    // INHALE: 0.55 → 1.10  HOLD: pulse (0.9 → 1.20 → 0.9)  EXHALE: 1.10 → 0.55
    let nodeEmissive;
    if (phase === 'inhale') {
      nodeEmissive = 0.55 + 0.55 * ep;
    } else if (phase === 'holdTop') {
      // Single synchronized pulse: peak at holdProgress ≈ 0.5
      const pulse = Math.sin(pp * Math.PI); // 0 → 1 → 0
      nodeEmissive = 0.90 + 0.30 * pulse;
    } else if (phase === 'exhale') {
      nodeEmissive = 1.10 - 0.55 * ep;
    } else {
      nodeEmissive = 0.55; // holdBottom: base level
    }

    nodeMatRef.current.emissive.set(accentColor || '#22d3ee');
    nodeMatRef.current.emissiveIntensity = nodeEmissive;

    // ── Glow shell opacity ──────────────────────────────────────────────────
    if (glowMatRef.current) {
      let glowOpacity;
      if (phase === 'inhale')       glowOpacity = 0.04 + 0.03 * ep;
      else if (phase === 'holdTop') glowOpacity = 0.07 + 0.02 * Math.sin(pp * Math.PI);
      else if (phase === 'exhale')  glowOpacity = 0.07 - 0.03 * ep;
      else                          glowOpacity = 0.04;

      glowMatRef.current.opacity = glowOpacity;
      glowMatRef.current.color.set(accentColor || '#22d3ee');
    }
  });

  return (
    <>
      {/* Minimal ambient — nodes read by emissive, not lighting */}
      <ambientLight intensity={0.05} />

      <AutoFitScene maxRadius={BRACELET_MAX_RADIUS} fillFactor={BRACELET_FILL}>
        {/* ringGroupRef carries the breath-driven scale */}
        <group ref={ringGroupRef}>

          {/* ── Outer glow corona ────────────────────────────────────────── */}
          <mesh>
            <torusGeometry args={[RING_RADIUS, GLOW_TUBE, 16, 128]} />
            <meshBasicMaterial
              ref={glowMatRef}
              color={accentColor || '#22d3ee'}
              transparent
              opacity={0.04}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* ── Base wire torus ───────────────────────────────────────────── */}
          <mesh>
            <torusGeometry args={[RING_RADIUS, RING_TUBE, 32, 256]} />
            <meshStandardMaterial
              color="#c8f2ec"
              emissive={new THREE.Color(accentColor || '#22d3ee')}
              emissiveIntensity={0.55}
              roughness={0.25}
              metalness={0.20}
              toneMapped={false}
            />
          </mesh>

          {/* ── Node jewels (instanced) ───────────────────────────────────── */}
          <instancedMesh
            ref={nodeRef}
            args={[null, null, NODE_COUNT]}
            material={nodeMat}
            frustumCulled={false}
          >
            <sphereGeometry args={[NODE_RADIUS, 16, 16]} />
          </instancedMesh>
        </group>
      </AutoFitScene>
    </>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function JeweledBraceletRND({ accentColor, breathDriver, className, style }) {
  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      dpr={[1, 2]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <JeweledBraceletScene accentColor={accentColor} breathDriver={breathDriver} />
      {/* No EffectComposer — spec forbids bloom beyond ring boundary */}
    </Canvas>
  );
}
