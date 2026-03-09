// src/components/BreathingRing.jsx
// BREATHING VISUALIZATION RING
// - Scales smoothly to match exact breath pattern timing
// - Echo effect + sound on inhale peak and exhale bottom
// - User locks eyes on ring to feel the rhythm
// - CLICKABLE: tapping calculates accuracy error and passes to onTap callback
// - PATH FX: path-specific particle effects sync with breath

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useId } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EnsoStroke } from "./EnsoStroke";
import { useBreathSoundEngine } from '../hooks/useBreathSoundEngine.js';
import { BloomRingSceneContent } from './bloomRing/BloomRingRenderer.jsx';
import { TechInstrumentSceneContent } from './bloomRing/TechInstrumentRND.jsx';
import { PolygonBreathSceneContent } from './bloomRing/PolygonBreathScene.jsx';
import { RainbowPresetCanvas } from './rainbowPreset/RainbowPresetCanvas.jsx';
import ParticleCountdownPreset from './countdown/ParticleCountdownPreset.jsx';
import { PRODUCTION_RING_DEFAULTS } from './bloomRing/bloomRingProductionDefaults.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { BREATH_RING_PRESETS } from './breathingRingPresets.js';

const BREATH_RING_MAX_DPR = 1.5;
const RING_MODE_CYCLE = BREATH_RING_PRESETS.map((preset) => preset.id);

function normalizeRingMode(mode) {
  if (mode === 'countdown') return 'orb';
  if (mode === 'baseline' || mode === 'base') return 'bracelet';
  return RING_MODE_CYCLE.includes(mode) ? mode : null;
}

function isRingFrameActive(practiceActive = true) {
  return practiceActive;
}

function getHybridOverlayZoom(size) {
  return Math.max(1, Math.min(size?.width || 0, size?.height || 0) / 2);
}

const scheduleBreathingRingUpdate = (callback) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }
  Promise.resolve().then(callback);
};

function RingSceneRouter({
  rndRingMode,
  productionParams,
  liveAccentColor,
  breathDriver,
  isFrameActive = true,
  displayNumber,
  presetVariant = 'other',
  activePresetRaw = '',
  activePresetLabel = '',
  normalizedPresetNumber = null,
}) {
  if (!isFrameActive) return null;

  if (rndRingMode === 'instrument') {
    return (
      <TechInstrumentSceneContent
        accentColor={liveAccentColor}
        breathDriver={breathDriver}
      />
    );
  }

  if (rndRingMode === 'polygon') {
    return (
      <PolygonBreathSceneContent
        accentColor={liveAccentColor}
        breathDriver={breathDriver}
        displayNumber={displayNumber}
      />
    );
  }

  if (rndRingMode === 'rainbow') {
    return null;
  }

  return (
    <BloomRingSceneContent
      params={productionParams}
      accentColor={liveAccentColor}
      mode="production"
      presetVariant={presetVariant}
      activePresetRaw={activePresetRaw}
      activePresetLabel={activePresetLabel}
      normalizedPresetNumber={normalizedPresetNumber}
      isFrameActive={isFrameActive}
    />
  );
}

function HybridInstrumentTickOverlayScene({ accentColor, breathDriver }) {
  const SEGMENT_COUNT = 48;
  const SEG_W = 0.038, SEG_H = 0.075, SEG_D = 0.006;
  const R = 0.90, Z = 0.06;
  const HYBRID_TICK_SCALE = 1.0;
  const LABEL_WINDOW_HALF_SPAN_DEG = 26;
  const baseMeshRef = useRef(null);
  const glowMeshRef = useRef(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(SEG_W, SEG_H, SEG_D), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tickColor = useMemo(() => new THREE.Color(), []);
  const darkBaseColor = useMemo(
    () => new THREE.Color(accentColor).lerp(new THREE.Color("#000"), 0.92),
    [accentColor]
  );
  const litBaseColor = useMemo(
    () => new THREE.Color(accentColor).lerp(new THREE.Color("#fff"), 0.42),
    [accentColor]
  );
  const gapHalfSpanRad = useMemo(
    () => (LABEL_WINDOW_HALF_SPAN_DEG * Math.PI) / 180,
    []
  );
  const visibleTickMeta = useMemo(() => {
    const sixOClock = -Math.PI / 2;
    const rankByIndex = new Array(SEGMENT_COUNT).fill(-1);
    const visibleIndices = [];

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const angle = Math.PI / 2 - (i / SEGMENT_COUNT) * Math.PI * 2;
      const d = Math.atan2(Math.sin(angle - sixOClock), Math.cos(angle - sixOClock));
      const inGap = Math.abs(d) <= gapHalfSpanRad;
      if (!inGap) {
        rankByIndex[i] = visibleIndices.length;
        visibleIndices.push(i);
      }
    }

    return {
      rankByIndex,
      visibleCount: visibleIndices.length,
    };
  }, [gapHalfSpanRad]);

  useEffect(() => {
    const baseMesh = baseMeshRef.current;
    const glowMesh = glowMeshRef.current;
    if (!baseMesh || !glowMesh) return;

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const angle = Math.PI / 2 - (i / SEGMENT_COUNT) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * R, Math.sin(angle) * R, Z);
      dummy.rotation.set(0, 0, angle - Math.PI / 2);
      if (visibleTickMeta.rankByIndex[i] === -1) {
        dummy.scale.set(0.001, 0.001, 0.001);
      } else {
        dummy.scale.set(1, 1, 1);
      }
      dummy.updateMatrix();
      baseMesh.setMatrixAt(i, dummy.matrix);
      glowMesh.setMatrixAt(i, dummy.matrix);
      glowMesh.setColorAt(i, new THREE.Color("#000"));
    }
    baseMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceColor.needsUpdate = true;
    baseMesh.frustumCulled = false;
    glowMesh.frustumCulled = false;
  }, [dummy, visibleTickMeta.rankByIndex]);

  useFrame(() => {
    const mesh = glowMeshRef.current;
    if (!mesh) return;
    const smoothstep = (edge0, edge1, x) => {
      const span = edge1 - edge0;
      if (span <= 0) return x >= edge1 ? 1 : 0;
      const t = Math.max(0, Math.min(1, (x - edge0) / span));
      return t * t * (3 - 2 * t);
    };

    const phase = breathDriver?.phase;
    const phaseProgress01 = Math.max(0, Math.min(1, breathDriver?.phaseProgress01 ?? 0));
    let p = phaseProgress01;
    if (phase === "exhale") p = 1 - phaseProgress01;
    if (phase === "holdTop") p = 1;
    if (phase === "holdBottom") p = 0;

    const w = 0.05;
    const sigma = 0.065;
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const rank = visibleTickMeta.rankByIndex[i];
      if (rank < 0) {
        mesh.setColorAt(i, tickColor.setRGB(0, 0, 0));
        continue;
      }

      const t = (rank + 0.5) / visibleTickMeta.visibleCount;
      const fill = smoothstep(t - w, t + w, p);
      const d = Math.min(Math.abs(t - p), 1 - Math.abs(t - p));
      const head = Math.exp(-(d * d) / (2 * sigma * sigma));
      const intensity = Math.max(0, Math.min(1.5, fill * 0.75 + head * 0.95));

      tickColor.copy(litBaseColor).multiplyScalar(intensity);
      mesh.setColorAt(i, tickColor);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group scale={[HYBRID_TICK_SCALE, HYBRID_TICK_SCALE, 1]}>
      <instancedMesh ref={baseMeshRef} args={[geometry, null, SEGMENT_COUNT]} frustumCulled={false}>
        <meshBasicMaterial
          transparent
          opacity={0.22}
          color={darkBaseColor}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={glowMeshRef} args={[geometry, null, SEGMENT_COUNT]} frustumCulled={false}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.92}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function PersistentBreathRingCanvas({
  rndRingMode,
  productionParams,
  liveAccentColor,
  breathDriver,
  style,
  isFrameActive = true,
  frameloop: frameloopProp,
  displayNumber,
  presetVariant = 'other',
  activePresetRaw = '',
  activePresetLabel = '',
  normalizedPresetNumber = null,
}) {
  const canvasElRef = useRef(null);

  // Mark canvas for intentional teardown BEFORE R3F's useEffect cleanup
  // calls gl.dispose() → loseContext().  useLayoutEffect cleanups run
  // before useEffect cleanups in the same unmount cycle.
  useLayoutEffect(() => {
    return () => {
      if (canvasElRef.current) {
        canvasElRef.current.dataset.intentionalTeardown = '1';
      }
    };
  }, []);

  return (
    // PROBE:OOM_DPR_CAP:START
    <>
      <Canvas
        style={{ width: '100%', height: '100%', minWidth: '1px', minHeight: '1px', display: 'block', ...style }}
        frameloop={frameloopProp !== undefined ? frameloopProp : (isFrameActive ? 'always' : 'never')}
        dpr={import.meta.env.PROD ? 1 : [1, BREATH_RING_MAX_DPR]}
        camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          stencil: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(import.meta.env.PROD ? 1 : Math.min(window.devicePixelRatio, BREATH_RING_MAX_DPR));
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;

          const canvas = gl.domElement;
          canvasElRef.current = canvas;

          if (!canvas.__immanenceWebglContextLostListenerAdded) {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (e) => {
                if (gl.domElement.dataset?.intentionalTeardown === '1') {
                  e.preventDefault();
                }
              },
              false
            );
            canvas.__immanenceWebglContextLostListenerAdded = true;
          }

          // ----------------------------------------------------------
          // FIX: Intercept WEBGL_lose_context.loseContext() so that
          // Three.js's dispose() cannot trigger a webglcontextlost
          // event during intentional teardown (session end).
          //
          // Why this works:
          //   Three.js WebGLRenderer.dispose() calls:
          //     extensions.get('WEBGL_lose_context').loseContext()
          //   which dispatches webglcontextlost synchronously.
          //   Three.js registers its own listener in the constructor
          //   (before onCreated), so a capturing listener added here
          //   cannot fire before Three's — they share the same element
          //   and Three registered first.
          //
          //   By making loseContext() a no-op when teardown is flagged,
          //   the event never fires, Three never logs "Context Lost",
          //   and Probe6 never records a CONTEXT_EVENT.
          //
          //   The raw GL context is garbage-collected when the canvas
          //   node is removed from DOM — no resource leak.
          // ----------------------------------------------------------
          try {
            const rawGl =
              gl.getContext?.() ||
              gl.domElement?.getContext?.('webgl2') ||
              gl.domElement?.getContext?.('webgl');
            const ext = rawGl?.getExtension?.('WEBGL_lose_context');
            if (ext && !ext.__immanencePatched) {
              const originalLoseContext = ext.loseContext?.bind(ext);

              ext.loseContext = () => {
                const canvasEl = canvasElRef.current || gl.domElement;
                if (canvasEl?.dataset?.intentionalTeardown === '1') {
                  if (import.meta.env.DEV) {
                    console.info('[BreathingRing] suppressed loseContext() call (intentional teardown)');
                  }
                  return;
                }
                originalLoseContext?.();
              };

              ext.__immanencePatched = true;
            }
          } catch (e) {
            // Non-fatal — if patching fails, context loss will still
            // log but the app will function normally.
            if (import.meta.env.DEV) {
              console.warn('[BreathingRing] failed to patch WEBGL_lose_context', e);
            }
          }

          if (import.meta.env.DEV) {
            const appliedDpr = Number(gl.getPixelRatio?.() || 1).toFixed(2);
            console.info(`[BreathingRing] canvas mount dpr=${appliedDpr} cap=${BREATH_RING_MAX_DPR.toFixed(2)}`);
          }
        }}
      >
        <RingSceneRouter
          rndRingMode={rndRingMode}
          productionParams={productionParams}
          liveAccentColor={liveAccentColor}
          breathDriver={breathDriver}
          isFrameActive={isFrameActive}
          displayNumber={displayNumber}
          presetVariant={presetVariant}
          activePresetRaw={activePresetRaw}
          activePresetLabel={activePresetLabel}
          normalizedPresetNumber={normalizedPresetNumber}
        />
      </Canvas>

      {import.meta.env.PROD && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 2147483647,
            pointerEvents: 'none',
            padding: '10px 12px',
            borderRadius: 999,
            background: 'rgba(255, 0, 0, 0.95)',
            color: '#fff',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.02em',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
          }}
        >
          OOM_PROBE_DPR_CAP=1.0
        </div>
      )}
    </>
    // PROBE:OOM_DPR_CAP:END
  );
}

function formatStillnessClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function StillnessVisualRing({ stillnessVisual, practiceActive = true }) {
  const theme = useTheme();
  const liveAccentColor = theme?.accent?.primary ?? "#22d3ee";
  const segmentType = stillnessVisual?.segmentType || "focus";
  const segmentLabel = stillnessVisual?.segmentLabel || "FOCUS";
  const nextSegmentLabel = stillnessVisual?.nextSegmentLabel || "REST";
  const segmentDurationSec = Math.max(1, Number(stillnessVisual?.segmentDurationSec) || 1);
  const segmentProgress01 = Math.max(0, Math.min(1, Number(stillnessVisual?.segmentProgress01) || 0));
  const cycleProgress01 = Math.max(0, Math.min(1, Number(stillnessVisual?.cycleProgress01) || 0));
  const segmentRemainingSec = Math.max(0, Math.ceil(Number(stillnessVisual?.segmentRemainingSec) || 0));
  const totalRemainingSec = Math.max(0, Math.ceil(Number(stillnessVisual?.totalRemainingSec) || 0));
  const intensity = String(stillnessVisual?.intensity || "medium").toUpperCase();
  const intensityCopy = stillnessVisual?.intensityCopy || "";
  const isPaused = Boolean(stillnessVisual?.isPaused);
  const normalizedMode = normalizeRingMode(stillnessVisual?.ringMode) || "instrument";
  const isOrb = normalizedMode === "orb";
  const presetOwnsCenterDigit = normalizedMode === "polygon" || isOrb;
  const useDetachedAuxText = normalizedMode === "polygon" || normalizedMode === "rainbow" || isOrb;
  const showArcPhaseLabel = false;
  const ringSafePad = "20px";
  const phaseForRenderer = segmentType === "focus" ? "inhale" : "exhale";
  const phaseProgressForRenderer = segmentType === "focus"
    ? segmentProgress01
    : 1 - segmentProgress01;
  const breathDriver = useMemo(() => ({
    phase: phaseForRenderer,
    cycleProgress01,
    phaseProgress01: Math.max(0, Math.min(1, phaseProgressForRenderer)),
    phaseDurationSec: segmentDurationSec,
    cycleDurationSec: Math.max(0.1, Number(stillnessVisual?.visualCycleDurationSec) || segmentDurationSec),
    isPaused,
  }), [
    cycleProgress01,
    isPaused,
    phaseForRenderer,
    phaseProgressForRenderer,
    segmentDurationSec,
    stillnessVisual?.visualCycleDurationSec,
  ]);
  const productionParams = useMemo(() => ({
    ...PRODUCTION_RING_DEFAULTS,
    breathDriver,
  }), [breathDriver]);
  const stagePlateRef = useRef(null);
  const [stagePlateSize, setStagePlateSize] = useState({ width: 0, height: 0 });
  const [orbDigitTargetPx, setOrbDigitTargetPx] = useState(360);

  useLayoutEffect(() => {
    const el = stagePlateRef.current;
    if (!el) return undefined;

    let rafId = null;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || 0;
      const h = rect.height || 0;

      setStagePlateSize((prev) => (
        Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5
          ? prev
          : { width: w, height: h }
      ));

      if (h > 0) {
        setOrbDigitTargetPx(Math.max(180, Math.min(560, h * 0.52)));
      }
    };

    const scheduleMeasure = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, []);

  const ringStageSize = Math.max(
    180,
    Math.min(
      300,
      (stagePlateSize.width || 520) * 0.58,
      (stagePlateSize.height || 560) * 0.64
    )
  );
  const hybridOverlayCamera = useMemo(() => ({
    position: [0, 0, 10],
    near: 0.1,
    far: 50,
    zoom: getHybridOverlayZoom(stagePlateSize),
  }), [stagePlateSize]);
  const segmentDisplay = segmentRemainingSec > 59
    ? formatStillnessClock(segmentRemainingSec)
    : String(segmentRemainingSec);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "#020207",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={stagePlateRef}
          style={{
            width: "100%",
            margin: 0,
            padding: isOrb ? "0" : "clamp(12px, 3vh, 40px) 14px clamp(10px, 2vh, 24px)",
            borderRadius: 0,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            position: "relative",
            overflow: "visible",
            isolation: "isolate",
            minHeight: 0,
            height: isOrb ? "100%" : "min(100%, 560px)",
            maxHeight: isOrb ? "none" : "560px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: "#020207",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              overflow: "visible",
              pointerEvents: normalizedMode === "rainbow" ? "auto" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${ringStageSize}px`,
                height: `${ringStageSize}px`,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent-color) 18%, transparent) 0%, rgba(0,0,0,0) 72%)",
                opacity: segmentType === "focus" ? 0.18 : 0.1,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />

            <div
              className="relative"
              style={{
                position: "relative",
                width: normalizedMode === "rainbow" ? "100%" : `${ringStageSize}px`,
                height: normalizedMode === "rainbow" ? "100%" : `${ringStageSize}px`,
                overflow: "visible",
                marginTop: 0,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: normalizedMode === "rainbow" ? 0 : `calc(-1 * ${ringSafePad})`,
                  overflow: "visible",
                  WebkitMaskImage: normalizedMode === "rainbow" ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
                  maskImage: normalizedMode === "rainbow" ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  pointerEvents: normalizedMode === "rainbow" ? "auto" : "none",
                }}
              >
                {!isOrb && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: ringSafePad,
                      zIndex: 7,
                      pointerEvents: "none",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.46) 34%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0.00) 82%)",
                      opacity: 0.85,
                    }}
                  />
                )}

                {normalizedMode !== "rainbow" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                      zIndex: 10,
                      pointerEvents: "none",
                      minWidth: "1px",
                      minHeight: "1px",
                      opacity: isOrb ? 0 : (practiceActive ? 1 : 0),
                      transition: "opacity 0.25s ease",
                    }}
                  >
                    <PersistentBreathRingCanvas
                      rndRingMode={normalizedMode}
                      frameloop={isOrb ? "never" : undefined}
                      productionParams={productionParams}
                      liveAccentColor={liveAccentColor}
                      breathDriver={breathDriver}
                      style={{ width: "100%", height: "100%", minWidth: "1px", minHeight: "1px", display: "block" }}
                      isFrameActive={practiceActive}
                      displayNumber={segmentRemainingSec}
                      presetVariant={normalizedMode === "bracelet" ? "preset1" : "other"}
                      activePresetRaw={normalizedMode}
                      activePresetLabel={normalizedMode}
                      normalizedPresetNumber={null}
                    />
                  </div>
                )}

                {normalizedMode === "bracelet" && !isOrb && practiceActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      background: "transparent",
                      zIndex: 20,
                    }}
                  >
                    <Canvas
                      frameloop="always"
                      dpr={[1, BREATH_RING_MAX_DPR]}
                      orthographic
                      camera={hybridOverlayCamera}
                      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                    >
                      <HybridInstrumentTickOverlayScene accentColor={liveAccentColor} breathDriver={breathDriver} />
                    </Canvas>
                  </div>
                )}

                {normalizedMode === "rainbow" && practiceActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "auto",
                      background: "transparent",
                      zIndex: 25,
                    }}
                  >
                    <RainbowPresetCanvas breathDriver={breathDriver} quality="stillness" />
                  </div>
                )}

                {!showArcPhaseLabel && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 30,
                      pointerEvents: "none",
                      padding: "0px",
                      borderRadius: 0,
                      width: "min(72%, 240px)",
                      textAlign: "center",
                    }}
                  >
                    {!useDetachedAuxText && (
                      <div
                        style={{
                          textTransform: "uppercase",
                          color: "var(--accent-primary)",
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(1.6rem, 5vw, 1.9rem)",
                          fontWeight: 400,
                          letterSpacing: "0.24em",
                          opacity: 0.88,
                          textShadow: "0 2px 12px rgba(0,0,0,0.58)",
                        }}
                      >
                        {isPaused ? "Paused" : segmentLabel}
                      </div>
                    )}
                    {!presetOwnsCenterDigit && (
                      <div
                        style={{
                          fontSize: "clamp(2.8rem, 9vw, 3.4rem)",
                          fontWeight: 300,
                          fontFamily: "var(--font-display)",
                          color: "var(--accent-primary)",
                          marginTop: "6px",
                          textShadow: "0 2px 10px rgba(0,0,0,0.50)",
                          opacity: 0.92,
                          lineHeight: 1,
                        }}
                      >
                        {segmentDisplay}
                      </div>
                    )}
                    {!useDetachedAuxText && (
                      <>
                        <div
                          style={{
                            marginTop: "8px",
                            color: "rgba(245,245,245,0.7)",
                            fontFamily: "var(--font-display)",
                            fontSize: "0.78rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                            lineHeight: 1.35,
                          }}
                        >
                          {isPaused ? "Phase timing paused" : `Next ${nextSegmentLabel} in ${segmentRemainingSec}s`}
                        </div>
                        {segmentType === "focus" && (
                          <>
                            <div
                              style={{
                                marginTop: "10px",
                                color: "rgba(245,245,245,0.82)",
                                fontFamily: "var(--font-display)",
                                fontSize: "0.74rem",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                              }}
                            >
                              {intensity}
                            </div>
                            <div
                              style={{
                                marginTop: "4px",
                                color: "rgba(245,245,245,0.64)",
                                fontSize: "0.88rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {intensityCopy}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {useDetachedAuxText && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: `calc(50% - ${Math.round(ringStageSize / 2)}px - 38px)`,
                  transform: "translateX(-50%)",
                  zIndex: 34,
                  pointerEvents: "none",
                  textTransform: "uppercase",
                  color: "var(--accent-primary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.45rem, 4.8vw, 1.8rem)",
                  fontWeight: 400,
                  letterSpacing: "0.24em",
                  opacity: 0.9,
                  textShadow: "0 2px 12px rgba(0,0,0,0.58)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {isPaused ? "Paused" : segmentLabel}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "calc(54px + env(safe-area-inset-bottom))",
                  transform: "translateX(-50%)",
                  zIndex: 35,
                  pointerEvents: "none",
                  width: "min(82vw, 320px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  borderRadius: "18px",
                  background: "rgba(2, 6, 14, 0.52)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "rgba(245,245,245,0.74)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                    lineHeight: 1.35,
                  }}
                >
                  {isPaused ? "Phase timing paused" : `Next ${nextSegmentLabel} in ${segmentRemainingSec}s`}
                </div>
                {segmentType === "focus" && (
                  <>
                    <div
                      style={{
                        color: "rgba(245,245,245,0.82)",
                        fontFamily: "var(--font-display)",
                        fontSize: "0.74rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {intensity}
                    </div>
                    <div
                      style={{
                        color: "rgba(245,245,245,0.66)",
                        fontSize: "0.92rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {intensityCopy}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {isOrb && (
            <div style={{
              position: "absolute",
              inset: -1,
              zIndex: 15,
              opacity: practiceActive ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.25s ease",
            }}>
              <ParticleCountdownPreset
                digitTargetPx={orbDigitTargetPx}
                displayNumber={segmentRemainingSec}
                accentColor={liveAccentColor}
                frameloop={isOrb ? "always" : "never"}
              />
            </div>
          )}

          {isOrb && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "18%",
                zIndex: 16,
                pointerEvents: "none",
                background: "linear-gradient(180deg, rgba(2,6,14,0) 0%, rgba(2,6,14,0.58) 72%, #020207 100%)",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "calc(6px + env(safe-area-inset-bottom))",
              zIndex: 36,
              pointerEvents: "none",
              paddingLeft: "14px",
              paddingRight: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                rowGap: "4px",
                fontSize: "0.88rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "rgba(245,245,245,0.68)",
                textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "rgba(2, 6, 14, 0.56)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <span>Total</span>
              <span style={{ color: "var(--accent-secondary)" }}>{formatStillnessClock(totalRemainingSec)}</span>
              {isPaused && <span style={{ opacity: 0.55 }}>• PAUSED</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// startTime is required and must be based on performance.now() so that
// audio scheduling (Web Audio API) and the rAF animation loop share one
// clock origin. Passing Date.now() will silently desync audio timing.
export function BreathingRing({
  breathPattern,
  onTap,
  onCycleComplete,
  startTime,
  totalSessionDurationSec = null,
  practiceActive = true,
  onUnmount = null,
  ringMode = null,
  stillnessVisual = null,
}) {
  const isStillnessMode = Boolean(stillnessVisual);
  const startTimeValid = startTime != null && Number.isFinite(startTime);
  const canRunBreathingRuntime = !isStillnessMode && !!startTime;

  const theme = useTheme();
  const liveAccentColor = theme?.accent?.primary ?? '#22d3ee';
  const lockedPatternRef = useRef(null);
  const pendingPatternRef = useRef(null);
  const incomingPatternRef = useRef(breathPattern);

  // State to track the currently displayed pattern (triggers re-render when pattern changes)
  const [displayedPattern, setDisplayedPattern] = useState(breathPattern || { inhale: 4, holdTop: 4, exhale: 4, holdBottom: 2 });
  const [rndRingMode, setRndRingMode] = useState(() => normalizeRingMode(ringMode) || 'instrument');

  const patternKey = (pattern) => ([
    pattern?.inhale ?? 0,
    pattern?.holdTop ?? 0,
    pattern?.exhale ?? 0,
    pattern?.holdBottom ?? 0,
  ]).join('|');

  useEffect(() => {
    if (ringMode != null) return;
    if (import.meta.env.DEV !== true || typeof window === 'undefined') return;
    let cancelled = false;

    const ringParam = new URLSearchParams(window.location.search).get('ring');
    const normalizedQueryMode = normalizeRingMode(ringParam);
    if (normalizedQueryMode) {
      scheduleBreathingRingUpdate(() => {
        if (!cancelled) {
          setRndRingMode(normalizedQueryMode);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [ringMode]);

  useEffect(() => {
    if (ringMode == null) return;
    const normalizedRingMode = normalizeRingMode(ringMode);
    if (!normalizedRingMode) return;
    let cancelled = false;
    scheduleBreathingRingUpdate(() => {
      if (!cancelled) {
        setRndRingMode((prev) => (prev === normalizedRingMode ? prev : normalizedRingMode));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ringMode]);

  // Compatibility normalization for legacy/persisted values.
  useEffect(() => {
    const normalizedMode = normalizeRingMode(rndRingMode) || RING_MODE_CYCLE[0];
    if (normalizedMode !== rndRingMode) {
      let cancelled = false;
      scheduleBreathingRingUpdate(() => {
        if (!cancelled) {
          setRndRingMode(normalizedMode);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [rndRingMode]);

  // Initialize locked pattern on mount (ONLY ONCE)
  // This ensures lockedPatternRef is set before animation loop runs
  useEffect(() => {
    if (!lockedPatternRef.current && breathPattern) {
      lockedPatternRef.current = breathPattern;
      incomingPatternRef.current = breathPattern;
      let cancelled = false;
      scheduleBreathingRingUpdate(() => {
        if (!cancelled) {
          setDisplayedPattern(breathPattern);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, []); // Empty deps: runs ONLY on mount

  // Track pattern changes and queue them as pending
  useEffect(() => {
    const incoming = breathPattern || {};
    incomingPatternRef.current = incoming;
    let cancelled = false;

    if (!lockedPatternRef.current) {
      // If locked not yet set (shouldn't happen due to mount effect above)
      lockedPatternRef.current = incoming;
      scheduleBreathingRingUpdate(() => {
        if (!cancelled) {
          setDisplayedPattern(incoming);
        }
      });
      return;
    }

    const incomingKey = patternKey(incoming);
    const lockedKey = patternKey(lockedPatternRef.current);
    if (incomingKey !== lockedKey) {
      // Queue pattern change for next wrap boundary
      pendingPatternRef.current = incoming;
    }
    return () => {
      cancelled = true;
    };
  }, [breathPattern]);

  // Use displayed pattern state for rendering (triggers re-render when pattern changes)
  const {
    inhale = 4,
    holdTop = 4,
    exhale = 4,
    holdBottom = 2,
  } = displayedPattern || {};
  // Total cycle duration - derived from the effective (locked or initial) pattern
  // This is used for phase boundary calculations
  const total = inhale + holdTop + exhale + holdBottom;

  const [progress, setProgress] = useState(0);
  const [echo, setEcho] = useState(null);
  const previousProgressRef = useRef(0);
  const audioContextRef = useRef(null);
  

  // Enso feedback state
  const [ensoFeedback, setEnsoFeedback] = useState({
    active: false,
    accuracy: null, // 'perfect' | 'good' | 'loose'
    key: 0
  });
  const [currentPhase, setCurrentPhase] = useState(null);
  const lastTapPhaseRef = useRef(null);

  // Normalized capacity phase (0-1) for unified UI display
  // Applies across all session types, not just tempo-synced
  const [capacityPhaseNorm, setCapacityPhaseNorm] = useState(0);
  const capacityPhaseNumber = capacityPhaseNorm < 0.333 ? 1 : capacityPhaseNorm < 0.667 ? 2 : 3;
  const capacityPhaseLabel = capacityPhaseNorm < 0.333 ? '50%' : capacityPhaseNorm < 0.667 ? '75%' : '90%';

  // Phase boundaries (as fractions of cycle)
  // These are calculated from total, which comes from the locked pattern
  // Guaranteed to be in sync with progress calculation in animation loop
  const tInhale = inhale / total;
  const tHoldTop = (inhale + holdTop) / total;
  const tExhale = (inhale + holdTop + exhale) / total;

  // Track current phase for enso feedback
  useEffect(() => {
    if (isStillnessMode) return;
    let cancelled = false;
    const nextPhase =
      progress < tInhale ? 'inhale' :
      progress < tHoldTop ? 'hold-top' :
      progress < tExhale ? 'exhale' :
      'hold-bottom';

    scheduleBreathingRingUpdate(() => {
      if (!cancelled) {
        setCurrentPhase((prev) => (prev === nextPhase ? prev : nextPhase));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [progress, tInhale, tHoldTop, tExhale, isStillnessMode]);

  // Calculate normalized capacity phase (0-1) for session-wide UI display
  // Updates based on elapsed time and total session duration
  useEffect(() => {
    if (isStillnessMode || !startTime || !totalSessionDurationSec || totalSessionDurationSec <= 0) return;

    const updateCapacityPhase = () => {
      const elapsed = (performance.now() - startTime) / 1000; // in seconds
      // NOTE: totalSessionDurationSec is in MINUTES from PracticeSection, convert to seconds
      const sessionDurationSeconds = totalSessionDurationSec * 60;
      const normalized = Math.min(1, Math.max(0, elapsed / sessionDurationSeconds));
      setCapacityPhaseNorm(normalized);
    };

    const interval = setInterval(updateCapacityPhase, 500); // Update every 500ms
    updateCapacityPhase(); // Initial update
    return () => clearInterval(interval);
  }, [startTime, totalSessionDurationSec, isStillnessMode]);

  // Breath sound engine - continuous audio feedback synced to breath phases
  const soundPhase = currentPhase === 'hold-top' ? 'holdTop' :
                     currentPhase === 'hold-bottom' ? 'holdBottom' :
                     currentPhase;
  useBreathSoundEngine({
    phase: soundPhase,
    pattern: displayedPattern,
    isRunning: canRunBreathingRuntime,
  });

  // Trigger echo visual effect
  const triggerEcho = () => {
    scheduleBreathingRingUpdate(() => {
      setEcho({ id: Date.now() });
    });
  };

  // Web Audio API sound generation
  const playSound = (frequency) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = frequency;
    osc.type = "sine";

    // Quick attack, exponential decay
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);
  };

  // Detect phase transitions and trigger sounds + echo
  useEffect(() => {
    if (!canRunBreathingRuntime) return;
    const prevP = previousProgressRef.current;
    const currP = progress;

    // Crossed into HOLD-TOP phase (end of inhale, peak reached)
    if (prevP < tInhale && currP >= tInhale) {
      triggerEcho();
      playSound(800); // High ping (inhale peak)
    }

    // Crossed into EXHALE phase (release from inhale hold)
    if (prevP < tHoldTop && currP >= tHoldTop) {
      playSound(700); // Medium-high ping (inhale release)
    }

    // Crossed into HOLD-BOTTOM phase (end of exhale, bottom reached)
    if (prevP < tExhale && currP >= tExhale) {
      playSound(400); // Low ping (exhale bottom)
    }

    // Crossed back into INHALE phase (release from exhale hold) - CYCLE COMPLETE
    if (prevP >= tExhale && currP < tExhale) {
      playSound(500); // Medium-low ping (exhale release)
      if (onCycleComplete) {
        onCycleComplete();
      }
    }

    previousProgressRef.current = currP;
  }, [progress, tInhale, tHoldTop, tExhale, onCycleComplete, canRunBreathingRuntime]);

  // Cycle start time - resets only on wrap boundaries
  // This prevents t discontinuity when pattern changes mid-cycle
  const cycleStartTimeRef = useRef(null);

  // Main animation loop - SYNCED to session start time
  // CRITICAL: Animation loop NEVER restarts - it runs continuously for entire session
  // Pattern changes queue as pending and apply at wrap boundaries only
  // Cycle time is continuous and resets only on actual wraps
  useEffect(() => {
    if (!canRunBreathingRuntime) return;

    let frameId = null;

    const loop = (now) => {
      // Initialize cycle start time on first frame
      if (!cycleStartTimeRef.current) {
        cycleStartTimeRef.current = now;
      }

      // LOCKED pattern is the ONLY source of truth
      // This guarantees cycle length never changes mid-cycle
      const lockedPattern = lockedPatternRef.current;

      if (!lockedPattern || Object.keys(lockedPattern).length === 0) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      // Calculate cycle total from LOCKED pattern only
      // All calculations (progress, phase boundaries, wrap detection) use this
      const cycleTotal = (lockedPattern.inhale || 0)
        + (lockedPattern.holdTop || 0)
        + (lockedPattern.exhale || 0)
        + (lockedPattern.holdBottom || 0);

      const cycleMs = Math.max(cycleTotal, 0.001) * 1000;

      // CRITICAL: elapsed is time since cycle start, not session start
      // This prevents discontinuity when cycleMs changes mid-cycle
      const elapsedFromCycleStart = now - cycleStartTimeRef.current;

      // FIXED WRAP DETECTION: Use elapsed time comparison, NOT progress comparison
      // This prevents false wraps when cycleMs changes mid-cycle
      // A true wrap occurs when elapsedFromCycleStart >= cycleMs
      const didWrap = elapsedFromCycleStart >= cycleMs;

      // Single authoritative progress: NOT using modulo to prevent discontinuity
      // If we haven't wrapped yet, use elapsed directly
      // This keeps progress smooth even when pattern changes
      let t = elapsedFromCycleStart / cycleMs;

      // Apply pending pattern ONLY on wrap boundary
      // Reset cycle start time to begin fresh cycle with new pattern
      if (didWrap) {
        cycleStartTimeRef.current = now;
        if (pendingPatternRef.current) {
          lockedPatternRef.current = pendingPatternRef.current;
          const newPattern = pendingPatternRef.current;
          pendingPatternRef.current = null;

          // Update displayed pattern state to trigger re-render with new timing
          setDisplayedPattern(newPattern);

          // Recalculate cycleMs with the NEW pattern
          const newCycleTotal = (newPattern.inhale || 0)
            + (newPattern.holdTop || 0)
            + (newPattern.exhale || 0)
            + (newPattern.holdBottom || 0);
          const newCycleMs = Math.max(newCycleTotal, 0.001) * 1000;

          // After reset, recalculate t for the new cycle with NEW duration
          t = (now - cycleStartTimeRef.current) / newCycleMs;
        } else {
          // No pattern change, use existing cycleMs
          t = (now - cycleStartTimeRef.current) / cycleMs;
        }
      }

      setProgress(t);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [canRunBreathingRuntime, startTime]); // ONLY depends on startTime when runtime is active

  // Remove echo after animation completes
  useEffect(() => {
    if (echo) {
      const timer = setTimeout(() => setEcho(null), 400);
      return () => clearTimeout(timer);
    }
  }, [echo]);

  // Handle click on breathing ring - calculate error and call onTap
  const handleRingClick = () => {
    if (!onTap) return;

    // Find which peak the user was trying to hit
    // Valid tap points: Start (0), Inhale Peak, Hold Release, Exhale Bottom, End (1)
    const peaks = [
      { name: 'inhale start', phase: 0 },
      { name: 'inhale peak', phase: tInhale },
      { name: 'hold release', phase: tHoldTop },
      { name: 'exhale bottom', phase: tExhale },
      { name: 'cycle end', phase: 1.0 }
    ];

    // Find closest peak
    let closestPeak = peaks[0];
    let minDistance = Math.abs(progress - peaks[0].phase);

    for (let i = 1; i < peaks.length; i++) {
      const distance = Math.abs(progress - peaks[i].phase);
      if (distance < minDistance) {
        minDistance = distance;
        closestPeak = peaks[i];
      }
    }

    // Calculate error from closest peak
    const cycleMs = total * 1000;
    const expectedMs = closestPeak.phase * cycleMs;
    const actualMs = progress * cycleMs;

    // INPUT LATENCY COMPENSATION
    // Typical touchscreen/mouse latency is ~60ms. 
    // Without this, perfect physical taps register as "Late".
    const INPUT_LATENCY_MS = 60;
    const errorMs = (actualMs - expectedMs) - INPUT_LATENCY_MS;

    const absError = Math.abs(errorMs);

    // Trigger enso feedback (once per phase)
    if (currentPhase && lastTapPhaseRef.current !== currentPhase) {
      const accuracy = absError < 50 ? 'perfect' : absError < 200 ? 'good' : 'loose';

      setEnsoFeedback(prev => ({
        active: true,
        accuracy,
        key: prev.key + 1
      }));

      lastTapPhaseRef.current = currentPhase;

      // Clear enso after animation completes
      setTimeout(() => setEnsoFeedback(prev => ({ ...prev, active: false })), 1400);
    }

    onTap(errorMs);
  };

  // Deterministic breathDriver: maps existing phase truth into renderer format.
  // phase strings: 'hold-top' → 'holdTop', 'hold-bottom' → 'holdBottom', others as-is.
  const breathDriver = useMemo(() => {
    if (!currentPhase) return null;
    const p01 = ((progress % 1) + 1) % 1; // wrap-safe 0→1

    const phase =
      currentPhase === 'hold-top'    ? 'holdTop'    :
      currentPhase === 'hold-bottom' ? 'holdBottom' :
      currentPhase; // 'inhale' | 'exhale' unchanged

    let phaseProgress01;
    if (currentPhase === 'inhale') {
      phaseProgress01 = tInhale > 0 ? p01 / tInhale : 1;
    } else if (currentPhase === 'hold-top') {
      const d = tHoldTop - tInhale;
      phaseProgress01 = d > 0 ? (p01 - tInhale) / d : 1;
    } else if (currentPhase === 'exhale') {
      const d = tExhale - tHoldTop;
      phaseProgress01 = d > 0 ? (p01 - tHoldTop) / d : 1;
    } else { // hold-bottom
      const d = 1 - tExhale;
      phaseProgress01 = d > 0 ? (p01 - tExhale) / d : 1;
    }

    return {
      phase,
      cycleProgress01: p01,
      phaseProgress01: Math.max(0, Math.min(1, phaseProgress01)),
      // Phase-clock orbit timing: 1 full revolution per phase duration.
      // Derived from the same phase boundary fractions used for the UI countdown.
      phaseDurationSec: (
        currentPhase === 'inhale'     ? Math.max(0, tInhale * total) :
        currentPhase === 'hold-top'   ? Math.max(0, (tHoldTop - tInhale) * total) :
        currentPhase === 'exhale'     ? Math.max(0, (tExhale - tHoldTop) * total) :
                                        Math.max(0, (1 - tExhale) * total)
      ),
    };
  }, [currentPhase, progress, tInhale, tHoldTop, tExhale, total]);

  // Production ring params — phase-driven via breathDriver.
  const productionParams = useMemo(() => ({
    ...PRODUCTION_RING_DEFAULTS,
    breathDriver,
  }), [breathDriver]);

  // DEV guard — must be after all hooks to satisfy Rules of Hooks.
  // Fires once on mount and whenever startTime changes.
  useEffect(() => {
    if (isStillnessMode || process.env.NODE_ENV === 'production') return;
    const now = performance.now();
    if (startTime == null || !Number.isFinite(startTime)) {
      console.error(
        '[BreathingRing] startTime is required and must be a finite performance.now() timestamp. ' +
        'The rAF loop and audio engine will not start without it.',
        'Received:', startTime
      );
      return;
    }
    // Heuristic: flag timestamps that look like Date.now() or a stale value
    if (startTime > now + 10_000 || startTime < now - 86_400_000) {
      console.error(
        '[BreathingRing] startTime looks wrong — expected a recent performance.now() value. ' +
        'Using Date.now() instead of performance.now() will desync audio scheduling.',
        'Received:', startTime, '| performance.now():', now,
        '| diff (ms):', startTime - now
      );
    }
  }, [startTime, isStillnessMode]);

  // After all hooks: bail if startTime is absent so the rAF loop and audio
  // engine never start with a missing clock anchor.
  useEffect(() => {
    if (isStillnessMode) return undefined;
    return () => {
      if (typeof onUnmount === "function") {
        onUnmount();
      }
    };
  }, [onUnmount, isStillnessMode]);

  const phaseArcPathId = useId();
  const isFrameActive = isRingFrameActive(practiceActive);
  const isOrb = rndRingMode === 'orb';
  const normalizedMode = normalizeRingMode(rndRingMode);
  const normalizedPresetIndex = normalizedMode ? RING_MODE_CYCLE.indexOf(normalizedMode) : -1;
  const normalizedPresetNumber = normalizedPresetIndex >= 0 ? normalizedPresetIndex + 1 : null;
	  const activePresetRaw = rndRingMode;
	  const activePresetLabel = normalizedPresetNumber == null
	    ? 'n/a'
	    : `#${normalizedPresetNumber}:${normalizedMode}`;
	  const presetVariant = normalizedMode === 'bracelet' ? 'preset1' : 'other';
	  const showArcPhaseLabel = rndRingMode === 'instrument' || rndRingMode === 'bracelet';
	  const ringSafePad = "20px";
	  const phaseWord =
	    progress < tInhale ? "Inhale" :
	    progress < tHoldTop ? "Hold" :
    progress < tExhale ? "Exhale" :
    "Hold";
  const phaseLabel = phaseWord.toUpperCase();
  const phaseRemainingSec = useMemo(() => {
    let phaseRemaining = 0;
    if (progress < tInhale) {
      phaseRemaining = (tInhale - progress) * total;
    } else if (progress < tHoldTop) {
      phaseRemaining = (tHoldTop - progress) * total;
    } else if (progress < tExhale) {
      phaseRemaining = (tExhale - progress) * total;
    } else {
      phaseRemaining = (1 - progress) * total;
    }
    return Math.max(0, Math.ceil(phaseRemaining));
  }, [progress, tInhale, tHoldTop, tExhale, total]);

  // stagePlateRef: ONE STAGE PLATE is the sizing authority for the orb canvas.
  const stagePlateRef = useRef(null);
  const [stagePlateSize, setStagePlateSize] = useState({ width: 0, height: 0 });
  const [orbDigitTargetPx, setOrbDigitTargetPx] = useState(360);

  useLayoutEffect(() => {
    const el = stagePlateRef.current;
    if (!el) return undefined;

    let rafId = null;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || 0;
      const h = rect.height || 0;

      setStagePlateSize((prev) => (
        Math.abs(prev.width - w) < 0.5 && Math.abs(prev.height - h) < 0.5
          ? prev
          : { width: w, height: h }
      ));

      if (h > 0) {
        setOrbDigitTargetPx(Math.max(180, Math.min(560, h * 0.52)));
      }
    };

    const scheduleMeasure = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, []);
  const ringStageSize = Math.max(
    180,
    Math.min(
      300,
      (stagePlateSize.width || 520) * 0.58,
      (stagePlateSize.height || 560) * 0.64
    )
  );
  const hybridOverlayCamera = useMemo(() => ({
    position: [0, 0, 10],
    near: 0.1,
    far: 50,
    zoom: getHybridOverlayZoom(stagePlateSize),
  }), [stagePlateSize]);
  if (isStillnessMode) {
    return <StillnessVisualRing stillnessVisual={{ ...stillnessVisual, ringMode }} practiceActive={practiceActive} />;
  }
  if (!startTimeValid) return null;

  return (
    <div
      className="w-full h-full flex flex-col cursor-pointer"
      onClick={handleRingClick}
      style={{
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* Full Breathing screen background (must not be bounded by stage plate). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "#020207",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >

      {/* Image-based Enso - authentic brush stroke (OUTSIDE SVG to avoid overlay) */}
      {ensoFeedback.active && (
        <div
          key={ensoFeedback.key}
          className="absolute"
          style={{
            pointerEvents: "none",
            top: "50%",
            left: "50%",
            width: "128px",
            height: "128px",
            transform: ensoFeedback.accuracy === 'loose'
              ? 'translate(-50%, -50%) scale(0.85)'
              : 'translate(-50%, -50%) scale(1)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              opacity: 1,
              animation: 'ensoFadeOut 500ms ease-out 800ms forwards',
            }}
          >
            <EnsoStroke
              centerX={64}
              centerY={64}
              radius={50}
              accuracy={ensoFeedback.accuracy}
              isActive={true}
            />
          </div>

          {/* Perfect timing flash at completion point */}
          {ensoFeedback.accuracy === 'perfect' && (
            <div
              style={{
                position: 'absolute',
                top: '25%',
                left: '22%',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#fffef0',
                boxShadow: '0 0 12px rgba(255, 254, 240, 0.9)',
                animation: 'ensoFlash 200ms ease-out 400ms',
                opacity: 0,
              }}
            />
          )}
        </div>
      )}

      {/* ONE STAGE PLATE: ring + center text + phase/capacity + timer live inside a single plate */}
      {/* BOUNDED STAGE: clamp minHeight is intentional. For fullscreen orb, fix the PracticeSection flex chain instead. */}
      <div
        ref={stagePlateRef}
        style={{
          width: "100%",
          margin: 0,
          padding: isOrb ? "0" : "clamp(12px, 3vh, 40px) 14px clamp(10px, 2vh, 24px)",
          borderRadius: 0,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          position: "relative",
          overflow: "visible",
          isolation: "isolate",
          minHeight: 0,
          height: isOrb ? "100%" : "min(100%, 560px)",
          maxHeight: isOrb ? "none" : "560px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Stage background: solid black — WebGL canvases own their own visual content */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: "#020207",
            pointerEvents: "none",
          }}
        />

        {/* Overlay layer: never clipped */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            overflow: "visible",
            pointerEvents: rndRingMode === 'rainbow' ? "auto" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${ringStageSize}px`,
              height: `${ringStageSize}px`,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent-color) 18%, transparent) 0%, rgba(0,0,0,0) 72%)",
              opacity: 0.15,
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
          {/* Ring stage — standard ring presets only (300px centered) */}
          <div
            className="relative"
            style={{
              position: "relative",
              width: rndRingMode === 'rainbow' ? "100%" : `${ringStageSize}px`,
              height: rndRingMode === 'rainbow' ? "100%" : `${ringStageSize}px`,
              overflow: "visible",
              marginTop: 0,
              flexShrink: 0,
            }}
          >
          {/* Safe drawing box: expands renderer region beyond layout box */}
          <div
            style={{
              position: "absolute",
              inset: rndRingMode === 'rainbow' ? 0 : `calc(-1 * ${ringSafePad})`,
              overflow: "visible",
              WebkitMaskImage: rndRingMode === 'rainbow' ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
              maskImage: rndRingMode === 'rainbow' ? "none" : "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              pointerEvents: rndRingMode === 'rainbow' ? "auto" : "none",
            }}
          >
            {/* Center depth well: improves phase text legibility without a boxed panel */}
            {!isOrb && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: ringSafePad,
                  zIndex: 7,
                  pointerEvents: "none",
                  borderRadius: "50%",
                  // Darkest at center, fades outward—keeps nebula continuity.
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.46) 34%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0.00) 82%)",
                  opacity: 0.85,
                }}
              />
            )}

	        {/* DEV ring-mode overlay removed (was used for probe targeting) */}

        {rndRingMode !== 'rainbow' && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              zIndex: 10,
              pointerEvents: "none",
              minWidth: "1px",
              minHeight: "1px",
              opacity: isOrb ? 0 : (isFrameActive ? 1 : 0),
              transition: "opacity 0.25s ease",
            }}
          >
            <PersistentBreathRingCanvas
              rndRingMode={rndRingMode}
              frameloop={isOrb ? "never" : undefined}
              productionParams={productionParams}
              liveAccentColor={liveAccentColor}
              breathDriver={breathDriver}
              style={{ width: '100%', height: '100%', minWidth: '1px', minHeight: '1px', display: 'block' }}
              isFrameActive={isFrameActive}
              displayNumber={phaseRemainingSec}
              presetVariant={presetVariant}
              activePresetRaw={activePresetRaw}
              activePresetLabel={activePresetLabel}
              normalizedPresetNumber={normalizedPresetNumber}
            />
          </div>
        )}

        {rndRingMode === 'bracelet' && !isOrb && isFrameActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'transparent',
              zIndex: 20,
            }}
          >
            <Canvas
              frameloop="always"
              dpr={[1, BREATH_RING_MAX_DPR]}
              orthographic
              camera={hybridOverlayCamera}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            >
              <HybridInstrumentTickOverlayScene accentColor={liveAccentColor} breathDriver={breathDriver} />
            </Canvas>
          </div>
        )}

        {rndRingMode === 'rainbow' && isFrameActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'auto',
              background: 'transparent',
              zIndex: 25,
            }}
          >
            <RainbowPresetCanvas breathDriver={breathDriver} />
          </div>
        )}

        {showArcPhaseLabel && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              ...(rndRingMode === 'bracelet'
                ? {
                    top: "60%",
                    left: "50%",
                    width: "70%",
                    height: "70%",
                    transform: "translate(-50%, -50%)",
                  }
                : {
                    inset: 0,
                  }),
              zIndex: 25,
              pointerEvents: "none",
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 200"
              style={{
                display: "block",
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              <path
                id={phaseArcPathId}
                d="M 14 110 A 86 86 0 0 0 186 110"
                fill="none"
              />
              <text
                style={{
                  fill: "var(--accent-primary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  opacity: 0.88,
                }}
              >
                <textPath href={`#${phaseArcPathId}`} startOffset="50%" textAnchor="middle" dy="-2">
                  {phaseLabel}
                </textPath>
              </text>
            </svg>
          </div>
        )}

        {/* Phase indicator - centered in circle for focus */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 30,
            pointerEvents: "none",
            padding: "0px",
            borderRadius: 0,
          }}
        >
        {!showArcPhaseLabel && rndRingMode !== 'orb' && rndRingMode !== 'polygon' && (
          <div
            style={{
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 5.2vw, 2rem)",
              fontWeight: 400,
              letterSpacing: "0.25em",
              opacity: 0.85,
              textShadow: "0 2px 12px rgba(0,0,0,0.58)",
            }}
          >
            {phaseWord}
          </div>
        )}
        {/* Phase countdown timer — hidden for orb (ParticleCountdown has its own WebGL digit) */}
        {rndRingMode !== 'orb' && rndRingMode !== 'polygon' && <div
          style={{
            fontSize: "clamp(3rem, 10vw, 3.5rem)",
            fontWeight: 300,
            fontFamily: "var(--font-display)",
            color: "var(--accent-primary)",
            marginTop: "6px",
            textShadow: "0 2px 10px rgba(0,0,0,0.50)",
            opacity: 0.9,
          }}
        >
          {phaseRemainingSec}
        </div>}

        </div>

        {isOrb && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 35,
              pointerEvents: "none",
              paddingTop: "calc(12px + env(safe-area-inset-top))",
              paddingLeft: "14px",
              paddingRight: "14px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              minHeight: 0,
            }}
          >
	            {/* DEV ring-mode overlay removed (was used for probe targeting) */}
          </div>
        )}

        {isOrb && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 35,
              pointerEvents: "none",
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
              paddingLeft: "14px",
              paddingRight: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              minHeight: 0,
            }}
          >
            {totalSessionDurationSec && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  fontSize: "0.92rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  color: "rgba(245,245,245,0.65)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                }}
              >
                <span>
                  PHASE <span style={{ color: "var(--accent-primary)" }}>{capacityPhaseNumber}</span><span style={{ color: "var(--accent-secondary)" }}>/3</span>
                </span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>
                  CAPACITY: <span style={{ color: "var(--accent-secondary)" }}>{capacityPhaseLabel}</span>
                </span>
              </div>
            )}
          </div>
        )}

        </div>
        </div>

        {/* ── Orb canvas — always mounted, direct child of ONE STAGE PLATE ── */}
        {/* Two WebGL contexts: frameloop="never" on inactive canvas stops GPU draws but keeps context alive. */}
        <div style={{
          position: "absolute", inset: -1, zIndex: 15,
          opacity: isOrb ? (isFrameActive ? 1 : 0) : 0,
          pointerEvents: "none",
          transition: "opacity 0.25s ease",
        }}>
          <ParticleCountdownPreset
            digitTargetPx={orbDigitTargetPx}
            displayNumber={phaseRemainingSec}
            accentColor={liveAccentColor}
            frameloop={isOrb ? "always" : "never"}
          />
        </div>
        {isOrb && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "18%",
              zIndex: 16,
              pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(2,6,14,0) 0%, rgba(2,6,14,0.58) 72%, #020207 100%)",
            }}
          />
        )}

        {!isOrb && totalSessionDurationSec && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "calc(6px + env(safe-area-inset-bottom))",
              zIndex: 36,
              pointerEvents: "none",
              paddingLeft: "14px",
              paddingRight: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                rowGap: "4px",
                fontSize: "0.88rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "rgba(245,245,245,0.65)",
                textShadow: "0 2px 8px rgba(0,0,0,0.46)",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "rgba(2, 6, 14, 0.56)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <span>
                PHASE <span style={{ color: "var(--accent-primary)" }}>{capacityPhaseNumber}</span><span style={{ color: "var(--accent-secondary)" }}>/3</span>
              </span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span>
                CAPACITY: <span style={{ color: "var(--accent-secondary)" }}>{capacityPhaseLabel}</span>
              </span>
            </div>
          </div>
        )}

      </div>
      </div>
      </div>

      <style>{`
        @keyframes fadeOutEcho {
          0% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes ensoReveal {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes ensoGlow {
          0%, 100% {
            filter: brightness(0) saturate(100%) invert(84%) sepia(29%) saturate(1000%) hue-rotate(358deg) brightness(104%) contrast(96%) drop-shadow(0 0 8px rgba(253, 224, 71, 0.6));
          }
          50% {
            filter: brightness(0) saturate(100%) invert(84%) sepia(29%) saturate(1000%) hue-rotate(358deg) brightness(104%) contrast(96%) drop-shadow(0 0 16px rgba(253, 224, 71, 0.9));
          }
        }
        
        @keyframes ensoGlowPerfect {
          0%, 100% {
            filter: brightness(0) saturate(100%) invert(84%) sepia(29%) saturate(1000%) hue-rotate(358deg) brightness(104%) contrast(96%) drop-shadow(0 0 12px rgba(253, 224, 71, 0.9));
          }
          50% {
            filter: brightness(0) saturate(100%) invert(84%) sepia(29%) saturate(1000%) hue-rotate(358deg) brightness(104%) contrast(96%) drop-shadow(0 0 24px rgba(253, 224, 71, 1));
          }
        }
        
        @keyframes ensoFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes ensoFlash {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
        
        @keyframes ensoFadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
