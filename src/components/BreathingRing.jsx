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
import { PathParticles } from "./PathParticles.jsx";

export function BreathingRing({ breathPattern, onTap, onCycleComplete, startTime, pathId, fxPreset, practiceEnergy = 0.5 }) {
  const {
    inhale = 4,
    holdTop = 4,
    exhale = 4,
    holdBottom = 2,
  } = breathPattern || {};

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

  // Phase boundaries (as fractions of cycle)
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

  // Main animation loop - SYNCED to session start time
  useEffect(() => {
    if (!total || total <= 0) return;

    const cycleMs = total * 1000;
    // Use provided startTime or current time as reference
    const referenceTime = startTime || performance.now();
    let frameId = null;

    const loop = (now) => {
      const elapsed = now - referenceTime;
      const t = (elapsed % cycleMs) / cycleMs;
      setProgress(t);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [total, startTime]); // Re-sync when startTime changes

  // Trigger echo visual effect
  const triggerEcho = () => {
    setEcho({ id: Date.now() });
  };

  // Remove echo after animation completes
  useEffect(() => {
    if (echo) {
      const timer = setTimeout(() => setEcho(null), 400);
      return () => clearTimeout(timer);
    }
  }, [echo]);

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

  // Read theme for dynamic colors
  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;

  return (
    <div
      className="relative w-full flex items-center justify-center py-16 cursor-pointer"
      onClick={handleRingClick}
      style={{ userSelect: "none", overflow: "visible" }}
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

      {/* Main breathing ring with EVENT HORIZON GLOW */}
      <svg
        viewBox="-50 -50 300 300"
        className="w-80 h-80"
        style={{
          position: 'relative',
          zIndex: 10,
          pointerEvents: "none",
          overflow: "visible",
          // EVENT HORIZON GLOW - Clean layered box-shadow using theme colors
          filter: progress < tInhale
            ? `drop-shadow(0 0 ${8 + 1.6 * (progress / tInhale)}px var(--accent-primary)) 
               drop-shadow(0 0 ${16 + 3.2 * (progress / tInhale)}px var(--accent-secondary)) 
               drop-shadow(0 0 ${24 + 4.8 * (progress / tInhale)}px var(--accent-muted)) 
               drop-shadow(0 0 ${32 + 6.4 * (progress / tInhale)}px var(--accent-glow))`
            : progress < tHoldTop
              ? `drop-shadow(0 0 9.6px var(--accent-primary)) 
               drop-shadow(0 0 19.2px var(--accent-secondary)) 
               drop-shadow(0 0 28.8px var(--accent-muted)) 
               drop-shadow(0 0 38.4px var(--accent-glow))`
              : progress < tExhale
                ? `drop-shadow(0 0 ${9.6 - 1.6 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px var(--accent-primary)) 
               drop-shadow(0 0 ${19.2 - 3.2 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px var(--accent-secondary)) 
               drop-shadow(0 0 ${28.8 - 4.8 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px var(--accent-muted)) 
               drop-shadow(0 0 ${38.4 - 6.4 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px var(--accent-glow))`
                : `drop-shadow(0 0 8px var(--accent-primary)) 
               drop-shadow(0 0 16px var(--accent-secondary)) 
               drop-shadow(0 0 24px var(--accent-muted)) 
               drop-shadow(0 0 32px var(--accent-glow))`
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

      {/* Echo effect - appears at max scale, fades out */}
      {echo && (
        <svg
          viewBox="-50 -50 300 300"
          className="absolute w-80 h-80"
          style={{
            animation: "fadeOutEcho 0.4s ease-out forwards",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              transform: `scale(${maxScale})`,
              transformOrigin: "100px 100px",
              opacity: 0.5,
            }}
          />
        </svg>
      )}

      {/* PATH PARTICLES - Rendered ON TOP of the ring for visibility */}
      {/* Canvas is 400x400 for headroom (prevents particle clipping), centered exactly over the ring */}
      <div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          pointerEvents: 'none',
          zIndex: 20,
          overflow: 'visible',
          /* Center using transform - same technique as phase indicator */
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <PathParticles
          pathId={pathId}
          fxPreset={fxPreset}
          intensity={(() => {
            // Base breath intensity from scale
            const breathIntensity = scale === maxScale ? 1 : (scale - minScale) / (maxScale - minScale);
            // Blend breath intensity with practice energy (60% breath, 40% practice energy)
            return breathIntensity * 0.6 + practiceEnergy * 0.4;
          })()}
          ringScale={scale}
          ringRadius={85.33}  /* Actual SVG ring radius: r=80 in viewBox 300, scaled to 320px = 80/300*320 */
          phase={
            progress < tInhale ? 'inhale' :
              progress < tHoldTop ? 'hold' :
                progress < tExhale ? 'exhale' :
                  'rest'
          }
          size={400}
          accentColor={theme.accent.particleColor || primary}
          isActive={true}
        />
      </div>

      {/* Phase indicator - centered in circle for focus */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "0.875rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: 'var(--accent-primary)',
          fontFamily: "Cinzel, serif",
          fontWeight: "500",
          zIndex: 10,
          pointerEvents: "none",
          textShadow: '0 0 10px var(--accent-glow)'
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