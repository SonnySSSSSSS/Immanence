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
        accent: 'hsl(45, 80%, 60%)',
        glow: 'rgba(255, 200, 100, 0.5)',
        wellBg: 'rgba(15, 12, 10, 0.95)', // Deep obsidian for orbs to pop
        barBg: 'rgba(50, 45, 40, 0.3)',
        textMain: 'rgba(45, 40, 35, 0.95)',
        textSub: 'rgba(90, 77, 60, 0.8)',
        streamAsset: 'stream_gold_black.png',
        peakOrb: 'orb_peak_gold_black.png',
        lowOrb: 'orb_low_gold_black.png',
        progressAsset: 'progress_glow_black.png',
        border: 'rgba(175, 139, 44, 0.4)',
        blendMode: 'screen'
    },
    dark: {
        accent: 'hsl(175, 100%, 50%)',
        glow: 'rgba(0, 255, 240, 0.6)',
        wellBg: 'rgba(5, 8, 12, 1)', // Pure dark well
        barBg: 'rgba(255, 255, 255, 0.05)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        streamAsset: 'stream_teal_black.png',
        peakOrb: 'orb_peak_teal_black.png',
        lowOrb: 'orb_low_teal_black.png',
        progressAsset: 'progress_glow_black.png',
        border: 'rgba(0, 255, 240, 0.15)',
        blendMode: 'screen'
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
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        mixBlendMode: config.blendMode
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
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
 * Precision Timeline - Flowing energy field with orbs
 */
function PrecisionTimeline({ weekData, isLight }) {
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const [hoverInfo, setHoverInfo] = useState(null);
    const containerRef = useRef(null);

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
            className="w-full relative mt-4 pt-3 pb-3 rounded-[20px] overflow-hidden"
            style={{
                background: config.wellBg,
                border: `1.5px solid ${config.border}`,
                boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.6)'
            }}
        >
            {/* Plasma Stream Connector (The "Silk") */}
            <div
                className="absolute inset-x-0 top-[60%] -translate-y-1/2 h-20 pointer-events-none opacity-90"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}stats/tracking_card/${config.streamAsset})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    mixBlendMode: 'screen'
                }}
            />

            {/* Connecting Vector Path (The Core Unity) */}
            <div
                className="absolute left-10 right-10 top-[60%] h-[1px] -translate-y-1/2 opacity-20"
                style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }}
            />

            <div
                className="text-[10px] font-black uppercase tracking-[0.35em] text-center mb-6 opacity-30"
                style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}
            >
                Precision Vector
            </div>

            <div className="flex justify-between items-center px-5 relative z-10 h-16">
                {days.map((day, i) => {
                    const dayData = weekData[i] || { precision: 'missed', time: null };
                    const isActive = dayData.precision !== 'missed';

                    let orbImg = isActive ? config.peakOrb : 'orb_empty_black.png';
                    if (dayData.precision === 'close') orbImg = config.lowOrb;

                    const isHovered = hoverInfo?.x && Math.abs(hoverInfo.x - (containerRef.current?.getBoundingClientRect().left + 20 + i * 55)) < 25;

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center relative"
                            onMouseEnter={(e) => handleMouseEnter(i, e, dayData, day)}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            <span
                                className="text-[10px] font-black mb-1.5 transition-all duration-300"
                                style={{
                                    color: config.textMain,
                                    opacity: isActive ? 0.8 : 0.2,
                                    fontFamily: 'var(--font-display)',
                                    transform: isActive ? 'translateY(0)' : 'translateY(2px)'
                                }}
                            >
                                {day}
                            </span>

                            {/* Entity Orb Layer */}
                            <div className="relative">
                                {/* Inner Aura Glow */}
                                {isActive && (
                                    <div
                                        className="absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse pointer-events-none"
                                        style={{ background: config.accent, transform: 'scale(1.5)' }}
                                    />
                                )}

                                <div
                                    className="w-14 h-14 bg-contain bg-center bg-no-repeat transition-all duration-700 cursor-help relative z-10"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}stats/tracking_card/${orbImg})`,
                                        transform: isActive ? 'scale(1.3)' : 'scale(0.85)',
                                        mixBlendMode: 'screen'
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
