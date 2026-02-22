// src/components/bloomRing/BloomRingRenderer.jsx
// Single source of truth for the WebGL bloom ring renderer.
// Used by both DevPanel BloomRingLab (tuning surface) and production BreathingRing.
//
// Props:
//   params      – flat object of all tunable values (destructured with safe defaults)
//   accentColor – hex string, stage/path accent color
//   className   – forwarded to Canvas wrapper
//   style       – forwarded to Canvas wrapper
//   mode        – 'lab' | 'production' | 'avatar' (default: 'production')
//
// Sizing: if params.width and params.height are set, uses those explicit px values.
//         Otherwise renders with width:'100%' height:'100%' to fill its CSS container.
//
// No DevPanel imports. No preset definitions. No per-frame allocations (GPU buffers fixed-size).

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { DISABLE_POSTPROCESS } from '../../config/renderProbeFlags.js';
import { registerR3FRenderer } from '../../dev/canvasStabilityGuard.js';

// ─── TrailArc ─────────────────────────────────────────────────────────────────
// Moving comet-head + tail along an arc (right quadrant).
// Production-portable: accepts a plain params object, no lab UI coupling.
//
// Props:
//   enabled     – show/hide the trail (no side effects when false)
//   trailLin    – linear RGB object {r,g,b} for main trail particles (from palette)
//   sparkleLin  – linear RGB object {r,g,b} for sparkle particles (from palette)
//   intensity   – 0–2, overall brightness multiplier.
//                 Audio-driveable: pass amplitude envelope directly as this prop;
//                 no architectural changes required (it's a plain number per frame).
//   length      – 5–80, number of main trail particles
//   spread      – 0–0.2, radial jitter around arc
//   speed       – angular velocity (rad/s)
//   sparkle     – 0–1, secondary tiny-particle density
//
// Composition: additive blending, depthWrite:false, toneMapped:false
// → Bloom picks it up naturally; sits in front of ring geometry (z=0.05).

// Smoothstep easing [0,1] → [0,1]. Used by breathDriver phase→wave mapping.
const easeInOut = p => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

function shouldRenderRingFrame(isFrameActive = true) {
  if (!isFrameActive) return false;
  if (typeof window === 'undefined') return true;
  if (window.__IMMANENCE_PRACTICE_ACTIVE__ === false) return false;
  if (window.__IMMANENCE_APP_MARKER__ === 'practice:idle') return false;
  return true;
}

// ─── Accent palette helpers ───────────────────────────────────────────────────
// Mix in linear RGB. Output as sRGB hex — safe for R3F material color props
// regardless of Three.js colorManagement state. Only handles #RRGGBB input;
// falls back to Beacon cyan (#22d3ee) for invalid/missing values.
function sRGBtoLinear(v255) {
  const v = v255 / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSRGB(v) {
  v = Math.max(0, Math.min(1, v));
  return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
}
function hexToLin(hex) {
  if (!hex || typeof hex !== 'string') return hexToLin('#22d3ee');
  const h = hex.replace('#', '');
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return hexToLin('#22d3ee');
  return {
    r: sRGBtoLinear(parseInt(h.slice(0, 2), 16)),
    g: sRGBtoLinear(parseInt(h.slice(2, 4), 16)),
    b: sRGBtoLinear(parseInt(h.slice(4, 6), 16)),
  };
}
function linToHex({ r, g, b }) {
  const R = linearToSRGB(r), G = linearToSRGB(g), B = linearToSRGB(b);
  return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
}
function mixLin(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}
function linLuma(c) {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}
const W_LIN = { r: 1, g: 1, b: 1 }; // white in linear
const B_LIN = { r: 0, g: 0, b: 0 }; // black in linear
function tintLin(a, t) { return mixLin(a, W_LIN, t); }
function shadeLin(a, t) { return mixLin(a, B_LIN, t); }

const MAX_TRAIL   = 80;
const MAX_SPARKLE = 40;
const ARC_RADIUS  = 1.05;  // core ring outer rim alignment
const ARC_SPAN    = Math.PI * 0.65;  // ~117° tail
const ENERGY_CORE_INNER = 0.952;
const ENERGY_CORE_OUTER = 0.962;
const ENERGY_BAND_INNER = 0.968;
const ENERGY_BAND_OUTER = 1.032;
const ENERGY_GLOW_INNER = 0.964;
const ENERGY_GLOW_OUTER = 1.084;

// The farthest point any geometry reaches in RingScene local space.
// Crosshair verticals: center y=1.50, half-height 0.275 → tip at 1.775.
// Used by autoFit to compute a camera-independent uniform scale each frame.
const SCENE_MAX_RADIUS = 1.80;
const MAX_OCCLUDER_SCALE = SCENE_MAX_RADIUS / 1.8;

// Production mode: ring-only scene (no reticle/crosshairs extending to 1.80).
const SCENE_MAX_RADIUS_PRODUCTION = 1.12;

// ─── Energy band GLSL ────────────────────────────────────────────────────────
const ENERGY_BAND_VERT = /* glsl */`
uniform float uTime;
uniform float uBreathIntensity;
uniform float uInnerRadius;
uniform float uOuterRadius;

varying float vTheta;
varying float vRadialT;

float hash1(float x) {
  return fract(sin(x * 127.1) * 43758.5453123);
}

float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i), hash1(i + 1.0), u);
}

void main() {
  vec3 p = position;
  float r = length(p.xy);
  float theta = atan(p.y, p.x);
  float t = clamp((r - uInnerRadius) / max(0.0001, (uOuterRadius - uInnerRadius)), 0.0, 1.0);

  // Clockwise energy crawl with slight edge turbulence.
  float n = noise1((theta + 3.14159265) * 5.5 - uTime * 0.55);
  float spikes = smoothstep(0.82, 0.99, n);
  float edgeBias = 0.40 + 0.60 * t;
  // Middle-hybrid tuning: scale existing distortion coefficients down (~35%).
  float noiseDistort = ((n - 0.5) * 0.0065 + spikes * 0.0052) * edgeBias;

  // Breath thickens on inhale and tightens on exhale.
  float breathThick = mix(-0.0035, 0.0045, clamp(uBreathIntensity, 0.0, 1.0));
  float side = mix(-1.0, 1.0, t);
  float dr = noiseDistort + side * breathThick;

  vec2 dir = normalize(p.xy);
  p.xy += dir * dr;

  vTheta = theta;
  vRadialT = t;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const ENERGY_BAND_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uAccentColor;
uniform float uBreathIntensity;
uniform float uCycleProgress;
uniform float uHoldFactor;

varying float vTheta;
varying float vRadialT;

float hash1(float x) {
  return fract(sin(x * 127.1) * 43758.5453123);
}

float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i), hash1(i + 1.0), u);
}

void main() {
  float breath = clamp(uBreathIntensity, 0.0, 1.0);

  // Base band field (coherent crawl)
  float n = noise1((vTheta + 3.14159265) * 6.3 - uTime * 0.62);
  float spikes = smoothstep(0.74, 0.985, n);
  float contrast = mix(0.52, 1.20, breath);
  float band = clamp(0.5 + (n - 0.5) * contrast, 0.0, 1.0);

  // Single flicker term (alive without layer soup)
  float flicker = 0.972 + 0.025 * sin(uTime * 6.3 + vTheta * 2.2);

  // Band mask — hard containment, minimal feather
  float edgeMask = smoothstep(0.02, 0.12, vRadialT) * (1.0 - smoothstep(0.86, 1.0, vRadialT));

  // Electric crackle: rare, thin sparks anchored to outer edge
  float edgeOuter = smoothstep(0.78, 0.98, vRadialT);
  float sparkField = noise1((vTheta + 3.14159265) * 18.0 + floor(uTime * 1.8));
  float sparkGate = step(0.92, sparkField);
  float tt = fract(uTime * 1.8);
  float sparkPulse = smoothstep(0.0, 0.12, tt) * (1.0 - smoothstep(0.55, 1.0, tt));
  float spark = sparkGate * sparkPulse * edgeOuter;

  // Alpha: calmer base; sparks punch through
  float alpha = (0.18 + band * 0.62 + spikes * 0.18) * edgeMask;
  alpha += spark * (0.22 + 0.10 * breath);
  alpha = clamp(alpha, 0.06, 1.0);

  // Brightness: cohesive band + spike pressure + spark flash
  float brightness = (0.85 + band * 1.45 + spikes * (1.25 + 0.40 * breath)) * flicker;
  brightness += spark * (2.8 + 1.2 * breath);

  // Charge wave: luminous arc traveling clockwise at breath-cycle pace.
  // Blends into existing brightness field — not a separate layer.
  const float CHARGE_HALF = 0.105; // ~12-degree half-width
  float chargeAngle = 1.5707963 - uCycleProgress * 6.2831853; // CW from 12 o'clock
  float dAngle = mod(vTheta - chargeAngle + 3.14159265, 6.2831853) - 3.14159265;
  float leadEnv  = smoothstep(CHARGE_HALF * 0.65, 0.0, max(0.0, -dAngle)); // sharp leading
  float trailEnv = smoothstep(CHARGE_HALF * 1.65, 0.0, max(0.0,  dAngle)); // soft trailing
  float arcEnv = leadEnv * trailEnv * edgeMask;
  float holdPulse = 1.0 + uHoldFactor * 0.28 * sin(uTime * 3.2);
  brightness *= (1.0 + arcEnv * 0.42 * holdPulse);

  vec3 color = uAccentColor * brightness;
  gl_FragColor = vec4(color, alpha);
}
`;

function TrailArc({ enabled, trailLin, sparkleLin, intensity, length, spread, speed, sparkle, orbitalAngleRef = null, glowGain = 1.0, isFrameActive = true }) {
  const trailRef = useRef(null);
  const materialRef = useRef(null);
  const instanceCount = MAX_TRAIL * 3;

  const randomData = useMemo(() => {
    const along = new Float32Array(instanceCount);
    const radiusJitter = new Float32Array(instanceCount);
    const angleJitter = new Float32Array(instanceCount);
    const size = new Float32Array(instanceCount);
    const hotSeed = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      // Stratified distribution keeps density even while avoiding a vector-like band.
      along[i] = Math.min(1, Math.max(0, (i + Math.random()) / instanceCount));
      radiusJitter[i] = Math.random() * 2 - 1;
      angleJitter[i] = Math.random() * 2 - 1;
      size[i] = 0.6 + Math.random() * 0.8;
      hotSeed[i] = Math.random();
    }

    return { along, radiusJitter, angleJitter, size, hotSeed };
  }, [instanceCount]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(), []);
  const sparkleColor = useMemo(() => new THREE.Color(), []);
  const whiteColor = useMemo(() => new THREE.Color(1, 1, 1), []);
  const workColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!enabled || !trailRef.current) return;
    if (!shouldRenderRingFrame(isFrameActive)) return;

    const mesh = trailRef.current;
    const t = clock.elapsedTime;
    const syncedAngle = orbitalAngleRef?.current;
    const headAngle = Number.isFinite(syncedAngle) ? syncedAngle : (t * speed) % (Math.PI * 2);
    const trailCount = Math.max(5, Math.floor(length));
    const sparkleCount = Math.max(0, Math.floor(sparkle * MAX_SPARKLE));
    const trailNorm = Math.max(0, Math.min(1, trailCount / MAX_TRAIL));
    const sparkleNorm = Math.max(0, Math.min(1, sparkleCount / MAX_SPARKLE));
    // Rare hot pixels: avoid a minimum clamp that forces constant glitter.
    const hotChance = Math.max(0.015, Math.min(0.18, 0.01 + sparkleNorm * 0.17));
    const hotBoost = 1.8 + sparkleNorm * 0.6;
    const canSetColor = typeof mesh.setColorAt === 'function';

    if (!canSetColor && materialRef.current) {
      materialRef.current.color.setRGB(trailLin.r, trailLin.g, trailLin.b);
    }

    baseColor.setRGB(trailLin.r, trailLin.g, trailLin.b);
    sparkleColor.setRGB(sparkleLin.r, sparkleLin.g, sparkleLin.b);

    for (let i = 0; i < instanceCount; i++) {
      const u = randomData.along[i];

      if (u > trailNorm || trailNorm <= 0) {
        dummy.position.set(0, 0, -100);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.0001, 0.0001, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (canSetColor) mesh.setColorAt(i, baseColor.setRGB(0, 0, 0));
        continue;
      }

      const un = Math.max(0, Math.min(1, u / Math.max(trailNorm, 0.0001)));
      const angle = headAngle - un * ARC_SPAN;
      const radius = ARC_RADIUS + randomData.radiusJitter[i] * spread * 0.12;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const tail = Math.pow(1 - un, 2.2);
      const flicker = 0.85 + 0.15 * Math.sin(t * 4 + i * 12.9898);
      const sizeNorm = (randomData.size[i] - 0.6) / 0.8;
      let brightness = tail * intensity * flicker * (0.35 + 0.65 * sizeNorm);
      const isHot = randomData.hotSeed[i] < hotChance;
      if (isHot) brightness *= hotBoost;
      if (isHot) brightness *= glowGain;
      else brightness *= (0.85 + 0.15 * glowGain);
      brightness = Math.max(0, Math.min(2.4, brightness));

      const s = (0.006 + 0.020 * Math.pow(1 - un, 1.4)) * randomData.size[i];
      dummy.position.set(x, y, 0.02 + (isHot ? 0.0015 : 0));
      dummy.rotation.set(0, 0, angle + Math.PI / 2 + randomData.angleJitter[i] * 0.12);
      dummy.scale.set(s * 0.9, s * 1.3, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (canSetColor) {
        workColor.copy(baseColor);
        if (isHot) {
          workColor.lerp(sparkleColor, 0.35 + sparkleNorm * 0.35);
          workColor.lerp(whiteColor, 0.20 + sparkleNorm * 0.25);
        }
        workColor.multiplyScalar(brightness);
        mesh.setColorAt(i, workColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (canSetColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <group name="trailArc">
      <instancedMesh ref={trailRef} args={[null, null, instanceCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#ffffff"
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function OrbVisual({ colorLin, glowGain, z = 0.02, isFrameActive = true }) {
  const base = linToHex(colorLin);
  const coreRef = useRef(null);
  const midRef = useRef(null);
  const haloRef = useRef(null);

  const softMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const c = size * 0.5;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0.00, 'rgba(255,255,255,1.00)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.78)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.18)');
    g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (!shouldRenderRingFrame(isFrameActive)) return;
    const t = clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.position.set(
        Math.sin(t * 1.7) * 0.0009,
        Math.cos(t * 1.3) * 0.0008,
        0
      );
      const s = 0.12 * (0.98 + 0.02 * Math.sin(t * 2.3));
      coreRef.current.scale.set(s, s, 1);
      if (coreRef.current.material) coreRef.current.material.rotation = Math.sin(t * 0.7) * 0.06;
    }

    if (midRef.current) {
      midRef.current.position.set(
        Math.sin(t * 0.9 + 1.7) * 0.0016,
        Math.cos(t * 1.1 + 0.9) * 0.0014,
        0
      );
      const s = 0.25 * (0.985 + 0.015 * Math.sin(t * 1.5 + 0.4));
      midRef.current.scale.set(s, s, 1);
      if (midRef.current.material) midRef.current.material.rotation = Math.sin(t * 0.55 + 0.8) * 0.09;
    }

    if (haloRef.current) {
      haloRef.current.position.set(
        Math.sin(t * 0.6 + 2.2) * 0.0032,
        Math.cos(t * 0.8 + 1.1) * 0.0028,
        0
      );
      const s = 0.66 * (0.985 + 0.015 * Math.sin(t * 1.1 + 1.2));
      haloRef.current.scale.set(s, s, 1);
      if (haloRef.current.material) haloRef.current.material.rotation = Math.sin(t * 0.33 + 2.1) * 0.13;
    }
  });

  return (
    <group position={[0, 0, z]}>
      <sprite ref={coreRef} scale={[0.12, 0.12, 1]}>
        <spriteMaterial
          map={softMap}
          color={base}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      <sprite ref={midRef} scale={[0.25, 0.25, 1]}>
        <spriteMaterial
          map={softMap}
          color={base}
          transparent
          opacity={0.22 * glowGain}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      <sprite ref={haloRef} scale={[0.66, 0.66, 1]}>
        <spriteMaterial
          map={softMap}
          color={base}
          transparent
          opacity={0.08 * glowGain}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

function HaloBand({ enabled, intensity, length, colorA, colorB, isFrameActive = true }) {
  if (!enabled) return null;

  const bandRef = useRef(null);
  const materialRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(), []);
  const altColor = useMemo(() => new THREE.Color(), []);
  const workColor = useMemo(() => new THREE.Color(), []);
  const bandCount = 220;

  const randomData = useMemo(() => {
    const angle = new Float32Array(bandCount);
    const radial = new Float32Array(bandCount);
    const vertical = new Float32Array(bandCount);
    const size = new Float32Array(bandCount);
    const alpha = new Float32Array(bandCount);
    const phase = new Float32Array(bandCount);
    for (let i = 0; i < bandCount; i++) {
      angle[i] = Math.random() * Math.PI * 2;
      radial[i] = Math.random() * 2 - 1;
      vertical[i] = Math.random() * 2 - 1;
      size[i] = Math.random();
      alpha[i] = Math.random();
      phase[i] = Math.random() * Math.PI * 2;
    }
    return { angle, radial, vertical, size, alpha, phase };
  }, [bandCount]);

  useFrame(({ clock }) => {
    if (!bandRef.current) return;
    if (!shouldRenderRingFrame(isFrameActive)) return;

    const mesh = bandRef.current;
    const t = clock.elapsedTime;
    const canSetColor = typeof mesh.setColorAt === 'function';
    const density = Math.max(0.14, Math.min(0.92, 0.30 + length * 0.55));
    const brightnessScale = Math.max(0.02, Math.min(0.34, 0.03 + intensity * 0.18));

    if (!canSetColor && materialRef.current) {
      materialRef.current.color.set(colorA);
    }

    baseColor.set(colorA);
    altColor.set(colorB);

    for (let i = 0; i < bandCount; i++) {
      const a = randomData.angle[i];
      const clump = 0.5 + 0.5 * Math.sin(a * 6 + randomData.phase[i]);
      const visible = randomData.alpha[i] < density * (0.55 + 0.45 * clump);

      if (!visible) {
        dummy.position.set(0, 0, -100);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.0001, 0.0001, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (canSetColor) mesh.setColorAt(i, workColor.setRGB(0, 0, 0));
        continue;
      }

      const rx = 1.58 + randomData.radial[i] * 0.08;
      const ry = 0.52 + randomData.vertical[i] * 0.06;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      const z = 0.008 + randomData.vertical[i] * 0.004;
      const flicker = 0.88 + 0.12 * Math.sin(t * 0.8 + i * 5.17 + randomData.phase[i]);
      const s = (0.006 + randomData.size[i] * 0.012) * (0.75 + 0.25 * clump);
      const brightness = brightnessScale * (0.35 + 0.65 * randomData.alpha[i]) * flicker;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, a + Math.PI / 2 + randomData.vertical[i] * 0.2);
      dummy.scale.set(s * 1.2, s * 0.8, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (canSetColor) {
        workColor.copy(baseColor).lerp(altColor, 0.2 + 0.4 * randomData.alpha[i]).multiplyScalar(brightness);
        mesh.setColorAt(i, workColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (canSetColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group name="haloBand" position={[0, 0, 0.015]}>
      <instancedMesh ref={bandRef} args={[null, null, bandCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          color={colorA}
          transparent
          opacity={0.45}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ─── RayOccluders ─────────────────────────────────────────────────────────────
function RayOccluders({ enabled, pattern, scale, depthOffset, debug }) {
  if (!enabled) return null;

  const debugMaterial = {
    color: "#ff3355",
    transparent: true,
    opacity: 0.25,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide
  };

  const occluderMaterial = {
    color: "#000000",
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide
  };

  const mat = debug ? debugMaterial : occluderMaterial;

  const renderCrossPattern = () => (
    <>
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.15 * scale, 32]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[0.04 * Math.sqrt(scale), 3.2 * scale]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
    </>
  );

  const renderGridPattern = () => (
    <>
      {renderCrossPattern()}
      <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      <mesh position={[0, 0, 0.003]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[3.6 * scale, 0.04 * Math.sqrt(scale)]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
    </>
  );

  const renderRadialPattern = () => (
    <>
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.15 * scale, 32]} />
        <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
      </mesh>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={`radial-${i}`} position={[0, 0, i * 0.0005]} rotation={[0, 0, rad]}>
            <planeGeometry args={[3.6 * scale, 0.03 * Math.sqrt(scale)]} />
            <meshBasicMaterial {...mat} onUpdate={(m) => { m.colorWrite = debug; }} />
          </mesh>
        );
      })}
    </>
  );

  const renderPattern = () => {
    switch (pattern) {
      case 'grid':   return renderGridPattern();
      case 'radial': return renderRadialPattern();
      default:       return renderCrossPattern();
    }
  };

  return (
    <group position={[0, 0, depthOffset]} name="rayOccluders" renderOrder={-10} frustumCulled={false}>
      {renderPattern()}
    </group>
  );
}

// ─── RingScene ────────────────────────────────────────────────────────────────
// 3D scene objects: ring geometry, streak proxy, reticle, avatar glow, god-ray emitter.
// Renamed from the internal BreathingRing in BloomRingCanvas to avoid collision
// with the production BreathingRing wrapper component.
function RingScene({
  breathSpeed = 0.8,
  trailSpeed = 0.4,
  streakStrength = 0.20,
  streakLength = 0.65,
  rayEnabled = false,
  godRayLightRef,
  raySunY,
  raySunZ,
  raySunRadius,
  occluderEnabled,
  occluderPattern,
  occluderScale,
  occluderDepthOffset,
  debugOccluders,
  accentColor = '#ffffff',
  mode = 'production',
  breathDriver = null,
  orbitalAngleRef = null,
  glowGain = 1.0,
  palette = null,
  autoFit = true,
  fitFill = 0.88,
  isFrameActive = true,
}) {
  const isAvatar = mode === 'avatar';
  const sceneRootRef   = useRef(null);
  const ringGroupRef   = useRef(null);
  const reticleRef     = useRef(null);
  const avatarGlowRef  = useRef(null);
  const orbitalOrbRef    = useRef(null);
  const energyBandMatRef = useRef(null);
  const energyGlowRef    = useRef(null);
  const RETICLE_OPACITY_SCALE = 0.82;
  const occluderScaleClamped = Math.min(occluderScale, MAX_OCCLUDER_SCALE);
  const orbAccentLin = useMemo(() => hexToLin(accentColor), [accentColor]);

  // Energy band shader uniforms (created once, updated per-frame)
  const energyUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAccentColor: { value: new THREE.Color(accentColor) },
    uBreathIntensity: { value: 0.5 },
    uInnerRadius: { value: ENERGY_BAND_INNER },
    uOuterRadius: { value: ENERGY_BAND_OUTER },
    uCycleProgress: { value: 0.0 },
    uHoldFactor:    { value: 0.0 },
  }), [accentColor]);

  useFrame(({ clock, viewport }, delta) => {
    if (!shouldRenderRingFrame(isFrameActive)) return;
    // t is always computed for secondary time-based effects (driftPhase, inner
    // concentric, layered orbital sun, avatar glow). When breathDriver is active, t is
    // NOT the breath clock — breathSpeed is irrelevant to the breath waveform.
    const t = clock.elapsedTime * breathSpeed;

    // Compute breath wave w in [-1..+1].
    // breathDriver present → deterministic from phase + phaseProgress01.
    // Absent → sine fallback (preserves existing lab animation behavior).
    let w;
    if (breathDriver) {
      const { phase, phaseProgress01 } = breathDriver;
      const ep = easeInOut(phaseProgress01 ?? 0);
      if (phase === 'inhale')       { w = ep * 2 - 1; }                              // -1 → +1
      else if (phase === 'holdTop') { w = 1  + 0.02 * Math.sin(clock.elapsedTime * 0.8); } // plateau + micro shimmer
      else if (phase === 'exhale')  { w = 1 - ep * 2; }                              // +1 → -1
      else                          { w = -1 + 0.02 * Math.sin(clock.elapsedTime * 0.8); } // holdBottom + shimmer
    } else {
      w = Math.sin(t);
    }

    let bI = 0.5;
    if (breathDriver) {
      const { phase, phaseProgress01: pp } = breathDriver;
      const ep = easeInOut(pp ?? 0);
      if (phase === 'inhale')       bI = ep;
      else if (phase === 'holdTop') bI = 1.0;
      else if (phase === 'exhale')  bI = 1.0 - ep;
      else                          bI = 0.0;
    } else {
      bI = Math.max(0, Math.min(1, (w + 1) * 0.5));
    }

    // Reticle opacity modulation — lab/avatar only (production hides reticle)
    if (mode !== 'production' && reticleRef.current) {
      const reticleOpacityMod = 1.0 + 0.025 * w;
      reticleRef.current.children.forEach((line) => {
        line.children.forEach((mesh, meshIndex) => {
          if (mesh.material) {
            const baseOpacity = (meshIndex === 0 ? 0.12 : 0.35) * RETICLE_OPACITY_SCALE;
            mesh.material.opacity = baseOpacity * reticleOpacityMod;
          }
        });
      });
    }

    let orbitalAngle = (clock.elapsedTime * trailSpeed) % (Math.PI * 2);
    if (mode !== 'production' && orbitalAngleRef) {
      if (!Number.isFinite(orbitalAngleRef.current)) orbitalAngleRef.current = orbitalAngle;
      if (breathDriver) {
        const phaseDurationSec = breathDriver?.phaseDurationSec;
        if (Number.isFinite(phaseDurationSec) && phaseDurationSec > 0) {
          // Clock orbit: exactly one full revolution per phase duration.
          const omega = (Math.PI * 2) / phaseDurationSec;
          orbitalAngleRef.current += delta * omega;
          const twoPi = Math.PI * 2;
          orbitalAngleRef.current = ((orbitalAngleRef.current % twoPi) + twoPi) % twoPi;
        } else {
          const { phase, phaseProgress01 } = breathDriver;
          const ep = easeInOut(phaseProgress01 ?? 0);
          let phaseFactor;
          if (phase === 'inhale')       phaseFactor = 0.85 + 0.35 * ep;
          else if (phase === 'holdTop') phaseFactor = 0.22 + 0.04 * Math.sin(clock.elapsedTime * 0.8);
          else if (phase === 'exhale')  phaseFactor = 1.00 - 0.20 * ep;
          else                          phaseFactor = 0.30 + 0.04 * Math.sin(clock.elapsedTime * 0.8);

          const omega = Math.max(0.05, trailSpeed) * phaseFactor;
          orbitalAngleRef.current += delta * omega;
          const twoPi = Math.PI * 2;
          orbitalAngleRef.current = ((orbitalAngleRef.current % twoPi) + twoPi) % twoPi;
        }
      } else {
        orbitalAngleRef.current = orbitalAngle;
      }
      orbitalAngle = orbitalAngleRef.current;
    }

    if (mode !== 'production' && orbitalOrbRef.current) {
      orbitalOrbRef.current.position.set(
        Math.cos(orbitalAngle) * ARC_RADIUS,
        Math.sin(orbitalAngle) * ARC_RADIUS,
        0
      );
    }

    // Energy band: update shader uniforms per-frame
    if (energyBandMatRef.current) {
      energyBandMatRef.current.uniforms.uTime.value = clock.elapsedTime;
      energyBandMatRef.current.uniforms.uAccentColor.value.set(accentColor);
      energyBandMatRef.current.uniforms.uBreathIntensity.value = bI;
      if (breathDriver) {
        energyBandMatRef.current.uniforms.uCycleProgress.value = breathDriver.cycleProgress01 ?? 0.0;
        const isHold = breathDriver.phase === 'holdTop' || breathDriver.phase === 'holdBottom';
        energyBandMatRef.current.uniforms.uHoldFactor.value = isHold ? 1.0 : 0.0;
      }
    }
    if (energyGlowRef.current?.material) {
      const flicker = 0.972 + 0.025 * Math.sin(clock.elapsedTime * 5.4);
      energyGlowRef.current.material.opacity = (0.24 + 0.22 * bI) * flicker;
    }

    if (isAvatar && avatarGlowRef.current) {
      const breathPhase = Math.sin(t);
      const drift = Math.sin(t * 0.37) * 0.02;
      const s = 1.0 + 0.025 * breathPhase + drift;
      avatarGlowRef.current.scale.set(s, s, 1);
      avatarGlowRef.current.children.forEach((mesh, i) => {
        if (mesh.material) {
          const base = i === 0 ? 0.12 : (i === 1 ? 0.08 : 0.05);
          mesh.material.opacity = base * (1.0 + 0.15 * breathPhase + drift);
        }
      });
    }

    // autoFit: scale the entire scene so SCENE_MAX_RADIUS fits within fitFill
    // of the smaller viewport dimension. Camera-independent (uses world-unit viewport).
    if (autoFit && sceneRootRef.current) {
      const minV = Math.min(viewport.width, viewport.height);
      if (isFinite(minV) && minV > 0) {
        const maxR = mode === 'production' ? SCENE_MAX_RADIUS_PRODUCTION : SCENE_MAX_RADIUS;
        sceneRootRef.current.scale.setScalar((minV * fitFill) / 2 / maxR);
      }
    }
  });

  return (
    <group ref={sceneRootRef}>
      {/* Avatar mode: soft radial glow field */}
      {isAvatar && (
        <group ref={avatarGlowRef}>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.85, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.4, 128]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.12, 64]} />
            <meshBasicMaterial color={palette?.coreHot ?? '#ffffff'} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* God-ray emitter (sun proxy) — non-avatar + ray-enabled only */}
      {!isAvatar && rayEnabled && (
        <mesh ref={godRayLightRef} position={[0, raySunY, raySunZ]}>
          <sphereGeometry args={[raySunRadius, 16, 16]} />
          <meshBasicMaterial color={palette?.nucleus ?? '#ffffff'} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      )}

      {/* Ray occluders — non-avatar only */}
      {!isAvatar && occluderEnabled && (
        <RayOccluders
          enabled={occluderEnabled}
          pattern={occluderPattern}
          scale={occluderScaleClamped}
          depthOffset={occluderDepthOffset}
          debug={debugOccluders}
        />
      )}

      {/* Plasma containment ring — non-avatar only */}
      {!isAvatar && (
        <group ref={ringGroupRef} position={[0, 0, 0]}>
          {/* Layer C: tight glow — lab/avatar only (production relies on Bloom for glow) */}
          {mode !== "production" && (
            <mesh ref={energyGlowRef} position={[0, 0, -0.001]}>
              <ringGeometry args={[ENERGY_GLOW_INNER, ENERGY_GLOW_OUTER, 192]} />
              <meshBasicMaterial
                color={accentColor}
                transparent
                opacity={0.28}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          )}

          {/* Layer B: noisy energy band */}
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[ENERGY_BAND_INNER, ENERGY_BAND_OUTER, 256]} />
            <shaderMaterial
              ref={energyBandMatRef}
              vertexShader={ENERGY_BAND_VERT}
              fragmentShader={ENERGY_BAND_FRAG}
              uniforms={energyUniforms}
              transparent
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Layer A: white-hot core ring */}
          <mesh position={[0, 0, 0.002]}>
            <ringGeometry args={[ENERGY_CORE_INNER, ENERGY_CORE_OUTER, 192]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent={false}
              blending={THREE.NormalBlending}
              depthWrite={true}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* Orbital sun (layered additive falloff) — lab only */}
      {!isAvatar && mode !== 'production' && (
        <group ref={orbitalOrbRef} position={[ARC_RADIUS, 0, 0]}>
          <OrbVisual colorLin={orbAccentLin} glowGain={glowGain} isFrameActive={isFrameActive} />
        </group>
      )}

      {/* Halo band (particulate, non-stroke) — lab only */}
      {!isAvatar && mode !== 'production' && streakStrength > 0 && (
        <HaloBand
          enabled={streakStrength > 0}
          intensity={streakStrength}
          length={streakLength}
          colorA={palette?.streakHot ?? accentColor}
          colorB={palette?.reticleBright ?? '#ffffff'}
          isFrameActive={isFrameActive}
        />
      )}

      {/* Reticle geometry — lab only */}
      {!isAvatar && mode !== 'production' && (
        <group ref={reticleRef} position={[0, 0, -0.005]}>
          <group>
            {[
              { angle: 0,   length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 90,  length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 180, length: 0.11, radius: 1.60, dim: 1.0 },
              { angle: 270, length: 0.11, radius: 1.60, dim: 1.0 },
            ].map(({ angle, length, radius, dim }) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <group key={`major-${angle}`} position={[Math.cos(rad) * radius, Math.sin(rad) * radius, 0]} rotation={[0, 0, rad]}>
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.07 * dim * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.18 * dim * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                </group>
              );
            })}
            {[
              { angle: 22,  length: 0.06, radius: 1.60, dim: 0.85 },
              { angle: 58,  length: 0.06, radius: 1.60, dim: 0.90 },
              { angle: 128, length: 0.06, radius: 1.60, dim: 0.75 },
              { angle: 206, length: 0.06, radius: 1.60, dim: 0.95 },
              { angle: 244, length: 0.06, radius: 1.60, dim: 0.80 },
              { angle: 316, length: 0.06, radius: 1.60, dim: 0.88 },
            ].map(({ angle, length, radius, dim }) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <group key={`minor-${angle}`} position={[Math.cos(rad) * radius, Math.sin(rad) * radius, 0]} rotation={[0, 0, rad]}>
                  <mesh><planeGeometry args={[length, 0.010]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.07 * dim * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                  <mesh position={[0, 0, 0.001]}><planeGeometry args={[length, 0.004]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.18 * dim * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
                </group>
              );
            })}
          </group>
          {/* Crosshair lines */}
          <group position={[0, 1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.35 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[0, -1.50, 0]}>
            <mesh><planeGeometry args={[0.015, 0.55]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.006, 0.55]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.35 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[-1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.31 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
          <group position={[1.35, 0, 0]}>
            <mesh><planeGeometry args={[0.22, 0.015]} /><meshBasicMaterial color={palette?.reticle ?? '#fff8f0'} transparent opacity={0.12 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.001]}><planeGeometry args={[0.22, 0.006]} /><meshBasicMaterial color={palette?.reticleBright ?? '#ffffff'} transparent opacity={0.31 * RETICLE_OPACITY_SCALE} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
          </group>
        </group>
      )}
    </group>
  );
}

export function BloomRingSceneContent({
  params = {},
  accentColor = '#ffffff',
  mode = 'production',
  isFrameActive = true,
}) {
  const {
    bloomStrength    = 1.2,
    bloomRadius      = 0.60,
    bloomThreshold   = 0.50,
    breathSpeed      = 0.6,
    streakStrength   = 0.0,
    streakThreshold  = 0.85,
    streakLength     = 0.65,
    rayEnabled       = false,
    rayExposure      = 0.10,
    rayWeight        = 0.4,
    rayDecay         = 0.93,
    raySamples       = 40,
    rayDensity       = 0.5,
    rayClampMax      = 0.6,
    raySunY          = 0.45,
    raySunZ          = -2.0,
    raySunRadius     = 0.10,
    occluderEnabled     = false,
    occluderPattern     = 'cross',
    occluderScale       = 1.2,
    occluderDepthOffset = -1.5,
    debugOccluders      = false,
    trailEnabled  = false,
    trailIntensity = 0.5,
    trailLength   = 30,
    trailSpread   = 0.02,
    trailSpeed    = 0.4,
    trailSparkle  = 0.1,
    breathDriver  = null,
    autoFit       = true,
    fitFill       = 0.88,
  } = params;

  const godRayLightRef = useRef(null);
  const orbitalAngleRef = useRef(0);

  // Accent palette — all tints/shades of accentColor mixed in linear RGB space.
  // Ensures every rendered pixel is hue-matched to the active stage accent.
  const accentLin = useMemo(() => hexToLin(accentColor), [accentColor]);
  const palette = useMemo(() => {
    const a = accentLin;
    const l = linLuma(a);
    const target = 0.55;
    const glowGain = Math.min(2.2, Math.max(0.85, target / Math.max(l, 1e-4)));
    // Luminance-based bloom compensation (scalar, no hue change).
    // Prevents high-luminance accents (Flame #fcd34d, Beacon #22d3ee) from
    // washing out under additive blending. Clamped [0.85, 1.0] — only dims, never amplifies.
    const lum = linLuma(a);
    const bloomDim = Math.max(0.85, Math.min(1.0, 0.70 / Math.max(lum, 0.30)));
    const aDimmed = { r: a.r * bloomDim, g: a.g * bloomDim, b: a.b * bloomDim };
    // Linear RGB objects for TrailArc buffer writes (avoids hex→linear round trip per frame).
    const trailLin   = tintLin(aDimmed, 0.20);
    const sparkleLin = tintLin(aDimmed, 0.45);
    return {
      // Hex strings for R3F material color props:
      core:          linToHex(a),                  // pure accent (≈ accentColor)
      coreHot:       linToHex(tintLin(a, 0.25)),   // +25% toward white — bright core/nucleus
      aperture:      linToHex(shadeLin(a, 0.10)),  // slight shade — depth, not pastel
      nucleus:       linToHex(tintLin(a, 0.30)),   // +30% tint — glow center
      reticle:       linToHex(shadeLin(a, 0.05)),  // slight shade — thin lines read cleaner
      reticleBright: linToHex(tintLin(a, 0.45)),   // +45% tint — inner highlight
      streakHot:     linToHex(tintLin(a, 0.40)),   // +40% tint — streak proxy bright ring
      // Linear RGB objects for TrailArc particle buffer writes:
      trailLin,
      sparkleLin,
      glowGain,
    };
  }, [accentLin]);

  const isAvatar           = mode === 'avatar';
  const cappedBloomStrength = Math.min(bloomStrength, 2.4);

  return (
    <>
      <RingScene
        breathSpeed={breathSpeed}
        trailSpeed={trailSpeed}
        streakStrength={streakStrength}
        streakLength={streakLength}
        rayEnabled={rayEnabled}
        godRayLightRef={godRayLightRef}
        raySunY={raySunY}
        raySunZ={raySunZ}
        raySunRadius={raySunRadius}
        occluderEnabled={occluderEnabled}
        occluderPattern={occluderPattern}
        occluderScale={occluderScale}
        occluderDepthOffset={occluderDepthOffset}
        debugOccluders={debugOccluders}
        accentColor={accentColor}
        mode={mode}
        breathDriver={breathDriver}
        orbitalAngleRef={orbitalAngleRef}
        glowGain={palette.glowGain}
        palette={palette}
        autoFit={autoFit}
        fitFill={fitFill}
        isFrameActive={isFrameActive}
      />

      {/* TrailArc — lab only (production strips all decorations) */}
      {!isAvatar && mode !== 'production' && (
        <TrailArc
          enabled={trailEnabled}
          trailLin={palette.trailLin}
          sparkleLin={palette.sparkleLin}
          intensity={trailIntensity}
          length={trailLength}
          spread={trailSpread}
          speed={trailSpeed}
          sparkle={trailSparkle}
          orbitalAngleRef={orbitalAngleRef}
          glowGain={palette.glowGain}
          isFrameActive={isFrameActive}
        />
      )}

      {!DISABLE_POSTPROCESS && (
        <EffectComposer multisampling={0}>
          {/* GodRays — non-avatar, param-gated */}
          {!isAvatar && rayEnabled && (
            <GodRays
              sun={godRayLightRef}
              samples={raySamples}
              density={rayDensity}
              decay={rayDecay}
              weight={rayWeight}
              exposure={rayExposure}
              clampMax={rayClampMax}
              blendFunction={BlendFunction.SCREEN}
            />
          )}

          {/* Tight bloom — production: high intensity, small radius for energy glow */}
          <Bloom
            intensity={isAvatar ? 0.6 : (mode === 'production' ? 1.9 : cappedBloomStrength * 0.8)}
            radius={isAvatar ? 0.5 : (mode === 'production' ? 0.14 : Math.min(bloomRadius, 0.35))}
            luminanceThreshold={isAvatar ? 0.1 : (mode === 'production' ? 0.32 : Math.max(bloomThreshold, 0.45))}
            luminanceSmoothing={isAvatar ? 0.4 : 0.015}
          />

          {/* Wide bloom — lab only */}
          {!isAvatar && mode !== 'production' && (
            <Bloom
              intensity={cappedBloomStrength * 0.3}
              radius={0.65}
              luminanceThreshold={0.55}
              luminanceSmoothing={0.05}
            />
          )}

          {/* Streak bloom — lab only */}
          {!isAvatar && mode !== 'production' && streakStrength > 0 && (
            <Bloom
              intensity={streakStrength * 1.5}
              radius={streakLength * 2.0}
              luminanceThreshold={streakThreshold}
              luminanceSmoothing={0.01}
            />
          )}

          {/* Chromatic aberration — lab only */}
          {!isAvatar && mode !== 'production' && (
            <ChromaticAberration offset={[0.0012, 0.0005]} radialModulation={true} modulationOffset={0.15} />
          )}

          {/* Vignette — lab only */}
          {!isAvatar && mode !== 'production' && (
            <Vignette eskil={false} offset={0.25} darkness={0.45} />
          )}
        </EffectComposer>
      )}
    </>
  );
}

// ─── BloomRingRenderer (main export) ──────────────────────────────────────────
export default function BloomRingRenderer({
  params = {},
  accentColor = '#ffffff',
  className,
  style,
  mode = 'production',
  isFrameActive = true,
}) {
  const { width, height } = params;

  // Sizing: explicit px dims from params, or fill container via CSS.
  const canvasStyle = (width != null && height != null)
    ? { width, height, ...style }
    : { width: '100%', height: '100%', display: 'block', ...style };

  return (
    <Canvas
      style={canvasStyle}
      className={className}
      frameloop={shouldRenderRingFrame(isFrameActive) ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        if (import.meta.env.DEV) {
          const appliedDpr = Number(gl.getPixelRatio?.() || 1).toFixed(2);
          console.info(`[BloomRingRenderer] mount dpr=${appliedDpr} cap=1.50`);
        }
        registerR3FRenderer(gl, gl, {
          source: 'BloomRingRenderer',
          dpr: Number(gl.getPixelRatio?.() || 1),
          canvasSize: `${gl.domElement?.width || 0}x${gl.domElement?.height || 0}`,
          appMarker: typeof window !== 'undefined' ? window.__IMMANENCE_APP_MARKER__ : 'unknown',
        });
      }}
    >
      <BloomRingSceneContent params={params} accentColor={accentColor} mode={mode} isFrameActive={isFrameActive} />
    </Canvas>
  );
}
