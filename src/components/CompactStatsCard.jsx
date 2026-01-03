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
 * Precision Timeline - Neural Thread SVG Architecture
 */
function PrecisionTimeline({ weekData, isLight, r, g, b }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const [hoverInfo, setHoverInfo] = useState(null);
    const containerRef = useRef(null);

    // Calculate path with subtle drift (not straight, not squiggly)
    const getPathData = () => {
        const points = days.map((_, i) => {
            // Base positions
            const baseX = 35 + i * (310 / 6);
            const baseY = (weekData[i]?.precision === 'perfect') ? 35 :
                (weekData[i]?.precision === 'close' ? 60 : 85);

            // Add subtle drift: small random-ish offsets based on index
            // Using sine waves for controlled, repeatable "imperfection"
            const driftX = Math.sin(i * 0.7) * 3; // ±3px horizontal drift
            const driftY = Math.cos(i * 1.3) * 2; // ±2px vertical drift

            return {
                x: baseX + driftX,
                y: baseY + driftY
            };
        });

        let d = `M ${points[0].x} ${points[0].y} `;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];

            // Gentle curve with micro-variation
            const cpX = (p0.x + p1.x) / 2 + Math.sin(i * 2.1) * 4;
            const cpY = (p0.y + p1.y) / 2 + Math.cos(i * 1.7) * 3;

            d += ` Q ${cpX} ${cpY}, ${p1.x} ${p1.y} `;
        }
        return d;
    };

    const handleMouseEnter = (index, event, dayData, dayName) => {
        if (!dayData.time) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setHoverInfo({
            day: dayName + ' PRACTICE',
            time: dayData.time,
            x: rect.left + rect.width / 2,
            y: rect.top
        });
    };

    // Calculate dynamic scale based on precision data
    const calculateDynamicScale = () => {
        const offsets = weekData
            .filter(day => day.precision !== 'missed' && day.offsetSeconds !== undefined)
            .map(day => Math.abs(day.offsetSeconds || 0));

        if (offsets.length === 0) return { unit: 'seconds', maxRange: 60 };

        const median = offsets.sort((a, b) => a - b)[Math.floor(offsets.length / 2)];
        const max = Math.max(...offsets);

        // If median is under 60 seconds and max under 120, use seconds scale
        if (median < 60 && max < 120) {
            return { unit: 'seconds', maxRange: Math.max(60, max * 1.2) };
        }
        // Otherwise use minutes scale
        return { unit: 'minutes', maxRange: Math.max(15, (max / 60) * 1.2) };
    };

    const scale = calculateDynamicScale();

    return (
        <div
            ref={containerRef}
            className="w-full relative mt-4 pt-5 pb-6 rounded-[28px] overflow-hidden transition-all duration-700"
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(252, 248, 240, 0.85) 0%, rgba(248, 244, 235, 0.9) 50%, rgba(245, 240, 230, 0.85) 100%)'
                    : config.wellBg,
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: `1px solid ${config.border}`,
                borderRadius: '28px',
                boxShadow: isLight
                    ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 15px 35px rgba(0,0,0,0.08)'
                    : 'inset 0 6px 25px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.5)'
            }}
        >
            {/* Watercolor Background Overlay */}
            {isLight && (
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at 20% 30%, rgba(180, 160, 130, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(200, 180, 140, 0.25) 0%, transparent 50%)',
                    }}
                />
            )}

            {/* Header Text Overlay */}
            <div
                className="absolute top-4 inset-x-0 text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-20 pointer-events-none"
                style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}
            >
                Precision Vector • {scale.unit === 'seconds' ? 'Seconds' : 'Minutes'} Scale
            </div>

            {/* Dynamic Precision Wave Visualization - Hidden in Light mode for Watercolor style */}
            {!isLight && (
                <svg className="absolute inset-x-0 bottom-0 w-full h-20 pointer-events-none z-0" viewBox="0 0 380 80" preserveAspectRatio="none">
                    <defs>
                        {/* Gradient for the wave fill */}
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={`rgba(${r}, ${g}, ${b}, 0.4)`} />
                            <stop offset="50%" stopColor={`rgba(${r}, ${g}, ${b}, 0.25)`} />
                            <stop offset="100%" stopColor={`rgba(${r}, ${g}, ${b}, 0.1)`} />
                        </linearGradient>
                        {/* Soft blur for watercolor effect */}
                        <filter id="watercolorBlur">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                        </filter>
                    </defs>

                    {/* Gradient wave path - showing timing offset precision */}
                    <path
                        d={(() => {
                            const baseY = 60;
                            const wavePoints = weekData.map((day, i) => {
                                const x = 15 + (i * 50);
                                let offsetValue = Math.abs(day.offsetSeconds || 0);

                                if (scale.unit === 'minutes') {
                                    offsetValue = offsetValue / 60;
                                }

                                // Calculate height based on offset (more offset = taller wave)
                                const heightRatio = Math.min(offsetValue / scale.maxRange, 1);
                                const height = 10 + (heightRatio * 40); // 10-50 range

                                return { x, y: baseY - height };
                            });

                            // Build smooth curve
                            let d = `M 0 ${baseY}`;
                            wavePoints.forEach((p, i) => {
                                if (i === 0) {
                                    d += ` L ${p.x} ${p.y}`;
                                } else {
                                    const prev = wavePoints[i - 1];
                                    const cpX = (prev.x + p.x) / 2;
                                    d += ` Q ${cpX} ${prev.y}, ${p.x} ${p.y}`;
                                }
                            });
                            d += ` L 380 ${baseY} L 380 80 L 0 80 Z`;
                            return d;
                        })()}
                        fill="url(#waveGradient)"
                        filter="url(#watercolorBlur)"
                        className="transition-all duration-1000"
                    />
                </svg>
            )}

            {/* Day markers with offset indicators */}
            <div className="flex justify-between items-end px-8 relative z-10 h-24 pb-2">
                {days.map((day, i) => {
                    const dayData = weekData[i] || { precision: 'missed', offsetSeconds: null };
                    const isActive = dayData.precision !== 'missed';
                    const offsetValue = Math.abs(dayData.offsetSeconds || 0);
                    const isPrecise = scale.unit === 'seconds' ? offsetValue < 10 : offsetValue < 600; // <10s or <10min

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center relative group cursor-help"
                            onMouseEnter={(e) => {
                                if (!isActive) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverInfo({
                                    day: day + ' OFFSET',
                                    time: scale.unit === 'seconds'
                                        ? `${offsetValue.toFixed(0)}s`
                                        : `${(offsetValue / 60).toFixed(1)}m`,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top
                                });
                            }}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            {/* Day label */}
                            <span
                                className="text-[10px] font-black mb-2 transition-all duration-300"
                                style={{
                                    color: config.textMain,
                                    opacity: isActive ? 0.8 : 0.25,
                                    fontFamily: 'var(--font-display)'
                                }}
                            >
                                {day}
                            </span>

                            {/* Precision indicator brush dab (Light) or circle (Dark) */}
                            <div className="relative">
                                {isLight ? (
                                    isActive && (
                                        <div
                                            className="transition-all duration-500 ease-out"
                                            style={{
                                                transform: `translateY(${(1 - (offsetValue / scale.maxRange)) * -40}px) scale(${1 + (1 - offsetValue / scale.maxRange) * 0.4})`,
                                                opacity: 0.85
                                            }}
                                        >
                                            <img
                                                src={`${import.meta.env.BASE_URL}assets/brush_dab_${(i % 4) + 1}.png`}
                                                className="w-8 h-8 object-contain"
                                                alt=""
                                                style={{
                                                    filter: (() => {
                                                        // Calculate hue rotation from green (120deg) to target color
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
                                                        const rotation = targetHue - 120; // Green baseline
                                                        return `hue-rotate(${rotation}deg)`;
                                                    })()
                                                }}
                                            />
                                        </div>
                                    )
                                ) : (
                                    <>
                                        {isPrecise && isActive && (
                                            <div
                                                className="absolute inset-0 rounded-full blur-md opacity-40 pointer-events-none"
                                                style={{ background: config.accent, transform: 'scale(2)' }}
                                            />
                                        )}
                                        <div
                                            className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                                            style={{
                                                background: isActive ? config.accent : 'transparent',
                                                borderColor: isActive ? config.accent : config.border,
                                                opacity: isActive ? 1 : 0.3,
                                                transform: isPrecise ? 'scale(1.3)' : 'scale(1)'
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tooltip Overlay */}
            <Tooltip text={hoverInfo} position={hoverInfo} />
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
    
    const weekData = useMemo(() => {
        const precisionKey = domain === 'breathwork' ? 'breath' : 
                            domain === 'visualization' ? 'visualization' : 
                            'wisdom';
        
        return trajectory.weeks.map(w => ({
            precision: w.avgPrecision[precisionKey] !== null ? w.avgPrecision[precisionKey] : 'missed',
            time: w.totalMinutes > 0 ? `${Math.floor(w.totalMinutes / 60)}h ${w.totalMinutes % 60}m` : null,
            practiced: w.daysActive > 0
        }));
    }, [trajectory, domain]);

    // Calculate actual regiment progress based on past 7 weeks or path completion
    const activePath = useTrackingStore(s => s.activePath);
    const regimentProgress = activePath 
        ? (activePath.completedWeeks.length / activePath.totalWeeks)
        : (weekData.filter(d => d.practiced).length / 7);

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

                {/* Header Row: Category + Date */}
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.2em]"
                            style={{
                                color: config.textMain,
                                textShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none' // Embedded text
                            }}
                        >
                            {domainLabels[domain]}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: config.accent }} />
                        <span
                            className="text-[9px] font-black uppercase tracking-[0.15em] opacity-50"
                            style={{
                                color: config.textMain,
                                textShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
                            }}
                        >
                            COGNITIVE.STREAM.V4
                        </span>
                    </div>

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



                {/* Secondary Section: Stats Grid (2 columns) - Centered & Symmetrical */}
                <div className="relative mb-2">
                    {/* Ornamental Partition 1 */}
                    <div className="flex items-center justify-center opacity-20 my-2 gap-3">
                        <div className="h-px w-16" style={{ background: config.textSub }} />
                        <div className="w-1 h-1 rounded-full" style={{ background: config.textSub }} />
                        <div className="h-px w-16" style={{ background: config.textSub }} />
                    </div>

                    {isLight && (
                        <div
                            className="absolute -inset-x-4 -inset-y-2 pointer-events-none opacity-25 blur-xl"
                            style={{
                                background: 'radial-gradient(circle, rgba(245, 239, 230, 0.9) 0%, rgba(245, 239, 230, 0) 70%)',
                                zIndex: -1
                            }}
                        />
                    )}
                    <div className="grid grid-cols-2 gap-8 relative z-10">
                        {/* Streak Column - Align LEFT to avoid feather */}
                        <div className="flex flex-col items-start pl-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60" style={{ color: config.textSub }}>Streak</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[28px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                                    {streak}
                                </span>
                                {isLight ? (
                                    <img
                                        src={`${import.meta.env.BASE_URL}assets/impasto_fire.png`}
                                        className="w-6 h-6 object-contain opacity-90"
                                        alt="Fire"
                                    />
                                ) : (
                                    <span className="text-2xl">🔥</span>
                                )}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40 text-left" style={{ color: config.textSub }}>Days</span>
                        </div>

                        {/* Sessions Column - Align RIGHT to avoid feather */}
                        <div className="flex flex-col items-end pr-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60" style={{ color: config.textSub }}>Sessions</span>
                            <div className="flex items-center gap-2 flex-row-reverse">
                                <span className="text-[28px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                                    {domainStats.count || 0}
                                </span>
                                {isLight ? (
                                    <img
                                        src={`${import.meta.env.BASE_URL}assets/impasto_meditator.png`}
                                        className="w-6 h-6 object-contain opacity-80"
                                        alt="Meditator"
                                    />
                                ) : (
                                    <span className="text-2xl">🧘</span>
                                )}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40 text-right" style={{ color: config.textSub }}>Total</span>
                        </div>
                    </div>
                    {/* Ornamental Partition 2 */}
                    <div className="flex items-center justify-center opacity-20 mt-2 mb-1 gap-3">
                        <div className="h-px w-24" style={{ background: config.textSub }} />
                    </div>
                </div>

                {/* Tertiary Section: Practice Precision - Added Mist Overlay */}
                <div className="relative z-10">
                    {isLight && (
                        <div
                            className="absolute -inset-x-8 -inset-y-4 pointer-events-none opacity-20 blur-3xl"
                            style={{
                                background: 'radial-gradient(circle, rgba(245, 239, 230, 0.98) 0%, rgba(245, 239, 230, 0) 80%)',
                                zIndex: -1
                            }}
                        />
                    )}
                    <div className="text-center mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-50" style={{ color: config.textMain }}>
                            {currentDomain.metricLabel} (Last 7 Days)
                        </span>
                        {/* Dashed separator */}
                        <div className="mt-2 flex justify-center">
                            <svg className="w-full h-[1px]" viewBox="0 0 200 1" preserveAspectRatio="none">
                                <line
                                    x1="0" y1="0.5" x2="200" y2="0.5"
                                    stroke={isLight ? 'rgba(140, 120, 100, 0.3)' : config.border}
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Precision Markers with Vertical Grid - NARROWED & SNAPPED */}
                    <div className="flex justify-between items-end px-4 relative h-32 max-w-[280px] mx-auto">
                        {weekData.map((dayData, i) => {
                            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                            const isActive = dayData.practiced;

                            // 5-Row Precision Mapping (0%, 25%, 50%, 75%, 100%)
                            let verticalSlot = 3; // Default to Center (On-Time)
                            
                            if (isActive) {
                                if (dayData.precision >= 0.9) verticalSlot = 3;
                                else if (dayData.precision >= 0.7) verticalSlot = 4;
                                else if (dayData.precision >= 0.5) verticalSlot = 2;
                                else if (dayData.precision >= 0.3) verticalSlot = 5;
                                else verticalSlot = 1;
                            }

                            const slotPositions = {
                                1: 12, // Bottom
                                2: 38,
                                3: 64, // Center
                                4: 90,
                                5: 116 // Top
                            };
                            const heightPercent = slotPositions[verticalSlot] || 64;

                            return (
                                <div key={i} className="flex flex-col items-center relative flex-1">
                                    <div
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-20 opacity-20"
                                        style={{ background: config.textMain }}
                                    />

                                    <div className="relative mb-2" style={{ height: '60px', display: 'flex', alignItems: 'flex-end' }}>
                                        {isLight && isActive ? (
                                            <div
                                                className="transition-all duration-500 ease-out"
                                                style={{
                                                    transform: `translateY(-${heightPercent}px)`,
                                                    opacity: 0.9
                                                }}
                                            >
                                                <img
                                                    src={`${import.meta.env.BASE_URL}assets/${config.dabAssets[i % config.dabAssets.length]}`}
                                                    className="w-7 h-7 object-contain"
                                                    style={{ 
                                                        filter: (() => {
                                                            // Calculate hue rotation from green (120deg) to target color
                                                            const r = currentDomain.r, g = currentDomain.g, b = currentDomain.b;
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
                                                            const rotation = targetHue - 120; // Green baseline
                                                            return `hue-rotate(${rotation}deg) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))`;
                                                        })(),
                                                        mixBlendMode: 'multiply'
                                                    }}
                                                    alt=""
                                                />
                                            </div>
                                        ) : (
                                            !isLight && isActive && (
                                                <div
                                                    className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                                                    style={{
                                                        background: `rgb(${currentDomain.r}, ${currentDomain.g}, ${currentDomain.b})`,
                                                        borderColor: `rgba(${currentDomain.r}, ${currentDomain.g}, ${currentDomain.b}, 0.5)`,
                                                        boxShadow: `0 0 10px rgba(${currentDomain.r}, ${currentDomain.g}, ${currentDomain.b}, 0.3)`,
                                                        transform: `translateY(-${heightPercent}px)`
                                                    }}
                                                />
                                            )
                                        )}
                                    </div>

                                    {/* Day label */}
                                    <span
                                        className="text-[10px] font-black relative z-10"
                                        style={{
                                            color: config.textMain,
                                            opacity: isActive ? 0.8 : 0.3,
                                            textShadow: isLight ? '0 1px 1px rgba(0, 0, 0, 0.08)' : 'none',
                                            transform: 'translateY(12px)' // Pull labels closer to dots
                                        }}
                                    >
                                        {days[i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
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
