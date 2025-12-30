// src/components/CompactStatsCard.jsx
// Premium visual stats card with precision-of-time tracking
// Targets the "ancient relic / celestial technology" aesthetic

import React, { useState, useRef, useEffect } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from '../utils/dynamicLighting.js';

/**
 * THEME CONFIGURATION
 * Defines distinct visual rules for Light and Dark modes
 */
const THEME_CONFIG = {
    light: {
        accent: 'hsl(45, 100%, 55%)',
        glow: 'rgba(255, 180, 50, 0.6)',
        wellBg: 'rgba(248, 245, 232, 0.85)',
        barBg: 'rgba(120, 100, 80, 0.12)',
        textMain: 'rgba(60, 50, 40, 0.95)',
        textSub: 'rgba(110, 95, 80, 0.7)',
        streamAsset: 'filament_silk_alpha.png',
        peakGem: 'gem_active_alpha.png',
        lowGem: 'gem_low_alpha.png',
        emptyGem: 'gem_empty_alpha.png',
        progressAsset: 'progress_glow_alpha.png',
        border: 'rgba(255, 255, 255, 0.3)',
        wellBorder: 'rgba(255, 255, 255, 0.2)',
        threadColor: 'rgba(215, 175, 100, 0.7)'
    },
    dark: {
        accent: 'hsl(180, 100%, 50%)',
        glow: 'rgba(0, 255, 240, 0.8)',
        wellBg: 'rgba(10, 15, 25, 0.75)',
        barBg: 'rgba(255, 255, 255, 0.05)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        streamAsset: 'filament_silk_alpha.png',
        peakGem: 'gem_active_alpha.png',
        lowGem: 'gem_low_alpha.png',
        emptyGem: 'gem_empty_alpha.png',
        progressAsset: 'progress_glow_alpha.png',
        border: 'rgba(0, 255, 240, 0.2)',
        wellBorder: 'rgba(0, 170, 255, 0.15)',
        threadColor: 'rgba(0, 255, 240, 0.6)'
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
 * Regiment Progress - Glass Capsule Liquid Bar
 */
function RegimentProgress({ progress, isLight }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    const percentage = Math.round(progress * 100);

    return (
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
            <div
                className="w-full h-[22px] rounded-full relative overflow-hidden p-[2px] backdrop-blur-sm"
                style={{
                    background: config.barBg,
                    border: `1.5px solid ${config.border}`,
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.05)'
                }}
            >
                {/* Glow behind liquid */}
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 blur-md opacity-30"
                    style={{
                        width: `${percentage}%`,
                        background: config.accent
                    }}
                />

                {/* Liquid Glass Effect */}
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-in-out relative z-10"
                    style={{
                        width: `${percentage}%`,
                        backgroundImage: `url(${import.meta.env.BASE_URL}stats/tracking_card/${config.progressAsset})`,
                        backgroundSize: '300px 100%',
                        backgroundPosition: 'left center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>

                {/* Capsule Highlight */}
                <div className="absolute inset-x-4 top-1 h-1.5 bg-white/20 rounded-full blur-[1px] z-20 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[13px] font-black tracking-tighter" style={{ color: config.textMain }}>{percentage}%</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: config.textSub }}>REGIMENT</span>
            </div>
        </div>
    );
}

/**
 * Precision Timeline - Neural Thread SVG Architecture
 */
function PrecisionTimeline({ weekData, isLight }) {
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

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];

            // Gentle curve with micro-variation
            const cpX = (p0.x + p1.x) / 2 + Math.sin(i * 2.1) * 4;
            const cpY = (p0.y + p1.y) / 2 + Math.cos(i * 1.7) * 3;

            d += ` Q ${cpX} ${cpY}, ${p1.x} ${p1.y}`;
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

    return (
        <div
            ref={containerRef}
            className="w-full relative mt-4 pt-5 pb-5 rounded-[28px] overflow-hidden transition-all duration-700"
            style={{
                background: config.wellBg,
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: `1px solid ${config.border}`,
                borderRadius: '28px',
                boxShadow: isLight
                    ? 'inset 0 2px 6px rgba(255,255,255,0.5), 0 15px 35px rgba(0,0,0,0.08)'
                    : 'inset 0 6px 25px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.5)'
            }}
        >
            {/* Header Text Overlay */}
            <div
                className="absolute top-4 inset-x-0 text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-30 pointer-events-none"
                style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}
            >
                Precision Vector
            </div>

            {/* Neural Thread Engine (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 380 120">
                <defs>
                    <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="20%" stopColor={config.threadColor} />
                        <stop offset="80%" stopColor={config.threadColor} />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <filter id="threadGlow">
                        <feGaussianBlur stdDeviation="2.5" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                    {/* Crystal Glow Filter for Gems */}
                    <filter id="crystalGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix in="blur" type="matrix"
                            values="0 0 0 0 0  0 1 1 0 0  0 1 1 0 0  0 0 0 1 0" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <path
                    d={getPathData()}
                    fill="none"
                    stroke="url(#threadGradient)"
                    strokeWidth="2.5"
                    filter="url(#threadGlow)"
                    className="transition-all duration-1000 ease-in-out opacity-60"
                    strokeLinecap="round"
                />
            </svg>

            <div className="flex justify-between items-center px-8 relative z-10 h-28 mt-4">
                {days.map((day, i) => {
                    const dayData = weekData[i] || { precision: 'missed', time: null };
                    const isActive = dayData.precision !== 'missed';

                    let gemImg = isActive ? config.peakGem : config.emptyGem;
                    if (dayData.precision === 'close') gemImg = config.lowGem;

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center relative group"
                            onMouseEnter={(e) => handleMouseEnter(i, e, dayData, day)}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            <span
                                className="text-[10px] font-black mb-3 transition-all duration-500"
                                style={{
                                    color: config.textMain,
                                    opacity: isActive ? 1 : 0.2,
                                    fontFamily: 'var(--font-display)',
                                    transform: isActive ? 'scale(1.1) translateY(-2px)' : 'none'
                                }}
                            >
                                {day}
                            </span>

                            {/* Celestial Node Layer */}
                            <div className="relative">
                                {/* Radiant Aura (Multi-layered glow) */}
                                {isActive && (
                                    <>
                                        <div
                                            className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-1000 pointer-events-none"
                                            style={{ background: config.accent, transform: 'scale(1.8)' }}
                                        />
                                        <div
                                            className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000 pointer-events-none"
                                            style={{ background: config.glow, transform: 'scale(2.5)' }}
                                        />
                                        <div
                                            className="absolute inset-0 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-1000 pointer-events-none"
                                            style={{ background: config.accent, transform: 'scale(3.5)' }}
                                        />
                                    </>
                                )}

                                <div
                                    className="w-12 h-12 bg-contain bg-center bg-no-repeat transition-all duration-1000 cursor-help relative z-10"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}stats/tracking_card/${gemImg})`,
                                        transform: isActive ? 'scale(1.3)' : 'scale(0.8)',
                                        filter: isActive ? 'url(#crystalGlow) brightness(1.1)' : 'brightness(0.6) opacity(0.5) grayscale(0.3)',
                                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
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
    const isLight = colorScheme === 'light';
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
                maxWidth: '430px',
                margin: '0 auto',
                border: '1.5px solid transparent',
                backgroundImage: isLight
                    ? `linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,242,235,0.95)), ${getDynamicGoldGradient(gradientAngle, true)}`
                    : `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98)), linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: isLight
                    ? `0 20px 60px rgba(120, 90, 60, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.9)`
                    : `0 30px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
        >
            {/* Ambient Background Aura */}
            <div
                className="absolute -top-32 -right-32 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 transition-all duration-1000"
                style={{ background: config.accent }}
            />

            {/* Header Column */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                        style={{ background: config.wellBg, border: `1px solid ${config.border}` }}
                    >
                        📖
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
                        style={{ background: `${config.accent}20`, color: config.accent, border: `1px solid ${config.accent}40` }}
                    >
                        PEAK: {domainStats.peakMinutes || 0}m
                    </div>
                </div>
            </div>

            {/* Core Metrics Row */}
            <div className="flex justify-between items-center px-4 mb-2">
                <MetricRing label="Sessions" value={domainStats.count || 0} isLight={isLight} />
                <MetricRing label="Streak" value={streak} isLight={isLight} />
                <RegimentProgress progress={regimentProgress} isLight={isLight} />
            </div>

            {/* Precision Vector - The Master Visual */}
            <PrecisionTimeline weekData={mockWeekData} isLight={isLight} />

            {/* System Status Line */}
            <div className="mt-6 flex items-center justify-between px-2 opacity-20">
                <div className="h-[1px] flex-1 bg-current" style={{ color: config.textMain }} />
                <span className="text-[8px] font-black uppercase tracking-[0.6em] mx-4" style={{ color: config.textMain }}>
                    NEURAL.LINK.SYNCHRONIZED
                </span>
                <div className="h-[1px] flex-1 bg-current" style={{ color: config.textMain }} />
            </div>
        </div>
    );
}

export default CompactStatsCard;
