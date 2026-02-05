// src/components/dev/BloomRingCanvas.jsx
// Phase 1: Refined analog bloom with layered rings (no dirt/streak yet)

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function BreathingRing({ breathSpeed = 0.8, streakStrength = 0.25, streakAngle = 0 }) {
  const coreRef = useRef(null);
  const shoulderRef = useRef(null);
  const streakRef = useRef(null);
  const baseShoulderOpacity = 0.35;

  // Create gradient texture for streak
  const streakTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Create horizontal gradient (center bright, edges fade)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.4, 'rgba(255, 248, 240, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 248, 240, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

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

    // Streak breathing (sync with core brightness)
    if (streakRef.current && streakStrength > 0) {
      const breathPhase = Math.sin(t);
      const streakOpacity = streakStrength * 0.3 * (0.5 + 0.5 * breathPhase);
      streakRef.current.material.opacity = Math.max(0, streakOpacity);
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

      {/* Anamorphic streak (lens flare effect) */}
      {streakStrength > 0 && (
        <mesh
          ref={streakRef}
          position={[0, 0, 0.02]}
          rotation={[0, 0, (streakAngle * Math.PI) / 180]}
        >
          <planeGeometry args={[6, 0.15, 1, 1]} />
          <meshBasicMaterial
            map={streakTexture}
            transparent
            opacity={streakStrength * 0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
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
  streakStrength = 0.25,
  streakAngle = 0
}) {
  useEffect(() => {
    console.log('[BloomRingCanvas] Analog bloom + streak', {
      width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed, streakStrength, streakAngle
    });
  }, [width, height, bloomStrength, bloomRadius, bloomThreshold, breathSpeed, streakStrength, streakAngle]);

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
          streakAngle={streakAngle}
        />

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
