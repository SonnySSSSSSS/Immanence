// NeonWireRingRND.jsx — Preset 3: Tech Instrument
//
// Identity: Precision breathing meter.
//
// Geometry:
//   • Dark base torus (structural bezel).
//   • 24 evenly-spaced rectangular segments (instanced planes), face-on to camera.
//   • Thin outer rim (subtle metallic border).
//   • Inner-core disc (exaggeration A: glowing center accent).
//
// Animation contract (breathDriver-driven):
//   INHALE   – segments activate clockwise, 0 → 24 proportional to inhaleProgress.
//              Each segment fades in over ~80ms (clean, short). Previous remain lit.
//   HOLD     – all segments lit. Single synchronized brightness pulse
//              (peak at holdProgress ≈ 0.5). No sequencing.
//   EXHALE   – segments deactivate in reverse (clockwise → off), 24 → 0.
//              Instant discrete off (no softness).
//
// Pare-down pass B: premium restraint — device-grade, not nightclub.

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── Debug toggles ─────────────────────────────────────────────────────────────
const DEBUG_FORCE_PROGRESS = null;  // set to 0.35 for static screenshot capture
const DEBUG_FORCE_PHASE    = 'inhale';

// ── Constants ─────────────────────────────────────────────────────────────────
const SEGMENT_COUNT  = 24;
const RING_RADIUS    = 1.0;
const RING_TUBE      = 0.060;   // base bezel tube
const SEG_WIDTH      = 0.182;   // tangential span (leaves visible gap between segments)
const SEG_HEIGHT     = 0.088;   // radial span
const SEG_Z          = 0.068;   // z-offset so segments sit in front of torus front face

// Segments at R=1.0, max radial extent = 1.044. Add margin.
const INSTRUMENT_MAX_RADIUS = 1.12;
const INSTRUMENT_FILL       = 0.86;

// Fade-in rate: full bright in ~80ms at 60fps → rate = 1 / 0.08 = 12.5
const FADE_IN_RATE = 13;

// ── Pare-down B — device-grade parameters ────────────────────────────────────
// ON_BRIGHTNESS ~1.15: lit segments are clearly powered but not nightclub-hot.
const ON_BRIGHTNESS   = 1.15;
const HOLD_BOOST_MAX  = 0.18;   // subtle breath pulse at holdTop midpoint

// Bloom — higher threshold keeps halo tight; lower intensity = refined glow.
const BLOOM_THRESHOLD = 0.45;
const BLOOM_INTENSITY = 0.6;
const BLOOM_RADIUS    = 0.26;

// Inner-core disc: quiet accent presence — proportional to active count.
const CORE_RADIUS     = 0.38;
const CORE_Z          = -0.01;
const CORE_BRIGHTNESS = 0.28;

// ── AutoFitScene ──────────────────────────────────────────────────────────────
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

// ── TechInstrumentScene ───────────────────────────────────────────────────────
function TechInstrumentScene({ accentColor, breathDriver }) {
  const segRef    = useRef(null);
  const coreRef   = useRef(null);   // inner-core disc material ref
  const dummy     = useMemo(() => new THREE.Object3D(), []);
  const workColor = useMemo(() => new THREE.Color(), []);
  const offColor  = useMemo(() => new THREE.Color('#040a0d'), []); // near-black hardware
  const brightnessRef = useRef(new Float32Array(SEGMENT_COUNT).fill(0));

  const easeInOut = (p) => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

  // Set all 24 segment matrices ONCE at mount (positions/rotations never change)
  useEffect(() => {
    if (!segRef.current) return;
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const angle = (i / SEGMENT_COUNT) * Math.PI * 2;
      dummy.position.set(
        Math.cos(angle) * RING_RADIUS,
        Math.sin(angle) * RING_RADIUS,
        SEG_Z
      );
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      segRef.current.setMatrixAt(i, dummy.matrix);
    }
    segRef.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      segRef.current.setColorAt(i, offColor);
    }
    if (segRef.current.instanceColor) {
      segRef.current.instanceColor.needsUpdate = true;
    }
  }, [dummy, offColor]);

  useFrame((_, delta) => {
    if (!segRef.current) return;

    // Debug override for static screenshot capture
    const phase = (DEBUG_FORCE_PROGRESS != null ? DEBUG_FORCE_PHASE : breathDriver?.phase) ?? 'holdBottom';
    const pp    = (DEBUG_FORCE_PROGRESS != null ? DEBUG_FORCE_PROGRESS : breathDriver?.phaseProgress01) ?? 0;
    const ep    = easeInOut(pp);

    // ── Target active segment count ──────────────────────────────────────────
    let targetActive;
    if (phase === 'inhale') {
      targetActive = Math.round(ep * SEGMENT_COUNT);
    } else if (phase === 'holdTop') {
      targetActive = SEGMENT_COUNT;
    } else if (phase === 'exhale') {
      targetActive = SEGMENT_COUNT - Math.round(ep * SEGMENT_COUNT);
    } else {
      targetActive = 0;
    }

    // ── Hold brightness pulse ────────────────────────────────────────────────
    let holdBoost = 0;
    if (phase === 'holdTop') {
      holdBoost = HOLD_BOOST_MAX * Math.sin(pp * Math.PI);
    }

    // ── Update per-segment brightness ────────────────────────────────────────
    const brightness = brightnessRef.current;
    const accentHex  = accentColor || '#22d3ee';

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const shouldBeOn = i < targetActive;

      if (shouldBeOn) {
        brightness[i] = Math.min(1.0, brightness[i] + delta * FADE_IN_RATE);
      } else {
        brightness[i] = 0;
      }

      const b = brightness[i];
      if (b < 0.005) {
        workColor.copy(offColor);
      } else {
        // HDR: multiplyScalar > 1 → values exceed 1.0 → triggers bloom
        const activeBrightness = b * (ON_BRIGHTNESS + holdBoost);
        workColor.set(accentHex).multiplyScalar(activeBrightness);
      }

      segRef.current.setColorAt(i, workColor);
    }

    if (segRef.current.instanceColor) {
      segRef.current.instanceColor.needsUpdate = true;
    }

    // ── Inner-core: dim at holdBottom, glows with active count ──────────────
    if (coreRef.current) {
      const activeFrac = targetActive / SEGMENT_COUNT;
      const coreIntensity = CORE_BRIGHTNESS * activeFrac + holdBoost * 0.4;
      workColor.set(accentHex).multiplyScalar(Math.max(0, coreIntensity));
      coreRef.current.color.copy(workColor);
    }
  });

  return (
    <AutoFitScene maxRadius={INSTRUMENT_MAX_RADIUS} fillFactor={INSTRUMENT_FILL}>
      {/* ── Inner-core accent disc (exaggeration A) ───────────────────────── */}
      <mesh position={[0, 0, CORE_Z]}>
        <circleGeometry args={[CORE_RADIUS, 64]} />
        <meshBasicMaterial ref={coreRef} color="#000000" toneMapped={false} transparent opacity={0.82} />
      </mesh>

      {/* ── Dark base bezel ring ──────────────────────────────────────────── */}
      <mesh>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 24, 256]} />
        <meshBasicMaterial color="#060e12" toneMapped={false} />
      </mesh>

      {/* ── Thin outer metallic rim ───────────────────────────────────────── */}
      <mesh>
        <torusGeometry args={[RING_RADIUS, RING_TUBE + 0.014, 16, 256]} />
        <meshBasicMaterial color="#0e1c22" toneMapped={false} />
      </mesh>

      {/* ── Segments (instanced) ─────────────────────────────────────────── */}
      <instancedMesh
        ref={segRef}
        args={[null, null, SEGMENT_COUNT]}
        frustumCulled={false}
      >
        <planeGeometry args={[SEG_WIDTH, SEG_HEIGHT]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </AutoFitScene>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function NeonWireRingRND({ accentColor, breathDriver, className, style }) {
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
      <TechInstrumentScene accentColor={accentColor} breathDriver={breathDriver} />
      {(
        <EffectComposer>
          <Bloom
            threshold={BLOOM_THRESHOLD}
            intensity={BLOOM_INTENSITY}
            radius={BLOOM_RADIUS}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
