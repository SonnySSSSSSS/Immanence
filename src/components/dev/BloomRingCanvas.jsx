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

      // Very low opacity, keyed to hot core
      const streakOpacity = streakStrength * 0.08 * hotness;
      streakProxyRef.current.children.forEach(child => {
        if (child.material) {
          child.material.opacity = streakOpacity;
        }
      });
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
