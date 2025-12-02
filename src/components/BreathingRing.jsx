// src/components/BreathingRing.jsx
// BREATHING VISUALIZATION RING
// - Scales smoothly to match exact breath pattern timing
// - Echo effect + sound on inhale peak and exhale bottom
// - User locks eyes on ring to feel the rhythm
// - CLICKABLE: tapping calculates accuracy error and passes to onTap callback

import React, { useEffect, useState, useRef } from "react";

export function BreathingRing({ breathPattern, onTap, onCycleComplete }) {
  const {
    inhale = 4,
    holdTop = 4,
    exhale = 4,
    holdBottom = 2,
  } = breathPattern || {};

  const total = inhale + holdTop + exhale + holdBottom;
  const minScale = 1.0;
  const maxScale = 1.2;

  const [progress, setProgress] = useState(0);
  const [echo, setEcho] = useState(null);
  const previousProgressRef = useRef(0);
  const audioContextRef = useRef(null);
  const [mandalaProgress, setMandalaProgress] = useState(0);
  const lastCycleRef = useRef(0);

  // Phase boundaries (as fractions of cycle)
  const tInhale = inhale / total;
  const tHoldTop = (inhale + holdTop) / total;
  const tExhale = (inhale + holdTop + exhale) / total;

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

  // Main animation loop - tracks progress through breath cycle
  useEffect(() => {
    if (!total || total <= 0) return;

    const cycleMs = total * 1000;
    const start = performance.now();
    let frameId = null;

    const loop = (now) => {
      const elapsed = now - start;
      const t = (elapsed % cycleMs) / cycleMs;
      setProgress(t);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [total]);

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

    // VALIDATION: Accept all taps, let parent handle "out of bounds" logic
    // const MAX_TAP_WINDOW_MS = 1000;
    // if (Math.abs(errorMs) > MAX_TAP_WINDOW_MS) { ... }

    console.log('✅ Tap accepted:', errorMs, 'ms from', closestPeak.name, 'peak');
    onTap(errorMs);
  };

  return (
    <div
      className="relative w-full flex items-center justify-center py-12 cursor-pointer"
      onClick={handleRingClick}
      style={{ userSelect: "none" }}
    >
      {/* Main breathing ring with EVENT HORIZON GLOW */}
      <svg
        viewBox="0 0 200 200"
        className="w-64 h-64"
        style={{
          pointerEvents: "none",
          // EVENT HORIZON GLOW - Clean layered box-shadow
          filter: progress < tInhale
            ? `drop-shadow(0 0 ${8 + 1.6 * (progress / tInhale)}px #fffbe8) 
               drop-shadow(0 0 ${16 + 3.2 * (progress / tInhale)}px #fde68a) 
               drop-shadow(0 0 ${24 + 4.8 * (progress / tInhale)}px #fcd34d) 
               drop-shadow(0 0 ${32 + 6.4 * (progress / tInhale)}px rgba(245,158,11,0.4))`
            : progress < tHoldTop
              ? `drop-shadow(0 0 9.6px #fffbe8) 
               drop-shadow(0 0 19.2px #fde68a) 
               drop-shadow(0 0 28.8px #fcd34d) 
               drop-shadow(0 0 38.4px rgba(245,158,11,0.4))`
              : progress < tExhale
                ? `drop-shadow(0 0 ${9.6 - 1.6 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px #fffbe8) 
               drop-shadow(0 0 ${19.2 - 3.2 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px #fde68a) 
               drop-shadow(0 0 ${28.8 - 4.8 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px #fcd34d) 
               drop-shadow(0 0 ${38.4 - 6.4 * ((progress - tHoldTop) / (tExhale - tHoldTop))}px rgba(245,158,11,0.4))`
                : `drop-shadow(0 0 8px #fffbe8) 
               drop-shadow(0 0 16px #fde68a) 
               drop-shadow(0 0 24px #fcd34d) 
               drop-shadow(0 0 32px rgba(245,158,11,0.4))`
        }}
      >
        {/* Mandala Pattern - grows with each breath */}
        {mandalaProgress > 0 && (
          <g>
            {/* Center circle */}
            <circle
              cx="100"
              cy="100"
              r={mandalaProgress * 15}
              fill="none"
              stroke="rgba(253,224,71,0.4)"
              strokeWidth="1"
              opacity={mandalaProgress * 0.4}
            />

            {/* Petal pattern - 6 petals */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const angle = (i * 60 * Math.PI) / 180;
              const radius = mandalaProgress * 30;
              const cx = 100 + Math.cos(angle) * radius;
              const cy = 100 + Math.sin(angle) * radius;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={mandalaProgress * 8}
                  fill="none"
                  stroke="rgba(253,224,71,0.3)"
                  strokeWidth="0.5"
                  opacity={mandalaProgress * 0.35}
                />
              );
            })}

            {/* Outer ring */}
            {mandalaProgress > 0.5 && (
              <circle
                cx="100"
                cy="100"
                r={mandalaProgress * 50}
                fill="none"
                stroke="rgba(253,224,71,0.2)"
                strokeWidth="0.5"
                opacity={mandalaProgress * 0.3}
              />
            )}
          </g>
        )}

        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#fcd34d"
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
          viewBox="0 0 200 200"
          className="absolute w-64 h-64"
          style={{
            animation: "fadeOutEcho 0.4s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#fcd34d"
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
          color: "rgba(253, 224, 71, 0.7)",
          fontFamily: "Cinzel, serif",
          fontWeight: "500",
          zIndex: 10,
          pointerEvents: "none",
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
      `}</style>
    </div>
  );
}