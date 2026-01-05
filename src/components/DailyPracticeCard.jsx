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
        bgAsset: 'ancient_relic_focus.png',
        canvasGrain: 'canvas_grain.png',
        border: 'rgba(139, 115, 85, 0.25)',
        shadow: '0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 0 1px rgba(180, 140, 60, 0.3)'
    },
    dark: {
        accent: 'var(--accent-color)',
        textMain: 'rgba(253, 251, 245, 0.95)',
        textSub: 'rgba(253, 251, 245, 0.5)',
        cosmicAsset: 'celestial_black_hole.png',
        border: 'var(--accent-20)',
        shadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }
};

export function DailyPracticeCard({ onStartPractice, onViewCurriculum, onNavigate }) {
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
        getDayLegsWithStatus,
        setActivePracticeSession,
        _devReset,
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
    const legs = getDayLegsWithStatus(dayNumber);


    if (dayNumber > 14 || progress.completed >= progress.total) {
        const bgAsset = isLight ? 'ancient_relic_focus.png' : 'celestial_black_hole.png';
        return (
            <div
                className="w-full relative p-8 text-center rounded-[24px] overflow-hidden"
                style={{
                    background: isLight ? '#f5efe5' : 'rgb(10, 10, 15)',
                    border: `1px solid ${config.border}`,
                    boxShadow: config.shadow,
                }}
            >
                {/* Relic/Cosmic Background Wallpaper */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/${bgAsset})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: isLight ? 0.21 : 0.36,
                        mixBlendMode: isLight ? 'multiply' : 'screen',
                    }}
                />

                {/* Canvas Grain Texture (Light mode only) */}
                {isLight && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/canvas_grain.png)`,
                            backgroundSize: '200px',
                            mixBlendMode: 'multiply',
                        }}
                    />
                )}

                <div className="relative z-10">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: config.textMain, fontFamily: 'var(--font-display)' }}>
                        Curriculum Complete!
                    </h3>
                    <p className="mb-6 opacity-70" style={{ color: config.textSub }}>
                        You completed {progress.completed} of {progress.total} practices
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onViewCurriculum}
                            className="px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                                background: 'var(--accent-color)',
                                color: isLight ? '#fff' : '#000',
                                boxShadow: '0 4px 20px var(--accent-30)',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            View Report
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (window.confirm('Reset this curriculum? All progress will be cleared.')) {
                                        _devReset();
                                    }
                                }}
                                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                                    border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid rgba(255,255,255,0.15)',
                                    color: config.textMain,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                Reset Program
                            </button>

                            <button
                                onClick={() => onNavigate?.('navigation')}
                                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                                    border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid rgba(255,255,255,0.15)',
                                    color: config.textMain,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                New Curriculum
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!todaysPractice) return null;

    const handleStartLeg = (leg) => {
        setActivePracticeSession(dayNumber, leg.legNumber);
        onStartPractice?.();
    };

    const completedLegs = legs.filter(l => l.completed).length;

    return (
        <div
            className="w-full relative transition-all duration-700 ease-in-out"
            style={{
                maxWidth: '430px',
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
                {/* MIDDLE: Container */}
                <div
                    ref={cardRef}
                    className="w-full relative overflow-hidden rounded-[24px]"
                    style={{
                        background: isLight ? '#faf6ee' : 'rgb(20, 15, 25)',
                        border: isLight ? '1px solid rgba(160, 120, 60, 0.15)' : '1px solid var(--accent-20)',
                    }}
                >
                    {/* Parchment Base Wallpaper (Entire Card) */}
                    {isLight && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/parchment_blank.png)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: 0.85,
                                mixBlendMode: 'multiply',
                            }}
                        />
                    )}

                    {/* Canvas Grain Texture (Entire Card) */}
                    {isLight && (
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.05]"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/canvas_grain.png)`,
                                backgroundSize: '200px',
                                mixBlendMode: 'multiply',
                            }}
                        />
                    )}

                    {/* TWO-COLUMN LAYOUT */}
                    <div className="flex">
                        {/* LEFT COLUMN: Background Image */}
                        <div 
                            className="relative overflow-hidden"
                            style={{
                                width: '42%',
                                minHeight: '280px',
                            }}
                        >
                            {isLight ? (
                                <>
                                    {/* Painted Surface */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.bgAsset})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center left',
                                            opacity: 0.54,
                                            mixBlendMode: 'multiply',
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Cosmic Surface */}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `linear-gradient(135deg, rgba(20, 15, 25, 0.98), rgba(10, 8, 15, 0.98))`,
                                        }}
                                    />
                                    {/* Cosmic Feather / Black Hole */}
                                    <div
                                        className="absolute inset-0 overflow-hidden pointer-events-none z-1"
                                        style={{ opacity: 0.24, mixBlendMode: 'screen' }}
                                    >
                                        <div 
                                            className="absolute inset-0"
                                            style={{
                                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.cosmicAsset})`,
                                                backgroundSize: 'cover', 
                                                backgroundPosition: 'center',
                                                filter: `hue-rotate(${stageHueRotate}deg) contrast(1.1) saturate(1.2)`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* Day Number Overlay with Labels */}
                            <div 
                                className="absolute top-4 left-4 z-10"
                                style={{ width: '48px', height: '48px' }}
                            >
                                {/* DAY label - Vertical on the left, matching Breathwork style */}
                                <div 
                                    className="absolute left-[2px] top-0 h-full flex items-center justify-center"
                                    style={{ 
                                        writingMode: 'vertical-rl', 
                                        transform: 'rotate(180deg)',
                                        color: isLight ? '#000' : '#fff',
                                        opacity: 0.8,
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        letterSpacing: '0.2em',
                                        textDecoration: 'underline',
                                        textDecorationThickness: '1px',
                                        textUnderlineOffset: '2px'
                                    }}
                                >
                                    Day
                                </div>
                                
                                {/* Badge with number */}
                                <div className="w-full h-full relative">
                                    <svg width="48" height="48" viewBox="0 0 44 44">
                                        <circle cx="22" cy="22" r="20" fill="none" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'} strokeWidth="1" />
                                        <circle 
                                            cx="22" cy="22" r="20" 
                                            fill="none" 
                                            stroke="var(--accent-color)" 
                                            strokeWidth="2.5" 
                                            strokeDasharray={`${(progress.completed / 14) * 126} 126`}
                                            strokeLinecap="round"
                                            style={{ 
                                                transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                                filter: isLight ? 'none' : 'blur(0.5px) drop-shadow(0 0 3px var(--accent-color))'
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                                        <span 
                                            className="text-[20px] font-black" 
                                            style={{ 
                                                color: isLight ? '#000' : 'var(--accent-color)',
                                                fontFamily: 'var(--font-display)',
                                                textShadow: isLight ? '0 1px 2px rgba(255,255,255,0.8)' : '0 0 12px var(--accent-40)'
                                            }}
                                        >
                                            {isComplete ? '✓' : dayNumber}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* "OF 14" label - Centered Right */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 left-[44px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                                    style={{ 
                                        color: isLight ? '#000' : '#fff',
                                        opacity: 0.6,
                                        fontFamily: 'var(--font-display)'
                                    }}
                                >
                                    of 14
                                </div>
                            </div>

                            {/* Soft fade edge to right */}
                            <div 
                                className="absolute inset-y-0 right-0 w-4 pointer-events-none"
                                style={{
                                    background: isLight 
                                        ? 'linear-gradient(to right, transparent, #faf6ee)'
                                        : 'linear-gradient(to right, transparent, rgba(20, 15, 25, 0.98))',
                                }}
                            />
                        </div>

                        {/* RIGHT COLUMN: Data */}
                        <div 
                            className="flex-1 flex flex-col p-5"
                            style={{ minHeight: '280px' }}
                        >
                            {/* Header - Title only, day info moved to left badge */}
                            <div className="mb-3">
                                <div 
                                    className="text-[17px] font-black leading-tight" 
                                    style={{ 
                                        color: config.textMain,
                                        fontFamily: 'var(--font-display)',
                                    }}
                                >
                                    {todaysPractice.title}
                                </div>
                            </div>

                            {/* Divider */}
                            <div 
                                className="w-full h-px mb-3"
                                style={{ background: isLight ? 'rgba(160, 120, 60, 0.15)' : 'var(--accent-15)' }}
                            />

                            {/* Practice Legs List */}
                            <div className="flex-1 space-y-2">
                                {legs.map((leg, index) => {
                                    // Determine if this is the next leg to complete
                                    const isNextLeg = !leg.completed && legs.slice(0, index).every(l => l.completed);
                                    const isLockedLeg = !leg.completed && !isNextLeg;

                                    return (
                                        <div
                                            key={`${dayNumber}-${leg.legNumber}`}
                                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all"
                                            style={{
                                                background: leg.completed
                                                    ? (isLight ? 'rgba(100, 150, 100, 0.08)' : 'rgba(100, 150, 100, 0.1)')
                                                    : (isLight ? 'rgba(60, 50, 35, 0.03)' : 'rgba(255, 255, 255, 0.03)'),
                                                opacity: isLockedLeg ? 0.5 : 1,
                                            }}
                                        >
                                            {/* Left: Status + Info */}
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                {/* Status Icon */}
                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    background: leg.completed ? 'var(--accent-color)' : (isLight ? 'rgba(60, 50, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)'),
                                                    color: leg.completed ? '#fff' : (isLight ? '#3c3020' : '#fdfbf5'),
                                                }}>
                                                    {leg.completed ? '✓' : leg.legNumber}
                                                </div>

                                                {/* Label + Time */}
                                                <div className="min-w-0 flex-1">
                                                    <div style={{
                                                        fontSize: '11px',
                                                        fontFamily: 'var(--font-display)',
                                                        fontWeight: 700,
                                                        color: config.textMain,
                                                    }}>
                                                        {leg.label || leg.practiceType}
                                                    </div>
                                                    <div
                                                        className="truncate"
                                                        style={{
                                                            fontSize: '9px',
                                                            opacity: 0.6,
                                                            color: config.textMain,
                                                        }}
                                                    >
                                                        {leg.time ? (typeof leg.time === 'string' ? leg.time.substring(0, 5) : String(leg.time)) : 'Anytime'}
                                                    </div>
                                                    {/* Warning for locked legs */}
                                                    {isLockedLeg && (
                                                        <div
                                                            style={{
                                                                fontSize: '8px',
                                                                fontWeight: 600,
                                                                color: isLight ? '#D97706' : '#FBBF24',
                                                                marginTop: '2px',
                                                            }}
                                                        >
                                                            Complete previous first
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Action */}
                                            {!leg.completed ? (
                                                <div className="relative flex-shrink-0">
                                                    {/* Radial glow animation - only for next leg */}
                                                    {isNextLeg && (
                                                        <div
                                                            className="absolute inset-0 rounded-full pointer-events-none"
                                                            style={{
                                                                background: `conic-gradient(from 0deg, transparent 0deg, var(--accent-color) 60deg, transparent 120deg)`,
                                                                filter: 'blur(8px)',
                                                                opacity: 0.6,
                                                                animation: 'radialGlow 3s linear infinite',
                                                            }}
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => handleStartLeg(leg)}
                                                        disabled={isLockedLeg}
                                                        className="relative px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all"
                                                        style={{
                                                            background: isLockedLeg
                                                                ? (isLight ? 'rgba(60, 50, 35, 0.2)' : 'rgba(255, 255, 255, 0.15)')
                                                                : 'var(--accent-color)',
                                                            color: isLockedLeg
                                                                ? (isLight ? 'rgba(60, 50, 35, 0.4)' : 'rgba(255, 255, 255, 0.3)')
                                                                : (isLight ? '#fff' : '#000'),
                                                            boxShadow: isLockedLeg ? 'none' : '0 3px 10px var(--accent-30)',
                                                            cursor: isLockedLeg ? 'not-allowed' : 'pointer',
                                                            ...(isNextLeg && {
                                                                transform: 'scale(1)',
                                                            }),
                                                            ...(!isLockedLeg && {
                                                                '&:hover': { transform: 'scale(1.05)' },
                                                                '&:active': { transform: 'scale(0.95)' },
                                                            }),
                                                        }}
                                                    >
                                                        Start
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    fontSize: '9px',
                                                    fontFamily: 'var(--font-display)',
                                                    fontWeight: 600,
                                                    color: 'var(--accent-color)',
                                                    opacity: 0.8,
                                                    flexShrink: 0,
                                                }}>
                                                    Done
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-3" style={{
                                borderTop: isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-10)',
                            }}>
                                {/* Completion Status */}
                                <div className="flex items-center gap-2">
                                    {isComplete ? (
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--accent-color)' }}>
                                            <span>✨</span>
                                            Day Complete
                                        </div>
                                    ) : (
                                        <div style={{
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            letterSpacing: '0.05em',
                                            color: config.textSub,
                                        }}>
                                            {completedLegs}/{legs.length} complete
                                        </div>
                                    )}
                                    {streak > 1 && (
                                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black flex items-center gap-1"
                                            style={{
                                                background: 'rgba(255, 200, 0, 0.1)',
                                                border: '1px solid rgba(255, 200, 0, 0.3)',
                                                color: 'var(--accent-color)',
                                            }}
                                        >
                                            🔥 {streak}
                                        </div>
                                    )}
                                </div>

                                {/* Rate + View Path */}
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="text-[16px] font-black tabular-nums" 
                                        style={{ 
                                            color: 'var(--accent-color)',
                                            textShadow: isLight ? 'none' : '0 0 10px var(--accent-30)'
                                        }}
                                    >
                                        {progress.rate}%
                                    </div>
                                    <button 
                                        onClick={onViewCurriculum}
                                        className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all"
                                        style={{ color: config.textMain }}
                                    >
                                        Path →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyPracticeCard;
