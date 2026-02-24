import * as THREE from 'three';

export function createAccentRamp(accentColor = '#22d3ee') {
  const accent = new THREE.Color(accentColor);
  const black = new THREE.Color('#000000');
  const softWhite = new THREE.Color('#ffffff').lerp(accent, 0.18);
  const brightWhite = new THREE.Color('#ffffff').lerp(accent, 0.10);

  return [
    accent.clone().lerp(black, 0.75),
    accent.clone().lerp(black, 0.45),
    accent.clone(),
    accent.clone().lerp(softWhite, 0.55),
    accent.clone().lerp(brightWhite, 0.82),
  ];
}

