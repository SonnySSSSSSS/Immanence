import React, { useMemo } from 'react';
import { MODE_COLORS, normalizeModeWeights, ANIMATION_DEFAULTS } from './constants.js';

export function ModeBlendField({ modeWeights }) {
  const normalized = useMemo(() => normalizeModeWeights(modeWeights), [modeWeights]);
  const modeTransition = `${ANIMATION_DEFAULTS.modeTransitionMs}ms`;

  return (
    <div className="avatar-v3__layer">
      <div
        className="avatar-v3__layer avatar-v3__field avatar-v3__field-drift"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08), rgba(0,0,0,0) 70%)',
          opacity: 0.2,
        }}
      />
      {Object.entries(normalized).map(([mode, weight]) => {
        const color = MODE_COLORS[mode];
        const opacity = Math.min(0.28, weight * 0.38);
        const gradient =
          mode === 'photic'
            ? `radial-gradient(circle at 40% 30%, ${color}, rgba(0,0,0,0) 65%)`
            : mode === 'haptic'
              ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${color} 75%)`
              : mode === 'sonic'
                ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${color} 55%, rgba(0,0,0,0) 100%)`
                : `radial-gradient(circle at 50% 55%, ${color}, rgba(0,0,0,0) 70%)`;
        return (
          <div
            key={mode}
            className="avatar-v3__layer avatar-v3__field"
            style={{
              background: gradient,
              opacity,
              transition: `opacity ${modeTransition} linear`,
            }}
          />
        );
      })}
    </div>
  );
}
