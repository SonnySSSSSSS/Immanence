// src/components/StageTitle.jsx
// Shared Stage Title component for displaying current stage and path across all sections
import React, { useState, useRef, useEffect } from "react";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { GoldCartouche } from "./GoldCartouche.jsx";
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from "../utils/dynamicLighting.js";
import { STAGE_COLORS } from "../constants/stageColors.js";

// Sanskrit path names with their closest one-word English translations
const PATH_TRANSLATIONS = {
    yantra: { sanskrit: 'Yantra', english: 'Ritual' },
    kaya: { sanskrit: 'Kaya', english: 'Somatic' },
    chitra: { sanskrit: 'Chitra', english: 'Imaginal' },
    nada: { sanskrit: 'Nada', english: 'Sonic' },
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
        // Yantra (Symbolic): Triangular lattice - intentional structure
        yantra: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <polygon points="12,3 21,19 3,19" stroke={iconColor} strokeWidth="1" opacity="0.55" />
                <polygon points="12,6 18,17 6,17" stroke={iconColor} strokeWidth="1" opacity="0.65" />
                <circle cx="12" cy="12" r="1.6" fill={iconColor} opacity="0.95" />
            </svg>
        ),
        // Kaya (Somatic): Concentric field rings - embodied presence
        kaya: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="1" opacity="0.35" />
                <circle cx="12" cy="12" r="5.5" stroke={iconColor} strokeWidth="1" opacity="0.55" />
                <circle cx="12" cy="12" r="2.5" fill={iconColor} opacity="0.85" />
            </svg>
        ),
        // Chitra (Imaginal): Petal star - morphing vision
        chitra: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 3 L14.5 9 L21 12 L14.5 15 L12 21 L9.5 15 L3 12 L9.5 9 Z" stroke={iconColor} strokeWidth="1" opacity="0.55" />
                <circle cx="12" cy="12" r="2.2" fill={iconColor} opacity="0.9" />
            </svg>
        ),
        // Nada (Sonic): Wave rings - rhythmic resonance
        nada: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M3 12 Q6 9 9 12 T15 12 T21 12" stroke={iconColor} strokeWidth="1.2" opacity="0.7" />
                <path d="M4 16 Q7 13 10 16 T16 16 T20 16" stroke={iconColor} strokeWidth="1" opacity="0.5" />
                <circle cx="12" cy="8" r="1.5" fill={iconColor} opacity="0.85" />
            </svg>
        ),
    };

    return icons[path?.toLowerCase()] || icons.yantra;
};

// Stage colors for glow effects and styling


// Textured Title Card Component - Geometrically Stable with Minimal Texture
const TexturedTitleCard = ({ children, stageColors, isLight, width }) => {
    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    // Calculate gradient angle based on position relative to avatar
    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const avatarCenter = getAvatarCenter();
            const angle = calculateGradientAngle(rect, avatarCenter);
            setGradientAngle(angle);
        }
    }, []);

    // Static SVG noise texture URL for marble effect (minimal opacity)
    const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' seed='15' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`;

    // Stage-adaptive tint color (use gradient midpoint)
    const tintColor = stageColors.gradient[1];

    return (
        <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl"
            style={{
                // Fixed padding to maintain stable internal grid - compact sizing
                padding: '4px 34px 4px',
                width: width,
                minWidth: width ? undefined : '300px',

                // Refined Gold Border - Beveled Light Simulation (Dynamic lighting from avatar)
                border: '2px solid transparent',
                backgroundImage: isLight
                    ? `
            linear-gradient(rgba(255,252,248,0.96), rgba(255,250,242,0.92)),
            ${getDynamicGoldGradient(gradientAngle, true)}
          `
                    : `
            linear-gradient(rgba(22,20,18,0.88), rgba(16,14,12,0.82)),
            linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))
          `,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',

                // Soft shadow for depth + specular highlight + contact shadow
                boxShadow: isLight
                    ? `
            0 0 0 0.5px #AF8B2C,
            inset -1px -1px 0 0.5px rgba(255, 250, 235, 0.8),
            inset 1px 1px 0 0.5px rgba(101, 67, 33, 0.6),
            0 3px 16px rgba(100,80,50,0.08),
            inset 0 1px 0 rgba(255,255,255,0.4)
          `
                    : `
            0 0 0 0.5px rgba(255,255,255,0.1),
            0 3px 20px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,250,240,0.04)
          `,

                // Minimal blur
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
            }}
        >
            {/* Noise/Marble Texture Overlay - VERY SUBTLE (4% max) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: noiseTexture,
                    backgroundSize: 'cover',
                    mixBlendMode: 'normal', // Default to normal for clean edges
                    opacity: isLight ? 0.04 : 0.03,
                }}
            />

            {/* Stage-Tinted Vein Overlay - Even more subtle */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: isLight
                        ? `radial-gradient(ellipse 100% 70% at 35% 40%, ${tintColor}08 0%, transparent 55%)`
                        : `radial-gradient(ellipse 100% 70% at 35% 40%, ${tintColor}05 0%, transparent 55%)`,
                    mixBlendMode: 'normal',
                }}
            />

            {/* Content Layer - Fixed 2-Row Grid */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

// CSS-based Stage Title Component with stacked vertical layout
export function StageTitle({ stage, path, attention, showWelcome = true, width }) {
    const [showEnglish, setShowEnglish] = useState(false);
    const [tooltip, setTooltip] = useState(null); // 'stage', 'path', or null
    const [tooltipTimer, setTooltipTimer] = useState(null);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const stageAssetStyle = useDisplayModeStore(s => s.stageAssetStyle);
    const isLight = colorScheme === 'light';

    const stageLower = (stage || "flame").toLowerCase();
    const stageColors = STAGE_COLORS[stageLower] || STAGE_COLORS.flame;

    // Capitalize first letter
    const stageName = (stage || "Flame").charAt(0).toUpperCase() + (stage || "Flame").slice(1).toLowerCase();

    // Get the path translation, or fallback to capitalized path
    const pathLower = path ? path.toLowerCase() : null;
    const hasPath = path && path.trim() !== '';
    const shouldShowPath = stageLower !== 'seedling' && hasPath;
    const pathTranslation = shouldShowPath ? PATH_TRANSLATIONS[pathLower] : null;
    const pathName = pathTranslation
        ? (showEnglish ? pathTranslation.english : pathTranslation.sanskrit)
        : (shouldShowPath ? path.charAt(0).toUpperCase() + path.slice(1).toLowerCase() : null);

    // Tooltip descriptions (general, non-statistical)
    const STAGE_DESCRIPTIONS = {
        seedling: "Your journey is just beginning. This stage represents the planting of seeds of awareness.",
        ember: "A spark of dedication has ignited. You're building the foundations of consistent practice.",
        flame: "Your practice burns steady. Discipline and understanding are growing stronger.",
        beacon: "You've become a light for yourself. Deep patterns of awareness are now established.",
        stellar: "Mastery radiates from within. Your practice illuminates every aspect of life.",
    };

    const PATH_DESCRIPTIONS = {
        yantra: "The path of ritual. Symbolic structure and deliberate form stabilize attention.",
        kaya: "The path of the body. Awareness grows through sensation and the felt field.",
        chitra: "The path of vision. Imaginal clarity shapes perception and inner sight.",
        nada: "The path of rhythm. Breath and sound entrain the nervous system.",
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
    const currentPathDescription = shouldShowPath ? PATH_DESCRIPTIONS[pathLower] : null;

    return (
        <div
            className="stage-title-container relative flex flex-col items-center justify-center overflow-visible"
            style={{ zIndex: 15 }}
        >

            {/* Welcome label - optional */}
            {/* Welcome text removed per user request */}

            {/* Ambient glow */}
            <div
                className="stage-ambient-glow absolute"
                style={{
                    width: '400px',
                    height: '60px',
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

            {/* Divider Tick above Title - Vertical Spine (Coupling to Orb) */}
            <div
                className="relative -mb-1 opacity-30 pointer-events-none"
                style={{ color: stageColors.gradient[1] }}
            >
                <svg width="2" height="20" viewBox="0 0 2 20" fill="none">
                    <rect width="2" height="20" fill="currentColor" rx="1" />
                </svg>
            </div>

            {/* Title container - Geometrically Stable Textured Card */}
            <TexturedTitleCard stageColors={stageColors} isLight={isLight} hasPath={shouldShowPath} attention={attention} width={width}>
                {/* FIXED 2-ROW GRID LAYOUT*/}
                <div className="flex flex-col items-center gap-1">

                    {/* ROW 1: Stage + Attention Vector + Path (3 EQUAL columns) */}
                    <div
                        className="grid items-center justify-items-center w-full"
                        style={{
                            gridTemplateColumns: '1fr 1fr 1fr', // 3 equal columns
                            gap: '16px'
                        }}
                    >
                        {/* LEFT COL: Stage (Centered) */}
                        <div className="flex justify-center w-full">
                            <div
                                className="relative cursor-help"
                                onMouseEnter={() => handleMouseEnter('stage')}
                                onMouseLeave={handleMouseLeave}
                            >
                                <img
                                    src={`${import.meta.env.BASE_URL}titles/set${stageAssetStyle}/${isLight ? 'light' : 'dark'}/stage_${stageLower}.png?v=${stageAssetStyle}`}
                                    alt={stageLower}
                                    className="h-20 w-auto object-contain transition-transform duration-500"
                                    style={{
                                        filter: isLight 
                                            ? 'brightness(0.95) contrast(1.1)' 
                                            : 'brightness(1.15) contrast(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.3))',
                                        transform: `scale(${stageAssetStyle === 1 ? 1 : 1.8})`,
                                        imageRendering: 'crisp-edges'
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.closest('.relative')?.querySelector('.text-fallback');
                                        if (fallback) fallback.style.display = 'block';
                                    }}
                                />

                                {/* Text fallback for Stage */}
                                <span
                                    className="text-fallback text-[1.4rem] font-medium uppercase"
                                    style={{
                                        display: 'none',
                                        fontFamily: "var(--font-display)",
                                        color: isLight ? 'rgba(45, 40, 35, 0.9)' : stageColors.gradient[1],
                                        letterSpacing: '0.25em',
                                    }}
                                >
                                    {stageName}
                                </span>

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
                        </div>

                        {/* MID COL: Attention Vector (Gold Cartouche) OR Separator (Centered) */}
                        <div className="flex items-center justify-center">
                            {attention && attention !== 'none' ? (
                                <GoldCartouche
                                    text={attention}
                                    stageColor={stageColors.gradient[1]}
                                    isLight={isLight}
                                />
                            ) : (
                                <div
                                    className="divider-glyph relative"
                                    style={{
                                        opacity: shouldShowPath ? 0.5 : 0,
                                        visibility: shouldShowPath ? 'visible' : 'hidden',
                                        width: '18px',
                                        transition: 'opacity 0.3s ease'
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 14 14">
                                        <path
                                            d="M7 1 L13 7 L7 13 L1 7 Z"
                                            fill="none"
                                            stroke={stageColors.gradient[1]}
                                            strokeWidth="1.2"
                                            style={{
                                                filter: `drop-shadow(0 0 3px ${stageColors.glow}40)`,
                                            }}
                                        />
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
                        </div>

                        {/* RIGHT COL: Path (Centered) */}
                        <div className="flex justify-center w-full items-center">
                            {shouldShowPath && (
                                <div
                                    className="path-section relative flex items-center justify-center cursor-help"
                                    onMouseEnter={() => handleMouseEnter('path')}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <img
                                        src={`${import.meta.env.BASE_URL}titles/set${stageAssetStyle}/${isLight ? 'light' : 'dark'}/path_${pathLower}.png?v=${stageAssetStyle}`}
                                        alt={pathLower}
                                        className="h-20 w-auto object-contain transition-transform duration-500"
                                        style={{
                                            filter: isLight 
                                                ? 'brightness(0.95) contrast(1.1)' 
                                                : 'brightness(1.15) contrast(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.3))',
                                            transform: `scale(${stageAssetStyle === 1 ? 1 : 1.8})`,
                                            imageRendering: 'crisp-edges'
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const textFallback = e.currentTarget.parentElement?.querySelector('.path-text-fallback');
                                            if (textFallback) textFallback.style.display = 'block';
                                        }}
                                    />

                                    {/* Path text fallback */}
                                    <span
                                        className="path-text-fallback text-[1.3rem] tracking-[0.08em]"
                                        onClick={() => setShowEnglish(!showEnglish)}
                                        style={{
                                            display: 'none',
                                            fontFamily: "var(--font-body)",
                                            fontStyle: 'italic',
                                            fontWeight: 500,
                                            color: `${stageColors.gradient[1]}dd`,
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
                    </div>

                    {/* ROW 2: Removed - Attention now inline in Row 1 as gold cartouche */}
                </div>
            </TexturedTitleCard>


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
        </div >
    );
}
