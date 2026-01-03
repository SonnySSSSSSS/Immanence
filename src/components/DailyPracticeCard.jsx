import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { calculateGradientAngle, getAvatarCenter } from "../utils/dynamicLighting.js";
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * THEME CONFIGURATION
 * Synchronized with CompactStatsCard for "Ancient Relic" aesthetic
 */
const THEME_CONFIG = {
    light: {
        accent: 'rgba(139, 159, 136, 0.85)',
        textMain: 'rgba(35, 20, 10, 0.98)',
        textSub: 'rgba(65, 45, 25, 0.9)',
        bgAsset: 'ink_well_card_organic.png',
        canvasGrain: 'canvas_grain.png',
        border: 'rgba(139, 115, 85, 0.25)',
        shadow: '0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 0 1px rgba(180, 140, 60, 0.3)'
    },
    dark: {
        accent: 'var(--accent-color)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        cosmicAsset: 'dark_mode_cosmic_feather.png',
        border: 'var(--accent-20)',
        shadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }
};

export function DailyPracticeCard({ onStartPractice, onViewCurriculum }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];
    
    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    const theme = useTheme();
    const primaryHex = theme?.accent?.primary || '#4ade80';

    const { 
        onboardingComplete,
        getCurrentDayNumber,
        getTodaysPractice,
        isTodayComplete,
        getProgress,
        getStreak,
        practiceTimeSlots,
        setActivePracticeSession,
    } = useCurriculumStore();

    // Parse hex to RGB for dynamic effects
    const baseAccent = useMemo(() => {
        const hex = primaryHex;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 126, g: 217, b: 87 };
    }, [primaryHex]);

    // Calculate hue rotation for cosmic assets
    const stageHueRotate = useMemo(() => {
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
        return targetHue - 180;
    }, [baseAccent]);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight, displayMode]);

    if (!onboardingComplete) return null;

    const dayNumber = getCurrentDayNumber();
    const todaysPractice = getTodaysPractice();
    const isComplete = isTodayComplete();
    const progress = getProgress();
    const streak = getStreak();

    if (dayNumber > 14 || progress.completed >= 14) {
        return (
            <div
                className="w-full relative p-8 text-center rounded-[24px]"
                style={{
                    background: isLight ? '#f5efe5' : 'rgba(20, 15, 25, 0.95)',
                    border: `1px solid ${config.border}`,
                    boxShadow: config.shadow,
                }}
            >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}>
                    Curriculum Complete!
                </h3>
                <p className="mb-4 opacity-70" style={{ color: config.textSub }}>
                    You completed {progress.completed} of 14 days
                </p>
                <button
                    onClick={onViewCurriculum}
                    className="px-6 py-2 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                        background: 'var(--accent-color)',
                        color: isLight ? '#fff' : '#000',
                        boxShadow: '0 4px 20px var(--accent-30)'
                    }}
                >
                    View Report
                </button>
            </div>
        );
    }

    if (!todaysPractice) return null;

    const duration = todaysPractice.circuit 
        ? todaysPractice.circuit.totalDuration 
        : todaysPractice.practiceConfig?.duration || 10;

    const nextTime = practiceTimeSlots.length > 0 
        ? practiceTimeSlots[0].time 
        : null;

    const handleStartPractice = () => {
        setActivePracticeSession(dayNumber);
        onStartPractice?.();
    };

    return (
        <div
            className="w-full relative transition-all duration-700 ease-in-out"
            style={{
                maxWidth: isSanctuary ? '600px' : '430px',
                margin: '0 auto',
            }}
        >
            {/* OUTER: Frame with Shadow */}
            <div
                className="w-full relative"
                style={{
                    borderRadius: '24px',
                    boxShadow: config.shadow,
                }}
            >
                {/* MIDDLE: Parchment / Cosmic Container */}
                <div
                    ref={cardRef}
                    className="w-full relative overflow-hidden rounded-[24px]"
                >
                    {/* INNER: Masked Content for soft edges */}
                    <div
                        className="w-full relative"
                        style={{
                            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at center, black 98%, transparent 100%)',
                            maskImage: 'radial-gradient(ellipse 100% 100% at center, black 98%, transparent 100%)',
                        }}
                    >
                        {/* BACKGROUND LAYERS */}
                        {isLight ? (
                            <>
                                {/* Painted Surface */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.bgAsset})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        transform: 'scale(1.04)',
                                        transformOrigin: 'center'
                                    }}
                                />
                                {/* Canvas Grain */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.canvasGrain})`,
                                        backgroundSize: '256px 256px',
                                        mixBlendMode: 'multiply',
                                        opacity: 0.05,
                                        transform: 'scale(1.04)'
                                    }}
                                />
                            </>
                        ) : (
                            <>
                                {/* Cosmic Surface */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98)), 
                                           linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                                    }}
                                />
                                {/* Cosmic Feather */}
                                <div 
                                    className="absolute inset-0 overflow-hidden pointer-events-none"
                                    style={{ opacity: 0.5, mixBlendMode: 'screen' }}
                                >
                                    <div 
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.cosmicAsset})`,
                                            backgroundSize: '100% 100%', 
                                            backgroundPosition: 'center',
                                            filter: `hue-rotate(${stageHueRotate}deg) contrast(1.1) saturate(1.2)`,
                                            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
                                            maskImage: 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)'
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {/* CONTENT */}
                        <div className="relative z-10 p-6">
                            {/* Header Row */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    {/* Day indicator - Precision circle */}
                                    <div className="relative group/day">
                                        <svg width="48" height="48" viewBox="0 0 44 44">
                                            <circle cx="22" cy="22" r="20" fill="none" stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeWidth="1" />
                                            <circle 
                                                cx="22" cy="22" r="20" 
                                                fill="none" 
                                                stroke="var(--accent-color)" 
                                                strokeWidth="2" 
                                                strokeDasharray={`${(progress.completed / 14) * 126} 126`}
                                                strokeLinecap="round"
                                                style={{ 
                                                    transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    filter: isLight ? 'none' : 'blur(0.5px) drop-shadow(0 0 2px var(--accent-color))'
                                                }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span 
                                                className="text-[16px] font-black" 
                                                style={{ 
                                                    color: isLight ? config.textMain : 'var(--accent-color)',
                                                    fontFamily: 'var(--font-display)',
                                                    textShadow: isLight ? '0 1px 1px rgba(0,0,0,0.1)' : '0 0 10px var(--accent-40)'
                                                }}
                                            >
                                                {isComplete ? '✓' : dayNumber}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div 
                                            className="text-[9px] uppercase font-black tracking-[0.3em] opacity-40 mb-0.5" 
                                            style={{ color: config.textMain }}
                                        >
                                            Day {dayNumber} of 14
                                        </div>
                                        <div 
                                            className="text-[19px] font-black leading-tight" 
                                            style={{ 
                                                color: config.textMain,
                                                fontFamily: 'var(--font-display)',
                                                textShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {todaysPractice.title}
                                        </div>
                                    </div>
                                </div>

                                {/* Completion Rate */}
                                <div className="text-right">
                                    <div className="text-[9px] uppercase font-black tracking-[0.2em] opacity-40" style={{ color: config.textMain }}>
                                        Rate
                                    </div>
                                    <div 
                                        className="text-[22px] font-black tabular-nums leading-none mt-0.5" 
                                        style={{ 
                                            color: 'var(--accent-color)',
                                            textShadow: isLight ? 'none' : '0 0 15px var(--accent-30)'
                                        }}
                                    >
                                        {progress.rate}%
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Row */}
                            <div className="flex items-center gap-4 mb-4 opacity-50">
                                <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: config.textMain }}>
                                    <span style={{ filter: isLight ? 'grayscale(1) brightness(0.5)' : 'none' }}>
                                        {todaysPractice.practiceType === 'stillness' ? '🧘' : '💨'}
                                    </span>
                                    {todaysPractice.practiceType}
                                </div>
                                <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: config.textMain }}>
                                    {duration} MIN
                                </div>
                                {nextTime && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: config.textMain }}>
                                            ⏰ {nextTime}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Intention - Elegant box */}
                            <div 
                                className="mb-6 p-4 rounded-xl relative overflow-hidden"
                                style={{
                                    background: isLight ? 'rgba(139, 115, 85, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isLight ? 'rgba(139, 115, 85, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`
                                }}
                            >
                                <p 
                                    className="text-[13px] italic leading-relaxed relative z-10" 
                                    style={{ 
                                        color: config.textSub,
                                        fontFamily: 'serif' 
                                    }}
                                >
                                    "{todaysPractice.intention}"
                                </p>
                                {/* Subtle inner glow for dark mode */}
                                {!isLight && (
                                    <div className="absolute inset-0 bg-accent-glow/5 opacity-30 blur-xl pointer-events-none" />
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="flex items-center justify-between">
                                {isComplete ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--accent-color)' }}>
                                            <span className="text-sm">✨</span>
                                            Practice Secured
                                        </div>
                                        {streak > 1 && (
                                            <div className="px-2.5 py-1 rounded-full text-[9px] font-black bg-accent-glow/20 text-accent-color border border-accent-glow/30 flex items-center gap-1">
                                                🔥 {streak} DAY STREAK
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartPractice}
                                        className="px-10 py-3.5 rounded-full text-[11px] font-black tracking-[0.25em] transition-all transform hover:scale-105 active:scale-95 group relative overflow-hidden"
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: isLight ? '#fff' : '#000',
                                            boxShadow: isLight 
                                              ? '0 8px 25px var(--accent-30)'
                                              : '0 8px 25px var(--accent-40), 0 0 20px var(--accent-20)'
                                        }}
                                    >
                                        <span className="relative z-10">START PRACTICE</span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    </button>
                                )
                                }

                                <button 
                                    onClick={onViewCurriculum}
                                    className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-all hover:tracking-[0.4em]"
                                    style={{ color: config.textMain }}
                                >
                                    View Path →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyPracticeCard;
