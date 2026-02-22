import { memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { DISABLE_POSTPROCESS } from '../../config/renderProbeFlags.js';

const DEFAULT_ACCENT = '#22d3ee';
const PRESET_NAME = 'instrument';

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

const PLATE_INNER_R = 0.74;
const PLATE_OUTER_R = 1.14;
const PLATE_Z = -0.02;

const BEZEL_RADIUS = 1.072;
const BEZEL_TUBE = 0.02;

const CAL_RING_RADIUS = 0.892;
const CAL_RING_TUBE = 0.008;
const CAL_Z = -0.002;

const MAX_RADIUS = 1.16;
const FILL_FACTOR = 0.86;
const DEBUG_STATIC_PROGRESS = null; // set to 0.35 for static ON/OFF screenshot checks

const EMI_OFF = 0.008;
const EMI_ON = 0.95;
const EMI_HEAD = EMI_ON * 1.35;
const INNER_EMI = 0.85;
const INNER_HEAD_EMI = 0.95;
const CAL_EMI = 0.08;
const HOLD_PULSE_MULT = 0.15;

const OFF_ROUGHNESS = 0.68;
const ON_ROUGHNESS = 0.28;
const OFF_CLEARCOAT = 0.22;
const ON_CLEARCOAT = 0.72;
const OFF_CLEARCOAT_ROUGHNESS = 0.58;
const ON_CLEARCOAT_ROUGHNESS = 0.2;

const BLOOM_THRESHOLD = 0.55;
const BLOOM_BASE = 0.95;
const BLOOM_HOLD_BOOST = 0.1;
const BLOOM_RADIUS = 0.32;
const BLOOM_ENABLED = true;
const COMPOSER_RESOLUTION_SCALE = 0.65;
const MAX_RENDER_DPR = 1.5;

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
    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0), uPower);
    float rim = fresnel * uIntensity;
    gl_FragColor = vec4(uColor * rim, rim);
  }
`;

const TMP_SIZE = new THREE.Vector2();

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function derivePalette(accentColor) {
  const accent = new THREE.Color(accentColor || DEFAULT_ACCENT);
  const black = new THREE.Color('#000000');
  const white = new THREE.Color('#ffffff');

  return {
    segOff: accent.clone().lerp(black, 0.94),
    segOnBase: accent.clone().lerp(white, 0.24),
    segOnEmissive: accent.clone().lerp(white, 0.6),
    segCoreEmissive: accent.clone().lerp(white, 0.12),
    track: accent.clone().lerp(black, 0.9),
    plate: accent.clone().lerp(black, 0.93),
    bezel: accent.clone().lerp(black, 0.88),
    calBase: accent.clone().lerp(black, 0.83),
    calEmissive: accent.clone().lerp(white, 0.14),
    rim: accent.clone().lerp(white, 0.26),
    index: accent.clone().lerp(white, 0.4),
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

const TechInstrumentScene = memo(function TechInstrumentScene({ accentColor, breathDriverRef }) {
  const segMainMatsRef = useRef([]);
  const segCoreMatsRef = useRef([]);
  const segCoreMeshesRef = useRef([]);
  const calMatRef = useRef(null);
  const breathStateRef = useRef(createBreathState());

  const palette = useMemo(() => derivePalette(accentColor), [accentColor]);

  const geometries = useMemo(() => ({
    plate: new THREE.RingGeometry(PLATE_INNER_R, PLATE_OUTER_R, 96),
    track: new THREE.RingGeometry(TRACK_INNER_R, TRACK_OUTER_R, 128),
    bezel: new THREE.TorusGeometry(BEZEL_RADIUS, BEZEL_TUBE, 20, 256),
    bezelRim: new THREE.TorusGeometry(BEZEL_RADIUS, BEZEL_TUBE + 0.002, 20, 256),
    cal: new THREE.TorusGeometry(CAL_RING_RADIUS, CAL_RING_TUBE, 16, 256),
    calRim: new THREE.TorusGeometry(CAL_RING_RADIUS, CAL_RING_TUBE + 0.0015, 16, 256),
    index: new THREE.BoxGeometry(0.012, 0.038, SEG_DEPTH * 0.58),
    segment: new THREE.BoxGeometry(SEG_WIDTH, SEG_HEIGHT, SEG_DEPTH),
    segmentCore: new THREE.BoxGeometry(SEG_WIDTH * CORE_SCALE, SEG_HEIGHT * CORE_SCALE, SEG_DEPTH * 0.42),
  }), []);

  const rimMaterials = useMemo(() => ({
    bezel: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      vertexShader: rimVert,
      fragmentShader: rimFrag,
      uniforms: {
        uColor: { value: new THREE.Color(DEFAULT_ACCENT) },
        uPower: { value: 2.6 },
        uIntensity: { value: 0.11 },
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
        uColor: { value: new THREE.Color(DEFAULT_ACCENT) },
        uPower: { value: 2.9 },
        uIntensity: { value: 0.08 },
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
    const holdMultiplier = state.phase === 'hold' ? 1 + HOLD_PULSE_MULT * state.holdPulse : 1;

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const isOn = i < state.activeCount;
      const isHead = i === state.headIndex;

      const mainMat = segMainMatsRef.current[i];
      if (mainMat) {
        mainMat.color.copy(isOn ? palette.segOnBase : palette.segOff);
        mainMat.emissive.copy(isOn ? palette.segOnEmissive : palette.segOff);
        mainMat.emissiveIntensity = isOn
          ? (isHead ? EMI_HEAD : EMI_ON) * holdMultiplier
          : EMI_OFF;
        mainMat.roughness = isOn ? ON_ROUGHNESS : OFF_ROUGHNESS;
        mainMat.clearcoat = isOn ? ON_CLEARCOAT : OFF_CLEARCOAT;
        mainMat.clearcoatRoughness = isOn ? ON_CLEARCOAT_ROUGHNESS : OFF_CLEARCOAT_ROUGHNESS;
      }

      const coreMesh = segCoreMeshesRef.current[i];
      if (coreMesh) coreMesh.visible = isOn;

      const coreMat = segCoreMatsRef.current[i];
      if (coreMat && isOn) {
        coreMat.color.copy(palette.segOnBase);
        coreMat.emissive.copy(palette.segCoreEmissive);
        coreMat.emissiveIntensity = (isHead ? INNER_HEAD_EMI : INNER_EMI) * holdMultiplier;
      }
    }

    if (calMatRef.current) {
      calMatRef.current.color.copy(palette.calBase);
      calMatRef.current.emissive.copy(palette.calEmissive);
      calMatRef.current.emissiveIntensity = CAL_EMI;
    }

    rimMaterials.bezel.uniforms.uColor.value.copy(palette.rim);
    rimMaterials.cal.uniforms.uColor.value.copy(palette.rim);
  });

  return (
    <AutoFitScene maxRadius={MAX_RADIUS} fillFactor={FILL_FACTOR}>
      <ambientLight intensity={0.04} />
      <directionalLight position={[2, 3, 4]} intensity={0.16} />

      <mesh position={[0, 0, PLATE_Z]} geometry={geometries.plate}>
        <meshStandardMaterial
          color={palette.plate}
          metalness={0.08}
          roughness={0.92}
          transparent
          opacity={0.74}
          emissive={palette.plate}
          emissiveIntensity={0.01}
          toneMapped={false}
        />
      </mesh>

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

      <mesh geometry={geometries.bezel}>
        <meshStandardMaterial
          color={palette.bezel}
          emissive={palette.bezel}
          emissiveIntensity={0.01}
          metalness={0.28}
          roughness={0.8}
          toneMapped={false}
        />
      </mesh>

      <mesh geometry={geometries.bezelRim} material={rimMaterials.bezel} />

      <mesh position={[0, 0, CAL_Z]} geometry={geometries.cal}>
        <meshPhysicalMaterial
          ref={calMatRef}
          color={palette.calBase}
          emissive={palette.calEmissive}
          emissiveIntensity={CAL_EMI}
          metalness={0.22}
          roughness={0.48}
          clearcoat={0.38}
          clearcoatRoughness={0.5}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0, CAL_Z + 0.0005]} geometry={geometries.calRim} material={rimMaterials.cal} />

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

      {segments.map((seg, i) => (
        <group key={i} position={[seg.px, seg.py, 0]} rotation={[0, 0, seg.rz]}>
          <mesh position={[0, 0, SEG_Z]} geometry={geometries.segment}>
            <meshPhysicalMaterial
              ref={(el) => {
                if (el) segMainMatsRef.current[i] = el;
              }}
              color={palette.segOff}
              emissive={palette.segOff}
              emissiveIntensity={EMI_OFF}
              metalness={0.2}
              roughness={OFF_ROUGHNESS}
              clearcoat={OFF_CLEARCOAT}
              clearcoatRoughness={OFF_CLEARCOAT_ROUGHNESS}
              toneMapped={false}
            />
          </mesh>

          <mesh
            ref={(el) => {
              if (el) segCoreMeshesRef.current[i] = el;
            }}
            visible={false}
            position={[0, 0, SEG_Z + CORE_Z_OFFSET]}
            geometry={geometries.segmentCore}
          >
            <meshPhysicalMaterial
              ref={(el) => {
                if (el) segCoreMatsRef.current[i] = el;
              }}
              color={palette.segOnBase}
              emissive={palette.segCoreEmissive}
              emissiveIntensity={INNER_EMI}
              transparent
              opacity={0.9}
              metalness={0.12}
              roughness={0.26}
              clearcoat={0.62}
              clearcoatRoughness={0.22}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </AutoFitScene>
  );
});

const BloomIntensityDriver = memo(function BloomIntensityDriver({ bloomRef, breathDriverRef }) {
  const breathStateRef = useRef(createBreathState());

  useFrame(() => {
    if (!bloomRef.current) return;
    writeBreathState(breathStateRef.current, breathDriverRef.current);
    bloomRef.current.intensity = BLOOM_BASE + breathStateRef.current.holdPulse * BLOOM_HOLD_BOOST;
  });

  return null;
});

export default function TechInstrumentRND({ accentColor, breathDriver, className, style }) {
  const breathDriverRef = useRef(breathDriver);
  const bloomRef = useRef(null);
  const contextWarnedRef = useRef(false);
  const contextListenersRef = useRef(null);
  const composerEnabled = BLOOM_ENABLED && !DISABLE_POSTPROCESS;

  const bloomProps = useMemo(
    () => ({
      threshold: BLOOM_THRESHOLD,
      radius: BLOOM_RADIUS,
      mipmapBlur: true,
    }),
    [],
  );

  useEffect(() => {
    breathDriverRef.current = breathDriver;
  }, [breathDriver]);

  useEffect(() => () => {
    const listeners = contextListenersRef.current;
    if (!listeners) return;
    listeners.canvas.removeEventListener('webglcontextlost', listeners.onLost);
    listeners.canvas.removeEventListener('webglcontextrestored', listeners.onRestored);
    contextListenersRef.current = null;
  }, []);

  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      dpr={[1, MAX_RENDER_DPR]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, MAX_RENDER_DPR));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        if (typeof window !== 'undefined' && typeof window.__PROBE6_REGISTER_GL__ === 'function') {
          window.__PROBE6_REGISTER_GL__({
            gl,
            canvas: gl.domElement,
            source: 'TechInstrumentRND',
          });
        }

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

        gl.domElement.addEventListener('webglcontextlost', onLost, false);
        gl.domElement.addEventListener('webglcontextrestored', onRestored, false);
        contextListenersRef.current = { canvas: gl.domElement, onLost, onRestored };
      }}
    >
      <TechInstrumentScene accentColor={accentColor} breathDriverRef={breathDriverRef} />
      {composerEnabled && (
        <>
          <BloomIntensityDriver bloomRef={bloomRef} breathDriverRef={breathDriverRef} />
          <EffectComposer
            key="tech-instrument-composer"
            enabled={composerEnabled}
            multisampling={0}
            resolutionScale={COMPOSER_RESOLUTION_SCALE}
          >
            <Bloom
              ref={bloomRef}
              threshold={bloomProps.threshold}
              intensity={BLOOM_BASE}
              radius={bloomProps.radius}
              mipmapBlur={bloomProps.mipmapBlur}
            />
          </EffectComposer>
        </>
      )}
    </Canvas>
  );
}
