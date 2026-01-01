// src/components/CompactStatsCard.jsx
// Premium visual stats card with precision-of-time tracking
// Targets the "ancient relic / celestial technology" aesthetic

import React, { useState, useRef, useEffect } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { calculateGradientAngle, getAvatarCenter } from "../utils/dynamicLighting.js";

/**
 * THEME CONFIGURATION
 * Defines distinct visual rules for Light and Dark modes
 */
const THEME_CONFIG = {
    light: {
        accent: 'var(--light-accent)',
        glow: 'var(--light-accent-muted)',
        wellBg: 'rgba(255, 252, 245, 0.8)',
        barBg: 'rgba(180, 160, 130, 0.15)',
        textMain: 'rgba(60, 45, 35, 0.95)',
        textSub: 'rgba(100, 80, 60, 0.75)',
        bgAsset: 'watercolor_bg.png',
        dabAssets: [
            'brush_dab_1.png',
            'brush_dab_2.png',
            'brush_dab_3.png',
            'brush_dab_4.png'
        ],
        emptyGem: 'gem_empty_alpha.png',
        progressAsset: 'progress_glow_alpha.png',
        border: 'rgba(160, 120, 80, 0.35)',
        wellBorder: 'rgba(180, 140, 90, 0.25)',
        threadColor: 'var(--light-accent)'
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
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
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
                    className="w-full h-[24px] rounded-full relative overflow-hidden backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(15, 10, 20, 0.8), rgba(10, 5, 15, 0.9))',
                        border: `1.5px solid rgba(${r}, ${g}, ${b}, 0.3)`,
                        boxShadow: `inset 0 4px 12px rgba(0, 0, 0, 0.7),
        inset 0 - 1px 2px rgba(255, 255, 255, 0.05),
            0 3px 8px rgba(${r}, ${g}, ${b}, 0.25)`,
                        padding: '2px'
                    }}
                >
                    {/* Multi-layered Glow */}
                    <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 blur-lg opacity-40"
                        style={{
                            width: `${percentage}% `,
                            background: `radial - gradient(ellipse at center, ${accentRGB}, transparent 70 %)`
                        }}
                    />
                    <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 blur-md opacity-30"
                        style={{
                            width: `${percentage}% `,
                            background: accentRGB
                        }}
                    />

                    {/* Dynamic Liquid Glass Bar */}
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out relative z-10"
                        style={{
                            width: `${percentage}% `,
                            background: `linear - gradient(135deg,
                    rgba(${r}, ${g}, ${b}, 0.85) 0 %,
                    rgba(${r}, ${g}, ${b}, 1) 50 %,
                    rgba(${r}, ${g}, ${b}, 0.75) 100 %)`,
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

            <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[13px] font-black tracking-tighter tabular-nums" style={{ color: config.textMain }}>{percentage}%</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: config.textSub }}>REGIMENT</span>
            </div>

            {/* Shimmer Animation */}
            <style>{`
@keyframes shimmer {
    0 % { background- position: -200 % 0;
}
100 % { background- position: 200 % 0; }
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
export function CompactStatsCard({ domain = 'wisdom', streakInfo }) {
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

    const mockWeekData = [
        { precision: 'perfect', time: '12:03' },
        { precision: 'perfect', time: '11:58' },
        { precision: 'close', time: '12:45' },
        { precision: 'missed', time: null },
        { precision: 'perfect', time: '12:02' },
        { precision: 'close', time: '13:15' },
        { precision: 'missed', time: null },
    ];

    const regimentProgress = mockWeekData.filter(d => d.precision !== 'missed').length / 7;

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
            ref={cardRef}
            className="w-full rounded-[24px] px-6 py-5 relative overflow-hidden transition-all duration-700 ease-in-out"
            style={{
                maxWidth: isSanctuary ? '600px' : '430px',
                margin: '0 auto',
                border: '2px solid transparent',
                backgroundImage: isLight
                    ? `linear-gradient(rgba(252, 248, 240, 0.98), rgba(248, 244, 235, 0.96)), 
                       linear-gradient(135deg, rgba(200, 160, 110, 0.4), rgba(180, 140, 90, 0.3))`
                    : `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98)), 
                       linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: isLight
                    ? `0 0 0 1px rgba(160, 120, 80, 0.3),
                       0 12px 40px rgba(120, 90, 60, 0.12), 
                       0 4px 16px rgba(200, 160, 110, 0.08),
                       inset 0 2px 0 rgba(255, 255, 255, 0.8),
                       inset 0 -1px 0 rgba(160, 120, 80, 0.15)`
                    : `0 30px 80px rgba(0, 0, 0, 0.7), 
                       inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
        >
            {/* Impasto Background Overlay */}
            {isLight && (
                <div
                    className="absolute inset-0 opacity-100 pointer-events-none rounded-[24px]"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/impasto_bg.png)`,
                        backgroundSize: 'cover',
                        mixBlendMode: 'multiply'
                    }}
                />
            )}

            {/* Header Row: Category + Date */}
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: config.textMain }}>
                        {domainLabels[domain]}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: config.accent }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40" style={{ color: config.textMain }}>
                        COGNITIVE.STREAM.V4
                    </span>
                </div>
                <div className="text-[10px] font-black tabular-nums tracking-wide opacity-50" style={{ color: config.textSub }}>{today}</div>
            </div>

            {/* Primary Section: Curriculum Progress */}
            <div className="mb-5 relative z-10">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[13px] font-bold tracking-wide" style={{ color: config.textMain }}>
                        Curriculum: Morning Awareness
                    </span>
                    <span className="text-[18px] font-black tabular-nums" style={{ color: config.accent }}>
                        {Math.round(regimentProgress * 100)}%
                    </span>
                </div>
                {/* Thick Impasto Progress Bar */}
                {isLight ? (
                    <div className="w-full h-[28px] relative flex flex-col justify-center">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
                            <defs>
                                <clipPath id="curriculumClip">
                                    <rect x="0" y="0" width={Math.round(regimentProgress * 100) * 2} height="30" />
                                </clipPath>
                            </defs>
                            {/* Background stroke */}
                            <path
                                d="M2,15 Q50,12 100,15 T198,15"
                                fill="none"
                                stroke="rgba(180, 160, 140, 0.15)"
                                strokeWidth="14"
                                strokeLinecap="round"
                            />
                            {/* Progress stroke */}
                            <path
                                d="M2,15 Q50,12 100,15 T198,15"
                                fill="none"
                                stroke={`rgb(${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-r')) || 126}, ${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-g')) || 217}, ${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-b')) || 87})`}
                                strokeWidth="16"
                                strokeLinecap="round"
                                style={{ opacity: 0.85, filter: 'blur(0.5px)' }}
                                clipPath="url(#curriculumClip)"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <img
                            src={`${import.meta.env.BASE_URL}assets/impasto_dab_1.png`}
                            className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none mix-blend-overlay"
                            alt=""
                        />
                    </div>
                ) : (
                    <RegimentProgress progress={regimentProgress} isLight={isLight} r={126} g={217} b={87} />
                )}
            </div>

            {/* Secondary Section: Stats Grid (2 columns) */}
            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b relative z-10" style={{ borderColor: isLight ? 'rgba(160, 140, 120, 0.2)' : config.border }}>
                {/* Streak Column */}
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wide mb-1 opacity-60" style={{ color: config.textSub }}>Streak:</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[28px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                            {streak}
                        </span>
                        {isLight ? (
                            <img
                                src={`${import.meta.env.BASE_URL}assets/impasto_fire.png`}
                                className="w-8 h-8 object-contain opacity-90"
                                alt="Fire"
                            />
                        ) : (
                            <span className="text-2xl">🔥</span>
                        )}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5 opacity-40" style={{ color: config.textSub }}>Days</span>
                </div>

                {/* Sessions Column */}
                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold uppercase tracking-wide mb-1 opacity-60" style={{ color: config.textSub }}>Total Sessions:</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[28px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                            {domainStats.count || 0}
                        </span>
                        {isLight ? (
                            <img
                                src={`${import.meta.env.BASE_URL}assets/impasto_meditator.png`}
                                className="w-8 h-8 object-contain opacity-70"
                                alt="Meditator"
                            />
                        ) : (
                            <span className="text-2xl">🧘</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tertiary Section: Practice Precision */}
            <div className="relative z-10">
                <div className="text-center mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-50" style={{ color: config.textMain }}>
                        Practice Precision (Last 7 Days)
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

                {/* Precision Markers with Vertical Grid */}
                <div className="flex justify-between items-end px-2 relative h-24">
                    {mockWeekData.map((dayData, i) => {
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        const isActive = dayData.precision !== 'missed';
                        const heightPercent = dayData.precision === 'perfect' ? 80 : dayData.precision === 'close' ? 50 : 20;

                        return (
                            <div key={i} className="flex flex-col items-center relative flex-1">
                                {/* Vertical grid line */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-20 opacity-20"
                                    style={{ background: config.textMain }}
                                />

                                {/* Brush dab marker */}
                                <div className="relative mb-2" style={{ height: '60px', display: 'flex', alignItems: 'flex-end' }}>
                                    {isLight && isActive ? (
                                        <div
                                            className="transition-all duration-500 ease-out"
                                            style={{
                                                transform: `translateY(-${heightPercent}px)`,
                                                opacity: 0.85
                                            }}
                                        >
                                            <img
                                                src={`${import.meta.env.BASE_URL}assets/impasto_dab_${(i % 2) + 1}.png`}
                                                className="w-7 h-7 object-contain"
                                                alt=""
                                            />
                                        </div>
                                    ) : (
                                        !isLight && isActive && (
                                            <div
                                                className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                                                style={{
                                                    background: config.accent,
                                                    borderColor: config.accent,
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
                                        opacity: isActive ? 0.7 : 0.25
                                    }}
                                >
                                    {days[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Status Line */}
            <div className={`mt-5 flex items-center justify-center px-2 ${isLight ? 'opacity-30' : 'opacity-20'}`}>
                <span className="text-[8px] font-black uppercase tracking-[0.5em]" style={{ color: config.textMain }}>
                    NEURAL.LINK.SYNCHRONIZED
                </span>
            </div>
        </div >
    );
}

export default CompactStatsCard;
