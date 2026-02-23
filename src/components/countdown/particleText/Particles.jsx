// src/components/countdown/particleText/Particles.jsx
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

function isCoarsePointer() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
}

export default function Particles({
  accentColor = '#22d3ee',
  enabled = true,
  countDesktop = 8000,
  countMobile = 2800,
  mouseRef = null,
  opacity = 0.1,
  fieldScale = 1.45,
  depthScale = 1.0,
  parallaxScale = 0.10,
}) {
  const meshRef = useRef(null);
  const viewport = useThree((state) => state.viewport);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  const count = useMemo(() => (isCoarsePointer() ? countMobile : countDesktop), [countDesktop, countMobile]);
  const field = useMemo(
    () => ({
      width: viewport.width * fieldScale,
      height: viewport.height * fieldScale,
      depth: 2.6 * depthScale,
    }),
    [depthScale, fieldScale, viewport.width, viewport.height]
  );

  const seeds = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      baseAngle: Math.random() * Math.PI * 2,
      band: Math.random() * Math.PI * 2,
      baseRadius: 0.2 + Math.random() * 1.05,
      angVel: 0.07 + Math.random() * 0.22,
      radialFreq: 0.1 + Math.random() * 0.28,
      radialWobble: 0.05 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
      driftPhaseX: Math.random() * Math.PI * 2,
      driftPhaseY: Math.random() * Math.PI * 2,
      driftAmpX: 0.08 + Math.random() * 0.45,
      driftAmpY: 0.06 + Math.random() * 0.32,
      turbAmp: 0.03 + Math.random() * 0.08,
      turbFreq: 0.15 + Math.random() * 0.38,
      depth: (Math.random() * 2 - 1) * field.depth,
      size: 0.006 + Math.random() * 0.015,
      spin: Math.random() * Math.PI * 2,
    }));
  }, [count, field.depth]);

  useFrame(({ clock }) => {
    if (!enabled || !meshRef.current) return;
    const t = clock.elapsedTime;
    const windX = Math.sin(t * 0.11) * field.width * 0.08;
    const windY = Math.cos(t * 0.09) * field.height * 0.06;

    // Virtual mouse drives a subtle global parallax shift on the particle field
    const mx = mouseRef?.current?.[0] ?? 0;
    const my = mouseRef?.current?.[1] ?? 0;
    const mouseOffX = mx * field.width * parallaxScale;
    const mouseOffY = my * field.height * parallaxScale;

    for (let i = 0; i < seeds.length; i++) {
      const q = seeds[i];
      const ang = q.baseAngle + t * q.angVel + Math.sin(t * 0.13 + q.band) * 0.35;
      const rr = q.baseRadius + Math.sin(t * q.radialFreq + q.phase) * q.radialWobble;

      const swirlX = Math.cos(ang) * rr * field.width;
      const swirlY = Math.sin(ang * 0.92 + q.band) * rr * field.height;
      const driftX = Math.sin(t * 0.19 + q.driftPhaseX) * q.driftAmpX * field.width;
      const driftY = Math.cos(t * 0.17 + q.driftPhaseY) * q.driftAmpY * field.height;
      const turbX = Math.sin(t * q.turbFreq + q.phase * 1.7) * q.turbAmp * field.width;
      const turbY = Math.cos(t * (q.turbFreq * 0.86) + q.phase * 0.8) * q.turbAmp * field.height;
      const z = q.depth + Math.sin(ang + t * 0.2 + q.phase) * 0.18;

      const x = swirlX + driftX + turbX + windX + mouseOffX;
      const y = swirlY + driftY + turbY + windY + mouseOffY;
      const s = q.size * (0.82 + 0.18 * Math.sin(t * 1.4 + q.phase));

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, q.spin + ang);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
