// PracticeControls.jsx
// Shared Stop button and timer display for all practice types

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

/**
 * Unified Stop button and timer display for practice sessions
 * @param {object} props
 * @param {function} props.onStop - Callback when Stop button is clicked
 * @param {string} props.formattedTime - Formatted time string (MM:SS)
 * @param {string} props.feedbackText - Optional feedback text to display
 * @param {string} props.feedbackColor - Optional feedback text color
 * @param {string} props.feedbackShadow - Optional text shadow for feedback
 * @param {string} props.buttonBg - Optional custom button background gradient
 * @param {string} props.radialGlow - Optional radial glow effect for button
 * @param {React.ReactNode} props.children - Optional additional content (e.g., breath count)
 */
export function PracticeControls({
  onStop,
  formattedTime,
  feedbackText = '',
  feedbackColor = 'var(--accent-primary)',
  feedbackShadow = 'none',
  buttonBg = null,
  radialGlow = null,
  children,
}) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  const defaultButtonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
  const defaultShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';
  
  const finalButtonBg = buttonBg || defaultButtonBg;
  const finalBoxShadow = radialGlow
    ? `${radialGlow}, ${defaultShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`
    : `0 0 24px var(--accent-30), ${defaultShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`;

  return (
    <div className="flex flex-col items-center z-50">
      {/* Feedback Text */}
      {feedbackText && (
        <div className="h-6 mb-3 flex items-center justify-center">
          <div
            className="text-[11px] font-medium tracking-[0.15em] uppercase animate-fade-in-up"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-wide)",
              color: feedbackColor,
              textShadow: feedbackShadow,
            }}
          >
            {feedbackText}
          </div>
        </div>
      )}

      {/* Stop Button */}
      <button
        onClick={onStop}
        className="rounded-full px-7 py-2.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] relative overflow-hidden"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "11px",
          letterSpacing: "var(--tracking-mythic)",
          textTransform: "uppercase",
          fontWeight: 600,
          background: finalButtonBg,
          color: "#050508",
          boxShadow: finalBoxShadow,
          borderRadius: "999px",
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ position: 'relative', zIndex: 2 }}>Stop</span>
        {/* Button shine overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
            mixBlendMode: 'soft-light',
            zIndex: 1,
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.06,
            mixBlendMode: 'overlay',
            zIndex: 1,
          }}
        />
      </button>

      {/* Timer Display */}
      <div
        className="mt-5"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "var(--tracking-mythic)",
          textTransform: "uppercase",
          color: "var(--text-primary)",
        }}
      >
        {formattedTime}
      </div>

      {/* Optional children (e.g., breath count) */}
      {children}
    </div>
  );
}

export default PracticeControls;
