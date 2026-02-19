// src/components/bloomRing/BloomRingRenderer.jsx
// Single source of truth for the WebGL bloom ring renderer.
// Used by both DevPanel BloomRingLab (tuning surface) and production BreathingRing.
//
// Props:
//   params      – flat object of all tunable values (destructured with safe defaults)
//   accentColor – hex string, stage/path accent color
//   className   – forwarded to Canvas wrapper
//   style       – forwarded to Canvas wrapper
//   mode        – 'lab' | 'production' | 'avatar' (default: 'production')
//
// Sizing: if params.width and params.height are set, uses those explicit px values.
//         Otherwise renders with width:'100%' height:'100%' to fill its CSS container.
//
// No DevPanel imports. No preset definitions. No per-frame allocations (GPU buffers fixed-size).

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// ─── TrailArc ─────────────────────────────────────────────────────────────────
// Moving comet-head + tail along an arc (right quadrant).
// Production-portable: accepts a plain params object, no lab UI coupling.
//
// Props:
//   enabled     – show/hide the trail (no side effects when false)
//   trailLin    – linear RGB object {r,g,b} for main trail particles (from palette)
//   sparkleLin  – linear RGB object {r,g,b} for sparkle particles (from palette)
//   intensity   – 0–2, overall brightness multiplier.
//                 Audio-driveable: pass amplitude envelope directly as this prop;
//                 no architectural changes required (it's a plain number per frame).
//   length      – 5–80, number of main trail particles
//   spread      – 0–0.2, radial jitter around arc
//   speed       – angular velocity (rad/s)
//   sparkle     – 0–1, secondary tiny-particle density
//
// Composition: additive blending, depthWrite:false, toneMapped:false
// → Bloom picks it up naturally; sits in front of ring geometry (z=0.05).

// Smoothstep easing [0,1] → [0,1]. Used by breathDriver phase→wave mapping.
const easeInOut = p => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

// ─── Accent palette helpers ───────────────────────────────────────────────────
// Mix in linear RGB. Output as sRGB hex — safe for R3F material color props
// regardless of Three.js colorManagement state. Only handles #RRGGBB input;
// falls back to Beacon cyan (#22d3ee) for invalid/missing values.
function sRGBtoLinear(v255) {
  const v = v255 / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSRGB(v) {
  v = Math.max(0, Math.min(1, v));
  return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
}
function hexToLin(hex) {
  if (!hex || typeof hex !== 'string') return hexToLin('#22d3ee');
  const h = hex.replace('#', '');
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return hexToLin('#22d3ee');
  return {
    r: sRGBtoLinear(parseInt(h.slice(0, 2), 16)),
    g: sRGBtoLinear(parseInt(h.slice(2, 4), 16)),
    b: sRGBtoLinear(parseInt(h.slice(4, 6), 16)),
  };
}
function linToHex({ r, g, b }) {
  const R = linearToSRGB(r), G = linearToSRGB(g), B = linearToSRGB(b);
  return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
}
function mixLin(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}
const W_LIN = { r: 1, g: 1, b: 1 }; // white in linear
const B_LIN = { r: 0, g: 0, b: 0 }; // black in linear
function tintLin(a, t) { return mixLin(a, W_LIN, t); }
function shadeLin(a, t) { return mixLin(a, B_LIN, t); }

const MAX_TRAIL   = 80;
const MAX_SPARKLE = 40;
const ARC_RADIUS  = 1.05;  // core ring outer rim alignment
const ARC_SPAN    = Math.PI * 0.65;  // ~117° tail

// The farthest point any geometry reaches in RingScene local space.
// Crosshair verticals: center y=1.50, half-height 0.275 → tip at 1.775.
// Used by autoFit to compute a camera-independent uniform scale each frame.
const SCENE_MAX_RADIUS = 1.80;
const OUTER_RING_MAX_R = 1.12;
const MAX_STREAK_X_SCALE = SCENE_MAX_RADIUS / OUTER_RING_MAX_R;
const MAX_OCCLUDER_SCALE = SCENE_MAX_RADIUS / 1.8;

function TrailArc({ enabled, trailLin, sparkleLin, intensity, length, spread, speed, sparkle, orbitalAngleRef = null }) {
  const trailRef = useRef(null);
  const materialRef = useRef(null);
  const instanceCount = MAX_TRAIL * 3;

  const randomData = useMemo(() => {
    const along = new Float32Array(instanceCount);
    const radiusJitter = new Float32Array(instanceCount);
    const angleJitter = new Float32Array(instanceCount);
    const size = new Float32Array(instanceCount);
    const hotSeed = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      // Stratified distribution keeps density even while avoiding a vector-like band.
      along[i] = Math.min(1, Math.max(0, (i + Math.random()) / instanceCount));
      radiusJitter[i] = Math.random() * 2 - 1;
      angleJitter[i] = Math.random() * 2 - 1;
      size[i] = 0.6 + Math.random() * 0.8;
      hotSeed[i] = Math.random();
    }

    return { along, radiusJitter, angleJitter, size, hotSeed };
  }, [instanceCount]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(), []);
  const sparkleColor = useMemo(() => new THREE.Color(), []);
  const whiteColor = useMemo(() => new THREE.Color(1, 1, 1), []);
  const workColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!enabled || !trailRef.current) return;

    const mesh = trailRef.current;
    const t = clock.elapsedTime;
    const syncedAngle = orbitalAngleRef?.current;
    const headAngle = Number.isFinite(syncedAngle) ? syncedAngle : (t * speed) % (Math.PI * 2);
    const trailCount = Math.max(5, Math.floor(length));
    const sparkleCount = Math.max(0, Math.floor(sparkle * MAX_SPARKLE));
    const trailNorm = Math.max(0, Math.min(1, trailCount / MAX_TRAIL));
    const sparkleNorm = Math.max(0, Math.min(1, sparkleCount / MAX_SPARKLE));
    const hotChance = Math.max(0.06, Math.min(0.22, 0.06 + sparkleNorm * 0.16));
    const hotBoost = 1.8 + sparkleNorm * 0.6;
    const canSetColor = typeof mesh.setColorAt === 'function';

    if (!canSetColor && materialRef.current) {
      materialRef.current.color.setRGB(trailLin.r, trailLin.g, trailLin.b);
    }

    baseColor.setRGB(trailLin.r, trailLin.g, trailLin.b);
    sparkleColor.setRGB(sparkleLin.r, sparkleLin.g, sparkleLin.b);

    for (let i = 0; i < instanceCount; i++) {
      const u = randomData.along[i];

      if (u > trailNorm || trailNorm <= 0) {
        dummy.position.set(0, 0, -100);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.0001, 0.0001, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (canSetColor) mesh.setColorAt(i, baseColor.setRGB(0, 0, 0));
        continue;
      }

      const un = Math.max(0, Math.min(1, u / Math.max(trailNorm, 0.0001)));
      const angle = headAngle - un * ARC_SPAN;
      const radius = ARC_RADIUS + randomData.radiusJitter[i] * spread * 0.12;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const tail = Math.pow(1 - un, 2.2);
      const flicker = 0.85 + 0.15 * Math.sin(t * 4 + i * 12.9898);
      const sizeNorm = (randomData.size[i] - 0.6) / 0.8;
      let brightness = tail * intensity * flicker * (0.35 + 0.65 * sizeNorm);
      const isHot = randomData.hotSeed[i] < hotChance;
      if (isHot) brightness *= hotBoost;
      brightness = Math.max(0, Math.min(2.4, brightness));

      const s = (0.006 + 0.020 * Math.pow(1 - un, 1.4)) * randomData.size[i];
      dummy.position.set(x, y, 0.02 + (isHot ? 0.0015 : 0));
      dummy.rotation.set(0, 0, angle + Math.PI / 2 + randomData.angleJitter[i] * 0.12);
      dummy.scale.set(s * 0.9, s * 1.3, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (canSetColor) {
        workColor.copy(baseColor);
        if (isHot) {
          workColor.lerp(sparkleColor, 0.35 + sparkleNorm * 0.35);
          workColor.lerp(whiteColor, 0.20 + sparkleNorm * 0.25);
        }
        workColor.multiplyScalar(brightness);
        mesh.setColorAt(i, workColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (canSetColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <group name="trailArc">
      <instancedMesh ref={trailRef} args={[null, null, instanceCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#ffffff"
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function HaloBand({ enabled, intensity, length, colorA, colorB }) {
  if (!enabled) return null;

  const bandRef = useRef(null);
  const materialRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(), []);
  const altColor = useMemo(() => new THREE.Color(), []);
  const workColor = useMemo(() => new THREE.Color(), []);
  const bandCount = 220;

  const randomData = useMemo(() => {
    const angle = new Float32Array(bandCount);
    const radial = new Float32Array(bandCount);
    const vertical = new Float32Array(bandCount);
    const size = new Float32Array(bandCount);
    const alpha = new Float32Array(bandCount);
    const phase = new Float32Array(bandCount);
    for (let i = 0; i < bandCount; i++) {
      angle[i] = Math.random() * Math.PI * 2;
      radial[i] = Math.random() * 2 - 1;
      vertical[i] = Math.random() * 2 - 1;
      size[i] = Math.random();
      alpha[i] = Math.random();
      phase[i] = Math.random() * Math.PI * 2;
    }
    return { angle, radial, vertical, size, alpha, phase };
  }, [bandCount]);

  useFrame(({ clock }) => {
    if (!bandRef.current) return;

    const mesh = bandRef.current;
    const t = clock.elapsedTime;
    const canSetColor = typeof mesh.setColorAt === 'function';
    const density = Math.max(0.14, Math.min(0.92, 0.30 + length * 0.55));
    const brightnessScale = Math.max(0.02, Math.min(0.34, 0.03 + intensity * 0.18));

    if (!canSetColor && materialRef.current) {
      materialRef.current.color.set(colorA);
    }

    baseColor.set(colorA);
    altColor.set(colorB);

    for (let i = 0; i < bandCount; i++) {
      const a = randomData.angle[i];
      const clump = 0.5 + 0.5 * Math.sin(a * 6 + randomData.phase[i]);
      const visible = randomData.alpha[i] < density * (0.55 + 0.45 * clump);

      if (!visible) {
        dummy.position.set(0, 0, -100);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.0001, 0.0001, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (canSetColor) mesh.setColorAt(i, workColor.setRGB(0, 0, 0));
        continue;
      }

      const rx = 1.58 + randomData.radial[i] * 0.08;
      const ry = 0.52 + randomData.vertical[i] * 0.06;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      const z = 0.008 + randomData.vertical[i] * 0.004;
      const flicker = 0.88 + 0.12 * Math.sin(t * 0.8 + i * 5.17 + randomData.phase[i]);
      const s = (0.006 + randomData.size[i] * 0.012) * (0.75 + 0.25 * clump);
      const brightness = brightnessScale * (0.35 + 0.65 * randomData.alpha[i]) * flicker;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, a + Math.PI / 2 + randomData.vertical[i] * 0.2);
      dummy.scale.set(s * 1.2, s * 0.8, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (canSetColor) {
        workColor.copy(baseColor).lerp(altColor, 0.2 + 0.4 * randomData.alpha[i]).multiplyScalar(brightness);
        mesh.setColorAt(i, workColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (canSetColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group name="haloBand" position={[0, 0, 0.015]}>
      <instancedMesh ref={bandRef} args={[null, null, bandCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          color={colorA}
          transparent
          opacity={0.45}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ─── RayOccluders ─────────────────────────────────────────────────────────────
function RayOccluders({ enabled, pattern, scale, depthOffset, debug }) {
  if (!enabled) return null;

  const debugMaterial = {
    color: "#ff3355",
    transparent: true,
    opacity: 0.25,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide
  };

  const occluderMaterial = {
    color: "#000000",
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide
  };

  const mat = debug ? debugMaterial : occluderMaterial;

  const renderCrossPattern = () => (
    <>
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.15 * scale, 32]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[0.04 * Math.sqrt(scale), 3.2 * scale]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
    </>
  );

  const renderGridPattern = () => (
    <>
      {renderCrossPattern()}
      <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0.003]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
    </>
  );

  const renderRadialPattern = () => (
    <>
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.15 * scale, 32]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={`radial-${i}`} position={[0, 0, i * 0.0005]} rotation={[0, 0, rad]}>
            <planeGeometry args={[3.6 * scale, 0.03 * Math.sqrt(scale)]} />
            <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
          </mesh>
        );
      })}
    </>
  );

  const renderPattern = () => {
    switch (pattern) {
      case 'grid':   return renderGridPattern();
      case 'radial': return renderRadialPattern();
      default:       return renderCrossPattern();
    }
  };

  return (
    <group position={[0, 0, depthOffset]} name="rayOccluders" renderOrder={-10} frustumCulled={false}>
      {renderPattern()}
    </group>
  );
}

// ─── RingScene ────────────────────────────────────────────────────────────────
// 3D scene objects: ring geometry, streak proxy, reticle, avatar glow, god-ray emitter.
// Renamed from the internal BreathingRing in BloomRingCanvas to avoid collision
// with the production BreathingRing wrapper component.
function RingScene({
  breathSpeed = 0.8,
  trailSpeed = 0.4,
  streakStrength = 0.20,
  streakLength = 0.65,
  nucleusSunRef,
  godRayLightRef,
  raySunY,
  raySunZ,
  raySunRadius,
  occluderEnabled,
  occluderPattern,
  occluderScale,
  occluderDepthOffset,
  debugOccluders,
  accentColor = '#ffffff',
  mode = 'production',
  breathDriver = null,
  orbitalAngleRef = null,
  palette = null,
  autoFit = true,
  fitFill = 0.88,
}) {
  const isAvatar = mode === 'avatar';
  const sceneRootRef   = useRef(null);
  const coreRef        = useRef(null);
  const shoulderRef    = useRef(null);
  const reticleRef     = useRef(null);
  const avatarGlowRef  = useRef(null);
  const nucleusHotRef  = useRef(null);
  const baseShoulderOpacity = 0.35;
  const occluderScaleClamped = Math.min(occluderScale, MAX_OCCLUDER_SCALE);

  useFrame(({ clock, viewport }, delta) => {
    // t is always computed for secondary time-based effects (driftPhase, inner
    // concentric, nucleus sun, avatar glow). When breathDriver is active, t is
    // NOT the breath clock — breathSpeed is irrelevant to the breath waveform.
    const t = clock.elapsedTime * breathSpeed;

    // Compute breath wave w in [-1..+1].
    // breathDriver present → deterministic from phase + phaseProgress01.
    // Absent → sine fallback (preserves existing lab animation behavior).
    let w;
    if (breathDriver) {
      const { phase, phaseProgress01 } = breathDriver;
      const ep = easeInOut(phaseProgress01 ?? 0);
      if (phase === 'inhale')       { w = ep * 2 - 1; }                              // -1 → +1
      else if (phase === 'holdTop') { w = 1  + 0.02 * Math.sin(clock.elapsedTime * 0.8); } // plateau + micro shimmer
      else if (phase === 'exhale')  { w = 1 - ep * 2; }                              // +1 → -1
      else                          { w = -1 + 0.02 * Math.sin(clock.elapsedTime * 0.8); } // holdBottom + shimmer
    } else {
      w = Math.sin(t);
    }

    const scaleAmount = 1 + 0.015 * w;
    if (coreRef.current)     coreRef.current.scale.set(scaleAmount, scaleAmount, 1);
    if (shoulderRef.current) shoulderRef.current.scale.set(scaleAmount, scaleAmount, 1);

    if (shoulderRef.current) {
      const opacityPulse = baseShoulderOpacity + 0.08 * w;
      shoulderRef.current.material.opacity = Math.max(0.15, opacityPulse);
    }

    if (reticleRef.current) {
      const reticleOpacityMod = 1.0 + 0.025 * w;
      reticleRef.current.children.forEach((line) => {
        line.children.forEach((mesh, meshIndex) => {
          if (mesh.material) {
            const baseOpacity = meshIndex === 0 ? 0.12 : 0.35;
            mesh.material.opacity = baseOpacity * reticleOpacityMod;
          }
        });
      });
    }

    let orbitalAngle = (clock.elapsedTime * trailSpeed) % (Math.PI * 2);
    if (orbitalAngleRef) {
      if (breathDriver) {
        const { phase, phaseProgress01 } = breathDriver;
        const ep = easeInOut(phaseProgress01 ?? 0);
        let phaseFactor;
        if (phase === 'inhale')       phaseFactor = 0.85 + 0.35 * ep;
        else if (phase === 'holdTop') phaseFactor = 0.22 + 0.04 * Math.sin(clock.elapsedTime * 0.8);
        else if (phase === 'exhale')  phaseFactor = 1.00 - 0.20 * ep;
        else                          phaseFactor = 0.30 + 0.04 * Math.sin(clock.elapsedTime * 0.8);

        const omega = Math.max(0.05, trailSpeed) * phaseFactor;
        orbitalAngleRef.current += delta * omega;
        const twoPi = Math.PI * 2;
        orbitalAngleRef.current = ((orbitalAngleRef.current % twoPi) + twoPi) % twoPi;
      } else {
        orbitalAngleRef.current = orbitalAngle;
      }
      orbitalAngle = orbitalAngleRef.current;
    }

    if (nucleusSunRef?.current) {
      nucleusSunRef.current.position.set(
        Math.cos(orbitalAngle) * ARC_RADIUS,
        Math.sin(orbitalAngle) * ARC_RADIUS,
        0.02
      );
      const breathPhase  = Math.sin(t);
      const nucleusPulse = 1.0 + 0.03 * breathPhase;
      nucleusSunRef.current.material.opacity = 0.22 * nucleusPulse;
    }
    if (nucleusHotRef.current) {
      nucleusHotRef.current.position.set(
        Math.cos(orbitalAngle) * ARC_RADIUS,
        Math.sin(orbitalAngle) * ARC_RADIUS,
        0.021
      );
      const breathPhase  = Math.sin(t);
      const nucleusPulse = 1.0 + 0.03 * breathPhase;
      nucleusHotRef.current.material.opacity = 0.55 * nucleusPulse;
    }

    if (isAvatar && avatarGlowRef.current) {
      const breathPhase = Math.sin(t);
      const drift = Math.sin(t * 0.37) * 0.02;
      const s = 1.0 + 0.025 * breathPhase + drift;
      avatarGlowRef.current.scale.set(s, s, 1);
      avatarGlowRef.current.children.forEach((mesh, i) => {
        if (mesh.material) {
          const base = i === 0 ? 0.12 : (i === 1 ? 0.08 : 0.05);
          mesh.material.opacity = base * (1.0 + 0.15 * breathPhase + drift);
        }
      });
    }

    // autoFit: scale the entire scene so SCENE_MAX_RADIUS fits within fitFill
    // of the smaller viewport dimension. Camera-independent (uses world-unit viewport).
    if (autoFit && sceneRootRef.current) {
      const minV = Math.min(viewport.width, viewport.height);
      if (isFinite(minV) && minV > 0) {
        sceneRootRef.current.scale.setScalar((minV * fitFill) / 2 / SCENE_MAX_RADIUS);
      }
    }
  });

  return (
    <group ref={sceneRootRef}>
      {/* Avatar mode: soft radial glow field */}
      {isAvatar && (
        <group ref={avatarGlowRef}>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.85, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.4, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.12, 64]} />
            <meshBasicMaterial color={palette?.coreHot ?? '#ffffff'} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* God-ray emitter (sun proxy) — non-avatar only */}
      {!isAvatar && (
        <mesh ref={godRayLightRef} position={[0, raySunY, raySunZ]}>
          <sphereGeometry args={[raySunRadius, 16, 16]} />
          <meshBasicMaterial color={palette?.nucleus ?? '#ffffff'} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      )}

      {/* Ray occluders — non-avatar only */}
      {!isAvatar && occluderEnabled && (
        <RayOccluders
          enabled={occluderEnabled}
          pattern={occluderPattern}
          scale={occluderScaleClamped}
          depthOffset={occluderDepthOffset}
          debug={debugOccluders}
        />
      )}

      {/* Dark center disc (halo effect) — non-avatar only */}
      {!isAvatar && (
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.9, 128]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {/* Soft shoulder ring — non-avatar only */}
      {!isAvatar && (
        <mesh ref={shoulderRef} position={[0, 0, 0]}>
          <ringGeometry args={[0.92, 1.12, 128]} />
          <meshBasicMaterial color={accentColor} transparent opacity={baseShoulderOpacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )}

      {/* Hot core ring — non-avatar only */}
      {!isAvatar && (
        <mesh ref={coreRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[0.98, 1.05, 128]} />
          <meshBasicMaterial color={palette?.coreHot ?? '#ffffff'} toneMapped={false} />
        </mesh>
      )}

      {/* Outer companion rings — non-avatar only */}
      {!isAvatar && (
        <>
          <mesh position={[0, 0, -0.002]}>
            <ringGeometry args={[0.90, 0.915, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.002]}>
            <ringGeometry args={[1.08, 1.095, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Orbital nucleus (center cleanup: orb-only) — non-avatar only */}
      {!isAvatar && (
        <>
          <mesh ref={nucleusSunRef} position={[ARC_RADIUS, 0, 0.02]}>
            <circleGeometry args={[0.03, 128]} />
            <meshBasicMaterial color={palette?.coreHot ?? '#ffffff'} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh ref={nucleusHotRef} position={[ARC_RADIUS, 0, 0.021]}>
            <circleGeometry args={[0.014, 64]} />
            <meshBasicMaterial color={palette?.coreHot ?? '#ffffff'} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Halo band (particulate, non-stroke) — non-avatar only */}
      {!isAvatar && streakStrength > 0 && (
        <HaloBand
          enabled={streakStrength > 0}
          intensity={streakStrength}
          length={streakLength}
          colorA={palette?.streakHot ?? accentColor}
          colorB={palette?.reticleBright ?? '#ffffff'}
        />
      )}

      {/* Reticle geometry — non-avatar only */}
      {!isAvatar && (
        <group ref={reticleRef} position={[0, 0, -0.005]}>
          <group>
            {[
              { angle: 0,   length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 90,  length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 180, length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 270, length: 0.11, radius: 1.60, dim: 1.0 },
            ].map(({ angle, length, radius, dim }) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <group key={`major-${angle}`} position={[Math.cos(rad) * radius, Math.sin(rad) * radius, 0]} rotation={[0, 0, rad]}>
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.07 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.18 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                </group>
              );
            })}
            {[
              { angle: 22,  length: 0.06, radius: 1.60, dim: 0.85 },
              { angle: 58,  length: 0.06, radius: 1.60, dim: 0.90 },
              { angle: 128, length: 0.06, radius: 1.60, dim: 0.75 },
              { angle: 206, length: 0.06, radius: 1.60, dim: 0.95 },
              { angle: 244, length: 0.06, radius: 1.60, dim: 0.80 },
              { angle: 316, length: 0.06, radius: 1.60, dim: 0.88 },
            ].map(({ angle, length, radius, dim }) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <group key={`minor-${angle}`} position={[Math.cos(rad) * radius, Math.sin(rad) * radius, 0]} rotation={[0, 0, rad]}>
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.07 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.18 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                </group>
              );
            })}
          </group>
          {/* Crosshair lines */}
          <group position={[0, 1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[0, -1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[-1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.31} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.31} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
        </group>
      )}
    </group>
  );
}

// ─── BloomRingRenderer (main export) ──────────────────────────────────────────
export default function BloomRingRenderer({
  params = {},
  accentColor = '#ffffff',
  className,
  style,
  mode = 'production',
}) {
  const {
    width,
    height,
    bloomStrength    = 1.2,
    bloomRadius      = 0.60,
    bloomThreshold   = 0.50,
    breathSpeed      = 0.6,
    streakStrength   = 0.0,
    streakThreshold  = 0.85,
    streakLength     = 0.65,
    rayEnabled       = false,
    rayExposure      = 0.10,
    rayWeight        = 0.4,
    rayDecay         = 0.93,
    raySamples       = 40,
    rayDensity       = 0.5,
    rayClampMax      = 0.6,
    raySunY          = 0.45,
    raySunZ          = -2.0,
    raySunRadius     = 0.10,
    occluderEnabled     = false,
    occluderPattern     = 'cross',
    occluderScale       = 1.2,
    occluderDepthOffset = -1.5,
    debugOccluders      = false,
    trailEnabled  = false,
    trailIntensity = 0.5,
    trailLength   = 30,
    trailSpread   = 0.02,
    trailSpeed    = 0.4,
    trailSparkle  = 0.1,
    breathDriver  = null,
    autoFit       = true,
    fitFill       = 0.88,
  } = params;

  const nucleusSunRef  = useRef(null);
  const godRayLightRef = useRef(null);
  const orbitalAngleRef = useRef(0);

  // Accent palette — all tints/shades of accentColor mixed in linear RGB space.
  // Ensures every rendered pixel is hue-matched to the active stage accent.
  const accentLin = useMemo(() => hexToLin(accentColor), [accentColor]);
  const palette = useMemo(() => {
    const a = accentLin;
    // Luminance-based bloom compensation (scalar, no hue change).
    // Prevents high-luminance accents (Flame #fcd34d, Beacon #22d3ee) from
    // washing out under additive blending. Clamped [0.85, 1.0] — only dims, never amplifies.
    const lum = 0.2126 * a.r + 0.7152 * a.g + 0.0722 * a.b;
    const bloomDim = Math.max(0.85, Math.min(1.0, 0.70 / Math.max(lum, 0.30)));
    const aDimmed = { r: a.r * bloomDim, g: a.g * bloomDim, b: a.b * bloomDim };
    // Linear RGB objects for TrailArc buffer writes (avoids hex→linear round trip per frame).
    const trailLin   = tintLin(aDimmed, 0.20);
    const sparkleLin = tintLin(aDimmed, 0.45);
    return {
      // Hex strings for R3F material color props:
      core:          linToHex(a),                  // pure accent (≈ accentColor)
      coreHot:       linToHex(tintLin(a, 0.25)),   // +25% toward white — bright core/nucleus
      aperture:      linToHex(shadeLin(a, 0.10)),  // slight shade — depth, not pastel
      nucleus:       linToHex(tintLin(a, 0.30)),   // +30% tint — glow center
      reticle:       linToHex(shadeLin(a, 0.05)),  // slight shade — thin lines read cleaner
      reticleBright: linToHex(tintLin(a, 0.45)),   // +45% tint — inner highlight
      streakHot:     linToHex(tintLin(a, 0.40)),   // +40% tint — streak proxy bright ring
      // Linear RGB objects for TrailArc particle buffer writes:
      trailLin,
      sparkleLin,
    };
  }, [accentLin]);

  const isAvatar           = mode === 'avatar';
  const cappedBloomStrength = Math.min(bloomStrength, 2.4);

  // Sizing: explicit px dims from params, or fill container via CSS.
  const canvasStyle = (width != null && height != null)
    ? { width, height, ...style }
    : { width: '100%', height: '100%', display: 'block', ...style };

  return (
    <Canvas
      style={canvasStyle}
      className={className}
      dpr={[1, 2]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <RingScene
        breathSpeed={breathSpeed}
        trailSpeed={trailSpeed}
        streakStrength={streakStrength}
        streakLength={streakLength}
        nucleusSunRef={nucleusSunRef}
        godRayLightRef={godRayLightRef}
        raySunY={raySunY}
        raySunZ={raySunZ}
        raySunRadius={raySunRadius}
        occluderEnabled={occluderEnabled}
        occluderPattern={occluderPattern}
        occluderScale={occluderScale}
        occluderDepthOffset={occluderDepthOffset}
        debugOccluders={debugOccluders}
        accentColor={accentColor}
        mode={mode}
        breathDriver={breathDriver}
        orbitalAngleRef={orbitalAngleRef}
        palette={palette}
        autoFit={autoFit}
        fitFill={fitFill}
      />

      {/* TrailArc — sits before EffectComposer so Bloom picks it up */}
      {!isAvatar && (
        <TrailArc
          enabled={trailEnabled}
          trailLin={palette.trailLin}
          sparkleLin={palette.sparkleLin}
          intensity={trailIntensity}
          length={trailLength}
          spread={trailSpread}
          speed={trailSpeed}
          sparkle={trailSparkle}
          orbitalAngleRef={orbitalAngleRef}
        />
      )}

      <EffectComposer multisampling={0}>
        {/* GodRays — non-avatar, param-gated */}
        {!isAvatar && rayEnabled && (
          <GodRays
            sun={godRayLightRef}
            samples={raySamples}
            density={rayDensity}
            decay={rayDecay}
            weight={rayWeight}
            exposure={rayExposure}
            clampMax={rayClampMax}
            blendFunction={BlendFunction.SCREEN}
          />
        )}

        {/* Tight bloom (crisp ring edges) */}
        <Bloom
          intensity={isAvatar ? 0.6 : cappedBloomStrength * 0.8}
          radius={isAvatar ? 0.5 : Math.min(bloomRadius, 0.35)}
          luminanceThreshold={isAvatar ? 0.1 : Math.max(bloomThreshold, 0.45)}
          luminanceSmoothing={isAvatar ? 0.4 : 0.015}
        />

        {/* Wide bloom — non-avatar only */}
        {!isAvatar && (
          <Bloom
            intensity={cappedBloomStrength * 0.3}
            radius={0.65}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.05}
          />
        )}

        {/* Streak bloom — non-avatar, param-gated */}
        {!isAvatar && streakStrength > 0 && (
          <Bloom
            intensity={streakStrength * 1.5}
            radius={streakLength * 2.0}
            luminanceThreshold={streakThreshold}
            luminanceSmoothing={0.01}
          />
        )}

        {/* Film grain — non-avatar only */}
        {!isAvatar && (
          <Noise opacity={0.035} premultiply blendFunction={BlendFunction.OVERLAY} />
        )}

        {/* Chromatic aberration — non-avatar only */}
        {!isAvatar && (
          <ChromaticAberration offset={[0.0012, 0.0005]} radialModulation={true} modulationOffset={0.15} />
        )}

        {/* Vignette — non-avatar only */}
        {!isAvatar && (
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
        )}
      </EffectComposer>
    </Canvas>
  );
}
