// VolumetricGlassRingRND.jsx — Preset 2: Cosmic Orb
//
// Identity: Contained current flowing through a torus.
//
// Geometry:
//   • Thick torus — single mesh with custom GLSL shader.
//   • Inner surface is brighter (vTubeT gradient: inner=1, outer=0).
//   • Single traveling emissive band (arc) on the torus surface.
//
// Animation contract (breathDriver-driven):
//   INHALE   – arcLength 20%→80%, arcStartAngle advances, arcEmissive intensifies.
//   HOLD     – arc pauses, uniform brightness lift (peak at holdProgress≈0.5).
//   EXHALE   – arcLength 80%→20%, arc continues slower, arcEmissive reduces.
//
// No postprocessing. No torus rotation. No sparkles. No segmentation.

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constants ────────────────────────────────────────────────────────────────
const RING_RADIUS = 1.0;
const RING_TUBE   = 0.24;   // thick torus
const TWO_PI      = Math.PI * 2;
const ARC_SPEED_INHALE = 0.55;   // rad/s during inhale
const ARC_SPEED_EXHALE = 0.28;   // rad/s during exhale (slower)

// Bounding sphere = 1.0 + 0.24 = 1.24. Add margin = 1.28.
const ORB_MAX_RADIUS = 1.28;
const ORB_FILL       = 0.85;

// ── Shaders ──────────────────────────────────────────────────────────────────
// vPhi  = circumferential angle around ring center [0, 2PI]
// vTubeT = tube cross-section gradient: 0 = outer face, 1 = inner face (toward hole)
const ORB_VERT = /* glsl */`
  varying float vPhi;
  varying float vTubeT;

  void main() {
    // Circumferential angle (phi): atan2(y, x) is exact for Three.js torus layout
    vPhi = mod(atan(position.y, position.x) + 6.28318530718, 6.28318530718);

    // Tube gradient: theta = angle around tube cross-section
    //   theta = 0  → outer face (away from hole)
    //   theta = PI → inner face (toward hole)
    float rFromZ  = length(position.xy);
    float tubeAngle = atan(position.z, rFromZ - 1.0); // major radius = 1.0 hardcoded
    vTubeT = 0.5 - 0.5 * cos(tubeAngle); // 0 at outer, 1 at inner

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ORB_FRAG = /* glsl */`
  uniform float uArcStart;      // current arc leading-edge angle [0, 2PI]
  uniform float uArcLength;     // arc span in radians
  uniform float uBaseEmissive;  // base torus brightness
  uniform float uArcEmissive;   // arc peak brightness
  uniform float uHoldBrightness;// extra uniform lift during hold
  uniform vec3  uColorBase;     // dark teal (accent * 0.18)
  uniform vec3  uColorArc;      // bright teal (accent blended toward white)

  varying float vPhi;
  varying float vTubeT;

  const float TWO_PI = 6.28318530718;

  void main() {
    // Angular distance ahead of arc leading edge (0 = at start, grows into arc body)
    float normStart = mod(uArcStart, TWO_PI);
    float dAhead    = mod(vPhi - normStart + TWO_PI, TWO_PI);

    // Soft edges: 0.18 rad lead-in, 0.30 rad trail-out
    float leadFade  = smoothstep(0.0, 0.18, dAhead);
    float trailFade = smoothstep(0.0, 0.30, uArcLength - dAhead);
    float arcMask   = clamp(leadFade * trailFade, 0.0, 1.0);

    // Inner brightness gradient: inner edge (vTubeT=1) is brightest
    float innerGlow = 0.28 + 0.72 * vTubeT;

    // Base torus brightness
    float baseBright = (uBaseEmissive + uHoldBrightness) * innerGlow;

    // Arc contribution — brighter at inner face for "contained current" depth
    float arcContrib = arcMask * uArcEmissive * (0.55 + 0.45 * vTubeT);

    vec3 color = uColorBase * baseBright + uColorArc * arcContrib;
    gl_FragColor = vec4(color, 1.0);
  }
`;

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

// ── CosmicOrbScene ────────────────────────────────────────────────────────────
function CosmicOrbScene({ accentColor, breathDriver }) {
  const matRef     = useRef(null);
  const arcAngleRef = useRef(0); // running arc position (advances per-frame)

  const easeInOut = (p) => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

  // Derive color values from accentColor
  const colorBase = useMemo(() => {
    const c = new THREE.Color(accentColor || '#22d3ee');
    return c.clone().multiplyScalar(0.18); // very dark teal base
  }, [accentColor]);

  const colorArc = useMemo(() => {
    const c = new THREE.Color(accentColor || '#22d3ee');
    return c.clone().lerp(new THREE.Color(1, 1, 1), 0.52); // bright teal → white
  }, [accentColor]);

  const orbUniforms = useMemo(() => ({
    uArcStart:       { value: 0 },
    uArcLength:      { value: TWO_PI * 0.20 },
    uBaseEmissive:   { value: 0.15 },
    uArcEmissive:    { value: 1.5 },
    uHoldBrightness: { value: 0 },
    uColorBase:      { value: colorBase },
    uColorArc:       { value: colorArc },
  }), [colorBase, colorArc]);

  useFrame((_, delta) => {
    const phase = breathDriver?.phase ?? 'inhale';
    const pp    = breathDriver?.phaseProgress01 ?? 0;
    const ep    = easeInOut(pp);

    // ── Advance arc angle ───────────────────────────────────────────────────
    if (phase === 'inhale') {
      arcAngleRef.current = (arcAngleRef.current + delta * ARC_SPEED_INHALE) % TWO_PI;
    } else if (phase === 'exhale') {
      arcAngleRef.current = (arcAngleRef.current + delta * ARC_SPEED_EXHALE) % TWO_PI;
    }
    // holdTop / holdBottom: arc position frozen

    if (!matRef.current) return;
    const u = matRef.current.uniforms;

    // ── Arc length (proportion of ring circumference) ───────────────────────
    if (phase === 'inhale') {
      u.uArcLength.value = (0.20 + 0.60 * ep) * TWO_PI;
    } else if (phase === 'holdTop') {
      u.uArcLength.value = 0.80 * TWO_PI;    // fixed at peak
    } else if (phase === 'exhale') {
      u.uArcLength.value = (0.80 - 0.60 * ep) * TWO_PI;
    } else { // holdBottom
      u.uArcLength.value = 0.20 * TWO_PI;
    }

    u.uArcStart.value = arcAngleRef.current;

    // ── Base emissive ───────────────────────────────────────────────────────
    if (phase === 'inhale') {
      u.uBaseEmissive.value = 0.14 + 0.12 * ep;
    } else if (phase === 'holdTop') {
      u.uBaseEmissive.value = 0.26;
    } else if (phase === 'exhale') {
      u.uBaseEmissive.value = 0.26 - 0.12 * ep;
    } else {
      u.uBaseEmissive.value = 0.14;
    }

    // ── Hold brightness lift (single pulse peaking at holdProgress≈0.5) ────
    if (phase === 'holdTop') {
      u.uHoldBrightness.value = 0.20 * Math.sin(pp * Math.PI); // 0 → 0.20 → 0
    } else {
      u.uHoldBrightness.value = 0;
    }

    // ── Arc emissive ────────────────────────────────────────────────────────
    if (phase === 'inhale') {
      u.uArcEmissive.value = 1.5 + 0.5 * ep;
    } else if (phase === 'holdTop') {
      u.uArcEmissive.value = 2.0;
    } else if (phase === 'exhale') {
      u.uArcEmissive.value = 2.0 - 0.5 * ep;
    } else {
      u.uArcEmissive.value = 1.5;
    }

    // ── Color sync ──────────────────────────────────────────────────────────
    u.uColorBase.value.copy(colorBase);
    u.uColorArc.value.copy(colorArc);
  });

  return (
    <AutoFitScene maxRadius={ORB_MAX_RADIUS} fillFactor={ORB_FILL}>
      {/* Slight static X-tilt gives 3D depth without violating the no-spin rule */}
      <group rotation={[0.15, 0, 0]}>
        <mesh>
          <torusGeometry args={[RING_RADIUS, RING_TUBE, 64, 256]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={ORB_VERT}
            fragmentShader={ORB_FRAG}
            uniforms={orbUniforms}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </AutoFitScene>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function VolumetricGlassRingRND({ accentColor, breathDriver, className, style }) {
  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      dpr={[1, 2]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        if (typeof window !== 'undefined' && typeof window.__PROBE6_REGISTER_GL__ === 'function') {
          window.__PROBE6_REGISTER_GL__({
            gl,
            canvas: gl.domElement,
            source: 'VolumetricGlassRingRND',
          });
        }
      }}
    >
      <CosmicOrbScene accentColor={accentColor} breathDriver={breathDriver} />
      {/* No EffectComposer — spec forbids bloom beyond ring boundary */}
    </Canvas>
  );
}
