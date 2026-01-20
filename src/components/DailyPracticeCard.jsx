// src/components/DailyPracticeCard.jsx
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
        bgAsset: 'card_bg_comet_{stage}.png',  // Placeholder, will be replaced below
        border: 'var(--accent-20)',
        shadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }
};

export function DailyPracticeCard({ onStartPractice, onViewCurriculum, onNavigate, hasPersistedCurriculumData, onStartSetup, onboardingComplete: onboardingCompleteProp, practiceTimeSlots: practiceTimeSlotsProp }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.viewportMode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const config = THEME_CONFIG[isLight ? 'light' : 'dark'];

    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    const theme = useTheme();
    const currentStage = theme?.stage || 'Flame';
    const stageLower = currentStage.toLowerCase();
    const primaryHex = theme?.accent?.primary || '#4ade80';

    const {
        onboardingComplete: storeOnboardingComplete,
        activeCurriculumId,
        getCurrentDayNumber,
        getTodaysPractice,
        isTodayComplete,
        getProgress,
        getStreak,
        getDayLegsWithStatus,
        setActivePracticeSession,
        _devReset,
        practiceTimeSlots: storePracticeTimeSlots,
    } = useCurriculumStore();

    const onboardingComplete = onboardingCompleteProp ?? storeOnboardingComplete;
    const practiceTimeSlots = practiceTimeSlotsProp ?? storePracticeTimeSlots;

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

    // Better color transformation from cyan base to stage accent
    const stageColorFilter = useMemo(() => {
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

        // Map target hue to filter string with sepia for warmer tones
        if (targetHue >= 10 && targetHue <= 60) {
            // Orange/Yellow range (Ember/Flame) - use sepia for warmth
            return `sepia(0.8) saturate(2) hue-rotate(${targetHue - 30}deg) brightness(1.1)`;
        } else if (targetHue >= 90 && targetHue <= 150) {
            // Green range (Seedling) - direct hue shift from cyan
            return `hue-rotate(${targetHue - 180}deg) saturate(1.3) brightness(1.05)`;
        } else if (targetHue >= 180 && targetHue <= 210) {
            // Cyan range (Beacon) - minimal adjustment
            return `saturate(1.4) brightness(1.05) contrast(1.1)`;
        } else if (targetHue >= 260 && targetHue <= 300) {
            // Purple/Violet range (Stellar) - hue shift from cyan
            return `hue-rotate(${targetHue - 180}deg) saturate(1.5) brightness(1.1)`;
        }
        // Default fallback
        return `hue-rotate(${targetHue - 180}deg) saturate(1.3) brightness(1.05)`;
    }, [baseAccent]);

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight, displayMode]);

    const needsSetup = !onboardingComplete && (!practiceTimeSlots || practiceTimeSlots.length === 0);


    if (needsSetup || (!onboardingComplete && hasPersistedCurriculumData === false)) {
        const bgAsset = isLight ? 'ancient_relic_focus.png' : `card_bg_comet_${stageLower}.png`;
        return (
            <div
                className="w-full relative transition-all duration-700 ease-in-out"
                style={{
                    maxWidth: isSanctuary ? '656px' : '430px',
                    margin: '0 auto',
                }}
            >
                <div
                    className="w-full relative"
                    style={{
                        borderRadius: '24px',
                        border: isLight
                            ? `2px solid ${primaryHex}40`
                            : `2px solid ${primaryHex}60`,
                        boxShadow: isLight
                            ? `0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 20px ${primaryHex}20`
                            : `0 30px 80px rgba(0, 0, 0, 0.8), 0 0 30px ${primaryHex}30`
                    }}
                >
                    <div
                        ref={cardRef}
                        className="w-full relative overflow-hidden rounded-[24px]"
                        style={{
                            background: isLight ? '#faf6ee' : 'rgb(20, 15, 25)',
                            border: isLight ? '1px solid rgba(160, 120, 60, 0.15)' : '1px solid var(--accent-20)',
                        }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/${bgAsset})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: isLight ? 'saturate(1.1)' : 'none',
                                transition: 'all 0.7s ease-in-out',
                            }}
                        />

                        <div className="absolute inset-0 pointer-events-none" style={{ 
                            background: isLight 
                                ? 'linear-gradient(to right, rgba(250, 246, 238, 0) 0%, rgba(250, 246, 238, 0.3) 30%, rgba(250, 246, 238, 0.9) 100%)' 
                                : 'linear-gradient(to right, rgba(20, 15, 25, 0) 0%, rgba(20, 15, 25, 0.45) 40%, rgba(20, 15, 25, 0.95) 100%)' 
                        }} />

                        <div 
                            className="relative z-10 ml-auto w-[380px] max-w-[70%] min-w-[320px] min-h-[460px] max-h-[600px] overflow-hidden flex flex-col"
                            style={{
                                background: isLight ? 'rgba(250, 246, 238, 0.72)' : 'rgba(20, 15, 25, 0.78)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderLeft: isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-15)',
                            }}
                        >
                            {isLight && (
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-40"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/parchment_blank.png)`,
                                        backgroundSize: 'cover',
                                        mixBlendMode: 'multiply',
                                    }}
                                />
                            )}

                            <div className="p-6 sm:p-7 relative z-10 flex flex-col gap-5">
                                <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)' : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)' }} />

                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.32em] opacity-60" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                                        Today's Practice
                                    </div>
                                    <div className="text-lg font-black tracking-wide" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                        NO CURRICULUM DATA
                                    </div>
                                    <div className="text-[11px] opacity-70 leading-snug mt-3" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                        This browser has no onboarding/curriculum saved yet.
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={() => onStartSetup?.()}
                                        className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
                                        style={{
                                            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                            color: '#fff',
                                            boxShadow: '0 3px 10px var(--accent-30)',
                                        }}
                                    >
                                        START SETUP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const dayNumber = getCurrentDayNumber();
    const todaysPractice = getTodaysPractice();
    const isComplete = isTodayComplete();
    const progress = getProgress();
    const streak = getStreak();
    const legs = getDayLegsWithStatus(dayNumber);


    if (dayNumber > 14 || progress.completed >= progress.total) {
        const bgAsset = isLight ? 'ancient_relic_focus.png' : `card_bg_comet_${stageLower}.png`;
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
                        filter: 'none',
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
        if (leg.launcherId) {
            onStartPractice?.(leg, { dayNumber, programId: activeCurriculumId });
            return;
        }
        setActivePracticeSession(dayNumber, leg.legNumber);
        onStartPractice?.(leg, { dayNumber, programId: activeCurriculumId });
    };

    const completedLegs = legs.filter(l => l.completed).length;

    return (
        <div
            className="w-full relative transition-all duration-700 ease-in-out"
            style={{
                maxWidth: isSanctuary ? '656px' : '430px',
                margin: '0 auto',
            }}
        >
            {/* OUTER: Frame with Shadow */}
            <div
                className="w-full relative"
                style={{
                    borderRadius: '24px',
                    border: isLight
                        ? `2px solid ${primaryHex}40`
                        : `2px solid ${primaryHex}60`,
                    boxShadow: isLight
                        ? `0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 20px ${primaryHex}20`
                        : `0 30px 80px rgba(0, 0, 0, 0.8), 0 0 30px ${primaryHex}30`
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
                    {/* 1. IMMERSIVE BACKGROUND LAYER (No layout width) */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url(${import.meta.env.BASE_URL}assets/${isLight ? config.bgAsset : `card_bg_comet_${stageLower}.png`})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: isLight ? 'saturate(1.1)' : 'none',
                                transition: 'all 0.7s ease-in-out',
                            }}
                    />

                    {/* 2. LEFT BLOOM FADE: image blooms into parchment */}
                    <div className="absolute inset-0 pointer-events-none" style={{ 
                        background: isLight 
                            ? 'linear-gradient(to right, rgba(250, 246, 238, 0) 0%, rgba(250, 246, 238, 0.3) 30%, rgba(250, 246, 238, 0.9) 100%)' 
                            : 'linear-gradient(to right, rgba(20, 15, 25, 0) 0%, rgba(20, 15, 25, 0.45) 40%, rgba(20, 15, 25, 0.95) 100%)' 
                    }} />

                    {/* 3. CONTENT PANEL (Owns the readable layout) */}
                    <div 
                        className="relative z-10 ml-auto w-[380px] max-w-[70%] min-w-[320px] min-h-[460px] max-h-[600px] overflow-hidden flex flex-col"
                        style={{
                            background: isLight ? 'rgba(250, 246, 238, 0.72)' : 'rgba(20, 15, 25, 0.78)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderLeft: isLight ? '1px solid rgba(160, 120, 60, 0.1)' : '1px solid var(--accent-15)',
                        }}
                    >
                            {/* Panel texture scrim */}
                            {isLight && (
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-40"
                                    style={{
                                        backgroundImage: `url(${import.meta.env.BASE_URL}assets/parchment_blank.png)`,
                                        backgroundSize: 'cover',
                                        mixBlendMode: 'multiply',
                                    }}
                                />
                            )}

                            {/* Scrollable Container */}
                            <div className="p-6 sm:p-7 relative z-10">
                                {/* Decorative corner embellishments */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at 10% 10%, rgba(180, 140, 60, 0.12), transparent 30%), radial-gradient(circle at 90% 90%, rgba(180, 140, 60, 0.12), transparent 30%)' : 'radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.06), transparent 30%), radial-gradient(circle at 90% 90%, rgba(255, 255, 255, 0.06), transparent 30%)' }} />

                                {/* Header */}
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.32em] opacity-60" style={{ color: isLight ? 'rgba(60, 50, 35, 0.6)' : 'rgba(253,251,245,0.6)' }}>
                                            Today's Practice
                                        </div>
                                        <div className="text-lg font-black tracking-wide" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                            {todaysPractice.title || `Day ${dayNumber}`}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                            {todaysPractice.subtitle || 'Curriculum'}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-xs font-bold" style={{ color: isLight ? config.accent : 'var(--accent-color)' }}>
                                            {completedLegs}/{legs.length} Complete
                                        </div>
                                        {streak > 1 && (
                                            <div className="px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1" style={{ background: isLight ? 'rgba(255, 200, 0, 0.12)' : 'rgba(255, 200, 0, 0.1)', border: isLight ? '1px solid rgba(255, 200, 0, 0.3)' : '1px solid rgba(255, 200, 0, 0.3)', color: isLight ? '#8b6b2c' : 'var(--accent-color)' }}>
                                                🔥 {streak}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Legs List */}
                                <div className="space-y-3">
                                    {legs.map((leg, index) => {
                                        const isNextLeg = !leg.completed && legs.slice(0, index).every(l => l.completed);
                                        const isLockedLeg = !leg.completed && !isNextLeg;
                                        return (
                                            <div
                                                key={`${dayNumber}-${leg.legNumber}`}
                                                className="rounded-2xl border p-4 flex items-center gap-3 transition-all"
                                                style={{
                                                    borderColor: isLight ? 'rgba(160, 120, 60, 0.18)' : 'var(--accent-15)',
                                                    background: isLight
                                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                                                        : 'linear-gradient(135deg, rgba(30, 25, 35, 0.95) 0%, rgba(24, 20, 30, 0.92) 100%)',
                                                    boxShadow: isLight
                                                        ? '0 6px 18px rgba(120, 90, 60, 0.1)'
                                                        : '0 10px 30px rgba(0,0,0,0.45)',
                                                    opacity: isLockedLeg ? 0.5 : 1,
                                                }}
                                            >
                                                {/* Leg Number / Status */}
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all"
                                                    style={{
                                                        background: leg.completed
                                                            ? 'linear-gradient(135deg, var(--accent-color), var(--accent-60))'
                                                            : (isLight ? 'rgba(160, 120, 60, 0.1)' : 'rgba(255, 255, 255, 0.08)'),
                                                        color: leg.completed ? '#fff' : (isLight ? '#3c3020' : '#fdfbf5'),
                                                        boxShadow: leg.completed ? '0 6px 20px var(--accent-25)' : 'none',
                                                        transform: isNextLeg ? 'scale(1.05)' : 'scale(1)',
                                                    }}
                                                >
                                                    {leg.completed ? '✓' : leg.legNumber}
                                                </div>

                                                {/* Leg Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-bold leading-tight" style={{ color: isLight ? '#3c3020' : '#fdfbf5', fontFamily: 'var(--font-display)' }}>
                                                            {leg.label || leg.practiceType}
                                                        </div>
                                                        {leg.time && (
                                                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                                {typeof leg.time === 'string' 
                                                                    ? leg.time.substring(0, 5) 
                                                                    : (leg.time.time ? String(leg.time.time).substring(0, 5) : String(leg.time).substring(0, 5))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] opacity-70 leading-snug mt-1" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                                        {leg.description || 'Guided practice'}
                                                    </div>
                                                    {leg.practiceConfig?.duration && (
                                                        <div className="text-[10px] uppercase tracking-[0.18em] font-black mt-1" style={{ color: isLight ? '#8b7b63' : 'var(--accent-40)' }}>
                                                            {leg.practiceConfig.duration} min
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                {!leg.completed ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        {isNextLeg && (
                                                            <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: isLight ? '#8b6b2c' : 'var(--accent-50)' }}>
                                                                Next Up
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleStartLeg(leg)}
                                                            disabled={isLockedLeg}
                                                            className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                                            style={{
                                                                background: isLockedLeg
                                                                    ? (isLight ? 'rgba(60,50,35,0.06)' : 'rgba(255,255,255,0.08)')
                                                                    : 'var(--accent-color)',
                                                                color: isLockedLeg ? (isLight ? '#3c3020' : '#fdfbf5') : '#fff',
                                                                boxShadow: isLockedLeg ? 'none' : '0 3px 10px var(--accent-30)',
                                                                cursor: isLockedLeg ? 'not-allowed' : 'pointer',
                                                                ...(isNextLeg && {
                                                                    boxShadow: '0 8px 20px var(--accent-30)',
                                                                }),
                                                                ...(!isLockedLeg && {
                                                                    background: 'linear-gradient(135deg, var(--accent-color), var(--accent-70))',
                                                                })
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
                                <div className="flex items-center justify-between mt-6 pt-4" style={{
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
                                            onClick={() => {
                                                console.log('[DailyPracticeCard] Path button clicked, calling onViewCurriculum');
                                                onViewCurriculum();
                                            }}
                                            className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all font-display"
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
