// src/components/DailyPracticeCard.jsx
// Premium "Ancient Relic" style Curriculum progress card
// Corrected to show solid parchment and organic edges

import React, { useRef, useState, useEffect } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { calculateGradientAngle, getAvatarCenter } from "../utils/dynamicLighting.js";

export function DailyPracticeCard({ onStartPractice, onViewCurriculum }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const displayMode = useDisplayModeStore(s => s.mode);
    const isLight = colorScheme === 'light';
    const isSanctuary = displayMode === 'sanctuary';
    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    const { 
        onboardingComplete,
        getCurrentDayNumber,
        getTodaysPractice,
        isTodayComplete,
        getProgress,
        getStreak,
        practiceTimeSlots,
    } = useCurriculumStore();

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setGradientAngle(calculateGradientAngle(rect, getAvatarCenter()));
        }
    }, [isLight]);

    if (!onboardingComplete) return null;

    const dayNumber = getCurrentDayNumber();
    const todaysPractice = getTodaysPractice();
    const isComplete = isTodayComplete();
    const progress = getProgress();
    const streak = getStreak();

    if (dayNumber > 14 || progress.completed >= 14) {
        return (
            <div
                className="w-full relative p-8 text-center rounded-[28px]"
                style={{
                    background: isLight ? '#f5efe5' : 'rgba(20, 15, 25, 0.95)',
                    border: '1px solid rgba(160, 120, 60, 0.4)',
                    boxShadow: '0 10px 40px rgba(80, 50, 20, 0.3)',
                }}
            >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                    Curriculum Complete!
                </h3>
                <p className="mb-4 opacity-70" style={{ color: isLight ? '#6b5a40' : '#fdfbf5' }}>
                    You completed {progress.completed} of 14 days
                </p>
                <button
                    onClick={onViewCurriculum}
                    className="px-6 py-2 rounded-full bg-accent-color text-white font-bold"
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

    const shadowStyle = isLight
        ? '0 10px 30px rgba(80, 50, 20, 0.25), 0 20px 60px rgba(60, 40, 15, 0.2), 0 0 0 1px rgba(160, 120, 60, 0.15)'
        : '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)';

    return (
        <div
            ref={cardRef}
            className="w-full relative transition-all duration-700 ease-in-out"
            style={{
                maxWidth: isSanctuary ? '600px' : '430px',
                margin: '0 auto',
            }}
        >
            {/* OUTER: Parchment Container */}
            <div
                className="w-full relative rounded-[28px] overflow-hidden"
                style={{
                    boxShadow: shadowStyle,
                    background: isLight ? '#faf6ee' : 'rgba(25, 20, 30, 0.98)',
                }}
            >
                {/* Background Asset (Light Mode) */}
                {isLight && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `url(${import.meta.env.BASE_URL}assets/painted_card_organic.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 1,
                            transform: 'scale(1.05)'
                        }}
                    />
                )}

                {/* Content */}
                <div className="relative z-10 p-7">
                    {/* Header Row */}
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-4">
                            {/* Day indicator */}
                            <div className="relative">
                                <svg width="44" height="44" viewBox="0 0 44 44">
                                    <circle cx="22" cy="22" r="20" fill="none" stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeWidth="2" />
                                    <circle 
                                        cx="22" cy="22" r="20" 
                                        fill="none" 
                                        stroke="var(--accent-color)" 
                                        strokeWidth="2.5" 
                                        strokeDasharray={`${(progress.completed / 14) * 126} 126`}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 1s ease' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[15px] font-black" style={{ color: isLight ? '#3c3020' : 'var(--accent-color)' }}>
                                        {isComplete ? '✓' : dayNumber}
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                    Day {dayNumber} of 14
                                </div>
                                <div className="text-[18px] font-bold leading-tight" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                    {todaysPractice.title}
                                </div>
                            </div>
                        </div>

                        {/* Completion Rate */}
                        <div className="text-right">
                             <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                Rate
                            </div>
                            <div className="text-[20px] font-black tabular-nums" style={{ color: 'var(--accent-color)' }}>
                                {progress.rate}%
                            </div>
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 mb-5 opacity-60">
                         <div className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                            {todaysPractice.practiceType === 'stillness' ? '🧘' : '💨'} {todaysPractice.practiceType}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                            {duration} MIN
                        </div>
                        {nextTime && (
                            <>
                                <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                                    ⏰ {nextTime}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Intention */}
                    <div className="mb-8 pl-4 border-l-2" style={{ borderColor: 'var(--accent-color)' }}>
                        <p className="text-[13px] italic leading-relaxed opacity-70" style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}>
                            "{todaysPractice.intention}"
                        </p>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between mt-auto">
                        {isComplete ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--accent-color)' }}>
                                        ✓ Practice Secured
                                    </span>
                                    {streak > 1 && (
                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent-glow/20 text-accent-color border border-accent-glow/30">
                                            🔥 {streak} DAY STREAK
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => onStartPractice?.(todaysPractice)}
                                    className="px-8 py-3 rounded-full text-[12px] font-black tracking-[0.2em] transition-all transform hover:scale-105"
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: isLight ? '#fff' : '#050508',
                                        boxShadow: '0 8px 20px var(--accent-25)'
                                    }}
                                >
                                    START PRACTICE
                                </button>
                            )
                        }

                        <button 
                            onClick={onViewCurriculum}
                            className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
                            style={{ color: isLight ? '#3c3020' : '#fdfbf5' }}
                        >
                            View Entire Path →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DailyPracticeCard;
