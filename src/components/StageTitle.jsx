// src/components/StageTitle.jsx
// Shared Stage Title component for displaying current stage and path across all sections
import React, { useState } from "react";
import { useDisplayModeStore } from "../state/displayModeStore.js";

// Sanskrit path names with their closest one-word English translations
const PATH_TRANSLATIONS = {
  soma: { sanskrit: 'Soma', english: 'Sensory' },
  prana: { sanskrit: 'Prana', english: 'Breath' },
  dhyana: { sanskrit: 'Dhyana', english: 'Meditation' },
  drishti: { sanskrit: 'Drishti', english: 'Vision' },
  jnana: { sanskrit: 'Jnana', english: 'Knowledge' },
  samyoga: { sanskrit: 'Samyoga', english: 'Union' },
};

// Attention vector labels
const ATTENTION_LABELS = {
  vigilance: 'vigilance',
  sahaja: 'sahaja',
  ekagrata: 'ekagrata',
};

// Sacred geometry path icons (SVG components)
const PathIcon = ({ path, color, size = 20 }) => {
  const iconColor = color || 'currentColor';

  const icons = {
    // Soma (Body): Concentric circles - grounded body-field
    soma: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="1" opacity="0.4" />
        <circle cx="12" cy="12" r="6" stroke={iconColor} strokeWidth="1" opacity="0.6" />
        <circle cx="12" cy="12" r="2.5" fill={iconColor} opacity="0.9" />
      </svg>
    ),
    // Prana (Breath): Spiral flow lines - vital currents
    prana: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3 C8 5, 6 9, 8 12 C10 15, 8 19, 12 21"
          stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"
        />
        <path
          d="M12 3 C16 5, 18 9, 16 12 C14 15, 16 19, 12 21"
          stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"
        />
        <circle cx="12" cy="12" r="2" fill={iconColor} opacity="0.9" />
      </svg>
    ),
    // Dhyana (Meditation): Abstract lotus geometry - stillness
    dhyana: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 4 L14 10 L12 8 L10 10 Z" stroke={iconColor} strokeWidth="0.8" fill={iconColor} opacity="0.5" />
        <path d="M12 4 L16 12 L12 9 L8 12 Z" stroke={iconColor} strokeWidth="0.8" opacity="0.4" />
        <ellipse cx="12" cy="18" rx="6" ry="2" stroke={iconColor} strokeWidth="1" opacity="0.5" />
        <circle cx="12" cy="12" r="2" fill={iconColor} opacity="0.9" />
      </svg>
    ),
    // Drishti (Vision): Aperture/lens rings - radiating perception
    drishti: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="0.8" opacity="0.3" />
        <path d="M12 3 L12 6 M12 18 L12 21 M3 12 L6 12 M18 12 L21 12" stroke={iconColor} strokeWidth="1" opacity="0.5" />
        <path d="M5.5 5.5 L7.5 7.5 M16.5 16.5 L18.5 18.5 M5.5 18.5 L7.5 16.5 M16.5 7.5 L18.5 5.5" stroke={iconColor} strokeWidth="0.8" opacity="0.4" />
        <circle cx="12" cy="12" r="4" stroke={iconColor} strokeWidth="1" opacity="0.6" />
        <circle cx="12" cy="12" r="1.5" fill={iconColor} opacity="0.95" />
      </svg>
    ),
    // Jnana (Wisdom): Crystalline light burst - knowledge
    jnana: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L12 7 M12 17 L12 22 M2 12 L7 12 M17 12 L22 12" stroke={iconColor} strokeWidth="1.2" opacity="0.6" />
        <path d="M5 5 L8.5 8.5 M15.5 15.5 L19 19 M5 19 L8.5 15.5 M15.5 8.5 L19 5" stroke={iconColor} strokeWidth="0.8" opacity="0.4" />
        <polygon points="12,6 14,10 12,9 10,10" fill={iconColor} opacity="0.7" />
        <polygon points="12,18 14,14 12,15 10,14" fill={iconColor} opacity="0.7" />
        <circle cx="12" cy="12" r="2.5" fill={iconColor} opacity="0.9" />
      </svg>
    ),
    // Samyoga (Integration): Vesica piscis / interlocking rings - unity
    samyoga: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="12" r="6" stroke={iconColor} strokeWidth="1" opacity="0.5" />
        <circle cx="15" cy="12" r="6" stroke={iconColor} strokeWidth="1" opacity="0.5" />
        <ellipse cx="12" cy="12" rx="2.5" ry="5" fill={iconColor} opacity="0.3" />
        <circle cx="12" cy="12" r="1.5" fill={iconColor} opacity="0.9" />
      </svg>
    ),
  };

  return icons[path?.toLowerCase()] || icons.soma;
};

// Stage colors for glow effects and styling
export const STAGE_COLORS = {
  seedling: { gradient: ["#4ade80", "#22c55e", "#16a34a"], glow: "#22c55e" },
  ember: { gradient: ["#fb923c", "#f97316", "#ea580c"], glow: "#f97316" },
  flame: { gradient: ["#fbbf24", "#f59e0b", "#d97706"], glow: "#f59e0b" },
  beacon: { gradient: ["#60a5fa", "#3b82f6", "#2563eb"], glow: "#3b82f6" },
  stellar: { gradient: ["#c084fc", "#a855f7", "#9333ea"], glow: "#a855f7" },
};

// CSS-based Stage Title Component with stacked vertical layout
export function StageTitle({ stage, path, attention, showWelcome = true }) {
  const [showEnglish, setShowEnglish] = useState(false);
  const [tooltip, setTooltip] = useState(null); // 'stage', 'path', or null
  const [tooltipTimer, setTooltipTimer] = useState(null);
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

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

  // Tooltip descriptions (general, non-statistical)
  const STAGE_DESCRIPTIONS = {
    seedling: "Your journey is just beginning. This stage represents the planting of seeds of awareness.",
    ember: "A spark of dedication has ignited. You're building the foundations of consistent practice.",
    flame: "Your practice burns steady. Discipline and understanding are growing stronger.",
    beacon: "You've become a light for yourself. Deep patterns of awareness are now established.",
    stellar: "Mastery radiates from within. Your practice illuminates every aspect of life.",
  };

  const PATH_DESCRIPTIONS = {
    soma: "The path of embodiment. Cultivating awareness through the body and senses.",
    prana: "The path of breath. Using life force as the doorway to presence.",
    dhyana: "The path of meditation. Training the mind through stillness and focus.",
    drishti: "The path of vision. Developing clear seeing and insight.",
    jnana: "The path of knowledge. Understanding through wisdom and inquiry.",
    samyoga: "The path of integration. Unifying all aspects of self and practice.",
  };

  // Tooltip handlers with 2-second delay
  const handleMouseEnter = (type) => {
    const timer = setTimeout(() => {
      setTooltip(type);
    }, 2000);
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      setTooltipTimer(null);
    }
    setTooltip(null);
  };

  const currentStageDescription = STAGE_DESCRIPTIONS[stageLower] || STAGE_DESCRIPTIONS.flame;
  const currentPathDescription = pathLower ? PATH_DESCRIPTIONS[pathLower] : null;

  return (
    <div className="stage-title-container relative flex flex-col items-center justify-center overflow-visible">

      {/* Welcome label - optional */}
      {/* Welcome text removed per user request */}

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
        {/* Background separation - dark backing for contrast (dark mode only) */}
        {!isLight && (
          <div
            className="absolute -inset-x-8 -inset-y-4 rounded-xl"
            style={{
              background: 'radial-gradient(ellipse 100% 100% at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              filter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Composite: Stage Image + Separator + Path Image */}
        <div className="composite-title-row flex items-center justify-center gap-4 relative z-10">
          {/* Stage image - with hover tooltip */}
          <div
            className="relative cursor-help"
            onMouseEnter={() => handleMouseEnter('stage')}
            onMouseLeave={handleMouseLeave}
          >
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

            {/* Stage Tooltip */}
            {tooltip === 'stage' && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-3 px-4 py-3 rounded-xl z-[9999] animate-fade-in"
                style={{
                  background: 'rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${stageColors.glow}40`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${stageColors.glow}20`,
                  width: '260px',
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'rgba(253,251,245,0.85)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ color: stageColors.glow, fontWeight: 600 }}>{stageName}</span>
                  <br />
                  {currentStageDescription}
                </div>
              </div>
            )}
          </div>

          {/* Divider glyph - symbolic separator (Option C) */}
          {hasPath && (
            <div className="divider-glyph relative mx-3" style={{ opacity: 0.6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" className="transition-opacity duration-300">
                {/* Diamond outline */}
                <path
                  d="M7 1 L13 7 L7 13 L1 7 Z"
                  fill="none"
                  stroke={stageColors.gradient[1]}
                  strokeWidth="1.2"
                  style={{
                    filter: `drop-shadow(0 0 3px ${stageColors.glow}40)`,
                  }}
                />
                {/* Center dot for weight */}
                <circle
                  cx="7"
                  cy="7"
                  r="1.5"
                  fill={stageColors.gradient[1]}
                  opacity="0.8"
                />
              </svg>
            </div>
          )}

          {/* Path section - with hover tooltip */}
          {hasPath && (
            <div
              className="path-section relative flex items-center justify-center cursor-help"
              onMouseEnter={() => handleMouseEnter('path')}
              onMouseLeave={handleMouseLeave}
            >
              {/* Subtle gold halo behind path */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(ellipse 100% 80% at center, ${stageColors.glow}08 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                  zIndex: 0,
                }}
              />

              {/* Path image - enhanced visibility with increased brightness */}
              <img
                src={`${import.meta.env.BASE_URL}titles/path-${pathLower}.png`}
                alt={pathName}
                className="path-title-img h-24 w-auto object-contain transition-opacity duration-500 relative z-10"
                style={{
                  filter: `
                    brightness(1.23)
                    drop-shadow(0 0 8px ${stageColors.glow}50)
                    drop-shadow(0 2px 4px rgba(0,0,0,0.7))
                  `,
                  maxWidth: '288px',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Show calligraphic text fallback
                  const textFallback = e.currentTarget.parentElement?.querySelector('.path-text-fallback');
                  if (textFallback) textFallback.style.display = 'block';
                }}
              />

              {/* Path text fallback - calligraphic style */}
              <span
                className="path-text-fallback text-[1.5rem] tracking-[0.08em]"
                onClick={() => setShowEnglish(!showEnglish)}
                style={{
                  display: 'none',
                  fontFamily: "var(--font-body)",
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: `${stageColors.gradient[1]}dd`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                {pathName}
              </span>

              {/* Path Tooltip */}
              {tooltip === 'path' && currentPathDescription && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 px-4 py-3 rounded-xl z-[9999] animate-fade-in"
                  style={{
                    background: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${stageColors.glow}40`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${stageColors.glow}20`,
                    width: '280px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: 'rgba(253,251,245,0.85)',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ color: stageColors.glow, fontWeight: 600 }}>{pathName}</span>
                    <br />
                    {currentPathDescription}
                  </div>
                </div>
              )}
            </div>
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
            className="stage-name text-[1.75rem] font-medium uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: '#fdfbf5',
              textShadow: `
                0 0 20px rgba(253,251,245,0.3),
                0 0 40px rgba(253,251,245,0.15)
              `,
              letterSpacing: 'var(--tracking-tight)',
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
              className="stage-path text-[1.6rem] font-normal uppercase"
              onClick={() => setShowEnglish(!showEnglish)}
              title={showEnglish ? "Click for Sanskrit" : "Click for English"}
              style={{
                fontFamily: "var(--font-display)",
                backgroundImage: `linear-gradient(135deg, ${stageColors.gradient[0]} 0%, ${stageColors.gradient[1]} 50%, ${stageColors.gradient[2]} 100%)`,
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'pathGradient 4s ease-in-out infinite',
                filter: `drop-shadow(0 0 15px ${stageColors.glow}40)`,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                letterSpacing: 'var(--tracking-normal)',
              }}
            >
              {pathName}
            </span>
          )}
        </div>
      </div>

      {/* Decorative Divider - moved up to sit above attention vector */}
      <div className="flex items-center justify-center gap-3 w-full -mt-4 mb-2 px-8">
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

      {/* Attention Vector Row - enhanced contrast and vertical spacing */}
      {attention && attention !== 'none' && (
        <div
          className="attention-row relative flex items-center justify-center gap-2 -mt-1 mb-3"
          style={{
            fontFamily: "var(--font-ui)",
          }}
        >
          {/* Subtle bloom background for legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 140% 120% at center, ${stageColors.glow}25 0%, ${stageColors.glow}12 30%, transparent 70%)`,
              filter: 'blur(8px)',
              zIndex: 0,
            }}
          />

          {/* Small dot separator */}
          <span
            className="text-[10px] opacity-30 relative z-10"
            style={{ color: stageColors.gradient[1] }}
          >
            ·
          </span>

          {/* Attention text - enhanced contrast */}
          <span
            className="text-[10px] text-suspended relative z-10"
            style={{
              color: stageColors.gradient[1],
              opacity: 0.6,
              textShadow: `0 0 12px ${stageColors.glow}20`,
            }}
          >
            {attention}
          </span>

          {/* Small dot separator */}
          <span
            className="text-[10px] opacity-30 relative z-10"
            style={{ color: stageColors.gradient[1] }}
          >
            ·
          </span>
        </div>
      )}

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
