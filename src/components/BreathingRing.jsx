// src/components/BreathingRing.jsx
// BREATHING VISUALIZATION RING
// - Scales smoothly to match exact breath pattern timing
// - Echo effect + sound on inhale peak and exhale bottom
// - User locks eyes on ring to feel the rhythm

import React, { useEffect, useState, useRef } from "react";

export function BreathingRing({ breathPattern }) {
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

    // Crossed back into INHALE phase (release from exhale hold)
    if (prevP >= tExhale && currP < tExhale) {
      playSound(500); // Medium-low ping (exhale release)
    }

    previousProgressRef.current = currP;
  }, [progress, tInhale, tHoldTop, tExhale]);

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

  return (
    <div className="relative w-full flex items-center justify-center py-12">
      {/* Main breathing ring */}
      <svg
        viewBox="0 0 200 200"
        className="w-64 h-64"
        style={{
          filter: "drop-shadow(0 0 32px rgba(253, 224, 71, 0.3))",
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
    </div>
  );
}