import React from "react";
import { AccessPostureOptionButton } from "./AccessPostureOptionButton.jsx";

export function AccessPosturePill({ accessPosture, setAccessPosture, isLight }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="Access posture"
      aria-checked={accessPosture === 'full'}
      data-testid="posture-pill-toggle"
      onClick={() => setAccessPosture(accessPosture === 'guided' ? 'full' : 'guided')}
      className="inline-flex items-center rounded-full border select-none"
      style={{
        position: 'absolute',
        bottom: '-22px',
        right: '28px',
        zIndex: 10,
        height: '22px',
        padding: '2px',
        gap: 0,
        borderColor: isLight ? 'var(--accent-30)' : 'var(--accent-30)',
        background: isLight ? 'rgba(236,246,248,0.72)' : 'rgba(7,14,20,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'border-color 200ms',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '2px',
          bottom: '2px',
          borderRadius: '999px',
          width: '50%',
          left: accessPosture === 'guided' ? '2px' : '50%',
          transition: 'left 200ms cubic-bezier(0.4,0,0.2,1)',
          background: isLight ? 'var(--accent-40)' : 'var(--accent-50)',
          boxShadow: '0 1px 4px var(--accent-20)',
        }}
      />
      <span data-testid="posture-toggle-guided">
        <AccessPostureOptionButton
          label="GUIDED"
          value="guided"
          accessPosture={accessPosture}
          isLight={isLight}
        />
      </span>
      <span data-testid="posture-toggle-full">
        <AccessPostureOptionButton
          label="FULL"
          value="full"
          accessPosture={accessPosture}
          isLight={isLight}
        />
      </span>
    </button>
  );
}
