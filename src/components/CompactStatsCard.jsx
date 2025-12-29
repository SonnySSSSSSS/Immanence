// src/components/CompactStatsCard.jsx
// Compact visual stats card with precision-of-time tracking
// Replaces the verbose TrackingHub with visual-first metrics

import React, { useState, useRef, useEffect } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { STAGE_COLORS } from '../constants/stageColors.js';
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from '../utils/dynamicLighting.js';

// Get current stage from progress
const useCurrentStage = () => {
    const allStats = useProgressStore(s => s.getAllStats?.() || {});
    // Determine primary domain based on recent activity
    const domains = ['wisdom', 'breathwork', 'visualization'];
    let mostRecent = { domain: 'wisdom', time: 0 };

    domains.forEach(domain => {
        const stats = allStats[domain];
        if (stats?.lastPracticed) {
            const time = new Date(stats.lastPracticed).getTime();
            if (time > mostRecent.time) {
                mostRecent = { domain, time };
            }
        }
    });

    return mostRecent.domain;
};

// Calculate precision for a given practice time vs target
const calculatePrecision = (targetTime, actualTime) => {
    if (!actualTime) return 'missed';

    const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const targetMinutes = parseTime(targetTime);
    const actualMinutes = parseTime(actualTime);
    const diffMinutes = Math.abs(targetMinutes - actualMinutes);

    if (diffMinutes <= 15) return 'perfect';   // ●
    if (diffMinutes <= 60) return 'close';      // ◐
    return 'missed';                             // ○
};

// Sessions Ring Component - Subtle progress toward milestone
function SessionsRing({ count, stageColor, isLight }) {
    const milestone = Math.ceil(count / 50) * 50; // Next 50 milestone
    const progress = (count % 50) / 50;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 50 50">
                    {/* Background ring */}
                    <circle
                        cx="25" cy="25" r="22"
                        fill="none"
                        stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="3"
                    />
                    {/* Progress ring - subtle 30% opacity */}
                    <circle
                        cx="25" cy="25" r="22"
                        fill="none"
                        stroke={stageColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ opacity: 0.4, transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
                <span
                    className="text-lg font-semibold"
                    style={{
                        color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)',
                    }}
                >
                    {count}
                </span>
            </div>
            <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.6)' }}
            >
                Sessions
            </span>
        </div>
    );
}

// Streak Embers Component - Glowing ember icons based on streak tier
function StreakEmbers({ streak, stageColor, isLight }) {
    // Streak tiers: 1-6 = 1 ember, 7-13 = 2, 14-29 = 3, 30+ = 4
    const emberCount = streak >= 30 ? 4 : streak >= 14 ? 3 : streak >= 7 ? 2 : streak >= 1 ? 1 : 0;

    // Ember glow intensity based on streak within tier
    const getGlowIntensity = () => {
        if (streak >= 30) return 0.9;
        if (streak >= 14) return 0.7;
        if (streak >= 7) return 0.5;
        return 0.3;
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex flex-col items-center">
                <span
                    className="text-lg font-semibold"
                    style={{
                        color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)',
                    }}
                >
                    {streak}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-3 transition-all duration-300"
                            style={{
                                background: i < emberCount
                                    ? `linear-gradient(to top, ${stageColor}, rgba(255, 200, 100, 0.8))`
                                    : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                                borderRadius: '50% 50% 20% 20%',
                                boxShadow: i < emberCount
                                    ? `0 0 ${4 + getGlowIntensity() * 6}px ${stageColor}`
                                    : 'none',
                                opacity: i < emberCount ? getGlowIntensity() + 0.3 : 0.4,
                            }}
                        />
                    ))}
                </div>
            </div>
            <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.6)' }}
            >
                Day Streak
            </span>
        </div>
    );
}

// Regiment Progress Bar
function RegimentProgress({ progress, stageColor, isLight }) {
    const percentage = Math.round(progress * 100);

    return (
        <div className="flex flex-col items-center gap-1 flex-1 max-w-[120px]">
            <div className="w-full flex items-center gap-2">
                <div
                    className="flex-1 h-2.5 rounded-full overflow-hidden"
                    style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${stageColor}80, ${stageColor})`,
                            boxShadow: percentage > 80 ? `0 0 8px ${stageColor}60` : 'none',
                        }}
                    />
                </div>
                <span
                    className="text-sm font-medium min-w-[36px] text-right"
                    style={{ color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(253, 251, 245, 0.9)' }}
                >
                    {percentage}%
                </span>
            </div>
            <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.6)' }}
            >
                Regiment Progress
            </span>
        </div>
    );
}

// Precision Timeline - Weekly visualization of practice time consistency
function PrecisionTimeline({ weekData, targetTime, stageColor, isLight }) {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const getPrecisionStyle = (precision) => {
        switch (precision) {
            case 'perfect':
                return {
                    fill: stageColor,
                    opacity: 0.9,
                    glow: `0 0 6px ${stageColor}`
                };
            case 'close':
                return {
                    fill: stageColor,
                    opacity: 0.5,
                    glow: 'none'
                };
            default:
                return {
                    fill: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                    opacity: 1,
                    glow: 'none'
                };
        }
    };

    return (
        <div className="w-full">
            <div
                className="text-[9px] uppercase tracking-[0.15em] text-center mb-2"
                style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.6)' }}
            >
                Precision of Time Practiced Every Day
            </div>

            <div className="flex justify-between items-start px-2">
                {days.map((day, i) => {
                    const dayData = weekData[i] || { precision: 'missed', time: null };
                    const style = getPrecisionStyle(dayData.precision);

                    return (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span
                                className="text-[10px] font-medium"
                                style={{ color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)' }}
                            >
                                {day}
                            </span>

                            {/* Precision indicator */}
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    background: style.fill,
                                    opacity: style.opacity,
                                    boxShadow: style.glow,
                                }}
                            >
                                {dayData.precision === 'close' && (
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)' }}
                                    />
                                )}
                            </div>

                            {/* Actual time (faint) */}
                            <span
                                className="text-[8px] h-3"
                                style={{
                                    color: isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(253, 251, 245, 0.35)',
                                    visibility: dayData.time ? 'visible' : 'hidden'
                                }}
                            >
                                {dayData.time || ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Main CompactStatsCard Component
export function CompactStatsCard({ domain = 'wisdom', streakInfo }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const cardRef = useRef(null);
    const [gradientAngle, setGradientAngle] = useState(135);

    // Get stats from store
    const getAllStats = useProgressStore(s => s.getAllStats);
    const allStats = getAllStats?.() || {};
    const domainStats = allStats[domain] || { count: 0, totalMinutes: 0 };

    // Calculate streak from streakInfo or fallback
    const streak = streakInfo?.currentStreak || 0;

    // Mock week data for precision timeline (will be replaced with real data)
    const targetTime = "12:00"; // Global target time - will come from settings
    const mockWeekData = [
        { precision: 'perfect', time: '12:03' },
        { precision: 'perfect', time: '11:58' },
        { precision: 'close', time: '12:45' },
        { precision: 'missed', time: null },
        { precision: 'perfect', time: '12:02' },
        { precision: 'close', time: '13:15' },
        { precision: 'missed', time: null },
    ];

    // Calculate regiment progress (% of days practiced this week)
    const daysWithPractice = mockWeekData.filter(d => d.precision !== 'missed').length;
    const regimentProgress = daysWithPractice / 7;

    // Stage color for visual elements
    const stageColor = isLight ? 'hsl(45, 70%, 45%)' : 'hsl(160, 60%, 50%)';

    // Dynamic lighting angle
    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const avatarCenter = getAvatarCenter();
            const angle = calculateGradientAngle(rect, avatarCenter);
            setGradientAngle(angle);
        }
    }, []);

    // Domain labels
    const domainLabels = {
        wisdom: 'Wisdom',
        breathwork: 'Breathwork',
        visualization: 'Visualization'
    };

    const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

    return (
        <div
            ref={cardRef}
            className="w-full rounded-2xl px-4 py-3 relative overflow-hidden transition-all duration-500"
            style={{
                maxWidth: '430px',
                margin: '0 auto',
                border: '1.5px solid transparent',
                backgroundImage: isLight
                    ? `
            linear-gradient(145deg, var(--light-bg-surface) 0%, var(--light-bg-base) 100%),
            ${getDynamicGoldGradient(gradientAngle, true)}
          `
                    : `
            linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%),
            linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))
          `,
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: isLight
                    ? `
            0 0 0 0.5px rgba(175, 139, 44, 0.3),
            0 4px 16px rgba(120, 90, 60, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `
                    : `
            0 0 0 0.5px rgba(255, 255, 255, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.06)
          `,
            }}
        >
            {/* Header Row */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: isLight ? 'rgba(45, 40, 35, 0.9)' : 'rgba(253, 251, 245, 0.9)' }}
                    >
                        📊 {domainLabels[domain]}
                    </span>
                </div>
                <div className="text-right">
                    <div
                        className="text-[10px]"
                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253, 251, 245, 0.5)' }}
                    >
                        {today}
                    </div>
                    <div
                        className="text-[9px] uppercase tracking-wider"
                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(253, 251, 245, 0.4)' }}
                    >
                        Peak: {domainStats.peakMinutes || 0} min
                    </div>
                </div>
            </div>

            {/* Visual Stats Row */}
            <div className="flex justify-between items-center gap-3 mb-4">
                <SessionsRing
                    count={domainStats.count || 0}
                    stageColor={stageColor}
                    isLight={isLight}
                />
                <StreakEmbers
                    streak={streak}
                    stageColor={stageColor}
                    isLight={isLight}
                />
                <RegimentProgress
                    progress={regimentProgress}
                    stageColor={stageColor}
                    isLight={isLight}
                />
            </div>

            {/* Precision Timeline */}
            <PrecisionTimeline
                weekData={mockWeekData}
                targetTime={targetTime}
                stageColor={stageColor}
                isLight={isLight}
            />
        </div>
    );
}

export default CompactStatsCard;
