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
        wellBg: 'rgba(255, 252, 245, 0.92)',
        barBg: 'rgba(180, 160, 130, 0.15)',
        textMain: 'rgba(60, 45, 35, 0.95)',
        textSub: 'rgba(100, 80, 60, 0.75)',
        streamAsset: 'filament_silk_alpha.png',
        peakGem: 'gem_active_alpha.png',
        lowGem: 'gem_low_alpha.png',
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
            <div
                className="w-full h-[24px] rounded-full relative overflow-hidden backdrop-blur-sm"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 250, 240, 0.6), rgba(245, 238, 220, 0.5))'
                        : 'linear-gradient(135deg, rgba(15, 10, 20, 0.8), rgba(10, 5, 15, 0.9))',
                    border: isLight
                        ? `1.5px solid rgba(${r}, ${g}, ${b}, 0.25)`
                        : `1.5px solid rgba(${r}, ${g}, ${b}, 0.3)`,
                    boxShadow: isLight
                        ? `inset 0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 - 1px 3px rgba(255, 255, 255, 0.4),
        0 2px 6px rgba(${r}, ${g}, ${b}, 0.15)`
                        : `inset 0 4px 12px rgba(0, 0, 0, 0.7),
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
                        background: isLight
                            ? `linear - gradient(135deg,
            rgba(${r}, ${g}, ${b}, 0.7) 0 %,
            rgba(${r}, ${g}, ${b}, 0.85) 50 %,
            rgba(${r}, ${g}, ${b}, 0.6) 100 %)`
                            : `linear - gradient(135deg,
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

            {/* Dynamic Precision Wave Visualization */}
            <svg className="absolute inset-x-0 bottom-0 w-full h-20 pointer-events-none z-0" viewBox="0 0 380 80" preserveAspectRatio="none">
                <defs>
                    {/* Gradient for the wave fill */}
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={isLight ? 'rgba(180, 160, 130, 0.4)' : `rgba(${r}, ${g}, ${b}, 0.4)`} />
                        <stop offset="50%" stopColor={isLight ? 'rgba(200, 180, 140, 0.25)' : `rgba(${r}, ${g}, ${b}, 0.25)`} />
                        <stop offset="100%" stopColor={isLight ? 'rgba(220, 200, 160, 0.1)' : `rgba(${r}, ${g}, ${b}, 0.1)`} />
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

                            {/* Precision indicator circle */}
                            <div className="relative">
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
            className="w-full rounded-[32px] px-6 py-5 relative overflow-hidden transition-all duration-700 ease-in-out"
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
            {/* Watercolor Background Overlay */}
            {
                isLight && (
                    <div
                        className="absolute inset-0 opacity-30 pointer-events-none rounded-[32px]"
                        style={{
                            background: `
    radial-gradient(ellipse at 15% 20%, rgba(220, 180, 140, 0.4) 0%, transparent 40%),
        radial-gradient(ellipse at 85% 80%, rgba(200, 160, 120, 0.35) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 50%, rgba(240, 220, 180, 0.25) 0%, transparent 60%)
            `,
                        }}
                    />
                )
            }
            {/* Domain Background Title Card - Subtle Thematic Context */}
            <div
                className="absolute top-0 right-0 w-1/2 h-1/2 pointer-events-none overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(to bottom left, black, transparent 70%)',
                    WebkitMaskImage: 'linear-gradient(to bottom left, black, transparent 70%)',
                    opacity: isLight ? 0.08 : 0.06,
                    zIndex: 0
                }}
            >
                <img
                    src={`${import.meta.env.BASE_URL} titles / path_${domain === 'breathwork' ? 'practice' : (domain || 'wisdom')}.png`}
                    className="w-full h-full object-contain scale-[2.2] translate-x-12 -translate-y-8 rotate-[-12deg]"
                    alt=""
                />
            </div>

            {/* Ambient Background Aura */}
            <div
                className="absolute -top-32 -right-32 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 transition-all duration-1000"
                style={{ background: config.accent }}
            />

            {/* Header Column */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                        style={{ background: config.wellBg, border: `1px solid ${config.border} ` }}
                    >
                        {domain === 'wisdom' ? '📖' : domain === 'breathwork' ? '🫁' : '🧭'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-black uppercase tracking-[0.3em]" style={{ color: config.textMain }}>
                            {domainLabels[domain]}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: config.accent }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40" style={{ color: config.textMain }}>
                                COGNITIVE.STREAM.V4
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[11px] font-black tabular-nums tracking-widest" style={{ color: config.textSub }}>{today}</div>
                    <div
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-1 shadow-sm"
                        style={{ background: `${config.accent} 20`, color: config.accent, border: `1px solid ${config.accent} 40` }}
                    >
                        PEAK: {domainStats.peakMinutes || 0}m
                    </div>
                </div>
            </div>

            {/* Core Metrics Row - Grid with Dividers */}
            <div className="grid grid-cols-3 gap-0 px-4 mb-6 relative">
                {/* Sessions */}
                <div className="flex flex-col items-center justify-center py-2">
                    <span className="text-[32px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                        {domainStats.count || 0}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 opacity-60" style={{ color: config.textSub }}>
                        Total Sessions
                    </span>
                </div>
                {/* Vertical Divider */}
                <div className="absolute left-1/3 top-2 bottom-2 w-[1px]" style={{ background: 'rgba(160, 120, 80, 0.2)' }} />
                {/* Streak */}
                <div className="flex flex-col items-center justify-center py-2">
                    <span className="text-[32px] font-black leading-none tabular-nums" style={{ color: config.textMain }}>
                        {streak}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 opacity-60" style={{ color: config.textSub }}>
                        Days Streak
                    </span>
                </div>
                {/* Vertical Divider */}
                <div className="absolute left-2/3 top-2 bottom-2 w-[1px]" style={{ background: 'rgba(160, 120, 80, 0.2)' }} />
                {/* Regiment */}
                <div className="flex flex-col items-center justify-center py-2">
                    <div
                        className="px-4 py-1.5 rounded-full"
                        style={{
                            background: `rgb(${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-r')) || 126
                                }, ${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-g')) || 217}, ${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-b')) || 87})`,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                        }}
                    >
                        <span className="text-[16px] font-black text-white">
                            {Math.round(regimentProgress * 100)}%
                        </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5 opacity-60" style={{ color: config.textSub }}>
                        Regiment
                    </span>
                </div>
            </div>

            {/* Precision Vector - The Master Visual */}
            <PrecisionTimeline
                weekData={mockWeekData}
                isLight={isLight}
                r={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-r')) || 252}
                g={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-g')) || 211}
                b={parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-b')) || 77}
            />

            {/* System Status Line */}
            <div className="mt-6 flex items-center justify-between px-2 opacity-20">
                <div className="h-[1px] flex-1 bg-current" style={{ color: config.textMain }} />
                <span className="text-[8px] font-black uppercase tracking-[0.6em] mx-4" style={{ color: config.textMain }}>
                    NEURAL.LINK.SYNCHRONIZED
                </span>
                <div className="h-[1px] flex-1 bg-current" style={{ color: config.textMain }} />
            </div>
        </div >
    );
}

export default CompactStatsCard;
