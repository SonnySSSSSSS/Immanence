// src/components/countdown/particleText/Sparks.jsx
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

function createSeeds(count, depth) {
  return new Array(count).fill(0).map(() => ({
    orbitAngle: Math.random() * Math.PI * 2,
    orbitSpeed: 0.1 + Math.random() * 0.45,
    orbitRadius: 0.38 + Math.random() * 0.75,
    phase: Math.random() * Math.PI * 2,
    tilt: Math.random() * Math.PI * 2,
    len: 0.12 + Math.random() * 0.3,
    thick: 0.008 + Math.random() * 0.02,
    depth: (Math.random() * 2 - 1) * depth,
  }));
}

export default function Sparks({
  accentColor = '#22d3ee',
  enabled = true,
  count = 56,
  mouseRef = null,
}) {
  const meshRef = useRef(null);
  const seedsRef = useRef([]);
  const viewport = useThree((state) => state.viewport);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const field = useMemo(
    () => ({
      width: viewport.width * 1.25,
      height: viewport.height * 1.25,
      depth: 1.8,
    }),
    [viewport.width, viewport.height]
  );

  useLayoutEffect(() => {
    seedsRef.current = createSeeds(count, field.depth);
  }, [count, field.depth]);

  useFrame(({ clock }) => {
    if (!enabled || !meshRef.current) return;
    const seeds = seedsRef.current;
    const t = clock.elapsedTime;
    const sweep = Math.sin(t * 0.12) * Math.PI * 0.2;

    // Virtual mouse shifts the orbit center slightly for parallax cohesion
    const mx = mouseRef?.current?.[0] ?? 0;
    const my = mouseRef?.current?.[1] ?? 0;
    const mouseOffX = mx * field.width * 0.08;
    const mouseOffY = my * field.height * 0.08;

    for (let i = 0; i < seeds.length; i++) {
      const q = seeds[i];
      const ang = q.orbitAngle + t * q.orbitSpeed + sweep;
      const rr = q.orbitRadius + Math.sin(t * 0.26 + q.phase) * 0.16;

      const x = Math.cos(ang) * rr * field.width + mouseOffX;
      const y = Math.sin(ang * 0.8 + q.tilt) * rr * field.height + mouseOffY;
      const z = q.depth + Math.sin(t * 0.4 + q.phase) * 0.24;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, ang + Math.PI / 2 + Math.sin(t * 0.35 + q.phase) * 0.4);

      const flick = 0.55 + 0.45 * Math.sin(t * 2.6 + q.phase);
      dummy.scale.set(q.thick, q.len * flick, 1);
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
        opacity={0.45}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
