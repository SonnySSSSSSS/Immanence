import React from "react";
import { useDisplayModeStore } from "../../state/displayModeStore.js";
import { PracticeIcons } from "./PracticeIcons.jsx";

export function PracticeSelector({
  selectedId,
  onSelect,
  tokens,
  PRACTICE_REGISTRY,
  GRID_PRACTICE_IDS,
  PRACTICE_UI_WIDTH,
}) {
  const displayMode = useDisplayModeStore(s => s.mode);
  const isSanctuary = displayMode === 'sanctuary';
  const isLight = tokens?.isLight;
  
  return (
    <div className="w-full" style={{ marginBottom: isSanctuary ? '28px' : '16px' }}>
      <div 
        className="grid gap-4 justify-items-stretch"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          maxWidth: PRACTICE_UI_WIDTH.maxWidth,
          margin: '0 auto',
          paddingLeft: PRACTICE_UI_WIDTH.padding,
          paddingRight: PRACTICE_UI_WIDTH.padding,
        }}
      >
        {GRID_PRACTICE_IDS.map((id) => {
          const p = PRACTICE_REGISTRY[id];
          const isActive = selectedId === id;
          const IconComponent = PracticeIcons[id] || PracticeIcons.breath;
          const iconColor = isActive ? 'var(--accent-color)' : 'var(--accent-60)';
          
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group practice-tab relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center gap-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isSanctuary ? '10px' : '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: isSanctuary ? '20px 12px' : '16px 10px',
                minHeight: isSanctuary ? '115px' : '100px',
                aspectRatio: '1 / 1.1',
                borderRadius: '16px',
                // Glassmorphic background with neon edge glow
                background: isActive 
                  ? 'linear-gradient(135deg, var(--accent-20) 0%, var(--accent-15) 50%, rgba(15, 20, 25, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: isActive ? 'blur(24px) saturate(180%)' : 'blur(16px) saturate(120%)',
                WebkitBackdropFilter: isActive ? 'blur(24px) saturate(180%)' : 'blur(16px) saturate(120%)',
                border: isActive 
                  ? '1px solid var(--accent-80)' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
                // Neon edge glow with multiple shadow layers for depth
                boxShadow: isActive 
                  ? `0 0 2px var(--accent-color),
                     0 0 8px var(--accent-80),
                     0 0 16px var(--accent-60),
                     0 0 32px var(--accent-40),
                     0 8px 32px rgba(0, 0, 0, 0.5),
                     inset 0 0 20px var(--accent-15),
                     inset 0 1px 0 rgba(255, 255, 255, 0.3),
                     inset 0 -1px 0 rgba(0, 0, 0, 0.5)` 
                  : `0 0 1px rgba(255, 255, 255, 0.3),
                     0 8px 24px rgba(0, 0, 0, 0.3),
                     0 2px 8px rgba(0, 0, 0, 0.2),
                     inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                color: isActive ? 'var(--accent-color)' : 'var(--accent-60)',
                textShadow: isActive ? '0 0 20px var(--accent-80), 0 0 12px var(--accent-60), 0 2px 4px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(0, 0, 0, 0.5)',
                opacity: isActive ? 1 : 0.75,
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'translateY(-4px) scale(1.02)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                  e.currentTarget.style.backdropFilter = 'blur(20px) saturate(150%)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-15) 0%, rgba(255, 255, 255, 0.04) 100%)';
                  e.currentTarget.style.border = '1px solid var(--accent-50)';
                  e.currentTarget.style.boxShadow = `0 0 2px var(--accent-80),
                                                      0 0 8px var(--accent-60),
                                                      0 0 16px var(--accent-40),
                                                      0 8px 28px rgba(0, 0, 0, 0.4),
                                                      inset 0 0 15px var(--accent-10),
                                                      inset 0 1px 0 rgba(255, 255, 255, 0.15)`;
                  e.currentTarget.style.textShadow = '0 0 12px var(--accent-60), 0 0 8px var(--accent-40)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.opacity = '0.75';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backdropFilter = 'blur(16px) saturate(120%)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.boxShadow = '0 0 1px rgba(255, 255, 255, 0.3), 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
                }
              }}
            >
              {/* Ornamental frame overlay (reference-style card border) */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: '0',
                  zIndex: 1,
                  opacity: isActive ? 0.9 : 0.55,
                  filter: isActive ? 'drop-shadow(0 0 10px var(--accent-40))' : 'none',
                }}
              >
                <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="99"
                    height="99"
                    rx="16"
                    stroke={isActive ? 'var(--accent-60)' : 'rgba(255, 255, 255, 0.16)'}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Corner flourishes */}
                  <path
                    d="M2 18 Q2 2 18 2"
                    stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M5 14 Q5 5 14 5"
                    stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth="1"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />

                  <g transform="translate(100 0) scale(-1 1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  <g transform="translate(0 100) scale(1 -1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  <g transform="translate(100 100) scale(-1 -1)">
                    <path
                      d="M2 18 Q2 2 18 2"
                      stroke={isActive ? 'var(--accent-70)' : 'rgba(255, 255, 255, 0.22)'}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M5 14 Q5 5 14 5"
                      stroke={isActive ? 'var(--accent-40)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </svg>
              </div>

              {/* Inline SVG Icon */}
              <div 
                className="transition-transform duration-500" 
                style={{ 
                  marginBottom: '8px',
                  filter: isActive 
                    ? 'drop-shadow(0 0 4px var(--accent-color)) drop-shadow(0 0 8px var(--accent-80)) drop-shadow(0 0 12px var(--accent-60))' 
                    : 'none',
                }}
              >
                <IconComponent color={iconColor} size={isSanctuary ? 32 : 28} />
              </div>
              <div className="text-center leading-tight" style={{ lineHeight: '1.4' }}>
                <div>{p.labelLine1}</div>
                {p.labelLine2 && <div>{p.labelLine2}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
