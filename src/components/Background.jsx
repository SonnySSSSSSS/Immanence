// src/components/Background.jsx
// Dark background with velvet texture overlay

import React from "react";

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep dark base - almost black with slight blue tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0d0d18] to-[#08080c]" />

      {/* Very subtle center glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(5, 5, 8, 0.6) 100%)",
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* VELVET TEXTURE - SVG noise overlay for materiality */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="velvetNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              seed="42"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.99
                      0 0 0 0 0.98
                      0 0 0 0 0.96
                      0 0 0 0.15 0"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          filter: "url(#velvetNoise)",
          mixBlendMode: "soft-light",
          opacity: 1,
        }}
      />
    </div>
  );
}
