// src/components/dev/BloomRingCanvas.jsx
// Phase 2A-2: Analog bloom + lens-like anamorphic streak (hot-pixel keyed)

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BreathingRing({ breathSpeed = 0.8, streakStrength = 0.20, streakLength = 0.65 }) {
  const coreRef = useRef(null);
  const shoulderRef = useRef(null);
  const streakProxyRef = useRef(null);
  const reticleRef = useRef(null);
  const innerGroupRef = useRef(null);
  const nucleusCoreRef = useRef(null);
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
    if (nucleusCoreRef.current) {
      const breathPhase = Math.sin(t);
      const nucleusPulse = 1.0 + 0.03 * breathPhase; // ±3% opacity modulation
      const baseNucleusOpacity = 0.22;
      nucleusCoreRef.current.material.opacity = baseNucleusOpacity * nucleusPulse;
    }
  });

  return (
    <group>
      {/* Dark center disc to control inner glow (creates halo effect) */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.9, 64]} />
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
            <circleGeometry args={[0.085, 64]} />
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
          <mesh ref={nucleusCoreRef} position={[0, 0, 0.013]}>
            <circleGeometry args={[0.03, 64]} />
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
          <circleGeometry args={[0.14, 64]} />
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
  streakAngle = 0
}) {
  useEffect(() => {
    console.log('[BloomRingCanvas] Analog bloom + streak (Phase 2A-2)', {
      width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed,
      streakStrength, streakThreshold, streakLength, streakAngle
    });
  }, [width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed,
      streakStrength, streakThreshold, streakLength, streakAngle]);

  return (
    <div style={{ width, height, background: 'transparent' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        orthographic
        camera={{ zoom: 80, position: [0, 0, 10] }}
      >
        <BreathingRing
          breathSpeed={breathSpeed}
          streakStrength={streakStrength}
          streakLength={streakLength}
        />

        <EffectComposer multisampling={0}>
          {/* Primary bloom (analog ring glow) */}
          <Bloom
            intensity={bloomStrength}
            radius={bloomRadius}
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={0.025}
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
        </EffectComposer>
      </Canvas>
    </div>
  );
}
