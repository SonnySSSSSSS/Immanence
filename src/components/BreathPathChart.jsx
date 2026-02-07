// src/components/BreathPathChart.jsx
// Renders a breath slope chart with an animated dot that follows inhale/hold/exhale/hold timings
import { useEffect, useMemo, useRef } from 'react';

export function BreathPathChart({ inhale = 4, hold1 = 4, exhale = 4, hold2 = 4 }) {
  const pathRef = useRef(null);
  const dotRef = useRef(null);

  const { pathD, total, segments } = useMemo(() => {
    const safeIn = Math.max(0, inhale);
    const safeH1 = Math.max(0, hold1);
    const safeEx = Math.max(0, exhale);
    const safeH2 = Math.max(0, hold2);
    const totalCounts = safeIn + safeH1 + safeEx + safeH2 || 1;

    const baseY = 55;
    const amp = 18; // amplitude for sine
    const endX = 100;

    // Generate a sharp sine curve across the full width
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * endX;
      const y = baseY - amp * Math.sin((2 * Math.PI * x) / endX);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const d = points.join(' ');
    
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
        <defs></defs>
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="rgba(245, 230, 211, 0.4)"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'none' }}
        />
        <circle
          ref={dotRef}
          r="2.4"
          fill="#00C896"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0, 200, 150, 0.8))' }}
        />
      </svg>
    </div>
  );
}
