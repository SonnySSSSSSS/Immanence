// src/components/StageTitle.jsx
// Shared Stage Title component for displaying current stage and path across all sections
import React, { useState } from "react";

// Sanskrit path names with their closest one-word English translations
const PATH_TRANSLATIONS = {
  soma: { sanskrit: 'Soma', english: 'Sensory' },
  prana: { sanskrit: 'Prana', english: 'Breath' },
  dhyana: { sanskrit: 'Dhyana', english: 'Meditation' },
  drishti: { sanskrit: 'Drishti', english: 'Vision' },
  jnana: { sanskrit: 'Jnana', english: 'Knowledge' },
  samyoga: { sanskrit: 'Samyoga', english: 'Union' },
};

// Stage colors for glow effects and styling
export const STAGE_COLORS = {
  seedling: { gradient: ["#4ade80", "#22c55e", "#16a34a"], glow: "#22c55e" },
  ember: { gradient: ["#fb923c", "#f97316", "#ea580c"], glow: "#f97316" },
  flame: { gradient: ["#fbbf24", "#f59e0b", "#d97706"], glow: "#f59e0b" },
  beacon: { gradient: ["#60a5fa", "#3b82f6", "#2563eb"], glow: "#3b82f6" },
  stellar: { gradient: ["#c084fc", "#a855f7", "#9333ea"], glow: "#a855f7" },
};

// CSS-based Stage Title Component with horizontal layout
export function StageTitle({ stage, path, showWelcome = true }) {
  const [showEnglish, setShowEnglish] = useState(false);

  const stageLower = (stage || "flame").toLowerCase();
  const stageColors = STAGE_COLORS[stageLower] || STAGE_COLORS.flame;

  // Capitalize first letter
  const stageName = (stage || "Flame").charAt(0).toUpperCase() + (stage || "Flame").slice(1).toLowerCase();

  // Get the path translation, or fallback to capitalized path
  const pathLower = path ? path.toLowerCase() : null;
  const pathTranslation = pathLower ? PATH_TRANSLATIONS[pathLower] : null;
  const pathName = pathTranslation
    ? (showEnglish ? pathTranslation.english : pathTranslation.sanskrit)
    : (path ? path.charAt(0).toUpperCase() + path.slice(1).toLowerCase() : null);

  // Check if we have a path to display
  const hasPath = path && path.trim() !== '';

  return (
    <div className="stage-title-container relative flex flex-col items-center justify-center overflow-visible">

      {/* Welcome label - optional */}
      {showWelcome && (
        <div
          className="text-[10px] uppercase tracking-[0.3em] mb-3"
          style={{
            color: 'rgba(253,251,245,0.4)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {hasPath ? 'Welcome Back · Current Path' : 'Current Stage'}
        </div>
      )}

      {/* Ambient glow */}
      <div
        className="stage-ambient-glow absolute"
        style={{
          width: '350px',
          height: '50px',
          top: showWelcome ? '60%' : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse 100% 100% at center, ${stageColors.glow}35 0%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Particles - subtle sparkles for contrast */}
      <div className="absolute pointer-events-none" style={{ width: '400px', height: '80px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="stage-particle absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${10 + (i * 11)}%`,
              top: `${20 + ((i * 17) % 60)}%`,
              backgroundColor: stageColors.gradient[i % 3],
              opacity: 0.4 + (i % 3) * 0.1,
              animation: `particleFloat${i % 4} ${3 + (i % 2)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 ${4 + (i % 2) * 2}px ${stageColors.glow}60`,
            }}
          />
        ))}
      </div>

      {/* Title container - Composite Image based with text fallback */}
      <div className="relative flex items-center justify-center -mt-2">
        {/* Background separation - dark backing for contrast */}
        <div
          className="absolute -inset-x-8 -inset-y-4 rounded-xl"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />

        {/* Composite: Stage Image + Separator + Path Image */}
        <div className="composite-title-row flex items-center justify-center gap-4 relative z-10">
          {/* Stage image - centered when no path, left-aligned when path exists */}
          <img
            src={`${import.meta.env.BASE_URL}titles/stage-${stageLower}.png`}
            alt={stageName}
            className="stage-title-img h-16 w-auto object-contain transition-opacity duration-500"
            style={{
              // Stage-specific outlines + edge discipline
              filter: (() => {
                // Base effects
                const base = 'drop-shadow(0 2px 3px rgba(0,0,0,0.5)) contrast(1.05)';

                // Stage-specific outlines
                if (stageLower === 'ember') {
                  // Softer white 1px outline for EMBER (reduced 20%)
                  return `
                    drop-shadow(0 0 1px rgba(255,255,255,0.7))
                    drop-shadow(0 0 1px rgba(255,255,255,0.5))
                    ${base}
                  `;
                } else if (stageLower === 'flame') {
                  // Balanced white outline for FLAME (77/57/37 for good visibility)
                  return `
                    drop-shadow(0 0 1px rgba(255,255,255,0.77))
                    drop-shadow(0 0 2px rgba(255,255,255,0.57))
                    drop-shadow(0 0 3px rgba(255,255,255,0.37))
                    ${base}
                  `;
                } else if (stageLower === 'stellar') {
                  // Darker gray 1px outline for STELLAR
                  return `
                    drop-shadow(0 0 1px rgba(120,120,120,0.9))
                    drop-shadow(0 0 1px rgba(140,140,140,0.7))
                    ${base}
                  `;
                }
                // Default for SEEDLING, BEACON
                return `drop-shadow(0 0 1px rgba(0,0,0,0.8)) ${base}`;
              })(),
              // Vertical luminance gradient: darker at base, brighter at top (silhouette authority)
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 100%)',
              maxWidth: hasPath ? '200px' : '300px',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              // Show text fallback if stage image fails
              const fallback = e.currentTarget.closest('.relative')?.querySelector('.text-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />

          {/* Separator dot - only if path exists */}
          {hasPath && (
            <span
              className="text-base opacity-40 mx-1"
              style={{
                color: stageColors.gradient[1],
                textShadow: `0 0 8px ${stageColors.glow}60`,
              }}
            >
              ·
            </span>
          )}

          {/* Path image (right) - balanced with stage */}
          {hasPath && (
            <img
              src={`${import.meta.env.BASE_URL}titles/path-${pathLower}.png`}
              alt={pathName}
              className="path-title-img h-16 w-auto object-contain transition-opacity duration-500"
              style={{
                filter: `
                  drop-shadow(0 2px 3px rgba(0,0,0,0.6))
                  drop-shadow(0 0 1px rgba(0,0,0,0.8))
                  contrast(1.05)
                `,
                maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 100%)',
                maxWidth: '200px',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Text Fallback (Hidden by default if image loads, shown on error) */}
        <div
          className="text-fallback stage-title-text relative items-center justify-center gap-2"
          style={{
            display: 'none', // Hidden initially, shown by onError
            filter: `drop-shadow(0 0 30px ${stageColors.glow}30)`,
          }}
        >
          {/* Stage name */}
          <span
            className="stage-name text-[1.75rem] font-medium uppercase tracking-[0.08em]"
            style={{
              fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
              color: '#fdfbf5',
              textShadow: `
                0 0 20px rgba(253,251,245,0.3),
                0 0 40px rgba(253,251,245,0.15)
              `,
              letterSpacing: '0.02em',
            }}
          >
            {stageName}
          </span>

          {/* Separator */}
          {hasPath && (
            <span
              className="text-[0.9rem] opacity-30"
              style={{
                color: stageColors.gradient[1],
                textShadow: `0 0 10px ${stageColors.glow}50`,
              }}
            >
              ·
            </span>
          )}

          {/* Path name */}
          {hasPath && (
            <span
              className="stage-path text-[1.6rem] font-normal uppercase tracking-[0.1em]"
              onClick={() => setShowEnglish(!showEnglish)}
              title={showEnglish ? "Click for Sanskrit" : "Click for English"}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                backgroundImage: `linear-gradient(135deg, ${stageColors.gradient[0]} 0%, ${stageColors.gradient[1]} 50%, ${stageColors.gradient[2]} 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'pathGradient 4s ease-in-out infinite',
                filter: `drop-shadow(0 0 15px ${stageColors.glow}40)`,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              {pathName}
            </span>
          )}
        </div>
      </div>

      {/* Geometric Base - Minimal line with flanking sacred geometry */}
      <div className="stage-geometric-base relative flex items-center justify-center mt-4" style={{ width: '320px' }}>

        {/* Left flanking geometry - small diamond */}
        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-40">
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="none"
            stroke={stageColors.gradient[1]}
            strokeWidth="0.75"
            style={{ filter: `drop-shadow(0 0 4px ${stageColors.glow}50)` }}
          />
        </svg>

        {/* Left crosshair accent */}
        <svg width="16" height="8" viewBox="0 0 16 8" className="opacity-30 mx-1">
          <line x1="0" y1="4" x2="16" y2="4" stroke={stageColors.gradient[0]} strokeWidth="0.5" />
          <line x1="8" y1="0" x2="8" y2="8" stroke={stageColors.gradient[0]} strokeWidth="0.5" />
        </svg>

        {/* Center gradient line */}
        <div
          className="stage-accent-line h-[1px] flex-1 rounded-full mx-2"
          style={{
            background: `linear-gradient(90deg, 
              ${stageColors.gradient[1]}60 0%, 
              rgba(253,251,245,0.3) 30%,
              ${stageColors.gradient[1]} 50%, 
              rgba(253,251,245,0.3) 70%,
              ${stageColors.gradient[1]}60 100%
            )`,
            boxShadow: `0 0 12px ${stageColors.glow}40`,
          }}
        />

        {/* Center ornament - subtle star/compass point */}
        <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-60 mx-1">
          <circle cx="5" cy="5" r="1.5" fill={stageColors.gradient[1]} style={{ filter: `drop-shadow(0 0 3px ${stageColors.glow})` }} />
          <path
            d="M5 0 L5 2.5 M5 7.5 L5 10 M0 5 L2.5 5 M7.5 5 L10 5"
            stroke={stageColors.gradient[0]}
            strokeWidth="0.5"
            opacity="0.5"
          />
        </svg>

        {/* Right gradient line */}
        <div
          className="stage-accent-line h-[1px] flex-1 rounded-full mx-2"
          style={{
            background: `linear-gradient(90deg, 
              ${stageColors.gradient[1]}60 0%, 
              rgba(253,251,245,0.3) 30%,
              ${stageColors.gradient[1]} 50%, 
              rgba(253,251,245,0.3) 70%,
              ${stageColors.gradient[1]}60 100%
            )`,
            boxShadow: `0 0 12px ${stageColors.glow}40`,
          }}
        />

        {/* Right crosshair accent */}
        <svg width="16" height="8" viewBox="0 0 16 8" className="opacity-30 mx-1">
          <line x1="0" y1="4" x2="16" y2="4" stroke={stageColors.gradient[0]} strokeWidth="0.5" />
          <line x1="8" y1="0" x2="8" y2="8" stroke={stageColors.gradient[0]} strokeWidth="0.5" />
        </svg>

        {/* Right flanking geometry - small diamond */}
        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-40">
          <path
            d="M6 0 L12 6 L6 12 L0 6 Z"
            fill="none"
            stroke={stageColors.gradient[1]}
            strokeWidth="0.75"
            style={{ filter: `drop-shadow(0 0 4px ${stageColors.glow}50)` }}
          />
        </svg>
      </div>

      {/* CSS Animations */}
      <style>{`
        .stage-title-text {
          animation: titleFloat 6s ease-in-out infinite;
        }
        
        .stage-ambient-glow {
          animation: ambientPulse 4s ease-in-out infinite;
        }
        
        .stage-accent-line {
          animation: lineGlow 3s ease-in-out infinite;
        }
        
        .stage-name {
          animation: nameGlow 5s ease-in-out infinite;
        }
        
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes pathGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        
        @keyframes lineGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        
        @keyframes nameGlow {
          0%, 100% { 
            text-shadow: 
              0 0 20px rgba(253,251,245,0.3),
              0 0 40px rgba(253,251,245,0.15);
          }
          50% { 
            text-shadow: 
              0 0 25px rgba(253,251,245,0.4),
              0 0 50px rgba(253,251,245,0.2);
          }
        }

        /* Particle float animations - 4 variations */
        @keyframes particleFloat0 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-8px) translateX(3px); opacity: 0.6; }
          50% { transform: translateY(-4px) translateX(-2px); opacity: 0.5; }
          75% { transform: translateY(-10px) translateX(1px); opacity: 0.4; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
          33% { transform: translateY(-6px) translateX(-4px); opacity: 0.7; }
          66% { transform: translateY(-12px) translateX(2px); opacity: 0.4; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-10px) translateX(-3px); opacity: 0.6; }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-8px) rotate(180deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
