import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const DEFAULT_ACCENT = '#22d3ee';

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

const EMI_OFF = 0.005;
const EMI_ON = 0.85;
const EMI_HEAD = EMI_ON * 1.35;
const INNER_EMI = EMI_ON * 0.9;
const INNER_HEAD_EMI = EMI_HEAD * 0.9;
const CAL_EMI = 0.08;
const HOLD_PULSE_MULT = 0.09;

const BLOOM_THRESHOLD = 0.65;
const BLOOM_BASE = 0.9;
const BLOOM_HOLD_BOOST = 0.06;
const BLOOM_RADIUS = 0.3;

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

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function derivePalette(accentColor) {
  const accent = new THREE.Color(accentColor || DEFAULT_ACCENT);
  const black = new THREE.Color('#000000');
  const white = new THREE.Color('#ffffff');

  return {
    segOff: accent.clone().lerp(black, 0.9),
    segOnBase: accent.clone().lerp(white, 0.2),
    segOnEmissive: accent.clone().lerp(white, 0.34),
    segCoreEmissive: accent.clone().lerp(white, 0.42),
    track: accent.clone().lerp(black, 0.9),
    plate: accent.clone().lerp(black, 0.93),
    bezel: accent.clone().lerp(black, 0.88),
    calBase: accent.clone().lerp(black, 0.83),
    calEmissive: accent.clone().lerp(white, 0.14),
    rim: accent.clone().lerp(white, 0.26),
    index: accent.clone().lerp(white, 0.4),
  };
}

function resolveBreathState(breathDriver) {
  const phase = breathDriver?.phase ?? 'holdBottom';
  const p = clamp01(breathDriver?.phaseProgress01 ?? 0);

  if (phase === 'inhale') {
    const activeCount = Math.floor(p * SEGMENT_COUNT);
    return {
      phase: 'inhale',
      inhaleP: p,
      holdP: 0,
      exhaleP: 0,
      holdPulse: 0,
      activeCount,
      headIndex: activeCount > 0 ? activeCount - 1 : -1,
    };
  }

  if (phase === 'holdTop') {
    return {
      phase: 'hold',
      inhaleP: 1,
      holdP: p,
      exhaleP: 0,
      holdPulse: Math.sin(p * Math.PI),
      activeCount: SEGMENT_COUNT,
      headIndex: -1,
    };
  }

  if (phase === 'exhale') {
    const activeCount = Math.floor((1 - p) * SEGMENT_COUNT);
    return {
      phase: 'exhale',
      inhaleP: 0,
      holdP: 0,
      exhaleP: p,
      holdPulse: 0,
      activeCount,
      headIndex: -1,
    };
  }

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

function TechInstrumentScene({ accentColor, breathDriver }) {
  const segMainMatsRef = useRef([]);
  const segCoreMatsRef = useRef([]);
  const segCoreMeshesRef = useRef([]);
  const calMatRef = useRef(null);
  const bezelRimRef = useRef(null);
  const calRimRef = useRef(null);

  const palette = useMemo(() => derivePalette(accentColor), [accentColor]);

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

  useFrame(() => {
    const state = resolveBreathState(breathDriver);
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
        mainMat.roughness = isOn ? 0.36 : 0.62;
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

    if (bezelRimRef.current) {
      bezelRimRef.current.uniforms.uColor.value.copy(palette.rim);
    }

    if (calRimRef.current) {
      calRimRef.current.uniforms.uColor.value.copy(palette.rim);
    }
  });

  return (
    <AutoFitScene maxRadius={MAX_RADIUS} fillFactor={FILL_FACTOR}>
      <ambientLight intensity={0.04} />
      <directionalLight position={[2, 3, 4]} intensity={0.16} />

      <mesh position={[0, 0, PLATE_Z]}>
        <ringGeometry args={[PLATE_INNER_R, PLATE_OUTER_R, 96]} />
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

      <mesh position={[0, 0, TRACK_Z]}>
        <ringGeometry args={[TRACK_INNER_R, TRACK_OUTER_R, 128]} />
        <meshStandardMaterial
          color={palette.track}
          emissive={palette.track}
          emissiveIntensity={0.02}
          metalness={0.14}
          roughness={0.9}
          toneMapped={false}
        />
      </mesh>

      <mesh>
        <torusGeometry args={[BEZEL_RADIUS, BEZEL_TUBE, 20, 256]} />
        <meshStandardMaterial
          color={palette.bezel}
          emissive={palette.bezel}
          emissiveIntensity={0.01}
          metalness={0.28}
          roughness={0.8}
          toneMapped={false}
        />
      </mesh>

      <mesh>
        <torusGeometry args={[BEZEL_RADIUS, BEZEL_TUBE + 0.002, 20, 256]} />
        <shaderMaterial
          ref={bezelRimRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          vertexShader={rimVert}
          fragmentShader={rimFrag}
          uniforms={{
            uColor: { value: palette.rim.clone() },
            uPower: { value: 2.6 },
            uIntensity: { value: 0.11 },
          }}
        />
      </mesh>

      <mesh position={[0, 0, CAL_Z]}>
        <torusGeometry args={[CAL_RING_RADIUS, CAL_RING_TUBE, 16, 256]} />
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

      <mesh position={[0, 0, CAL_Z + 0.0005]}>
        <torusGeometry args={[CAL_RING_RADIUS, CAL_RING_TUBE + 0.0015, 16, 256]} />
        <shaderMaterial
          ref={calRimRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          vertexShader={rimVert}
          fragmentShader={rimFrag}
          uniforms={{
            uColor: { value: palette.rim.clone() },
            uPower: { value: 2.9 },
            uIntensity: { value: 0.08 },
          }}
        />
      </mesh>

      <mesh position={[0, (RING_RADIUS + CAL_RING_RADIUS) * 0.5, SEG_Z + 0.008]}>
        <boxGeometry args={[0.012, 0.038, SEG_DEPTH * 0.58]} />
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
          <mesh position={[0, 0, SEG_Z]}>
            <boxGeometry args={[SEG_WIDTH, SEG_HEIGHT, SEG_DEPTH]} />
            <meshPhysicalMaterial
              ref={el => {
                if (el) segMainMatsRef.current[i] = el;
              }}
              color={palette.segOff}
              emissive={palette.segOff}
              emissiveIntensity={EMI_OFF}
              metalness={0.2}
              roughness={0.62}
              clearcoat={0.56}
              clearcoatRoughness={0.28}
              toneMapped={false}
            />
          </mesh>

          <mesh
            ref={el => {
              if (el) segCoreMeshesRef.current[i] = el;
            }}
            visible={false}
            position={[0, 0, SEG_Z + CORE_Z_OFFSET]}
          >
            <boxGeometry
              args={[SEG_WIDTH * CORE_SCALE, SEG_HEIGHT * CORE_SCALE, SEG_DEPTH * 0.42]}
            />
            <meshPhysicalMaterial
              ref={el => {
                if (el) segCoreMatsRef.current[i] = el;
              }}
              color={palette.segOnBase}
              emissive={palette.segCoreEmissive}
              emissiveIntensity={INNER_EMI}
              transparent
              opacity={0.85}
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
}

export default function TechInstrumentRND({ accentColor, breathDriver, className, style }) {
  const state = resolveBreathState(breathDriver);
  const bloomIntensity = BLOOM_BASE + state.holdPulse * BLOOM_HOLD_BOOST;

  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      dpr={[1, 2]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <TechInstrumentScene accentColor={accentColor} breathDriver={breathDriver} />
      <EffectComposer>
        <Bloom
          threshold={BLOOM_THRESHOLD}
          intensity={bloomIntensity}
          radius={BLOOM_RADIUS}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
