// src/components/GoldCartouche.jsx
// Authority Material Component - Polished Gold Seal for State Indicators
import React from 'react';

export function GoldCartouche({ text, stageColor, isLight = false, onStateChange = false }) {
  return (
    <div className="gold-cartouche inline-block">
      <div className={`cartouche-plate ${onStateChange ? 'state-change' : ''}`}>
        {/* Layer 1: Base gold texture (CSS-generated micro grain) */}
        <div className="gold-base" />

        {/* Layer 2: Specular gradient (controlled lighting) */}
        <div className="gold-specular" />

        {/* Layer 3: Text content with emboss */}
        <span className="cartouche-text">{text}</span>
      </div>

      <style>{`
        .gold-cartouche {
          vertical-align: middle;
        }

        .cartouche-plate {
          position: relative;
          display: inline-block;
          border-radius: 6px;
          padding: 4px 12px 5px;
          overflow: hidden;
          
          /* Deckle edge - subtle irregularity for hand-torn parchment */
          clip-path: polygon(
            1% 2%, 3% 1%, 97% 0%, 99% 2%,
            100% 98%, 98% 99%, 2% 100%, 0% 97%
          );
          
          /* Material selection: Gold for Light, Obsidian for Dark */
          background: ${isLight ? '#D4AF37' : '#1A0F1C'};
          
          /* Layer 3: Edge bevel (metal depth) */
          box-shadow: 
            /* Outer shadows (depth below surface) */
            0 2px 4px rgba(0, 0, 0, ${isLight ? '0.25' : '0.6'}),
            0 1px 2px rgba(0, 0, 0, ${isLight ? '0.15' : '0.4'}),
            /* Inner highlight (top rim catch-light) */
            inset 0 1px 0 rgba(255, 255, 255, ${isLight ? '0.5' : '0.1'}),
            /* Inner shadow (bottom bevel) */
            inset 0 -1px 0 rgba(0, 0, 0, ${isLight ? '0.25' : '0.5'});
          
          border: ${isLight ? 'none' : '0.5px solid rgba(255, 255, 255, 0.05)'};
        }

        /* Layer 1: Base texture */
        .gold-base {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${isLight ? '0.15' : '0.3'}'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          opacity: ${isLight ? '0.5' : '0.3'};
          mix-blend-mode: ${isLight ? 'multiply' : 'overlay'};
        }

        /* Layer 2: Specular gradient */
        .gold-specular {
          position: absolute;
          inset: 0;
          background: ${isLight
          ? `linear-gradient(
                135deg,
                rgba(255, 245, 200, 0.6) 0%,
                rgba(212, 175, 55, 0.2) 50%,
                rgba(180, 140, 30, 0.4) 100%
              )`
          : `linear-gradient(
                135deg,
                rgba(167, 139, 250, 0.1) 0%,
                rgba(0, 0, 0, 0) 50%,
                rgba(0, 0, 0, 0.4) 100%
              )`
        };
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* State change shimmer animation */
        .cartouche-plate.state-change .gold-specular {
          animation: goldShimmer 0.6s ease-out;
        }

        @keyframes goldShimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: ${isLight ? '1.15' : '1.3'}; }
        }

        /* Typography (embossed/debossed text) */
        .cartouche-text {
          position: relative;
          z-index: 1;
          display: inline-block;
          font-family: var(--font-display);
          font-variant: small-caps;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: ${isLight ? '#3d2a1a' : 'rgba(253, 251, 245, 0.85)'};
          
          /* Restrained emboss: 1 highlight + 1 shadow */
          text-shadow: 
            0 1px 0 rgba(255, 255, 255, ${isLight ? '0.25' : '0.05'}),
            0 -1px 0 rgba(0, 0, 0, ${isLight ? '0.45' : '0.8'});
        }
      `}</style>
    </div>
  );
}
