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
//   enabled       – show/hide the trail (no side effects when false)
//   accentColor   – hex string, drives all particle color
//   intensity     – 0–2, overall brightness multiplier.
//                   Audio-driveable: pass amplitude envelope directly as this prop;
//                   no architectural changes required (it's a plain number per frame).
//   length        – 5–80, number of main trail particles
//   spread        – 0–0.2, radial jitter around arc
//   speed         – angular velocity (rad/s)
//   sparkle       – 0–1, secondary tiny-particle density
//
// Composition: additive blending, depthWrite:false, toneMapped:false
// → Bloom picks it up naturally; sits in front of ring geometry (z=0.05).

// Smoothstep easing [0,1] → [0,1]. Used by breathDriver phase→wave mapping.
const easeInOut = p => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

const MAX_TRAIL   = 80;
const MAX_SPARKLE = 40;
const ARC_RADIUS  = 1.02;  // just outside the main ring (radius ~1.0)
const ARC_SPAN    = Math.PI * 0.65;  // ~117° tail

function TrailArc({ enabled, accentColor, intensity, length, spread, speed, sparkle }) {
  const trailRef   = useRef(null);
  const sparkleRef = useRef(null);

  // Fixed-size GPU buffers — never reallocated, only written each frame
  const trailPositions   = useMemo(() => new Float32Array(MAX_TRAIL   * 3), []);
  const trailColors      = useMemo(() => new Float32Array(MAX_TRAIL   * 3), []);
  const sparklePositions = useMemo(() => new Float32Array(MAX_SPARKLE * 3), []);
  const sparkleColors    = useMemo(() => new Float32Array(MAX_SPARKLE * 3), []);

  // Decode hex accent + compute hue compensation once per accentColor change.
  // High-luminance hues (Flame #fcd34d L≈0.82, Beacon #22d3ee L≈0.69) wash out
  // faster under additive blending + bloom. hueCompensation softens them so the
  // perceived hue survives at high Radiance settings.
  const { accentRGB, hueCompensation } = useMemo(() => {
    const hex = accentColor.replace('#', '');
    if (hex.length !== 6) return { accentRGB: { r: 1, g: 1, b: 1 }, hueCompensation: 1.0 };
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    // Perceived luminance (rec. 709)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Hard-clamped to [0.85, 1.0]: only ever a subtle darkening, never amplification.
    const hueComp = Math.max(0.85, Math.min(1.0, 0.70 / Math.max(lum, 0.30)));
    return { accentRGB: { r, g, b }, hueCompensation: hueComp };
  }, [accentColor]);

  useFrame(({ clock }) => {
    if (!enabled) return;

    const t          = clock.elapsedTime;
    const headAngle  = (t * speed) % (Math.PI * 2);
    const trailCount   = Math.max(5,  Math.floor(length));
    const sparkleCount = Math.max(0,  Math.floor(sparkle * MAX_SPARKLE));

    // ── Main trail ────────────────────────────────────────────────────────────
    if (trailRef.current) {
      const posAttr = trailRef.current.geometry.attributes.position;
      const colAttr = trailRef.current.geometry.attributes.color;

      for (let i = 0; i < MAX_TRAIL; i++) {
        if (i < trailCount) {
          const frac  = i / Math.max(1, trailCount - 1); // 0=head, 1=tail
          const angle = headAngle - frac * ARC_SPAN;
          // Radial jitter: slow pseudo-random wobble (not sync'd to breath)
          const jitter = Math.sin(i * 13.7 + t * 0.5) * spread * 0.5;
          const r      = ARC_RADIUS + jitter;

          posAttr.array[i * 3]     = Math.cos(angle) * r;
          posAttr.array[i * 3 + 1] = Math.sin(angle) * r;
          posAttr.array[i * 3 + 2] = 0.05;

          // Non-linear falloff: head bright, tail near-zero.
          // Clamp at 0.90 so the trail head never forces a full-frame bloom clip
          // at high Radiance. hueCompensation tames warm/bright stages (Flame, Beacon).
          const brightness = Math.min(Math.pow(1 - frac, 1.8) * intensity * hueCompensation, 0.90);
          colAttr.array[i * 3]     = accentRGB.r * brightness;
          colAttr.array[i * 3 + 1] = accentRGB.g * brightness;
          colAttr.array[i * 3 + 2] = accentRGB.b * brightness;
        } else {
          // Park unused particles behind the camera
          posAttr.array[i * 3 + 2] = -100;
          colAttr.array[i * 3]     = 0;
          colAttr.array[i * 3 + 1] = 0;
          colAttr.array[i * 3 + 2] = 0;
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    // ── Sparkle (secondary tiny particles) ───────────────────────────────────
    if (sparkleRef.current && sparkleCount > 0) {
      const posAttr = sparkleRef.current.geometry.attributes.position;
      const colAttr = sparkleRef.current.geometry.attributes.color;

      for (let i = 0; i < MAX_SPARKLE; i++) {
        if (i < sparkleCount) {
          // Random-ish positions scattered near the arc, fast flicker
          const angle = headAngle
            - (i / sparkleCount) * ARC_SPAN
            + Math.sin(i * 7.3  + t * 2.1) * 0.3;
          const r = ARC_RADIUS + Math.sin(i * 19.1 + t * 1.7) * spread * 2;

          posAttr.array[i * 3]     = Math.cos(angle) * r;
          posAttr.array[i * 3 + 1] = Math.sin(angle) * r;
          posAttr.array[i * 3 + 2] = 0.06;

          const flicker    = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(i * 11.3 + t * 4.7));
          // Sparkle ceiling slightly lower (0.75) — accent, not dominant
          const brightness = Math.min(flicker * intensity * 0.55 * hueCompensation, 0.75);
          colAttr.array[i * 3]     = accentRGB.r * brightness;
          colAttr.array[i * 3 + 1] = accentRGB.g * brightness;
          colAttr.array[i * 3 + 2] = accentRGB.b * brightness;
        } else {
          posAttr.array[i * 3 + 2] = -100;
          colAttr.array[i * 3]     = 0;
          colAttr.array[i * 3 + 1] = 0;
          colAttr.array[i * 3 + 2] = 0;
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  });

  if (!enabled) return null;

  return (
    <group name="trailArc">
      {/* Main comet trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions,  3]} />
          <bufferAttribute attach="attributes-color"    args={[trailColors,     3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.045}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Secondary sparkle particles */}
      {sparkle > 0 && (
        <points ref={sparkleRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[sparklePositions, 3]} />
            <bufferAttribute attach="attributes-color"    args={[sparkleColors,    3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={0.022}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      )}
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
}) {
  const isAvatar = mode === 'avatar';
  const coreRef        = useRef(null);
  const shoulderRef    = useRef(null);
  const streakProxyRef = useRef(null);
  const reticleRef     = useRef(null);
  const innerGroupRef  = useRef(null);
  const avatarGlowRef  = useRef(null);
  const baseShoulderOpacity = 0.35;

  useFrame(({ clock }) => {
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

    if (streakProxyRef.current && streakStrength > 0) {
      const hotness           = 0.5 + 0.5 * w;
      const horizontalStretch = 1 + streakLength * 6;
      streakProxyRef.current.scale.set(horizontalStretch, 1, 1);
      const driftPhase      = Math.sin(t * 0.06) * 0.05;
      const edgeDecay       = 1.0 - Math.pow(Math.min(horizontalStretch - 1, 4) / 4, 1.5) * 0.3;
      const baseStreakOpacity = streakStrength * 0.072 * hotness * edgeDecay;
      streakProxyRef.current.children.forEach((child, index) => {
        if (child.material) {
          const asymmetryFactor = index === 0 ? 0.65 + driftPhase : 1.0 - driftPhase;
          child.material.opacity = baseStreakOpacity * asymmetryFactor;
        }
      });
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

    if (innerGroupRef.current) {
      const breathPhase = Math.sin(t);
      const innerPulse  = 1.0 + 0.015 * breathPhase;
      innerGroupRef.current.children.forEach((mesh, index) => {
        if (mesh.material && index > 0 && index % 2 === 0) {
          mesh.material.opacity = 0.22 * innerPulse;
        }
      });
    }

    if (nucleusSunRef?.current) {
      const breathPhase  = Math.sin(t);
      const nucleusPulse = 1.0 + 0.03 * breathPhase;
      nucleusSunRef.current.material.opacity = 0.22 * nucleusPulse;
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
  });

  return (
    <group>
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
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* God-ray emitter (sun proxy) — non-avatar only */}
      {!isAvatar && (
        <mesh ref={godRayLightRef} position={[0, raySunY, raySunZ]}>
          <sphereGeometry args={[raySunRadius, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} />
        </mesh>
      )}

      {/* Ray occluders — non-avatar only */}
      {!isAvatar && (
        <RayOccluders
          enabled={occluderEnabled}
          pattern={occluderPattern}
          scale={occluderScale}
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
          <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
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

      {/* Inner concentric aperture stack — non-avatar only */}
      {!isAvatar && (
        <group ref={innerGroupRef} name="innerConcentric" position={[0, 0, -0.005]}>
          <group name="centerNucleus">
            <mesh position={[0, 0, 0.012]}>
              <circleGeometry args={[0.085, 128]} />
              <meshBasicMaterial color="#FFF2E8" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh ref={nucleusSunRef} position={[0, 0, 0.013]}>
              <circleGeometry args={[0.03, 128]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
          <mesh position={[0, 0, -0.003]}>
            <circleGeometry args={[0.14, 128]} />
            <meshBasicMaterial color="#FFF0E0" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* Ring A */}
          <mesh><ringGeometry args={[0.16, 0.175, 128]} /><meshBasicMaterial color={accentColor} transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.001]}><ringGeometry args={[0.16, 0.175, 128]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          {/* Ring B */}
          <mesh><ringGeometry args={[0.26, 0.275, 128]} /><meshBasicMaterial color={accentColor} transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.001]}><ringGeometry args={[0.26, 0.275, 128]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          {/* Ring C */}
          <mesh><ringGeometry args={[0.36, 0.372, 128]} /><meshBasicMaterial color={accentColor} transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          <mesh position={[0, 0, 0.001]}><ringGeometry args={[0.36, 0.372, 128]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        </group>
      )}

      {/* Streak proxy group — non-avatar only */}
      {!isAvatar && streakStrength > 0 && (
        <group ref={streakProxyRef} position={[0, 0, 0.02]}>
          <mesh>
            <ringGeometry args={[0.92, 1.12, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.98, 1.05, 128]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
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
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.07 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.18 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
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
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.07 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.18 * dim} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                </group>
              );
            })}
          </group>
          {/* Crosshair lines */}
          <group position={[0, 1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[0, -1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[-1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.31} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color="#FFF8F0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.31} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
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
  } = params;

  const nucleusSunRef  = useRef(null);
  const godRayLightRef = useRef(null);

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
      />

      {/* TrailArc — sits before EffectComposer so Bloom picks it up */}
      {!isAvatar && (
        <TrailArc
          enabled={trailEnabled}
          accentColor={accentColor}
          intensity={trailIntensity}
          length={trailLength}
          spread={trailSpread}
          speed={trailSpeed}
          sparkle={trailSparkle}
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
