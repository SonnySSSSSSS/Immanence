import React from "react";
import { isUiPickingActive } from "../../dev/uiControlsCaptureManager.js";

export function BeginPracticeButton({ label, onStart, ...rest }) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isUiPickingActive()) return;
          onStart?.();
        }}
        className="group transition-all duration-300 relative overflow-hidden begin-button"
        style={{
          width: '100%',
          maxWidth: '400px',
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '18px 52px',
          borderRadius: '60px',
          background: 'var(--ui-button-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)))',
          color: '#0a0a0a',
          textShadow: '0 0 10px var(--accent-color)',
          boxShadow: `
            0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
            inset 0 0 30px rgba(255, 255, 255, 0.25),
            0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
          `,
          transition: 'all 0.25s ease-out',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = `
            0 0 100px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 1),
            inset 0 0 35px rgba(255, 255, 255, 0.35),
            0 12px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.75)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `
            0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
            inset 0 0 30px rgba(255, 255, 255, 0.25),
            0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
          `;
        }}
        {...rest}
      >
        <div
          className="portal-glow"
          style={{
            position: 'absolute',
            inset: '-4px',
            background: 'radial-gradient(circle at center, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.6) 0%, transparent 70%)',
            opacity: 0.7,
            filter: 'blur(15px)',
            zIndex: -1,
            animation: 'portal-pulse 3s infinite ease-in-out',
          }}
        />
        <div
          className="portal-ripple"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '60px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
            opacity: 0,
            transform: 'scale(0.5)',
            transition: 'all 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
        <span className="relative z-10">{label}</span>
      </button>
      <style>{`
        @keyframes portal-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .begin-button:hover .portal-ripple {
          opacity: 1 !important;
          transform: scale(1.1) !important;
        }
      `}</style>
    </>
  );
}
