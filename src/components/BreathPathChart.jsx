// src/components/BreathPathChart.jsx
// Renders a breath slope chart with an animated dot that follows inhale/hold/exhale/hold timings
import React, { useEffect, useMemo, useRef } from 'react';

export function BreathPathChart({ inhale = 4, hold1 = 4, exhale = 4, hold2 = 4, tokens = {} }) {
  const pathRef = useRef(null);
  const dotRef = useRef(null);

  const { pathD, total, segments } = useMemo(() => {
    const safeIn = Math.max(0, inhale);
    const safeH1 = Math.max(0, hold1);
    const safeEx = Math.max(0, exhale);
    const safeH2 = Math.max(0, hold2);
    const totalCounts = safeIn + safeH1 + safeEx + safeH2 || 1;

    const baseY = 55;
    const peakY = 18;
    const endX = 100;

    const x1 = (safeIn / totalCounts) * endX;
    const x2 = x1 + (safeH1 / totalCounts) * endX;
    const x3 = x2 + (safeEx / totalCounts) * endX;
    const x4 = endX;

    const d = `M 0 ${baseY} L ${x1.toFixed(2)} ${peakY} L ${x2.toFixed(2)} ${peakY} L ${x3.toFixed(2)} ${baseY} L ${x4} ${baseY}`;
    
    // Calculate cumulative timings for each segment
    const segmentTimings = [
      { start: 0, duration: safeIn },                        // inhale
      { start: safeIn, duration: safeH1 },                   // hold1
      { start: safeIn + safeH1, duration: safeEx },          // exhale
      { start: safeIn + safeH1 + safeEx, duration: safeH2 }  // hold2
    ];
    
    return { pathD: d, total: totalCounts, segments: segmentTimings };
  }, [inhale, hold1, exhale, hold2]);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;

    const length = path.getTotalLength();
    const totalDurationMs = Math.max(total, 1) * 1000;
    let startTs;
    let rafId;

    const step = (ts) => {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) % totalDurationMs;
      const elapsedSec = elapsed / 1000;
      
      // Find which segment we're in based on elapsed time
      let cumulativeLength = 0;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (elapsedSec >= seg.start && elapsedSec < seg.start + seg.duration) {
          // We're in this segment
          const segProgress = seg.duration > 0 ? (elapsedSec - seg.start) / seg.duration : 0;
          const segStartLength = (i / segments.length) * length;
          const segEndLength = ((i + 1) / segments.length) * length;
          const positionOnPath = segStartLength + segProgress * (segEndLength - segStartLength);
          
          const pt = path.getPointAtLength(positionOnPath);
          dot.setAttribute('cx', pt.x.toString());
          dot.setAttribute('cy', pt.y.toString());
          break;
        }
      }
      
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [total, segments]);

  return (
    <div className="w-full flex justify-center" style={{ marginBottom: '20px' }}>
      <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: '520px' }}>
        <defs>
          <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tokens.accent || 'var(--accent-color)'} stopOpacity="0.35" />
            <stop offset="100%" stopColor={tokens.accent || 'var(--accent-color)'} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="url(#breathGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.35))' }}
        />
        <circle
          ref={dotRef}
          r="2.4"
          fill={tokens.accent || 'var(--accent-color)'}
          style={{ filter: `drop-shadow(0 0 8px ${(tokens.accent || 'var(--accent-color)')}80)` }}
        />
      </svg>
    </div>
  );
}
