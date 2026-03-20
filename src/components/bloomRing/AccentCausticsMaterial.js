import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createAccentRamp } from './accentRamp.js';

const VERT = /* glsl */`
varying vec2 vUv;
varying float vRadial01;
uniform float uRadius;
uniform float uTube;

void main() {
  vUv = uv;
  float radial = length(position.xy);
  float inner = max(0.0001, uRadius - uTube);
  float outer = uRadius + uTube;
  vRadial01 = clamp((radial - inner) / max(0.0001, outer - inner), 0.0, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */`
uniform float uTime;
uniform float uIntensity;
uniform float uHold;
uniform float uHoldIntensity;
uniform float uSpeed;
uniform vec3 uRamp0;
uniform vec3 uRamp1;
uniform vec3 uRamp2;
uniform vec3 uRamp3;
uniform vec3 uRamp4;
varying vec2 vUv;
varying float vRadial01;

vec3 sampleRamp(float t) {
  float x = clamp(t, 0.0, 1.0);
  if (x < 0.25) return mix(uRamp0, uRamp1, x / 0.25);
  if (x < 0.50) return mix(uRamp1, uRamp2, (x - 0.25) / 0.25);
  if (x < 0.75) return mix(uRamp2, uRamp3, (x - 0.50) / 0.25);
  return mix(uRamp3, uRamp4, (x - 0.75) / 0.25);
}

void main() {
  float theta = vUv.x * 6.2831853;
  float waveA = 0.5 + 0.5 * sin(theta * 12.0 - uTime * uSpeed);
  float waveB = 0.5 + 0.5 * sin(theta * 23.0 + uTime * (uSpeed * 0.72) + vRadial01 * 7.0);
  float field = clamp(waveA * 0.7 + waveB * 0.3, 0.0, 1.0);

  float radialBand = smoothstep(0.20, 0.60, vRadial01) * (1.0 - smoothstep(0.94, 1.0, vRadial01));
  float lit = pow(field, 1.22) * radialBand;
  float outerMask = smoothstep(0.72, 0.94, vRadial01);
  float holdGlow = outerMask * uHold * uHoldIntensity;

  vec3 base = sampleRamp(lit);
  vec3 holdColor = uRamp4 * holdGlow;
  vec3 outColor = base * uIntensity + holdColor;
  float alpha = clamp(lit * 0.70 + holdGlow * 0.85, 0.0, 1.0);

  gl_FragColor = vec4(outColor, alpha);
}
`;

export default function AccentCausticsMaterial({
  accentColor = '#22d3ee',
  radius = 1.0,
  tube = 0.03,
  radialSegments = 16,
  tubularSegments = 128,
  intensity = 1.2,
  holdAmount = 0.0,
  holdIntensity = 2.8,
  speed = 0.72,
}) {
  const matRef = useRef(null);
  const ramp = useMemo(() => createAccentRamp(accentColor), [accentColor]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uHold: { value: holdAmount },
    uHoldIntensity: { value: holdIntensity },
    uSpeed: { value: speed },
    uRadius: { value: radius },
    uTube: { value: tube },
    uRamp0: { value: ramp[0].clone() },
    uRamp1: { value: ramp[1].clone() },
    uRamp2: { value: ramp[2].clone() },
    uRamp3: { value: ramp[3].clone() },
    uRamp4: { value: ramp[4].clone() },
  }), [holdAmount, holdIntensity, intensity, radius, ramp, speed, tube]);

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uIntensity.value = intensity;
    matRef.current.uniforms.uHold.value = holdAmount;
    matRef.current.uniforms.uHoldIntensity.value = holdIntensity;
    matRef.current.uniforms.uSpeed.value = speed;
    matRef.current.uniforms.uRadius.value = radius;
    matRef.current.uniforms.uTube.value = tube;
    matRef.current.uniforms.uRamp0.value.copy(ramp[0]);
    matRef.current.uniforms.uRamp1.value.copy(ramp[1]);
    matRef.current.uniforms.uRamp2.value.copy(ramp[2]);
    matRef.current.uniforms.uRamp3.value.copy(ramp[3]);
    matRef.current.uniforms.uRamp4.value.copy(ramp[4]);
  }, [holdAmount, holdIntensity, intensity, radius, ramp, speed, tube]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return React.createElement(
    'mesh',
    { position: [0, 0, 0.004] },
    React.createElement('torusGeometry', {
      args: [radius, tube * 1.04, radialSegments, tubularSegments],
    }),
    // eslint-disable-next-line react-hooks/refs
    React.createElement('shaderMaterial', {
      ref: matRef,
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
}
