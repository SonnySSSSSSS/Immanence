import { memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, GodRays } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

const DEFAULT_ACCENT = '#22d3ee';
const PRESET_NAME = 'instrument';

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  INSTRUMENT RENDERER — TUNABLES                                             ║
// ║  All visual parameters live here. Adjust freely; do not scatter magic       ║
// ║  numbers elsewhere in the file.                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Torus / bezel (glowing-torus reference port) ─────────────────────────────
const T_BEZEL_METALNESS      = 0.88;   // 0–1   polished metal reads → crisp specular
const T_BEZEL_ROUGHNESS      = 0.08;   // 0–1   tight specular lobe
const T_BEZEL_CLEARCOAT      = 0.95;   // 0–1   glossy lacquer layer
const T_BEZEL_CC_ROUGHNESS   = 0.04;   // 0–1   tight clearcoat micro-highlight
const T_BEZEL_EMI_INTENSITY  = 0.78;   // [tuned up] bloom bait — accent emissive
const T_CAL_EMI_INTENSITY    = 0.30;   // [tuned up]

// ── Rim (Fresnel) shader ──────────────────────────────────────────────────────
const T_RIM_BEZEL_INTENSITY  = 0.52;   // [tuned up] crisp specular highlight band
const T_RIM_BEZEL_POWER      = 1.6;    // lower = broader rim band
const T_RIM_CAL_INTENSITY    = 0.32;   // [tuned up]
const T_RIM_CAL_POWER        = 2.0;

// ── 3-point lighting ──────────────────────────────────────────────────────────
const T_LIGHT_KEY_POS        = [-1.8,  2.8,  5.0];
const T_LIGHT_KEY_INT        = 1.10;   // [tuned up] stronger key for crisper specular
const T_LIGHT_FILL_POS       = [ 2.6, -1.4,  3.8];
const T_LIGHT_FILL_INT       = 0.26;   // [tuned up]
const T_LIGHT_RIM_POS        = [ 0.0, -2.8, -4.5];
const T_LIGHT_RIM_INT        = 0.62;   // [tuned up] stronger back-rim catch

// ── Scene wobble (marks instrument renderer as clearly distinct from bracelet) ─
const T_WOBBLE_ENABLED       = true;   // slow tilt oscillation
const T_WOBBLE_AMPLITUDE     = 0.08;   // radians — max tilt angle
const T_WOBBLE_SPEED         = 0.28;   // rad/s

// ── Bloom (dual-pass) ─────────────────────────────────────────────────────────
const T_BLOOM_TIGHT_THRESHOLD  = 0.58;   // [tuned down] catch more emissive
const T_BLOOM_TIGHT_BASE       = 1.70;   // [tuned up]  unmistakable glow
const T_BLOOM_TIGHT_HOLD_BOOST = 0.20;   // [tuned up]
const T_BLOOM_TIGHT_RADIUS     = 0.22;   // [tuned up]  slightly wider tight halo
const T_BLOOM_WIDE_THRESHOLD   = 0.28;   // [tuned down]
const T_BLOOM_WIDE_INTENSITY   = 0.36;   // [tuned up]  stronger atmospheric wrap
const T_BLOOM_WIDE_RADIUS      = 0.72;

// ── GodRays ───────────────────────────────────────────────────────────────────
const T_GODRAY_EXPOSURE_BASE   = 0.22;   // [tuned up] more visible at rest
const T_GODRAY_EXPOSURE_HOLD   = 0.38;   // [tuned up] "full lung" hold
const T_GODRAY_DECAY           = 0.90;
const T_GODRAY_WEIGHT          = 0.28;   // [tuned up]
const T_GODRAY_DENSITY         = 0.88;
const T_GODRAY_SAMPLES         = 40;

// DEV-only: push godrays to max for isolated tuning
// Set true temporarily to overshoot, then dial T_GODRAY_* constants back.
const T_DEV_GODRAY_BOOST = false;

// ── Ghost reflection ──────────────────────────────────────────────────────────
const T_GHOST_Y       = -0.30;   // below ring (ring-local Y)
const T_GHOST_OPACITY = 0;       // disabled: remove offset back-ring "ghost reflection"

// ── Misc ──────────────────────────────────────────────────────────────────────
const T_COMPOSER_RESOLUTION_SCALE = 0.65;
const T_MAX_RENDER_DPR             = 1.5;

// ─── ring geometry ────────────────────────────────────────────────────────────
const SEGMENT_COUNT = 48;
const RING_RADIUS = 1.0;
const SEG_WIDTH = 0.082;
const SEG_HEIGHT = 0.112;
const SEG_DEPTH = 0.012;
const SEG_Z = 0.006;
const CORE_Z_OFFSET = 0.004;
const CORE_SCALE = 0.76;
const TRACK_INNER_R = RING_RADIUS - SEG_HEIGHT * 0.56;
const TRACK_OUTER_R = RING_RADIUS + SEG_HEIGHT * 0.56;
const TRACK_Z = -0.008;
const BEZEL_RADIUS = 1.072;
const BEZEL_TUBE = 0.02;
const CAL_RING_RADIUS = 0.892;
const CAL_RING_TUBE = 0.008;
const CAL_Z = -0.002;
const MAX_RADIUS = 1.16;
const FILL_FACTOR = 0.86;
const DEBUG_STATIC_PROGRESS = null; // set to 0.35 for static screenshot checks

// ─── segment emission ─────────────────────────────────────────────────────────
const EMI_OFF = 0.05;
const EMI_ON = 1.15;
const EMI_HEAD = EMI_ON * 1.35;
const INNER_EMI = 1.35;
const INNER_HEAD_EMI = 1.75;
const HOLD_PULSE_MULT = 0.15;

// ─── segment material ─────────────────────────────────────────────────────────
const OFF_ROUGHNESS = 0.6;
const ON_ROUGHNESS = 0.45;

const BLOOM_ENABLED = true;

const TMP_SIZE = new THREE.Vector2();

// ─── A) rim shader: sRGB → linear decode so accent hue reaches bloom intact ──
// (E) Colour-correct: gamma-decode uColor so the rim contributes to bloom in
//     linear space. Without this, sRGB-compressed values wash toward white.
const rimVert = `
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDirW = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const rimFrag = `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  void main() {
    // E) sRGB → linear so bloom receives correct accent hue (no warm-white drift)
    vec3 linearColor = pow(max(uColor, vec3(0.0001)), vec3(2.2));
    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0), uPower);
    float rim = fresnel * uIntensity;
    gl_FragColor = vec4(linearColor * rim, rim);
  }
`;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

// E) Keep rim colour accent-true: lerp toward white less aggressively so hue
//    stays faithful across the full accent palette.
function derivePalette(accentColor) {
  const accent = new THREE.Color(accentColor || DEFAULT_ACCENT);
  const black  = new THREE.Color('#000000');
  const white  = new THREE.Color('#ffffff');

  return {
    segOff:          accent.clone().lerp(black, 0.94),
    segOnBase:       accent.clone().lerp(white, 0.24),
    segOnEmissive:   accent.clone().lerp(white, 0.55),
    segCoreEmissive: accent.clone().lerp(white, 0.10),
    track:           accent.clone().lerp(black, 0.90),
    bezel:           accent.clone().lerp(black, 0.82),
    calBase:         accent.clone().lerp(black, 0.78),
    calEmissive:     accent.clone().lerp(white, 0.22),
    // rim: less whitened than before → hue stays accent-true for bloom
    rim:             accent.clone().lerp(white, 0.14),
    index:           accent.clone().lerp(white, 0.40),
    // sun: bright accent-tinted for GodRays emitter
    sun:             accent.clone().lerp(white, 0.62),
  };
}

function createBreathState() {
  return {
    phase: 'holdBottom',
    inhaleP: 0,
    holdP: 0,
    exhaleP: 1,
    holdPulse: 0,
    activeCount: 0,
    headIndex: -1,
  };
}

function writeBreathState(target, breathDriver) {
  const phase = DEBUG_STATIC_PROGRESS != null ? 'inhale' : (breathDriver?.phase ?? 'holdBottom');
  const p = clamp01(DEBUG_STATIC_PROGRESS ?? (breathDriver?.phaseProgress01 ?? 0));

  target.inhaleP = 0;
  target.holdP = 0;
  target.exhaleP = 0;
  target.holdPulse = 0;
  target.headIndex = -1;

  if (phase === 'inhale') {
    target.phase = 'inhale';
    target.inhaleP = p;
    target.activeCount = Math.floor(p * SEGMENT_COUNT);
    target.headIndex = target.activeCount > 0 ? target.activeCount - 1 : -1;
    return;
  }

  if (phase === 'holdTop') {
    target.phase = 'hold';
    target.inhaleP = 1;
    target.holdP = p;
    target.holdPulse = Math.sin(p * Math.PI);
    target.activeCount = SEGMENT_COUNT;
    return;
  }

  if (phase === 'exhale') {
    target.phase = 'exhale';
    target.exhaleP = p;
    target.activeCount = Math.floor((1 - p) * SEGMENT_COUNT);
    return;
  }

  target.phase = 'holdBottom';
  target.exhaleP = 1;
  target.activeCount = 0;
}

function AutoFitScene({ maxRadius, fillFactor, children }) {
  const rootRef = useRef(null);

  useFrame(({ viewport }) => {
    if (!rootRef.current) return;
    const minV = Math.min(viewport.width, viewport.height);
    if (Number.isFinite(minV) && minV > 0) {
      rootRef.current.scale.setScalar((minV * fillFactor) / 2 / maxRadius);
    }
  });

  return <group ref={rootRef}>{children}</group>;
}

// sunRef is owned by TechInstrumentSceneContent and forwarded here so that
// the sun mesh lives inside AutoFitScene (scales with ring) while GodRays
// in the EffectComposer can still reference it.
export const TechInstrumentScene = memo(function TechInstrumentScene({
  accentColor,
  breathDriverRef,
  sunRef,
}) {
  const segMainMatsRef   = useRef([]);
  const segCoreMatsRef   = useRef([]);
  const segCoreMeshesRef = useRef([]);
  const calMatRef        = useRef(null);
  const bezelMatRef      = useRef(null);
  const glintRef         = useRef(null);
  const glintMatRef      = useRef(null);
  const rimLightRef      = useRef(null);   // B) accent-tinted rim/back light
  const breathStateRef   = useRef(createBreathState());
  const holdEmiRef       = useRef(0);
  const glintOpacityRef  = useRef(0);

  const palette = useMemo(() => derivePalette(accentColor), [accentColor]);
  const accentTint = useMemo(
    () => palette.rim.clone().lerp(new THREE.Color('#fff'), 0.55),
    [palette],
  );
  const accentShade = useMemo(
    () => palette.rim.clone().lerp(new THREE.Color('#000'), 0.65),
    [palette],
  );

  const geometries = useMemo(() => ({
    track:       new THREE.RingGeometry(TRACK_INNER_R, TRACK_OUTER_R, 128),
    bezel:       new THREE.TorusGeometry(BEZEL_RADIUS, BEZEL_TUBE, 20, 256),
    bezelRim:    new THREE.TorusGeometry(BEZEL_RADIUS, BEZEL_TUBE + 0.002, 20, 256),
    cal:         new THREE.TorusGeometry(CAL_RING_RADIUS, CAL_RING_TUBE, 16, 256),
    calRim:      new THREE.TorusGeometry(CAL_RING_RADIUS, CAL_RING_TUBE + 0.0015, 16, 256),
    index:       new THREE.BoxGeometry(0.012, 0.038, SEG_DEPTH * 0.58),
    segment:     new THREE.BoxGeometry(SEG_WIDTH, SEG_HEIGHT, SEG_DEPTH),
    segmentCore: new THREE.BoxGeometry(SEG_WIDTH * CORE_SCALE, SEG_HEIGHT * CORE_SCALE, SEG_DEPTH * 0.42),
  }), []);

  // A) Rim shader materials with upgraded intensity/power constants
  const rimMaterials = useMemo(() => ({
    bezel: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      vertexShader: rimVert,
      fragmentShader: rimFrag,
      uniforms: {
        uColor:     { value: new THREE.Color(DEFAULT_ACCENT) },
        uPower:     { value: T_RIM_BEZEL_POWER },
        uIntensity: { value: T_RIM_BEZEL_INTENSITY },
      },
    }),
    cal: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      vertexShader: rimVert,
      fragmentShader: rimFrag,
      uniforms: {
        uColor:     { value: new THREE.Color(DEFAULT_ACCENT) },
        uPower:     { value: T_RIM_CAL_POWER },
        uIntensity: { value: T_RIM_CAL_INTENSITY },
      },
    }),
  }), []);

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const angle = Math.PI / 2 - (i / SEGMENT_COUNT) * Math.PI * 2;
        return {
          px: Math.cos(angle) * RING_RADIUS,
          py: Math.sin(angle) * RING_RADIUS,
          rz: angle - Math.PI / 2,
        };
      }),
    [],
  );

  useEffect(() => () => {
    Object.values(geometries).forEach((geom) => geom.dispose());
    rimMaterials.bezel.dispose();
    rimMaterials.cal.dispose();
    segMainMatsRef.current.length = 0;
    segCoreMatsRef.current.length = 0;
    segCoreMeshesRef.current.length = 0;
  }, [geometries, rimMaterials]);

	  useFrame(() => {
	    const state = breathStateRef.current;
	    writeBreathState(state, breathDriverRef.current);

	    const isHold = state.phase === 'hold' || state.phase === 'holdBottom';
	    const targetHoldEmi = isHold ? 0.16 : 0;
	    holdEmiRef.current += (targetHoldEmi - holdEmiRef.current) * 0.12;
	    if (bezelMatRef.current) {
	      bezelMatRef.current.emissiveIntensity = holdEmiRef.current;
	    }

	    const holdMultiplier = state.phase === 'hold' ? 1 + HOLD_PULSE_MULT * state.holdPulse : 1;
	    const headIndex = state.headIndex;

	    // Phase 3C — subtle head-coupled glint on the bezel (no extra UI layer)
	    if (glintRef.current && glintMatRef.current) {
	      const hasHead = headIndex >= 0 && headIndex < SEGMENT_COUNT;
	      const glintTarget = hasHead ? (isHold ? 0.14 : 0.06) : 0;
	      glintOpacityRef.current += (glintTarget - glintOpacityRef.current) * 0.18;
	      glintMatRef.current.opacity = glintOpacityRef.current;
	      glintRef.current.visible = glintOpacityRef.current > 0.001;

	      if (hasHead) {
	        const seg = segments[headIndex];
	        const angle = Math.atan2(seg.py, seg.px);
	        glintRef.current.position.set(
	          Math.cos(angle) * BEZEL_RADIUS,
	          Math.sin(angle) * BEZEL_RADIUS,
	          0.02,
	        );
	        glintRef.current.rotation.set(0, 0, seg.rz);
	      }
	    }

	    for (let i = 0; i < SEGMENT_COUNT; i++) {
	      const isOn   = i < state.activeCount;
	      const isHead = i === headIndex;

      const mainMat = segMainMatsRef.current[i];
      if (mainMat) {
        mainMat.color.copy(accentShade);
        mainMat.emissive.copy(accentTint);
        mainMat.emissiveIntensity = isOn
          ? (isHead ? EMI_HEAD : EMI_ON) * holdMultiplier
          : EMI_OFF;
        mainMat.metalness = 0;
        mainMat.roughness = isOn ? ON_ROUGHNESS : OFF_ROUGHNESS;
      }

      const coreMesh = segCoreMeshesRef.current[i];
      if (coreMesh) coreMesh.visible = isOn;

      const coreMat = segCoreMatsRef.current[i];
      if (coreMat && isOn) {
        coreMat.color.copy(accentShade);
        coreMat.emissive.copy(accentTint);
        coreMat.emissiveIntensity = (isHead ? INNER_HEAD_EMI : INNER_EMI) * holdMultiplier;
        coreMat.metalness = 0;
        coreMat.roughness = 0.5;
      }
    }

    if (calMatRef.current) {
      calMatRef.current.color.copy(palette.calBase);
      calMatRef.current.emissive.copy(palette.calEmissive);
      calMatRef.current.emissiveIntensity = T_CAL_EMI_INTENSITY;
    }

    // B) Rim/back light tracks accent hue each frame
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(palette.rim);
    }

    rimMaterials.bezel.uniforms.uColor.value.copy(palette.rim);
    rimMaterials.cal.uniforms.uColor.value.copy(palette.rim);
  });

	  return (
	    <AutoFitScene maxRadius={MAX_RADIUS} fillFactor={FILL_FACTOR}>
	      <>
		        {/* ── B) 3-point lighting (ReflectorPlanes language) ── */}
		        <ambientLight intensity={0.25} />
		        <directionalLight position={[2, 3, 2]} intensity={1.2} />
		        {/* Key: soft, above-left */}
		        <pointLight position={T_LIGHT_KEY_POS}  intensity={T_LIGHT_KEY_INT}  color="#ffffff" />
		        {/* Fill: dim, opposite side, warm tint */}
		        <pointLight position={T_LIGHT_FILL_POS} intensity={T_LIGHT_FILL_INT} color="#ffe8d6" />
		        {/* Rim/back: accent-tinted edge catch — color updated per frame */}
		        <pointLight ref={rimLightRef} position={T_LIGHT_RIM_POS} intensity={T_LIGHT_RIM_INT} />
		        {/* Phase 3C — localized shaping light: grazing gradient over bezel/ticks */}
		        <spotLight
		          position={[-2, 2.2, 1.5]}
		          intensity={0.3}
		          angle={0.45}
		          penumbra={0.7}
		          distance={3}
		          color={accentTint}
		        />

	        {/* ── track ring ── */}
	        <mesh position={[0, 0, TRACK_Z]} geometry={geometries.track}>
	          <meshStandardMaterial
	            color={palette.track}
            emissive={palette.track}
            emissiveIntensity={0.02}
            metalness={0.14}
            roughness={0.9}
            toneMapped={false}
          />
        </mesh>

	        {/* ── A) Bezel torus — "glowing torus" style: polished metal + accent emissive ── */}
	        {/* High metalness + low roughness = crisp specular band from key light.          */}
	        {/* emissive=rim (accent-true) feeds bloom for the glow ring read.               */}
		        <mesh geometry={geometries.bezel}>
		          <meshPhysicalMaterial
		            ref={bezelMatRef}
		            color={accentShade}
		            emissive={accentTint}
		            emissiveIntensity={0}
		            metalness={1}
		            roughness={0.07}
		            clearcoat={0.4}
		            clearcoatRoughness={0.1}
		            sheen={0.15}
		            sheenColor={accentTint}
		            sheenRoughness={0.6}
		          />
		        </mesh>
	        {/* Additive fresnel rim over bezel (A: specular highlight band) */}
	        <mesh geometry={geometries.bezelRim} material={rimMaterials.bezel} />

	        {/* Phase 3C — inner etched reticle (very low contrast, no emission) */}
	        <mesh position={[0, 0, TRACK_Z - 0.002]}>
	          <torusGeometry args={[0.955, 0.0016, 10, 192]} />
	          <meshBasicMaterial
	            color={accentShade}
	            transparent
	            opacity={0.1}
	            toneMapped={false}
	            depthWrite={false}
	          />
	        </mesh>

	        {/* Phase 3C — head-coupled glint (tiny highlight riding the bezel) */}
	        <mesh ref={glintRef} position={[0, 0, 0.02]} rotation={[0, 0, 0]}>
	          <boxGeometry args={[0.055, 0.015, 0.002]} />
	          <meshBasicMaterial
	            ref={glintMatRef}
	            color={accentTint}
	            transparent
	            opacity={0}
	            toneMapped={false}
	            depthWrite={false}
	          />
	        </mesh>

	        {/* ── A) Cal ring — upgraded emissive + polished clearcoat ── */}
	        <mesh position={[0, 0, CAL_Z]} geometry={geometries.cal}>
	          <meshPhysicalMaterial
	            ref={calMatRef}
            color={palette.calBase}
            emissive={palette.calEmissive}
            emissiveIntensity={T_CAL_EMI_INTENSITY}
            metalness={0.58}
            roughness={0.22}
            clearcoat={0.72}
            clearcoatRoughness={0.18}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, CAL_Z + 0.0005]} geometry={geometries.calRim} material={rimMaterials.cal} />

          {/* ── index tick ── */}
          <mesh position={[0, (RING_RADIUS + CAL_RING_RADIUS) * 0.5, SEG_Z + 0.008]} geometry={geometries.index}>
            <meshPhysicalMaterial
              color={palette.index}
              emissive={palette.index}
              emissiveIntensity={0.08}
              metalness={0.24}
              roughness={0.42}
              clearcoat={0.3}
              clearcoatRoughness={0.4}
              toneMapped={false}
            />
          </mesh>

          {/* ── segments ── */}
          {segments.map((seg, i) => (
            <group key={i} position={[seg.px, seg.py, 0]} rotation={[0, 0, seg.rz]}>
              <mesh position={[0, 0, SEG_Z]} geometry={geometries.segment}>
                <meshStandardMaterial
                  ref={(el) => { if (el) segMainMatsRef.current[i] = el; }}
                  color={accentShade}
                  emissive={accentTint}
                  emissiveIntensity={EMI_OFF}
                  metalness={0}
                  roughness={OFF_ROUGHNESS}
                  toneMapped={false}
                />
              </mesh>

              <mesh
                ref={(el) => { if (el) segCoreMeshesRef.current[i] = el; }}
                visible={false}
                position={[0, 0, SEG_Z + CORE_Z_OFFSET]}
                geometry={geometries.segmentCore}
              >
                <meshStandardMaterial
                  ref={(el) => { if (el) segCoreMatsRef.current[i] = el; }}
                  color={accentShade}
                  emissive={accentTint}
                  emissiveIntensity={INNER_EMI}
                  transparent
                  opacity={0.9}
                  metalness={0}
                  roughness={0.5}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}

          {/* ── B) Ghost reflection suggestion ── */}
          {/* A second additive ring below the bezel, squashed on Z, gives the    */}
          {/* impression the ring casts light downward — cheap fake Reflector.    */}
          {T_GHOST_OPACITY > 0 && (
            <group position={[0, T_GHOST_Y, -0.06]} scale={[0.96, 1, 0.22]}>
              <mesh geometry={geometries.bezel}>
                <meshBasicMaterial
                  color={palette.rim}
                  transparent
                  opacity={T_GHOST_OPACITY}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh geometry={geometries.cal}>
                <meshBasicMaterial
                  color={palette.rim}
                  transparent
                  opacity={T_GHOST_OPACITY * 0.5}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}

        {/* ── C) GodRays sun emitter ── */}
        {/* Tiny accent-bright sphere just above the bezel top.                 */}
        {/* GodRays projects from its screen-space position → subtle downward   */}
        {/* rays crossing the ring (cinematic, not flashlight).                 */}
        <mesh ref={sunRef} position={[0, BEZEL_RADIUS + 0.15, 0.08]}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshBasicMaterial color={palette.sun} toneMapped={false} />
        </mesh>
      </>

    </AutoFitScene>
  );
});

// D) Drives tight bloom intensity via breath phase
const BloomIntensityDriver = memo(function BloomIntensityDriver({ bloomRef, breathDriverRef }) {
  const breathStateRef = useRef(createBreathState());

  useFrame(() => {
    if (!bloomRef.current) return;
    writeBreathState(breathStateRef.current, breathDriverRef.current);
    bloomRef.current.intensity = T_BLOOM_TIGHT_BASE + breathStateRef.current.holdPulse * T_BLOOM_TIGHT_HOLD_BOOST;
  });

  return null;
});

// C) Gates GodRays exposure — slightly stronger on holds, softer during flow
const GodRaysDriver = memo(function GodRaysDriver({ godRaysRef, breathDriverRef }) {
  const breathStateRef = useRef(createBreathState());

  useFrame(() => {
    const effect = godRaysRef.current;
    if (!effect) return;
    writeBreathState(breathStateRef.current, breathDriverRef.current);
    const { phase, holdPulse } = breathStateRef.current;
    const holdBoost = phase === 'hold'
      ? holdPulse * (T_GODRAY_EXPOSURE_HOLD - T_GODRAY_EXPOSURE_BASE)
      : 0;
    const baseExposure = T_DEV_GODRAY_BOOST ? T_GODRAY_EXPOSURE_HOLD * 2.0 : T_GODRAY_EXPOSURE_BASE;
    effect.exposure = baseExposure + holdBoost;
  });

  return null;
});

export function TechInstrumentSceneContent({ accentColor, breathDriver }) {
  const breathDriverRef = useRef(breathDriver);
  const tightBloomRef   = useRef(null);
  const godRaysRef      = useRef(null);
  // sunRef is passed into TechInstrumentScene so the sun mesh lives inside
  // AutoFitScene (scales with ring) while GodRays here can reference it.
  const sunRef          = useRef(null);
  const composerEnabled = BLOOM_ENABLED;

  useEffect(() => {
    breathDriverRef.current = breathDriver;
  }, [breathDriver]);

  return (
    <>
      <TechInstrumentScene
        accentColor={accentColor}
        breathDriverRef={breathDriverRef}
        sunRef={sunRef}
      />
      {composerEnabled && (
        <>
          <BloomIntensityDriver bloomRef={tightBloomRef}  breathDriverRef={breathDriverRef} />
          <GodRaysDriver        godRaysRef={godRaysRef}   breathDriverRef={breathDriverRef} />
          <EffectComposer
            key="tech-instrument-composer"
            multisampling={0}
            resolutionScale={T_COMPOSER_RESOLUTION_SCALE}
          >
            {/* C) GodRays — conservative atmospheric rays from ring top     */}
            {/* Order: before bloom so rays are themselves bloomed.           */}
            <GodRays
              ref={godRaysRef}
              sun={sunRef}
              blendFunction={BlendFunction.SCREEN}
              samples={T_GODRAY_SAMPLES}
              density={T_GODRAY_DENSITY}
              decay={T_GODRAY_DECAY}
              weight={T_GODRAY_WEIGHT}
              exposure={T_GODRAY_EXPOSURE_BASE}
              clampMax={1}
              kernelSize={KernelSize.SMALL}
              blur
            />
            {/* D) Tight bloom: rim glow + emissive highlights               */}
            <Bloom
              ref={tightBloomRef}
              threshold={T_BLOOM_TIGHT_THRESHOLD}
              intensity={T_BLOOM_TIGHT_BASE}
              radius={T_BLOOM_TIGHT_RADIUS}
              mipmapBlur
            />
            {/* D) Wide bloom: low-intensity atmospheric wrap                 */}
            <Bloom
              threshold={T_BLOOM_WIDE_THRESHOLD}
              intensity={T_BLOOM_WIDE_INTENSITY}
              radius={T_BLOOM_WIDE_RADIUS}
              mipmapBlur
            />
          </EffectComposer>
        </>
      )}
    </>
  );
}

export default function TechInstrumentRND({ accentColor, breathDriver, className, style }) {
  const contextWarnedRef    = useRef(false);
  const contextListenersRef = useRef(null);
  const composerEnabled     = BLOOM_ENABLED;

  useEffect(() => () => {
    const listeners = contextListenersRef.current;
    if (!listeners) return;
    listeners.canvas.removeEventListener('webglcontextlost',     listeners.onLost);
    listeners.canvas.removeEventListener('webglcontextrestored', listeners.onRestored);
    contextListenersRef.current = null;
  }, []);

  return (
    <>
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      dpr={[1, T_MAX_RENDER_DPR]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, T_MAX_RENDER_DPR));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        const size = gl.getSize(TMP_SIZE);
        console.info(
          `[TechInstrumentRND] mount dpr=${gl.getPixelRatio().toFixed(2)} size=${size.x}x${size.y} composer=${composerEnabled}`,
        );

        const onLost = (event) => {
          event.preventDefault();
          if (contextWarnedRef.current) return;
          contextWarnedRef.current = true;
          const lostSize = gl.getSize(TMP_SIZE);
          console.warn(
            `[TechInstrumentRND] webglcontextlost preset=${PRESET_NAME} dpr=${gl.getPixelRatio().toFixed(2)} size=${lostSize.x}x${lostSize.y} bloom=${composerEnabled}`,
          );
        };
        const onRestored = () => {
          contextWarnedRef.current = false;
          const restoredSize = gl.getSize(TMP_SIZE);
          console.info(
            `[TechInstrumentRND] webglcontextrestored preset=${PRESET_NAME} dpr=${gl.getPixelRatio().toFixed(2)} size=${restoredSize.x}x${restoredSize.y} bloom=${composerEnabled}`,
          );
        };

        gl.domElement.addEventListener('webglcontextlost',     onLost,      false);
        gl.domElement.addEventListener('webglcontextrestored', onRestored,  false);
        contextListenersRef.current = { canvas: gl.domElement, onLost, onRestored };
      }}
    >
      <TechInstrumentSceneContent accentColor={accentColor} breathDriver={breathDriver} />
    </Canvas>
    </>
  );
}
