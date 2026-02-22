// src/components/BreathingRing.jsx
// BREATHING VISUALIZATION RING
// - Scales smoothly to match exact breath pattern timing
// - Echo effect + sound on inhale peak and exhale bottom
// - User locks eyes on ring to feel the rhythm
// - CLICKABLE: tapping calculates accuracy error and passes to onTap callback
// - PATH FX: path-specific particle effects sync with breath

import React, { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EnsoStroke } from "./EnsoStroke";
import { useBreathSoundEngine } from '../hooks/useBreathSoundEngine.js';
import { BloomRingSceneContent } from './bloomRing/BloomRingRenderer.jsx';
import { VolumetricGlassRingSceneContent } from './bloomRing/VolumetricGlassRingRND.jsx';
import { TechInstrumentSceneContent } from './bloomRing/TechInstrumentRND.jsx';
import { PRODUCTION_RING_DEFAULTS } from './bloomRing/bloomRingProductionDefaults.js';
import { useTheme } from '../context/ThemeContext.jsx';

const BREATH_RING_MAX_DPR = 1.5;

function isRingFrameActive(practiceActive = true) {
  if (!practiceActive) return false;
  if (typeof window === 'undefined') return true;
  if (window.__IMMANENCE_PRACTICE_ACTIVE__ === false) return false;
  if (window.__IMMANENCE_APP_MARKER__ === 'practice:idle') return false;
  return true;
}

function RingSceneRouter({ rndRingMode, productionParams, liveAccentColor, breathDriver, isFrameActive = true }) {
  if (!isFrameActive) return null;

  if (rndRingMode === 'orb') {
    return (
      <VolumetricGlassRingSceneContent
        accentColor={liveAccentColor}
        breathDriver={breathDriver}
      />
    );
  }

  if (rndRingMode === 'instrument') {
    return (
      <TechInstrumentSceneContent
        accentColor={liveAccentColor}
        breathDriver={breathDriver}
      />
    );
  }

  return (
    <BloomRingSceneContent
      params={productionParams}
      accentColor={liveAccentColor}
      mode="production"
      isFrameActive={isFrameActive}
    />
  );
}

function PersistentBreathRingCanvas({ rndRingMode, productionParams, liveAccentColor, breathDriver, style, isFrameActive = true }) {
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
    <Canvas
      style={{ width: '100%', height: '100%', minWidth: '1px', minHeight: '1px', display: 'block', ...style }}
      frameloop={isFrameActive ? 'always' : 'never'}
      dpr={[1, BREATH_RING_MAX_DPR]}
      camera={{ fov: 12, position: [0, 0, 10], near: 0.1, far: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, BREATH_RING_MAX_DPR));
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;

        const canvas = gl.domElement;
        canvasElRef.current = canvas;

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
          const rawGl = gl.getContext();
          const loseCtxExt = rawGl.getExtension('WEBGL_lose_context');
          if (loseCtxExt) {
            const originalLoseContext = loseCtxExt.loseContext.bind(loseCtxExt);
            loseCtxExt.loseContext = () => {
              const isIntentional = canvas.dataset?.intentionalTeardown === '1'
                || window.__IMMANENCE_PRACTICE_ACTIVE__ === false
                || window.__IMMANENCE_APP_MARKER__ === 'practice:idle';
              if (isIntentional) {
                if (import.meta.env.DEV) {
                  console.info('[BreathingRing] suppressed loseContext() call (intentional teardown)');
                }
                return;
              }
              originalLoseContext();
            };
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
        if (typeof window !== 'undefined' && typeof window.__PROBE6_REGISTER_GL__ === 'function') {
          window.__PROBE6_REGISTER_GL__({
            gl,
            canvas: gl.domElement,
            source: 'BreathingRing:PersistentCanvas',
          });
        }
      }}
    >
      <RingSceneRouter
        rndRingMode={rndRingMode}
        productionParams={productionParams}
        liveAccentColor={liveAccentColor}
        breathDriver={breathDriver}
        isFrameActive={isFrameActive}
      />
    </Canvas>
  );
}

// startTime is required and must be based on performance.now() so that
// audio scheduling (Web Audio API) and the rAF animation loop share one
// clock origin. Passing Date.now() will silently desync audio timing.
export function BreathingRing({ breathPattern, onTap, onCycleComplete, startTime, totalSessionDurationSec = null, practiceActive = true, onUnmount = null }) {
  const theme = useTheme();
  const liveAccentColor = theme?.accent?.primary ?? '#22d3ee';
  const lockedPatternRef = useRef(null);
  const pendingPatternRef = useRef(null);
  const incomingPatternRef = useRef(breathPattern);

  // State to track the currently displayed pattern (triggers re-render when pattern changes)
  const [displayedPattern, setDisplayedPattern] = useState(breathPattern || { inhale: 4, holdTop: 4, exhale: 4, holdBottom: 2 });
  const [rndRingMode, setRndRingMode] = useState('bracelet');

  const patternKey = (pattern) => ([
    pattern?.inhale ?? 0,
    pattern?.holdTop ?? 0,
    pattern?.exhale ?? 0,
    pattern?.holdBottom ?? 0,
  ]).join('|');

  useEffect(() => {
    if (import.meta.env.DEV !== true || typeof window === 'undefined') return;

    const ringModes = ['bracelet', 'orb', 'instrument', 'baseline'];
    const ringParam = new URLSearchParams(window.location.search).get('ring');
    if (ringParam && ringModes.includes(ringParam)) {
      setRndRingMode(ringParam);
    }

    const onKeyDown = (event) => {
      if (event.key !== 'F2') return;
      event.preventDefault();
      setRndRingMode((prev) => {
        const idx = ringModes.indexOf(prev);
        return ringModes[(idx + 1) % ringModes.length];
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Initialize locked pattern on mount (ONLY ONCE)
  // This ensures lockedPatternRef is set before animation loop runs
  useEffect(() => {
    if (!lockedPatternRef.current && breathPattern) {
      lockedPatternRef.current = breathPattern;
      incomingPatternRef.current = breathPattern;
      setDisplayedPattern(breathPattern);
    }
  }, []); // Empty deps: runs ONLY on mount

  // Track pattern changes and queue them as pending
  useEffect(() => {
    const incoming = breathPattern || {};
    incomingPatternRef.current = incoming;

    if (!lockedPatternRef.current) {
      // If locked not yet set (shouldn't happen due to mount effect above)
      lockedPatternRef.current = incoming;
      setDisplayedPattern(incoming);
      return;
    }

    const incomingKey = patternKey(incoming);
    const lockedKey = patternKey(lockedPatternRef.current);
    if (incomingKey !== lockedKey) {
      // Queue pattern change for next wrap boundary
      pendingPatternRef.current = incoming;
    }
  }, [breathPattern]);

  // Use displayed pattern state for rendering (triggers re-render when pattern changes)
  const {
    inhale = 4,
    holdTop = 4,
    exhale = 4,
    holdBottom = 2,
  } = displayedPattern || {};

  const formatSec = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(/\\.0$/, "");
  };
  const patternText = `${formatSec(inhale)}-${formatSec(holdTop)}-${formatSec(exhale)}-${formatSec(holdBottom)}s`;
  const nebulaBgUrl = `${import.meta.env.BASE_URL}assets/celestial_blue_nebula.png`;
  const grainBgUrl = `${import.meta.env.BASE_URL}assets/canvas_grain.png`;
  const showSubjectPhotoLayer = false;

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
    if (progress < tInhale) {
      setCurrentPhase('inhale');
    } else if (progress < tHoldTop) {
      setCurrentPhase('hold-top');
    } else if (progress < tExhale) {
      setCurrentPhase('exhale');
    } else {
      setCurrentPhase('hold-bottom');
    }
  }, [progress, tInhale, tHoldTop, tExhale]);

  // Calculate normalized capacity phase (0-1) for session-wide UI display
  // Updates based on elapsed time and total session duration
  useEffect(() => {
    if (!startTime || !totalSessionDurationSec || totalSessionDurationSec <= 0) return;

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
  }, [startTime, totalSessionDurationSec]);

  // Breath sound engine - continuous audio feedback synced to breath phases
  const soundPhase = currentPhase === 'hold-top' ? 'holdTop' :
                     currentPhase === 'hold-bottom' ? 'holdBottom' :
                     currentPhase;
  useBreathSoundEngine({
    phase: soundPhase,
    pattern: displayedPattern,
    isRunning: !!startTime,
  });

  // Trigger echo visual effect
  const triggerEcho = () => {
    setEcho({ id: Date.now() });
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
  }, [progress, tInhale, tHoldTop, tExhale, onCycleComplete]);

  // Cycle start time - resets only on wrap boundaries
  // This prevents t discontinuity when pattern changes mid-cycle
  const cycleStartTimeRef = useRef(null);

  // Main animation loop - SYNCED to session start time
  // CRITICAL: Animation loop NEVER restarts - it runs continuously for entire session
  // Pattern changes queue as pending and apply at wrap boundaries only
  // Cycle time is continuous and resets only on actual wraps
  useEffect(() => {
    if (!startTime) return;

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
  }, [startTime]); // ONLY depends on startTime

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
    if (process.env.NODE_ENV === 'production') return;
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
  }, [startTime]);

  // After all hooks: bail if startTime is absent so the rAF loop and audio
  // engine never start with a missing clock anchor.
  useEffect(() => {
    return () => {
      if (typeof onUnmount === "function") {
        onUnmount();
      }
    };
  }, [onUnmount]);

  const startTimeValid = startTime != null && Number.isFinite(startTime);
  if (!startTimeValid) return null;
  const isFrameActive = isRingFrameActive(practiceActive);
  const ringSafePad = "20px";

  return (
    <div
      className="w-full flex flex-col items-center cursor-pointer gap-6"
      onClick={handleRingClick}
      style={{ userSelect: "none", overflow: "visible", position: "relative" }}
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
      <div
        style={{
          width: "100vw",
          margin: 0,
          padding: "40px 14px 24px",
          borderRadius: 0,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          position: "relative",
          overflow: "visible",
          isolation: "isolate",
          // Target mobile portrait; capped so STOP button always stays on-screen.
          minHeight: "clamp(260px, 44vh, 440px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background layer: clipped visuals only */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            borderRadius: 0,
            pointerEvents: "none",

            // Seam softening: fade this stage’s background to transparent at top/bottom
            // so the surrounding nebula can blend without hard band edges.
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0) 100%)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        >
          {/* Layer 1: nebula background */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              backgroundImage: `url(${nebulaBgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: "scale(1.03)",
              filter: "blur(2px) saturate(0.92) contrast(0.94) brightness(0.52)",
            }}
          />
          {/* Single vignette source (practice compositing): keep extremely subtle */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.42) 58%, rgba(0,0,0,0.66) 100%)",
              opacity: 0.88,
            }}
          />
          {/* Layer 2 (optional placeholder): subject photo layer (wired, off by default) */}
          {showSubjectPhotoLayer && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
                display: "none",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          )}
          {/* Layer 1.5: subtle grain on background only */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              pointerEvents: "none",
              backgroundImage: `url(${grainBgUrl})`,
              backgroundSize: "420px 420px",
              backgroundRepeat: "repeat",
              opacity: 0.03,
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* Overlay layer: never clipped */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            overflow: "visible",
            pointerEvents: "none",
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
              top: "50%",
              left: "50%",
              width: "300px",
              height: "300px",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent-color) 18%, transparent) 0%, rgba(0,0,0,0) 72%)",
              opacity: 0.15,
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
          {/* Ring stage */}
          <div
            className="relative"
            style={{
              position: "relative",
              width: "min(58vw, 300px)",
              aspectRatio: "1 / 1",
              overflow: "visible",
              marginTop: "12px",
            }}
          >
          {/* Safe drawing box: expands renderer region beyond layout box */}
          <div
            style={{
              position: "absolute",
              inset: `calc(-1 * ${ringSafePad})`,
              overflow: "visible",
              WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
              maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0) 100%)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              pointerEvents: "none",
            }}
          >
            {/* Contrast window (atmospheric, not a plate): improves halo band separation from nebula */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: ringSafePad,
                zIndex: 6,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.00) 34%, rgba(0,0,0,0.26) 58%, rgba(0,0,0,0.00) 86%)",
                opacity: 0.75,
              }}
            />
            {/* Center depth well: improves phase text legibility without a boxed panel */}
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

        {/* WebGL bloom ring — single shared renderer (BloomRingRenderer) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 10,
            pointerEvents: "none",
            minWidth: "1px",
            minHeight: "1px",
            opacity: isFrameActive ? 1 : 0,
          }}
        >
          <PersistentBreathRingCanvas
            rndRingMode={rndRingMode}
            productionParams={productionParams}
            liveAccentColor={liveAccentColor}
            breathDriver={breathDriver}
            style={{ width: '100%', height: '100%', minWidth: '1px', minHeight: '1px', display: 'block' }}
            isFrameActive={isFrameActive}
          />
        </div>

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
          {progress < tInhale
            ? "Inhale"
            : progress < tHoldTop
              ? "Hold"
              : progress < tExhale
                ? "Exhale"
                : "Hold"}
        </div>
        {/* Phase countdown timer */}
        <div
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
          {(() => {
            // Calculate remaining seconds in current phase
            let phaseRemaining;
            if (progress < tInhale) {
              // Inhale phase: remaining = (tInhale - progress) * total
              phaseRemaining = (tInhale - progress) * total;
            } else if (progress < tHoldTop) {
              // Hold top phase: remaining = (tHoldTop - progress) * total
              phaseRemaining = (tHoldTop - progress) * total;
            } else if (progress < tExhale) {
              // Exhale phase: remaining = (tExhale - progress) * total
              phaseRemaining = (tExhale - progress) * total;
            } else {
              // Hold bottom phase: remaining = (1 - progress) * total
              phaseRemaining = (1 - progress) * total;
            }
            return Math.ceil(phaseRemaining);
          })()}
        </div>

        </div>
        </div>
        </div>

        {/* Bottom info group (inside same plate) */}
        {totalSessionDurationSec && (
          <div
            className="relative z-10"
            style={{
              marginTop: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              pointerEvents: "none",
            }}
          >
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
          </div>
        )}
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
