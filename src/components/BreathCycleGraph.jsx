// src/components/BreathCycleGraph.jsx
// 4-phase trapezoidal breath visualization with animated dot tracer
// Shows: Inhale (rising) → Hold 1 (plateau) → Exhale (falling) → Hold 2 (plateau)

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { calculateRhythmFrequency, rhythmOscillation } from '../utils/rhythmUtils.js';

export function BreathCycleGraph({
  inhale = 4,
  hold1 = 4,
  exhale = 4,
  hold2 = 4,
  cycles = 1,
  showDot = true,
  isAnimating = false,
}) {
  // Calculate the total cycle time in seconds
  const totalCycleTime = inhale + hold1 + exhale + hold2;
  
  // Rhythm pulsing for dot glow
  const animationTimeRef = useRef(0);
  const rhythmFreqRef = useRef(calculateRhythmFrequency(totalCycleTime));
  const [dotGlowIntensity, setDotGlowIntensity] = useState(1.0);
  
  // Update rhythm frequency when cycle time changes
  useEffect(() => {
    rhythmFreqRef.current = calculateRhythmFrequency(totalCycleTime);
  }, [totalCycleTime]);
  
  // Animate rhythm pulsing for the dot
  useEffect(() => {
    let frameId = null;
    
    if (showDot && isAnimating) {
      const startTime = performance.now();
      
      const animate = (now) => {
        const elapsed = (now - startTime) / 1000;
        animationTimeRef.current = elapsed;
        
        // Calculate rhythm oscillation for dot glow: 1 ± 0.15 (±15%)
        const rhythmOsc = rhythmOscillation(elapsed, rhythmFreqRef.current, 1.0);
        const glowIntensity = 1.0 + rhythmOsc * 0.15; // Subtle ±15% pulsing
        setDotGlowIntensity(glowIntensity);
        
        frameId = requestAnimationFrame(animate);
      };
      
      frameId = requestAnimationFrame(animate);
    } else {
      // Reset to default when not animating
      setDotGlowIntensity(1.0);
    }
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [showDot, isAnimating]);
  
  // Generate the SVG path for the 4-phase breath graph
  const breathPath = useMemo(() => {
    const totalWidth = 300;
    const height = 120;
    const top = 15;
    const bottom = height - 15;

    // Calculate segment widths proportionally for a single cycle
    // Note: totalCycleTime is the reference for the whole 300px width
    const inhaleW = (inhale / totalCycleTime) * (totalWidth / cycles);
    const hold1W = (hold1 / totalCycleTime) * (totalWidth / cycles);
    const exhaleW = (exhale / totalCycleTime) * (totalWidth / cycles);
    const hold2W = (hold2 / totalCycleTime) * (totalWidth / cycles);
    const cycleW = inhaleW + hold1W + exhaleW + hold2W;

    // Build trapezoidal path for multiple cycles
    let d = `M 0 ${bottom}`;
    for (let i = 0; i < Math.ceil(cycles); i++) {
        const xOffset = i * cycleW;
        d += ` L ${xOffset + inhaleW} ${top}`;
        d += ` L ${xOffset + inhaleW + hold1W} ${top}`;
        d += ` L ${xOffset + inhaleW + hold1W + exhaleW} ${bottom}`;
        d += ` L ${xOffset + cycleW} ${bottom}`;
    }

    return d;
  }, [inhale, hold1, exhale, hold2, totalCycleTime, cycles]);

  // keyTimes for animateMotion to ensure exact speed per segment
  // format: "0; t1; t2; t3; 1" where tN are fractions of totalCycleTime
  const keyTimes = useMemo(() => {
    const t1 = inhale / totalCycleTime;
    const t2 = (inhale + hold1) / totalCycleTime;
    const t3 = (inhale + hold1 + exhale) / totalCycleTime;
    return `0; ${t1.toFixed(3)}; ${t2.toFixed(3)}; ${t3.toFixed(3)}; 1`;
  }, [inhale, hold1, exhale, hold2, totalCycleTime]);

  const animationDuration = `${totalCycleTime}s`;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
        marginBottom: '24px',
      }}
    >
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height: '120px',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="breath-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feFlood
              floodColor="var(--accent-primary)"
              floodOpacity="0.5"
              result="color"
            />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main breath path */}
        <path
          d={breathPath}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#breath-glow)"
          opacity="0.85"
        />

        {/* Animated dot tracer with rhythm pulsing */}
        {showDot && (
          <circle
            r={5 * dotGlowIntensity}
            fill="var(--accent-primary)"
            filter="url(#breath-glow)"
            opacity={isAnimating ? 0.9 * dotGlowIntensity : 0.6}
            style={{ transition: 'none' }} // Disable transition for smooth rhythm
          >
            <animateMotion
              dur={animationDuration}
              repeatCount="indefinite"
              path={breathPath.split('L').slice(0, 5).join('L')} // Just the first cycle for animation
              keyTimes={keyTimes}
              calcMode="linear"
            />
          </circle>
        )}
      </svg>
    </div>
  );
}
