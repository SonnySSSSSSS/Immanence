// src/components/dev/BloomRingCanvas.jsx
// Phase 2A-2: Analog bloom + lens-like anamorphic streak (hot-pixel keyed)

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Phase 2C-3: Ray Occluders Component
function RayOccluders({ enabled, pattern, scale, depthOffset, debug }) {
  if (!enabled) return null;

  // Debug material: visible red for positioning verification
  const debugMaterial = {
    color: "#ff3355",
    transparent: true,
    opacity: 0.25,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide
  };

  // Real occluder material: depth-only, NO transparent pipeline
  // CRITICAL: opaque material that writes depth but not color
  // colorWrite is set via onUpdate to ensure compatibility
  const occluderMaterial = {
    color: "#000000",  // irrelevant since colorWrite will be false
    transparent: false,  // do NOT use transparent pipeline (preserves reliable depth writing)
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide  // occlude from both sides
  };

  const mat = debug ? debugMaterial : occluderMaterial;

  // Cross pattern: 2 bars covering full ring diameter (~3.2 units for 1.6 radius)
  const renderCrossPattern = () => (
    <>
      {/* Horizontal bar */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2 * scale, 0.06 * scale]} />
        <meshBasicMaterial
          {...mat}
          onUpdate={(m) => { m.colorWrite = debug; }}
        />
      </mesh>
      {/* Vertical bar */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[0.06 * scale, 3.2 * scale]} />
        <meshBasicMaterial
          {...mat}
          onUpdate={(m) => { m.colorWrite = debug; }}
        />
      </mesh>
    </>
  );

  // Grid pattern: cross + diagonals = 8 segments
  const renderGridPattern = () => (
    <>
      {/* Cross bars (reuse cross pattern) */}
      {renderCrossPattern()}
      {/* Diagonal bars */}
      <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.06 * scale]} />
        <meshBasicMaterial
          {...mat}
          onUpdate={(m) => { m.colorWrite = debug; }}
        />
      </mesh>
      <mesh position={[0, 0, 0.003]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.06 * scale]} />
        <meshBasicMaterial
          {...mat}
          onUpdate={(m) => { m.colorWrite = debug; }}
        />
      </mesh>
    </>
  );

  // Radial pattern: 4 spokes at 0°, 45°, 90°, 135°
  const renderRadialPattern = () => (
    <>
      {[0, 45, 90, 135].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={`radial-${i}`} position={[0, 0, i * 0.001]} rotation={[0, 0, rad]}>
            <planeGeometry args={[3.6 * scale, 0.05 * scale]} />
            <meshBasicMaterial
              {...mat}
              onUpdate={(m) => { m.colorWrite = debug; }}
            />
          </mesh>
        );
      })}
    </>
  );

  const renderPattern = () => {
    switch (pattern) {
      case 'grid': return renderGridPattern();
      case 'radial': return renderRadialPattern();
      default: return renderCrossPattern();
    }
  };

  return (
    <group position={[0, 0, depthOffset]} name="rayOccluders">
      {renderPattern()}
    </group>
  );
}

function BreathingRing({
  breathSpeed = 0.8,
  streakStrength = 0.20,
  streakLength = 0.65,
  nucleusSunRef,
  godRayLightRef,
  // Phase 2C-3: Sun proxy props
  raySunY,
  raySunZ,
  raySunRadius,
  // Phase 2C-3: Occluder props
  occluderEnabled,
  occluderPattern,
  occluderScale,
  occluderDepthOffset,
  debugOccluders
}) {
  const coreRef = useRef(null);
  const shoulderRef = useRef(null);
  const streakProxyRef = useRef(null);
  const reticleRef = useRef(null);
  const innerGroupRef = useRef(null);
  const baseShoulderOpacity = 0.35;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * breathSpeed;

    // Subtle scale breathing (reduced amplitude)
    const scaleAmount = 1 + 0.015 * Math.sin(t);
    if (coreRef.current) {
      coreRef.current.scale.set(scaleAmount, scaleAmount, 1);
    }
    if (shoulderRef.current) {
      shoulderRef.current.scale.set(scaleAmount, scaleAmount, 1);
    }

    // Opacity breathing on shoulder ring
    if (shoulderRef.current) {
      const opacityPulse = baseShoulderOpacity + 0.08 * Math.sin(t);
      shoulderRef.current.material.opacity = Math.max(0.15, opacityPulse);
    }

    // Streak proxy breathing (hot-pixel keyed, horizontal smear)
    if (streakProxyRef.current && streakStrength > 0) {
      const breathPhase = Math.sin(t);
      const hotness = 0.5 + 0.5 * breathPhase; // 0 to 1

      // Scale horizontally to create smear
      const horizontalStretch = 1 + streakLength * 6;
      streakProxyRef.current.scale.set(horizontalStretch, 1, 1);

      // Slow temporal drift (not synced with breath, breaks static feeling)
      const driftPhase = Math.sin(t * 0.06) * 0.05; // 0.06 Hz, ±5% amplitude

      // Edge decay (non-linear falloff based on horizontal stretch)
      const edgeDecay = 1.0 - Math.pow(Math.min(horizontalStretch - 1, 4) / 4, 1.5) * 0.3;

      // Base opacity (reduced by ~10% from Phase 2A-2)
      const baseStreakOpacity = streakStrength * 0.072 * hotness * edgeDecay;

      // Apply asymmetry to each child (upper/lower bias via mesh order)
      streakProxyRef.current.children.forEach((child, index) => {
        if (child.material) {
          // Shoulder ring (index 0): upper bias (65% base + drift)
          // Core ring (index 1): lower bias (100% base - drift)
          const asymmetryFactor = index === 0
            ? 0.65 + driftPhase
            : 1.0 - driftPhase;

          child.material.opacity = baseStreakOpacity * asymmetryFactor;
        }
      });
    }

    // Reticle breathing (very subtle, secondary to ring)
    if (reticleRef.current) {
      const breathPhase = Math.sin(t);
      const reticleOpacityMod = 1.0 + 0.025 * breathPhase; // ±2.5% opacity modulation

      reticleRef.current.children.forEach((line) => {
        line.children.forEach((mesh, meshIndex) => {
          if (mesh.material) {
            // meshIndex 0 = shoulder, 1 = core
            const baseOpacity = meshIndex === 0 ? 0.12 : 0.35;
            mesh.material.opacity = baseOpacity * reticleOpacityMod;
          }
        });
      });
    }

    // Inner concentric breathing (subtle core heating, opacity only)
    if (innerGroupRef.current) {
      const breathPhase = Math.sin(t);
      const innerPulse = 1.0 + 0.015 * breathPhase; // ±1.5% opacity modulation

      // Apply to hot core meshes only (even indices: 1, 3, 5, 7, 9)
      // Structure: centerGlow(0), ringA_shoulder(1), ringA_core(2), ringB_shoulder(3), ringB_core(4), ringC_shoulder(5), ringC_core(6)
      innerGroupRef.current.children.forEach((mesh, index) => {
        if (mesh.material && index > 0 && index % 2 === 0) {
          // Even indices after 0: core meshes at 2, 4, 6
          const baseOpacity = 0.22;
          mesh.material.opacity = baseOpacity * innerPulse;
        }
      });
    }

    // Nucleus core breathing (subtle heat modulation)
    if (nucleusSunRef?.current) {
      const breathPhase = Math.sin(t);
      const nucleusPulse = 1.0 + 0.03 * breathPhase; // ±3% opacity modulation
      const baseNucleusOpacity = 0.22;
      nucleusSunRef.current.material.opacity = baseNucleusOpacity * nucleusPulse;
    }
  });

  return (
    <group>
      {/* God-ray emitter (tunable sun proxy - CRITICAL for shaft structure) */}
      <mesh ref={godRayLightRef} position={[0, raySunY, raySunZ]}>
        <sphereGeometry args={[raySunRadius, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Ray occluders (Phase 2C-3: structured shafts) */}
      <RayOccluders
        enabled={occluderEnabled}
        pattern={occluderPattern}
        scale={occluderScale}
        depthOffset={occluderDepthOffset}
        debug={debugOccluders}
      />

      {/* Dark center disc to control inner glow (creates halo effect) */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.9, 128]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Soft shoulder ring (creates analog falloff) */}
      <mesh ref={shoulderRef} position={[0, 0, 0]}>
        <ringGeometry args={[0.92, 1.12, 128]} />
        <meshBasicMaterial
          color="#FFF8F0"
          transparent
          opacity={baseShoulderOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Hot core ring (thin bright center) */}
      <mesh ref={coreRef} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.98, 1.05, 128]} />
        <meshBasicMaterial
          color="#FFFFFF"
          toneMapped={false}
        />
      </mesh>

      {/* Outer companion rings (Phase 2C Step 4: subtle aperture stack) */}
      {/* Inner companion (inside main ring) */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[0.90, 0.915, 128]} />
        <meshBasicMaterial
          color="#FFF8F0"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Outer companion (outside main ring) */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[1.08, 1.095, 128]} />
        <meshBasicMaterial
          color="#FFF8F0"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Inner concentric core (Phase 2C: aperture stack) */}
      <group ref={innerGroupRef} name="innerConcentric" position={[0, 0, -0.005]} rotation={[0, 0, 0]}>
        {/* Center nucleus (Phase 2C Step 3: warm light source) */}
        <group name="centerNucleus" position={[0, 0, 0]}>
          {/* Warm halo disc */}
          <mesh position={[0, 0, 0.012]}>
            <circleGeometry args={[0.085, 128]} />
            <meshBasicMaterial
              color="#FFF2E8"
              transparent
              opacity={0.06}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* White core disc (breathing heat modulation) */}
          <mesh ref={nucleusSunRef} position={[0, 0, 0.013]}>
            <circleGeometry args={[0.03, 128]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.22}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Center glow disc (soft luminous core) */}
        <mesh position={[0, 0, -0.003]}>
          <circleGeometry args={[0.14, 128]} />
          <meshBasicMaterial
            color="#FFF0E0"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Inner Ring A (closest to center) */}
        {/* Shoulder */}
        <mesh>
          <ringGeometry args={[0.16, 0.175, 128]} />
          <meshBasicMaterial
            color="#FFF8F0"
            transparent
            opacity={0.10}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Core */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.16, 0.175, 128]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Inner Ring B (middle) */}
        {/* Shoulder */}
        <mesh>
          <ringGeometry args={[0.26, 0.275, 128]} />
          <meshBasicMaterial
            color="#FFF8F0"
            transparent
            opacity={0.10}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Core */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.26, 0.275, 128]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Inner Ring C (outer) */}
        {/* Shoulder */}
        <mesh>
          <ringGeometry args={[0.36, 0.372, 128]} />
          <meshBasicMaterial
            color="#FFF8F0"
            transparent
            opacity={0.10}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Core */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.36, 0.372, 128]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Streak proxy group (horizontal smear, hot-pixel keyed) */}
      {streakStrength > 0 && (
        <group ref={streakProxyRef} position={[0, 0, 0.02]}>
          {/* Proxy shoulder ring (stretched) */}
          <mesh>
            <ringGeometry args={[0.92, 1.12, 128]} />
            <meshBasicMaterial
              color="#FFF8F0"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Proxy core ring (stretched) */}
          <mesh>
            <ringGeometry args={[0.98, 1.05, 128]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* Reticle geometry group (Phase 2B: instrumental structure) */}
      <group ref={reticleRef} position={[0, 0, -0.005]}>
        {/* Tick marks group (Step 2: sparse, instrumental) */}
        <group>
          {/* Major ticks (4 cardinal directions, aligned with crosshair) */}
          {[
            { angle: 0, length: 0.11, radius: 1.60, dim: 1.0 },
            { angle: 90, length: 0.11, radius: 1.60, dim: 1.0 },
            { angle: 180, length: 0.11, radius: 1.60, dim: 1.0 },
            { angle: 270, length: 0.11, radius: 1.60, dim: 1.0 },
          ].map(({ angle, length, radius, dim }) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <group key={`major-${angle}`} position={[x, y, 0]} rotation={[0, 0, rad]}>
                {/* Shoulder */}
                <mesh>
                  <planeGeometry args={[length, 0.010]} />
                  <meshBasicMaterial
                    color="#FFF8F0"
                    transparent
                    opacity={0.07 * dim}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
                {/* Core */}
                <mesh position={[0, 0, 0.001]}>
                  <planeGeometry args={[length, 0.004]} />
                  <meshBasicMaterial
                    color="#FFFFFF"
                    transparent
                    opacity={0.18 * dim}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Minor ticks (6 uneven angles, quieter) */}
          {[
            { angle: 22, length: 0.06, radius: 1.60, dim: 0.85 },
            { angle: 58, length: 0.06, radius: 1.60, dim: 0.90 },
            { angle: 128, length: 0.06, radius: 1.60, dim: 0.75 },
            { angle: 206, length: 0.06, radius: 1.60, dim: 0.95 },
            { angle: 244, length: 0.06, radius: 1.60, dim: 0.80 },
            { angle: 316, length: 0.06, radius: 1.60, dim: 0.88 },
          ].map(({ angle, length, radius, dim }) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <group key={`minor-${angle}`} position={[x, y, 0]} rotation={[0, 0, rad]}>
                {/* Shoulder */}
                <mesh>
                  <planeGeometry args={[length, 0.010]} />
                  <meshBasicMaterial
                    color="#FFF8F0"
                    transparent
                    opacity={0.07 * dim}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
                {/* Core */}
                <mesh position={[0, 0, 0.001]}>
                  <planeGeometry args={[length, 0.004]} />
                  <meshBasicMaterial
                    color="#FFFFFF"
                    transparent
                    opacity={0.18 * dim}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Top crosshair line */}
        <group position={[0, 1.50, 0]}>
          {/* Shoulder glow (wide, low opacity) */}
          <mesh>
            <planeGeometry args={[0.015, 0.55]} />
            <meshBasicMaterial
              color="#FFF8F0"
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* Hot core (thin, bright) */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.006, 0.55]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Bottom crosshair line */}
        <group position={[0, -1.50, 0]}>
          {/* Shoulder glow */}
          <mesh>
            <planeGeometry args={[0.015, 0.55]} />
            <meshBasicMaterial
              color="#FFF8F0"
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* Hot core */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.006, 0.55]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Left crosshair line */}
        <group position={[-1.35, 0, 0]}>
          {/* Shoulder glow */}
          <mesh>
            <planeGeometry args={[0.22, 0.015]} />
            <meshBasicMaterial
              color="#FFF8F0"
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* Hot core */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.22, 0.006]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.31}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Right crosshair line */}
        <group position={[1.35, 0, 0]}>
          {/* Shoulder glow */}
          <mesh>
            <planeGeometry args={[0.22, 0.015]} />
            <meshBasicMaterial
              color="#FFF8F0"
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* Hot core */}
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.22, 0.006]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.31}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function BloomRingCanvas({
  width,
  height,
  bloomStrength = 2.0,
  bloomRadius = 0.4,
  bloomThreshold = 0.3,
  breathSpeed = 0.8,
  streakStrength = 0.20,
  streakThreshold = 0.85,
  streakLength = 0.65,
  streakAngle = 0,
  // Phase 2C-3: GodRays controls
  rayEnabled = true,
  rayExposure = 0.12,
  rayWeight = 0.4,
  rayDecay = 0.93,
  raySamples = 40,
  rayDensity = 0.8,
  rayClampMax = 1.0,
  // Phase 2C-3: Sun proxy controls
  raySunY = 0.45,
  raySunZ = -2.0,
  raySunRadius = 0.08,
  // Phase 2C-3: Occluder controls
  occluderEnabled = true,
  occluderPattern = 'cross',
  occluderScale = 1.2,
  occluderDepthOffset = -1.5,
  debugOccluders = false
}) {
  const nucleusSunRef = useRef(null);
  const godRayLightRef = useRef(null);

  useEffect(() => {
    console.log('[BloomRingCanvas] Analog bloom + streak (Phase 2A-2)', {
      width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed,
      streakStrength, streakThreshold, streakLength, streakAngle
    });
  }, [width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed,
      streakStrength, streakThreshold, streakLength, streakAngle]);

  // Clamp bloom to preserve highlight detail and prevent full-frame blowout
  const cappedBloomStrength = Math.min(bloomStrength, 2.4);

  return (
    <Canvas
      style={{ width, height }}
      dpr={[1, 2]}
      camera={{
        fov: 12,
        position: [0, 0, 10],
        near: 0.1,
        far: 50,
      }}
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
        <BreathingRing
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
        />

        <EffectComposer multisampling={4}>
          {/* Phase 2C-3: Occluded ray shafts (tunable, structured by occlusion) */}
          {/* No ref gating needed - GodRays will handle null sun gracefully until ref populates */}
          {rayEnabled && (
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

          {/* Tight bloom (crisp ring edges, 70% of perceived glow) */}
          <Bloom
            intensity={cappedBloomStrength * 0.8}
            radius={Math.min(bloomRadius, 0.35)}
            luminanceThreshold={Math.max(bloomThreshold, 0.45)}
            luminanceSmoothing={0.015}
          />

          {/* Wide bloom (atmosphere without milk, 30% of perceived glow) */}
          <Bloom
            intensity={cappedBloomStrength * 0.3}
            radius={0.65}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.05}
          />

          {/* Secondary bloom (streak effect, hot-pixel keyed) */}
          {streakStrength > 0 && (
            <Bloom
              intensity={streakStrength * 1.5}
              radius={streakLength * 2.0}
              luminanceThreshold={streakThreshold}
              luminanceSmoothing={0.01}
            />
          )}

          {/* Film grain (after rays to preserve coherence) */}
          <Noise
            opacity={0.035}
            premultiply
            blendFunction={BlendFunction.OVERLAY}
          />

          {/* Phase 2F Step 1: Lens post stack (optical artifacts) */}
          {/* Chromatic aberration (subtle RGB separation at edges) */}
          <ChromaticAberration
            offset={[0.0012, 0.0005]}
            radialModulation={true}
            modulationOffset={0.15}
          />

          {/* Vignette (subtle edge darkening) */}
          <Vignette
            eskil={false}
            offset={0.25}
            darkness={0.45}
          />
        </EffectComposer>
      </Canvas>
  );
}
