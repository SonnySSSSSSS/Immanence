// src/components/countdown/ParticleCountdown.jsx
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Text, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import Effects from './particleText/Effects.jsx';
import Particles from './particleText/Particles.jsx';
import Sparks from './particleText/Sparks.jsx';
import useCountdown9to0 from './useCountdown9to0.js';

export default function ParticleCountdown({
  start = 9,
  end = 0,
  intervalMs = 1000,
  accentColor = '#22d3ee',
  enabled = true,
}) {
  const digit = useCountdown9to0({ start, end, intervalMs, enabled });
  const groupRef = useRef();
  const mouseRef = useRef([0, 0]);

  const bloomColor = useMemo(() => {
    const c = new THREE.Color(accentColor);
    c.multiplyScalar(1.4);
    return `#${c.getHexString()}`;
  }, [accentColor]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Synthesized virtual mouse — gentle orbital driver replaces real pointer
    mouseRef.current = [
      Math.sin(t * 0.2) * 0.6,
      Math.cos(t * 0.17) * 0.6,
    ];

    if (groupRef.current) {
      // Parallax tilt: exponential lerp toward virtual mouse direction
      groupRef.current.rotation.y += (mouseRef.current[0] * 0.45 - groupRef.current.rotation.y) * 0.04;
      groupRef.current.rotation.x += (-mouseRef.current[1] * 0.3 - groupRef.current.rotation.x) * 0.04;
    }
  });

  return (
    <>
      {/* Override camera for this preset; restores previous camera on unmount */}
      <PerspectiveCamera makeDefault fov={65} position={[0, 0, 7]} near={0.1} far={100} />

      <pointLight position={[0, 0, 5]} intensity={3} color={accentColor} />

      {/* Digit with parallax rotation */}
      <group ref={groupRef}>
        <Text
          anchorX="center"
          anchorY="middle"
          fontSize={4}
          characters="0123456789"
          color={bloomColor}
          outlineWidth={0.025}
          outlineColor={accentColor}
          outlineOpacity={0.45}
          material-toneMapped={false}
        >
          {String(digit)}
        </Text>
      </group>

      {/* Particle field + orbiting sparks */}
      <Particles accentColor={accentColor} enabled={enabled} mouseRef={mouseRef} />
      <Sparks accentColor={accentColor} enabled={enabled} mouseRef={mouseRef} />

      {/* Post FX: bloom + chromatic aberration */}
      <Effects enabled={enabled} />
    </>
  );
}
