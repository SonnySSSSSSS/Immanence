// src/components/countdown/particleText/Effects.jsx
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Module-level constant — never mutated, avoids per-render allocation
const CA_OFFSET = new THREE.Vector2(0.0024, 0.0018);

export default function Effects({ enabled = true }) {
  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      {/* Tight bloom: digit core + bright sparks */}
      <Bloom
        intensity={1.75}
        radius={0.28}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.05}
        mipmapBlur
      />
      {/* Wide bloom: soft halo around the full field */}
      <Bloom
        intensity={0.55}
        radius={0.85}
        luminanceThreshold={0.06}
        luminanceSmoothing={0.18}
      />
      {/* Chromatic aberration: clearly visible at digit edges */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={CA_OFFSET}
      />
      <Vignette eskil={false} offset={0.21} darkness={0.24} />
    </EffectComposer>
  );
}
