function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function buildBreathPath({ inhale, hold1, exhale, hold2 }, cycles = 2) {
  const safeInhale = clampNumber(inhale, 0.0001, 9999);
  const safeHold1 = clampNumber(hold1, 0, 9999);
  const safeExhale = clampNumber(exhale, 0.0001, 9999);
  const safeHold2 = clampNumber(hold2, 0, 9999);

  const startX = 10;
  const endX = 420;
  const baseY = 46;
  const topY = 18;

  const totalWidth = endX - startX;
  const cycleCount = Math.max(1, Math.floor(clampNumber(cycles, 1, 8)));
  const cycleWidth = totalWidth / cycleCount;

  const total = safeInhale + safeHold1 + safeExhale + safeHold2;
  const wInhale = (safeInhale / total) * cycleWidth;
  const wHold1 = (safeHold1 / total) * cycleWidth;
  const wExhale = (safeExhale / total) * cycleWidth;
  const wHold2 = (safeHold2 / total) * cycleWidth;

  let d = `M${startX} ${baseY}`;
  for (let i = 0; i < cycleCount; i++) {
    const x0 = startX + i * cycleWidth;
    const x1 = x0 + wInhale;
    const x2 = x1 + wHold1;
    const x3 = x2 + wExhale;
    const x4 = x3 + wHold2;

    d += ` L${x1} ${topY}`;
    if (wHold1 > 0.25) d += ` L${x2} ${topY}`;
    d += ` L${x3} ${baseY}`;
    if (wHold2 > 0.25) d += ` L${x4} ${baseY}`;
  }
  return d;
}

import { useId, useMemo } from 'react';

function getTotalSeconds({ inhale, hold1, exhale, hold2 }) {
  const safeInhale = clampNumber(inhale, 0, 9999);
  const safeHold1 = clampNumber(hold1, 0, 9999);
  const safeExhale = clampNumber(exhale, 0, 9999);
  const safeHold2 = clampNumber(hold2, 0, 9999);
  const total = safeInhale + safeHold1 + safeExhale + safeHold2;
  return Math.max(0.5, total);
}

export default function BreathWaveform({ pattern, cycles = 1, showTracer = true }) {
  const uid = useId().replace(/:/g, '');
  const defaultPattern = { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
  const effectivePattern = pattern || defaultPattern;

  const d = useMemo(
    () => buildBreathPath(effectivePattern, cycles),
    [effectivePattern?.inhale, effectivePattern?.hold1, effectivePattern?.exhale, effectivePattern?.hold2, cycles]
  );

  const totalSeconds = useMemo(
    () => getTotalSeconds(effectivePattern),
    [effectivePattern?.inhale, effectivePattern?.hold1, effectivePattern?.exhale, effectivePattern?.hold2]
  );

  const glowFilterId = `breath-glow-${uid}`;
  const tracerGlowId = `breath-tracer-${uid}`;
  const motionPathId = `breath-motion-path-${uid}`;
  const tracerKey = `${effectivePattern?.inhale}-${effectivePattern?.hold1}-${effectivePattern?.exhale}-${effectivePattern?.hold2}-${cycles}`;

  return (
    <svg viewBox="-20 -20 470 104" style={{ width: "100%", height: "64px", display: "block" }}>
      <defs>
        <filter id={glowFilterId} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={tracerGlowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <path id={motionPathId} d={d} fill="none" />
      </defs>

      {/* Outer bloom glow layer */}
      <path
        d={d}
        fill="none"
        stroke="var(--accent-color)"
        strokeOpacity="0.12"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
        className="waveform-bloom"
      />

      {/* Mid glow layer */}
      <path
        d={d}
        fill="none"
        stroke="var(--accent-color)"
        strokeOpacity="0.28"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
        className="waveform-glow-mid"
      />

      {/* Inner glow layer */}
      <path
        d={d}
        fill="none"
        stroke="var(--accent-color)"
        strokeOpacity="0.55"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowFilterId})`}
        className="waveform-glow-inner"
      />

      {/* Core line */}
      <path
        d={d}
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="waveform-line"
      />

      {showTracer && (
        <g key={tracerKey} filter={`url(#${tracerGlowId})`}>
          <circle r="5" fill="var(--accent-color)" fillOpacity="0.9">
            <animateMotion dur={`${totalSeconds}s`} repeatCount="indefinite" rotate="auto" calcMode="linear">
              <mpath href={`#${motionPathId}`} xlinkHref={`#${motionPathId}`} />
            </animateMotion>
          </circle>
          <circle r="10" fill="var(--accent-color)" fillOpacity="0.18">
            <animateMotion dur={`${totalSeconds}s`} repeatCount="indefinite" rotate="auto" calcMode="linear">
              <mpath href={`#${motionPathId}`} xlinkHref={`#${motionPathId}`} />
            </animateMotion>
          </circle>
        </g>
      )}

      <style>{`
        .waveform-bloom {
          animation: sacred-breath-bloom 16s infinite ease-in-out;
        }
        
        .waveform-glow-mid {
          animation: sacred-breath-glow-mid 16s infinite ease-in-out;
        }
        
        .waveform-glow-inner {
          animation: sacred-breath-glow-inner 16s infinite ease-in-out;
        }
        
        .waveform-line {
          animation: sacred-breath-line 16s infinite ease-in-out;
        }

        @keyframes sacred-breath-bloom {
          0%, 100% { 
            stroke-opacity: 0.12;
            filter: drop-shadow(0 0 15px rgba(255, 69, 0, 0.5));
          }
          25% { 
            stroke-opacity: 0.22;
            filter: drop-shadow(0 0 45px rgba(255, 69, 0, 0.85));
          }
          50% { 
            stroke-opacity: 0.14;
            filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.55));
          }
          75% { 
            stroke-opacity: 0.25;
            filter: drop-shadow(0 0 50px rgba(255, 69, 0, 0.9));
          }
        }

        @keyframes sacred-breath-glow-mid {
          0%, 100% { 
            stroke-opacity: 0.28;
            filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.6));
          }
          25% { 
            stroke-opacity: 0.42;
            filter: drop-shadow(0 0 55px rgba(255, 69, 0, 0.9));
          }
          50% { 
            stroke-opacity: 0.32;
            filter: drop-shadow(0 0 28px rgba(255, 69, 0, 0.65));
          }
          75% { 
            stroke-opacity: 0.48;
            filter: drop-shadow(0 0 60px rgba(255, 69, 0, 0.95));
          }
        }

        @keyframes sacred-breath-glow-inner {
          0%, 100% { 
            stroke-opacity: 0.55;
            filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.7));
          }
          25% { 
            stroke-opacity: 0.72;
            filter: drop-shadow(0 0 70px rgba(255, 69, 0, 1));
          }
          50% { 
            stroke-opacity: 0.60;
            filter: drop-shadow(0 0 35px rgba(255, 69, 0, 0.75));
          }
          75% { 
            stroke-opacity: 0.78;
            filter: drop-shadow(0 0 75px rgba(255, 69, 0, 1));
          }
        }

        @keyframes sacred-breath-line {
          0%, 100% { 
            filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.6));
          }
          25% { 
            filter: drop-shadow(0 0 35px rgba(255, 69, 0, 0.9));
          }
          50% { 
            filter: drop-shadow(0 0 18px rgba(255, 69, 0, 0.65));
          }
          75% { 
            filter: drop-shadow(0 0 40px rgba(255, 69, 0, 0.95));
          }
        }
      `}</style>
    </svg>
  );
}
