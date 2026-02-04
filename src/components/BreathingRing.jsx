// src/components/BreathingRing.jsx
// BREATHING VISUALIZATION RING
// - Scales smoothly to match exact breath pattern timing
// - Echo effect + sound on inhale peak and exhale bottom
// - User locks eyes on ring to feel the rhythm
// - CLICKABLE: tapping calculates accuracy error and passes to onTap callback
// - PATH FX: path-specific particle effects sync with breath

import React, { useEffect, useState, useRef } from "react";
import { EnsoStroke } from "./EnsoStroke";
import { useTheme } from "../context/ThemeContext";
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { useBreathSoundEngine } from '../hooks/useBreathSoundEngine.js';

export function BreathingRing({ breathPattern, onTap, onCycleComplete, startTime, pathId, fxPreset, practiceEnergy = 0.5, totalSessionDurationSec = null, timeLeftText = null }) {
  const lockedPatternRef = useRef(null);
  const pendingPatternRef = useRef(null);
  const incomingPatternRef = useRef(breathPattern);

  // State to track the currently displayed pattern (triggers re-render when pattern changes)
  const [displayedPattern, setDisplayedPattern] = useState(breathPattern || { inhale: 4, holdTop: 4, exhale: 4, holdBottom: 2 });

  const patternKey = (pattern) => ([
    pattern?.inhale ?? 0,
    pattern?.holdTop ?? 0,
    pattern?.exhale ?? 0,
    pattern?.holdBottom ?? 0,
  ]).join('|');

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

  // Total cycle duration - derived from the effective (locked or initial) pattern
  // This is used for phase boundary calculations
  const total = inhale + holdTop + exhale + holdBottom;
  const minScale = 0.9;  // Decreased 10% from 1.0
  const maxScale = 1.32; // Increased 10% from 1.2

  const [progress, setProgress] = useState(0);
  const [echo, setEcho] = useState(null);
  const previousProgressRef = useRef(0);
  const audioContextRef = useRef(null);
  const [mandalaProgress, setMandalaProgress] = useState(0);
  const lastCycleRef = useRef(0);
  

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
    _progress: progress,
  });

  // Calculate current scale based on progress through cycle
  let scale = minScale;
  if (progress < tInhale) {
    // INHALE: scale up from min to max
    scale = minScale + (maxScale - minScale) * (progress / tInhale);
  } else if (progress < tHoldTop) {
    // HOLD TOP: stay at max
    scale = maxScale;
  } else if (progress < tExhale) {
    // EXHALE: scale down from max to min
    const exhaleProgress = (progress - tHoldTop) / (tExhale - tHoldTop);
    scale = maxScale - (maxScale - minScale) * exhaleProgress;
  } else {
    // HOLD BOTTOM: stay at min
    scale = minScale;
  }


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
      // Cycle completed - increment mandala
      setMandalaProgress(prev => Math.min(prev + 0.1, 1)); // Grow to max 100%
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

  // Helper: Compute all glow blur layers with rhythm for current phase
  const computeGlowLayers = () => {
    let b1 = 8, b2 = 16, b3 = 24, b4 = 32;
    
    if (progress < tInhale) {
      const inhaleRatio = progress / tInhale;
      b1 = 8 + 1.6 * inhaleRatio;
      b2 = 16 + 3.2 * inhaleRatio;
      b3 = 24 + 4.8 * inhaleRatio;
      b4 = 32 + 6.4 * inhaleRatio;
    } else if (progress < tHoldTop) {
      b1 = 9.6;
      b2 = 19.2;
      b3 = 28.8;
      b4 = 38.4;
    } else if (progress < tExhale) {
      const exhaleRatio = (progress - tHoldTop) / (tExhale - tHoldTop);
      b1 = 9.6 - 1.6 * exhaleRatio;
      b2 = 19.2 - 3.2 * exhaleRatio;
      b3 = 28.8 - 4.8 * exhaleRatio;
      b4 = 38.4 - 6.4 * exhaleRatio;
    } else {
      b1 = 8;
      b2 = 16;
      b3 = 24;
      b4 = 32;
    }
    
    return { b1, b2, b3, b4 };
  };

  const glowLayers = computeGlowLayers();

  // Read theme for dynamic colors
  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;

  // Detect light mode to use subtle shadow instead of glow
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

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
          padding: "28px 14px 18px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.52)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          position: "relative",
          overflow: "hidden",
          // Target mobile portrait; let it grow on tall screens (e.g. 1080x1920) without pushing the Stop button off smaller viewports.
          minHeight: "clamp(520px, 62vh, 980px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Soft vignette for focus */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.38) 100%)",
            opacity: 1,
          }}
        />

        {/* Ring stage */}
        <div
          className="relative z-10"
          style={{
            position: "relative",
            width: "320px",
            height: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "6px",
          }}
        >

        {/* Main breathing ring with EVENT HORIZON GLOW */}
        <svg
          viewBox="-50 -50 300 300"
          className="w-80 h-80"
          style={{
            display: "block",
            zIndex: 10,
            pointerEvents: "none",
            overflow: "visible",
            position: "absolute",
            // EVENT HORIZON GLOW - Clean layered box-shadow using theme colors
            // Light mode: subtle dark shadow for definition
            // Dark mode: full colored glow effect with rhythm modulation
            filter: isLight
              ? 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.15)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.1))'
              : `drop-shadow(0 0 ${glowLayers.b1.toFixed(1)}px var(--accent-primary))
                 drop-shadow(0 0 ${glowLayers.b2.toFixed(1)}px var(--accent-secondary))
                 drop-shadow(0 0 ${glowLayers.b3.toFixed(1)}px var(--accent-muted))
                 drop-shadow(0 0 ${glowLayers.b4.toFixed(1)}px var(--accent-glow))`
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "100px 100px",
              transition: "none",
            }}
          />
        </svg>
        {/* PATH PARTICLES - Rendered ON TOP of the ring for visibility */}
        {/* Canvas is 400x400 for headroom (prevents particle clipping), centered exactly over the ring */}
        {pathId && fxPreset && fxPreset !== 'none' && (
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              pointerEvents: 'none',
              zIndex: 20,
              overflow: 'visible',
              left: "50%",
              top: "50%",
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* PathParticles removed - will be rebuilt with avatar revamp */}
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
        <div
          style={{
            fontSize: "0.875rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: 'var(--accent-primary)',
            fontFamily: "var(--font-display)",
            fontWeight: "700",
            letterSpacing: "var(--tracking-mythic)",
            textShadow: '0 0 18px rgba(0,0,0,0.85), 0 0 12px var(--accent-glow)',
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
            fontSize: "1.5rem",
            fontWeight: "700",
            fontFamily: "var(--font-mono, monospace)",
            color: 'var(--accent-primary)',
            marginTop: "4px",
            textShadow: '0 0 18px rgba(0,0,0,0.85), 0 0 12px var(--accent-glow)',
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

        {/* Bottom info group (inside same plate) */}
        {totalSessionDurationSec && (
          <div
            className="relative z-10"
            style={{
              marginTop: "18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                fontSize: "0.72rem",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.70)",
                textShadow: "0 2px 10px rgba(0,0,0,0.55)",
              }}
            >
              <span>
                PHASE <span style={{ color: "var(--accent-primary)" }}>{capacityPhaseNumber}</span><span style={{ color: "#FFD93D" }}>/3</span>
              </span>
              <span style={{ opacity: 0.45 }}>|</span>
              <span>
                CAPACITY: <span style={{ color: "var(--accent-secondary)" }}>{capacityPhaseLabel}</span>
              </span>
            </div>

            {/* Breathing pattern (seconds) moved out of the circle for a cleaner focus */}
            <div
              style={{
                fontSize: "0.72rem",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.74)",
                textShadow: "0 2px 12px rgba(0,0,0,0.65)",
                opacity: 0.95,
              }}
            >
              {patternText}
            </div>
          </div>
        )}
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
