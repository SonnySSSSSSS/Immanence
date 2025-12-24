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
          
          /* Base gold fill */
          background: ${isLight ? '#D4AF37' : '#C9A942'};
          
          /* Layer 3: Edge bevel (metal depth) */
          box-shadow: 
            /* Outer shadows (depth below surface) */
            0 2px 4px rgba(0, 0, 0, ${isLight ? '0.25' : '0.35'}),
            0 1px 2px rgba(0, 0, 0, ${isLight ? '0.15' : '0.25'}),
            /* Inner highlight (top rim catch-light) */
            inset 0 1px 0 rgba(255, 255, 255, ${isLight ? '0.5' : '0.4'}),
            /* Inner shadow (bottom bevel) */
            inset 0 -1px 0 rgba(0, 0, 0, ${isLight ? '0.25' : '0.35'});
        }

        /* Layer 1: Base gold texture (CSS noise via SVG filter) */
        .gold-base {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          opacity: ${isLight ? '0.5' : '0.6'};
          mix-blend-mode: ${isLight ? 'multiply' : 'overlay'};
        }

        /* Layer 2: Specular gradient (CSS-controlled lighting) */
        .gold-specular {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 245, 200, ${isLight ? '0.6' : '0.5'}) 0%,
            rgba(212, 175, 55, 0.2) 50%,
            rgba(180, 140, 30, ${isLight ? '0.4' : '0.5'}) 100%
          );
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* State change shimmer animation */
        .cartouche-plate.state-change .gold-specular {
          animation: goldShimmer 0.6s ease-out;
        }

        @keyframes goldShimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 1.15; }
        }

        /* Typography (embossed text carved into gold) */
        .cartouche-text {
          position: relative;
          z-index: 1;
          display: inline-block;
          font-family: var(--font-display);
          font-variant: small-caps;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: ${isLight ? '#3d2a1a' : '#2a1f15'};
          
          /* Restrained emboss: 1 highlight + 1 shadow */
          text-shadow: 
            0 1px 0 rgba(255, 255, 255, ${isLight ? '0.25' : '0.2'}),
            0 -1px 0 rgba(0, 0, 0, ${isLight ? '0.45' : '0.55'});
        }
      `}</style>
        </div>
    );
}
