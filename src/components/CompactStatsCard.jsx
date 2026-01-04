// src/components/CompactStatsCard.jsx
// Premium visual stats card with precision-of-time tracking
// Targets the "ancient relic / celestial technology" aesthetic

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useTrackingStore } from '../state/trackingStore.js';
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { calculateGradientAngle, getAvatarCenter } from "../utils/dynamicLighting.js";
import { useTheme } from '../context/ThemeContext';

/**
 * THEME CONFIGURATION
 * Defines distinct visual rules for Light and Dark modes
 */
const THEME_CONFIG = {
    light: {
        accent: 'rgba(139, 159, 136, 0.85)', // Muted sage green, not bright lime
        glow: 'rgba(139, 159, 136, 0.4)',
        wellBg: 'rgba(245, 239, 230, 0.6)', // Warm cream
        barBg: 'rgba(139, 115, 85, 0.12)', // Earth brown
        textMain: 'rgba(35, 20, 10, 0.98)', // Even darker for maximum readability
        textSub: 'rgba(65, 45, 25, 0.9)',
        bgAsset: 'painted_card_organic.png', // Organic edges version
        dabAssets: [
            'textured_blob_1.png',
            'textured_blob_2.png',
            'textured_blob_3.png',
            'textured_blob_4.png',
            'textured_blob_5.png'
        ],
        canvasGrain: 'canvas_grain.png',
        border: 'rgba(139, 115, 85, 0.25)',
        wellBorder: 'rgba(139, 115, 85, 0.15)',
        threadColor: 'rgba(139, 159, 136, 0.7)'
    },
    dark: {
        accent: 'var(--accent-color)',
        glow: 'var(--accent-glow)',
        wellBg: 'rgba(10, 15, 25, 0.75)',
        barBg: 'rgba(255, 255, 255, 0.05)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        streamAsset: 'filament_silk_alpha.png',
        peakGem: 'gem_active_alpha.png',
        lowGem: 'gem_low_alpha.png',
        emptyGem: 'gem_empty_alpha.png',
        progressAsset: 'progress_glow_alpha.png',
        border: 'var(--accent-20)',
        wellBorder: 'var(--accent-15)',
        threadColor: 'var(--accent-color)'
    }
};

/**
 * Tooltip Component - Positioned relative to page to avoid clipping
 */
function Tooltip({ text, position }) {
    if (!text || !position) return null;
    return (
        <div
            className="fixed z-[100] px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 text-white text-[10px] pointer-events-none shadow-2xl transition-opacity duration-200"
            style={{
                left: position.x,
                top: position.y - 40,
                transform: 'translateX(-50%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
        >
            <div className="font-bold tracking-wider uppercase mb-0.5 text-white/50">{text.day}</div>
            <div className="font-mono text-amber-200">{text.time}</div>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45" />
        </div>
    );
}

/**
 * Regiment Progress - Glass Capsule Liquid Bar (Accent-Color Adaptive)
 */
function RegimentProgress({ progress, isLight, r, g, b }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    const percentage = Math.round(progress * 100);

    // Convert RGB to CSS color
    const accentRGB = `rgb(${r}, ${g}, ${b})`;

    return (
        <div className="flex flex-col items-end gap-1 flex-1 w-full">
            {isLight ? (
                <div className="w-full h-[32px] relative flex flex-col justify-center">
                    {/* Background brush stroke shape */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <path
                            d="M2,20 Q50,15 100,20 T198,20"
                            fill="none"
                            stroke="rgba(180, 160, 140, 0.1)"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Progress brush stroke */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <defs>
                            <clipPath id="regimentClip">
                                <rect x="0" y="0" width={percentage * 2} height="40" />
                            </clipPath>
                        </defs>
                        <path
                            d="M2,20 Q50,15 100,20 T198,20"
                            fill="none"
                            stroke={accentRGB}
                            strokeWidth="14"
                            strokeLinecap="round"
                            style={{ opacity: 0.7, filter: 'blur(1px)' }}
                            clipPath="url(#regimentClip)"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    {/* Texture overlay from brush dab */}
                    <img
                        src={`${import.meta.env.BASE_URL}assets/brush_dab_1.png`}
                        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none mix-blend-overlay"
                        alt=""
                    />
                </div>
            ) : (
                <div
                    className="w-full h-[18px] rounded-full relative overflow-hidden backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(15, 10, 20, 0.8), rgba(10, 5, 15, 0.9))',
                        border: `1.5px solid rgba(${r}, ${g}, ${b}, 0.3)`,
                        boxShadow: `inset 0 4px 12px rgba(0, 0, 0, 0.7),
        inset 0 -1px 2px rgba(255, 255, 255, 0.05),
            0 3px 8px rgba(${r}, ${g}, ${b}, 0.25)`,
                        padding: '2px'
                    }}
                >
                    {/* Multi-layered Glow */}
                    <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 blur-lg opacity-40"
                        style={{
                            width: `${percentage}%`,
                            background: `radial-gradient(ellipse at center, ${accentRGB}, transparent 70%)`
                        }}
                    />
                    <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 blur-md opacity-30"
                        style={{
                            width: `${percentage}%`,
                            background: accentRGB
                        }}
                    />

                    {/* Dynamic Liquid Glass Bar */}
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative z-10"
                        style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(135deg,
                    rgba(${r}, ${g}, ${b}, 0.85) 0%,
                    rgba(${r}, ${g}, ${b}, 1) 50%,
                    rgba(${r}, ${g}, ${b}, 0.75) 100%)`,
                            boxShadow: `0 0 12px rgba(${r}, ${g}, ${b}, 0.5),
        inset 0 1px 2px rgba(255, 255, 255, 0.3)`
                        }}
                    >
                        {/* Plasma Shimmer */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                                animation: 'shimmer 3s ease-in-out infinite',
                                backgroundSize: '200% 100%'
                            }}
                        />
                        {/* Inner Highlight */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%)'
                            }}
                        />
                    </div>

                    {/* Capsule Specular Highlight */}
                    <div
                        className="absolute inset-x-4 top-[3px] h-[6px] rounded-full blur-[2px] z-20 pointer-events-none"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)'
                        }}
                    />
                </div>
            )}

            {/* Shimmer Animation */}
            <style>{`
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
`}</style>
        </div>
    );
}

/**
 * Precision Timeline - 5-Level Timing Architecture
 */
function PrecisionTimeline({ weekOffsets, isLight, r, g, b }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const [hoverInfo, setHoverInfo] = useState(null);

    // 5-Level Snap Logic
    const getVerticalPosition = (offset) => {
        if (offset === null) return null;
        
        // Exact: +/- 1 min (Level 3 - Center)
        if (Math.abs(offset) <= 1) return 3;
        
        // Early
        if (offset > 1) {
            if (offset >= 8) return 5; // Level 5 (Top) - ≥ 10m (using 8 as snap threshold)
            return 4; // Level 4 - ~5m
        }
        
        // Late
        if (offset < -1) {
            if (offset <= -8) return 1; // Level 1 (Bottom) - ≥ 10m
            return 2; // Level 2 - ~5m
        }
        
        return 3;
    };

    const slotHeights = {
        5: 15,  // Top (Early 10m+)
        4: 35,  // Upper (Early 5m)
        3: 55,  // Center (Exact)
        2: 75,  // Lower (Late 5m)
        1: 95   // Bottom (Late 10m+)
    };

    return (
        <div
            className="w-full relative mt-4 pt-5 pb-6 rounded-[28px] transition-all duration-700"
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(252, 248, 240, 0.45) 0%, rgba(248, 244, 235, 0.5) 50%, rgba(245, 240, 230, 0.45) 100%)'
                    : config.wellBg,
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: `1px solid ${config.border}`,
                borderRadius: '28px',
                boxShadow: isLight
                    ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 10px 25px rgba(0,0,0,0.05)'
                    : 'inset 0 6px 25px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.5)',
                marginLeft: '40px' // Make room for labels on the left
            }}
        >
            {/* Header Text - ABOVE the chart, more legible */}
            <div
                className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-2 relative z-10"
                style={{ 
                    color: config.textMain, 
                    fontFamily: 'var(--font-display)',
                    opacity: 0.7,
                    textShadow: isLight 
                        ? '0 1px 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.5)' 
                        : '0 1px 2px rgba(0,0,0,0.5)'
                }}
            >
                Timing Precision • 5-Level Scale
            </div>

            {/* Chart Container */}
            <div className="relative">
                {/* Guide Threads (Horizontal lines) */}
                <div className="absolute inset-x-0 top-0 bottom-[40px] px-8 flex flex-col justify-between pointer-events-none opacity-10">
                {[5, 4, 3, 2, 1].map(lvl => (
                    <div key={lvl} className="w-full h-px" style={{ background: config.textMain, borderTop: lvl === 3 ? '1px dashed' : 'none' }} />
                ))}
            </div>

            {/* Scale Labels - OUTSIDE chart on the left */}
            <div 
                className="absolute left-[-38px] top-[20px] bottom-[40px] w-[32px] flex flex-col justify-between items-end text-[8px] font-bold opacity-50 pointer-events-none uppercase tracking-tight pr-1" 
                style={{ color: config.textMain }}
            >
                <span>+10m</span>
                <span>+5m</span>
                <span className="opacity-100 font-black">Exact</span>
                <span>-5m</span>
                <span>-10m</span>
            </div>

            {/* Main Chart Area */}
            <div className="flex justify-between items-start pl-1 pr-6 relative z-10 h-[110px] pt-2">
                {days.map((day, i) => {
                    const data = weekOffsets[i] || { offsetMinutes: null, practiced: false };
                    const slot = getVerticalPosition(data.offsetMinutes);
                    const yPos = slot ? slotHeights[slot] : null;
                    const isActive = data.practiced && slot !== null;

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center relative flex-1"
                            onMouseEnter={(e) => {
                                if (!isActive) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverInfo({
                                    day: day + ' TIMING',
                                    time: data.offsetMinutes === 0 ? 'Exactly on time' : 
                                          data.offsetMinutes > 0 ? `${data.offsetMinutes.toFixed(0)}m early` : 
                                          `${Math.abs(data.offsetMinutes).toFixed(0)}m late`,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top + (yPos || 0)
                                });
                            }}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            {/* Neural Connectors (Vertical Lines) */}
                            <div 
                                className="absolute top-0 bottom-[-30px] w-px opacity-5" 
                                style={{ background: config.textMain, left: '50%' }} 
                            />

                            {/* Data Point - Always show blob, adjust opacity for inactive */}
                            <div 
                                className="relative transition-all duration-700 ease-out"
                                style={{ 
                                    transform: `translateY(${isActive ? yPos : 55}px)`,
                                    opacity: isActive ? 1 : 0.25
                                }}
                            >
                                {isLight ? (
                                    <img
                                        src={`${import.meta.env.BASE_URL}assets/textured_blob_${(i % 5) + 1}.png`}
                                        className="w-7 h-7 object-contain"
                                        alt=""
                                        style={{
                                            filter: isActive ? (() => {
                                                const max = Math.max(r, g, b) / 255;
                                                const min = Math.min(r, g, b) / 255;
                                                let h = 0;
                                                if (max !== min) {
                                                    const d = max - min;
                                                    const rn = r / 255, gn = g / 255, bn = b / 255;
                                                    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
                                                    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
                                                    else h = ((rn - gn) / d + 4) / 6;
                                                }
                                                const targetHue = Math.round(h * 360);
                                                return `hue-rotate(${targetHue - 120}deg) saturate(1.2)`;
                                            })() : 'grayscale(100%)'
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                                        style={{
                                            background: isActive ? `rgb(${r}, ${g}, ${b})` : 'transparent',
                                            borderColor: isActive ? `rgba(${r}, ${g}, ${b}, 0.5)` : config.border,
                                            boxShadow: isActive ? `0 0 10px rgba(${r}, ${g}, ${b}, 0.3)` : 'none'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Day label */}
                            <span
                                className="absolute bottom-[-25px] text-[10px] font-black transition-all duration-300"
                                style={{
                                    color: config.textMain,
                                    opacity: data.practiced ? 0.8 : 0.2,
                                    fontFamily: 'var(--font-display)'
                                }}
                            >
                                {day}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Tooltip Overlay */}
            <Tooltip text={hoverInfo} position={hoverInfo} />
            </div>{/* End Chart Container */}
        </div>
    );
}

/**
 * Metric Ring Component
 */
function MetricRing({ label, value, isLight }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    return (
        <div className="flex flex-col items-center relative">
            <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Decorative outer dash ring */}
                <svg className="absolute inset-0 w-full h-full rotate-45" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={config.border} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
                </svg>
                <div className="flex flex-col items-center">
                    <span className="text-[22px] font-black leading-none" style={{ color: config.textMain }}>{value}</span>
                </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mt-1" style={{ color: config.textSub }}>{label}</span>
        </div>
    );
}

/**
 * Main CompactStatsCard Component
 */
export function CompactStatsCard({ domain = 'wisdom', streakInfo, onOpenArchive }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];

    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    const getAllStats = useProgressStore(s => s.getAllStats);
    const allStats = getAllStats?.() || {};
    const domainStats = allStats[domain] || { count: 0, totalMinutes: 0 };
    const streak = streakInfo?.currentStreak || 0;

    // Get stage accent color from theme
    const theme = useTheme();
    const primaryHex = theme?.accent?.primary || '#4ade80';
    
    // Parse hex to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 126, g: 217, b: 87 };
    };
    
    const baseAccent = hexToRgb(primaryHex);
    
    // Calculate hue rotation from cyan/teal baseline (~180deg) to stage accent
    const stageHueRotate = (() => {
        const { r, g, b } = baseAccent;
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        let h = 0;
        if (max !== min) {
            const d = max - min;
            const rn = r / 255, gn = g / 255, bn = b / 255;
            if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
            else if (max === gn) h = ((bn - rn) / d + 2) / 6;
            else h = ((rn - gn) / d + 4) / 6;
        }
        const targetHue = Math.round(h * 360);
        return targetHue - 180; // Subtly shift from the cyan/purple baseline of the milky way
    })();
    
    // Create shade variations of the stage accent (adjust lightness)
    const adjustBrightness = (rgb, factor) => ({
        r: Math.min(255, Math.round(rgb.r * factor)),
        g: Math.min(255, Math.round(rgb.g * factor)),
        b: Math.min(255, Math.round(rgb.b * factor))
    });
    
    const domainConfig = {
        wisdom: {
            title: 'Cognitive Vipassana',
            metricLabel: 'Focus Stability',
            curriculumLabel: 'Sanctuary of Mind',
            unit: '%',
            ...adjustBrightness(baseAccent, 1.0) // Base shade
        },
        breathwork: {
            title: 'Rhythm Calibration',
            metricLabel: 'Breath Precision',
            curriculumLabel: 'Pranic Regulation',
            unit: '%',
            ...adjustBrightness(baseAccent, 0.8) // Darker shade
        },
        visualization: {
            title: 'Radiant Schematics',
            metricLabel: 'Vividness Depth',
            curriculumLabel: 'Conceptual Mapping',
            unit: '%',
            ...adjustBrightness(baseAccent, 1.15) // Lighter shade
        }
    };

    const currentDomain = domainConfig[domain] || domainConfig.wisdom;
    const getTrajectory = useTrackingStore(s => s.getTrajectory);
    const sessionsCount = useTrackingStore(s => s.sessions.length);
    const logsCount = useTrackingStore(s => Object.keys(s.dailyLogs).length);
    
    const trajectory = useMemo(() => getTrajectory(7), [getTrajectory, sessionsCount, logsCount]);
    
    // New: Get Timing Offsets for the 5-level chart
    const getWeeklyTimingOffsets = useTrackingStore(s => s.getWeeklyTimingOffsets);
    const trackingDomain = domain === 'breathwork' ? 'breath' : 
                          domain === 'wisdom' ? 'cognitive_vipassana' : 
                          'visualization';
    const weekOffsets = useMemo(() => getWeeklyTimingOffsets(trackingDomain), [getWeeklyTimingOffsets, trackingDomain, sessionsCount]);

    // Calculate actual regiment progress based on past 7 weeks or path completion
    const activePath = useTrackingStore(s => s.activePath);
    const regimentProgress = activePath 
        ? (activePath.completedWeeks.length / activePath.totalWeeks)
        : (weekOffsets.filter(d => d.practiced).length / 7);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight]);

    const domainLabels = { wisdom: 'Wisdom', breathwork: 'Breathwork', visualization: 'Visualization' };
    const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

    return (
        <div
            className="w-full relative transition-all duration-700 ease-in-out"
            style={{
                maxWidth: isSanctuary ? '600px' : '430px',
                margin: '0 auto',
            }}
        >
            {/* OUTER: Golden Border Frame - Using reliable box-shadow for depth */}
            <div
                className="w-full relative"
                style={{
                    borderRadius: '24px',
                    boxShadow: isLight 
                        ? '0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 0 1px rgba(180, 140, 60, 0.3)'
                        : '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* MIDDLE: Parchment Background Container */}
                <div
                    ref={cardRef}
                    className="w-full h-full relative"
                    style={{
                        overflow: 'visible',
                    }}
                >
                    {/* INNER: Masked Content - Softened to 98% */}
                    <div
                        className="w-full h-full relative"
                        style={{
                            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at center, black 98%, transparent 100%)',
                            maskImage: 'radial-gradient(ellipse 100% 100% at center, black 98%, transparent 100%)',
                        }}
                    >
            {/* Painted Surface Background Layer */}
            {isLight && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.bgAsset})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transform: 'scale(1.04)', // Reduced scale for better containment
                        transformOrigin: 'center'
                    }}
                />
            )}

            {/* Canvas Grain Overlay - subtle texture */}
            {isLight && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.canvasGrain})`,
                        backgroundSize: '256px 256px',
                        backgroundRepeat: 'repeat',
                        mixBlendMode: 'multiply',
                        opacity: 0.05,
                        transform: 'scale(1.04)', // Match scale of background
                        transformOrigin: 'center'
                    }}
                />
            )}


            {/* Dark mode background */}
            {!isLight && (
                <>
                    <div
                        className="absolute inset-0 rounded-[24px]"
                        style={{
                            backgroundImage: `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98)), 
                               linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                            boxShadow: `0 30px 80px rgba(0, 0, 0, 0.7), 
                               inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                        }}
                    />
                    
                    {/* Cosmic Feather - Single Dominant Object (Mirrors light mode feather) */}
                    <div 
                        className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none"
                        style={{ opacity: 0.6, mixBlendMode: 'screen' }}
                    >
                        <div 
                            className="absolute inset-0 transition-all duration-1000"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/dark_mode_cosmic_feather.png)`,
                                backgroundSize: '100% 100%', 
                                backgroundPosition: 'center',
                                filter: `hue-rotate(${stageHueRotate}deg) contrast(1.1) saturate(1.2)`,
                                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)'
                            }}
                        />
                    </div>
                </>
            )}

            {/* Content Container - Shortened bottom to pull parchment edge up */}
            <div className={`relative px-9 ${isLight ? 'pt-5 pb-2' : 'py-3'} z-10`} style={{ background: 'transparent' }}>

                {/* Header Row: Date only (domain label moved to vertical) */}
                <div className="flex justify-end items-center mb-2 relative z-10">
                    <div
                        className="text-[10px] font-black tabular-nums tracking-wide opacity-50"
                        style={{
                            color: config.textSub,
                            textShadow: isLight ? '0 1px 1px rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                    >
                        {today}
                    </div>
                </div>



                {/* Secondary Section: Two-Column Stats Layout */}
                <div className="relative mb-4 flex gap-0 h-[140px]">
                    {/* Vertical Domain Label - Left Edge, Aligned to VERY TOP */}
                    <div 
                        className="absolute left-[-8px] top-[-8px] flex items-start justify-center z-20"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.35em]"
                            style={{
                                color: config.textMain,
                                textShadow: isLight 
                                    ? '0 1px 3px rgba(255,255,255,0.8), 0 0 6px rgba(255,255,255,0.6)' 
                                    : '0 0 8px rgba(0,0,0,0.8)',
                                opacity: 0.9,
                                textDecoration: 'underline',
                                textDecorationThickness: '1px',
                                textUnderlineOffset: '0px'
                            }}
                        >
                            {domainLabels[domain]}
                        </span>
                    </div>

                    {/* Left Column: Graphics (Feather) - REDUCED WIDTH */}
                    <div className="w-[25%] relative">
                        {/* Dark mode feather centered on left */}
                        {!isLight && (
                            <div 
                                className="absolute inset-x-[-20%] inset-y-0 opacity-80 mix-blend-screen"
                                style={{
                                    backgroundImage: `url(${import.meta.env.BASE_URL}assets/dark_mode_cosmic_feather.png)`,
                                    backgroundSize: '180% 100%',
                                    backgroundPosition: 'left center',
                                    filter: `hue-rotate(${stageHueRotate}deg) contrast(1.1) saturate(1.2)`,
                                    WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
                                    maskImage: 'linear-gradient(to right, black 50%, transparent 100%)'
                                }}
                            />
                        )}
                        {/* Light mode - feather is in the bg, leave graphic area empty or smaller icon */}
                    </div>

                    {/* Celestial Thread Divider */}
                    <div className="w-px h-full relative overflow-visible">
                        <div 
                            className="absolute inset-0 blur-[1px]" 
                            style={{ 
                                background: `linear-gradient(to bottom, transparent, ${config.accent}, transparent)`,
                                opacity: 0.6
                            }} 
                        />
                        <div 
                            className="absolute inset-y-2 left-[-1px] right-[-1px]" 
                            style={{ 
                                background: config.accent,
                                boxShadow: `0 0 10px ${config.accent}`
                            }} 
                        />
                        {/* Ornamental beads on the thread */}
                        <div className="absolute top-[20%] left-[-2px] w-1.5 h-1.5 rounded-full" style={{ background: config.accent, border: `1px solid ${config.wellBg}` }} />
                        <div className="absolute top-[80%] left-[-2px] w-1.5 h-1.5 rounded-full" style={{ background: config.accent, border: `1px solid ${config.wellBg}` }} />
                    </div>

                    {/* Right Column: Data - VERTICALLY STACKED, RIGHT ALIGNED */}
                    <div className="flex-1 flex flex-col justify-center items-end pr-4">
                        {/* Streak */}
                        <div className="mb-3 text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block" style={{ color: config.textSub }}>Streak</span>
                            <div className="flex items-center justify-end gap-2">
                                <div className="flex flex-col items-center">
                                    {isLight ? (
                                        <img
                                            src={`${import.meta.env.BASE_URL}assets/impasto_fire.png`}
                                            className="w-5 h-5 object-contain"
                                            alt="Fire"
                                        />
                                    ) : (
                                        <span className="text-xl">🔥</span>
                                    )}
                                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] opacity-40" style={{ color: config.textSub }}>Days</span>
                                </div>
                                <span className="text-[32px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                                    {streak}
                                </span>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 block" style={{ color: config.textSub }}>Sessions</span>
                            <div className="flex items-center justify-end gap-2">
                                <div className="flex flex-col items-center">
                                    {isLight ? (
                                        <img
                                            src={`${import.meta.env.BASE_URL}assets/impasto_meditator.png`}
                                            className="w-5 h-5 object-contain"
                                            alt="Meditator"
                                        />
                                    ) : (
                                        <span className="text-xl">🧘</span>
                                    )}
                                    <span className="text-[7px] font-bold uppercase tracking-[0.15em] opacity-40" style={{ color: config.textSub }}>Total</span>
                                </div>
                                <span className="text-[32px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                                    {domainStats.count || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tertiary Section: Practice Precision - Timing Offset Scale */}
                <div className="relative z-10">
                    <PrecisionTimeline 
                        weekOffsets={weekOffsets} 
                        isLight={isLight} 
                        r={currentDomain.r} 
                        g={currentDomain.g} 
                        b={currentDomain.b} 
                    />
                </div>

                {/* Bottom Section - Archive Link */}
                <div className={`mt-3 flex items-center justify-center px-2`}>
                    <button
                        onClick={(e) => {
                            console.log('BOTTOM Archive clicked');
                            e.stopPropagation();
                            onOpenArchive?.();
                        }}
                        className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ color: config.textMain }}
                    >
                        ⟨ VIEW ARCHIVE ⟩
                    </button>
                </div>
            </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default CompactStatsCard;
