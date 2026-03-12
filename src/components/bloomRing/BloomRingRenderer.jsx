// src/components/bloomRing/BloomRingRenderer.jsx
// Single source of truth for the WebGL bloom ring renderer.
// Used by the production BreathingRing path and shared runtime surfaces.
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
import { Html } from '@react-three/drei';
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Smoothstep easing [0,1] → [0,1]. Used by breathDriver phase→wave mapping.
const easeInOut = p => { const c = Math.max(0, Math.min(1, p)); return c * c * (3 - 2 * c); };

function shouldRenderRingFrame(isFrameActive = true) {
  return isFrameActive;
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
const W_LIN = { r: 1, g: 1, b: 1 }; // white in linear
const B_LIN = { r: 0, g: 0, b: 0 }; // black in linear
function tintLin(a, t) { return mixLin(a, W_LIN, t); }
function shadeLin(a, t) { return mixLin(a, B_LIN, t); }

const ENERGY_CORE_INNER = 0.952;
const ENERGY_CORE_OUTER = 0.962;
const ENERGY_BAND_INNER = 0.968;
const ENERGY_BAND_OUTER = 1.032;

// The farthest point any geometry reaches in RingScene local space.
// Crosshair verticals: center y=1.50, half-height 0.275 → tip at 1.775.
// Used by autoFit to compute a camera-independent uniform scale each frame.
const SCENE_MAX_RADIUS = 1.80;
const MAX_OCCLUDER_SCALE = SCENE_MAX_RADIUS / 1.8;

// Production mode: ring-only scene (no reticle/crosshairs extending to 1.80).
const SCENE_MAX_RADIUS_PRODUCTION = 1.12;
const INSTRUMENT_PROBE_ENABLED = true;

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
  palette = null,
  autoFit = true,
  fitFill = 0.88,
  isFrameActive = true,
  activePresetRaw = '',
}) {
  const isAvatar = mode === 'avatar';
  const isInstrumentTarget = !isAvatar && mode === 'production' && activePresetRaw === 'instrument';
  const showInstrumentProbe = isInstrumentTarget && INSTRUMENT_PROBE_ENABLED;
  const sceneRootRef   = useRef(null);
  const ringGroupRef   = useRef(null);
  const avatarGlowRef  = useRef(null);
  const energyBandMatRef = useRef(null);
  const occluderScaleClamped = Math.min(occluderScale, MAX_OCCLUDER_SCALE);

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

  useFrame(({ clock, viewport }) => {
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
          {isInstrumentTarget ? (
            <>
              {showInstrumentProbe ? (
                <>
                  <Html
                    fullscreen
                    style={{
                      background: 'rgba(255,0,0,0.35)',
                      zIndex: 999999,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '36px',
                      letterSpacing: '0.08em',
                      textShadow: '0 0 10px rgba(0,0,0,0.65)',
                    }}
                  >
                    INSTRUMENT_PROBE_VISIBLE
                  </Html>
                  <mesh position={[0, 0, 0]} renderOrder={9999}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial
                      color="red"
                      transparent
                      opacity={0.85}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                </>
              ) : (
                <>
                  <ambientLight intensity={0.25} color="#ffffff" />
                  <directionalLight intensity={1.2} color="#ffffff" position={[2, 3, 2]} />
                  <mesh position={[0, 0, 0.01]}>
                    <torusGeometry args={[1.0, 0.09, 24, 96]} />
                    <meshPhysicalMaterial
                      color={accentColor}
                      metalness={1}
                      roughness={0.08}
                      clearcoat={0.4}
                      clearcoatRoughness={0.12}
                    />
                  </mesh>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
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
  activePresetRaw = '',
}) {
  const {
    bloomStrength    = 1.2,
    bloomRadius      = 0.60,
    bloomThreshold   = 0.50,
    breathSpeed      = 0.6,
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
    breathDriver  = null,
    autoFit       = true,
    fitFill       = 0.88,
  } = params;

  const godRayLightRef = useRef(null);

  // Accent palette — all tints/shades of accentColor mixed in linear RGB space.
  // Ensures every rendered pixel is hue-matched to the active stage accent.
  const accentLin = useMemo(() => hexToLin(accentColor), [accentColor]);
  const palette = useMemo(() => {
    const a = accentLin;
    return {
      // Hex strings for R3F material color props:
      core:          linToHex(a),                  // pure accent (≈ accentColor)
      coreHot:       linToHex(tintLin(a, 0.25)),   // +25% toward white — bright core/nucleus
      aperture:      linToHex(shadeLin(a, 0.10)),  // slight shade — depth, not pastel
      nucleus:       linToHex(tintLin(a, 0.30)),   // +30% tint — glow center
    };
  }, [accentLin]);

  const isAvatar           = mode === 'avatar';
  const cappedBloomStrength = Math.min(bloomStrength, 2.4);

  return (
    <>
      <RingScene
        breathSpeed={breathSpeed}
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
        palette={palette}
        autoFit={autoFit}
        fitFill={fitFill}
        isFrameActive={isFrameActive}
        activePresetRaw={activePresetRaw}
      />

      {(
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
      }}
    >
      <BloomRingSceneContent
        params={params}
        accentColor={accentColor}
        mode={mode}
        isFrameActive={isFrameActive}
      />
    </Canvas>
  );
}
