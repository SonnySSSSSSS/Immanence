// src/components/dev/BloomRingCanvas.jsx
// Phase 1: Refined analog bloom with layered rings (no dirt/streak yet)

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BreathingRing({ breathSpeed = 0.8 }) {
  const coreRef = useRef(null);
  const shoulderRef = useRef(null);
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
    </group>
  );
}

export default function BloomRingCanvas({
  width,
  height,
  bloomStrength = 2.0,
  bloomRadius = 0.4,
  bloomThreshold = 0.3,
  breathSpeed = 0.8
}) {
  useEffect(() => {
    console.log('[BloomRingCanvas] Analog bloom', { width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed });
  }, [width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed]);

  return (
    <div style={{ width, height, background: 'transparent' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        orthographic
        camera={{ zoom: 80, position: [0, 0, 10] }}
      >
        <BreathingRing breathSpeed={breathSpeed} />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={bloomStrength}
            radius={bloomRadius}
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
