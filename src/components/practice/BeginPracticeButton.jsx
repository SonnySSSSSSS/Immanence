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
          textShadow: '0 0 5px var(--accent-color)',
          boxShadow: `
            0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4),
            inset 0 0 15px rgba(255, 255, 255, 0.12),
            0 4px 10px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.28)
          `,
          transition: 'all 0.25s ease-out',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = `
            0 0 50px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.5),
            inset 0 0 18px rgba(255, 255, 255, 0.18),
            0 6px 15px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.38)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `
            0 0 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4),
            inset 0 0 15px rgba(255, 255, 255, 0.12),
            0 4px 10px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.28)
          `;
        }}
        {...rest}
      >
        <div
          className="portal-glow"
          style={{
            position: 'absolute',
            inset: '-4px',
            background: 'radial-gradient(circle at center, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3) 0%, transparent 70%)',
            opacity: 0.35,
            filter: 'blur(8px)',
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
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .begin-button:hover .portal-ripple {
          opacity: 1 !important;
          transform: scale(1.1) !important;
        }
      `}</style>
    </>
  );
}
