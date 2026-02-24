import React from 'react';

export default function MetalRingMesh({
  radius = 1.0,
  tube = 0.03,
  radialSegments = 16,
  tubularSegments = 128,
  metalness = 1.0,
  roughness = 0.05,
  clearcoat = 0.35,
  clearcoatRoughness = 0.12,
}) {
  return (
    <mesh position={[0, 0, 0.001]}>
      <torusGeometry args={[radius, tube, radialSegments, tubularSegments]} />
      <meshPhysicalMaterial
        color="#ff2a2a"
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        envMapIntensity={1.55}
      />
    </mesh>
  );
}
