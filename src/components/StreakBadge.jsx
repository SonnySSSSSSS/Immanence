// src/components/StreakBadge.jsx
// Visual streak indicator with multiple states

import React from 'react';
import { useProgressStore } from '../state/progressStore.js';

/**
 * StreakBadge - Shows streak with visual states
 * States: active, decay warning, vacation, broken
 */
export function StreakBadge({ size = 'normal', showLabel = true }) {
    const { getStreakInfo } = useProgressStore();
    const streakInfo = getStreakInfo();

    const { current, longest, decayWarning, broken, onVacation } = streakInfo;

    // Determine state
    let state = 'active';
    if (onVacation) state = 'vacation';
    else if (broken) state = 'broken';
    else if (decayWarning) state = 'warning';
    else if (current >= 7) state = 'fire';

    // State-based styling
    const stateStyles = {
        fire: {
            icon: '🔥',
            bg: 'linear-gradient(135deg, rgba(251,146,60,0.25) 0%, rgba(239,68,68,0.15) 100%)',
            border: 'rgba(251,146,60,0.5)',
            color: '#fb923c',
            glow: '0 0 20px rgba(251,146,60,0.3)',
            pulse: true
        },
        active: {
            icon: '✨',
            bg: 'var(--accent-15)',
            border: 'var(--accent-30)',
            color: 'var(--accent-color)',
            glow: '0 0 15px var(--accent-10)',
            pulse: false
        },
        warning: {
            icon: '⚠️',
            bg: 'rgba(217,119,6,0.2)',
            border: 'rgba(217,119,6,0.5)',
            color: '#d97706',
            glow: '0 0 15px rgba(217,119,6,0.2)',
            pulse: true
        },
        vacation: {
            icon: '❄️',
            bg: 'rgba(59,130,246,0.15)',
            border: 'rgba(59,130,246,0.4)',
            color: '#3b82f6',
            glow: '0 0 15px rgba(59,130,246,0.2)',
            pulse: false
        },
        broken: {
            icon: '💔',
            bg: 'rgba(107,114,128,0.15)',
            border: 'rgba(107,114,128,0.3)',
            color: '#6b7280',
            glow: 'none',
            pulse: false
        }
    };

    const style = stateStyles[state];
    const isLarge = size === 'large';

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full transition-all ${style.pulse ? 'animate-pulse-subtle' : ''}`}
            style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                boxShadow: style.glow,
                padding: isLarge ? '8px 16px' : '4px 10px'
            }}
        >
            <span className={isLarge ? 'text-xl' : 'text-sm'}>
                {style.icon}
            </span>

            <div className="flex flex-col">
                <span
                    className={`font-semibold ${isLarge ? 'text-base' : 'text-[11px]'}`}
                    style={{ color: style.color, fontFamily: 'var(--font-ui, Outfit, sans-serif)' }}
                >
                    {onVacation ? (
                        `${current} day${current !== 1 ? 's' : ''} frozen`
                    ) : broken ? (
                        'Streak reset'
                    ) : (
                        `${current} day${current !== 1 ? 's' : ''}`
                    )}
                </span>

                {showLabel && (
                    <span
                        className="text-[8px] uppercase tracking-wider"
                        style={{ color: `${style.color}80` }}
                    >
                        {state === 'fire' ? 'On fire!' :
                            state === 'warning' ? 'Practice today!' :
                                state === 'vacation' ? 'Vacation mode' :
                                    state === 'broken' ? 'Start fresh' :
                                        current === 0 ? 'Start your streak' : 'Current streak'}
                    </span>
                )}
            </div>

            {/* Longest streak badge (if notable) */}
            {longest > current && longest >= 7 && !isLarge && (
                <div
                    className="text-[8px] px-1.5 py-0.5 rounded-full ml-1"
                    style={{
                        background: 'rgba(253,251,245,0.1)',
                        color: 'rgba(253,251,245,0.5)'
                    }}
                    title={`Longest streak: ${longest} days`}
                >
                    🏆 {longest}
                </div>
            )}

            <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}

/**
 * StreakRing - Circular streak visualization
 * Shows 7 dots for the week, filled for practiced days
 */
export function StreakRing({ size = 60 }) {
    const { getWeeklyPattern, getStreakInfo } = useProgressStore();
    const weeklyPattern = getWeeklyPattern();
    const streakInfo = getStreakInfo();

    const radius = size / 2 - 8;
    const center = size / 2;
    const dotSize = size > 50 ? 6 : 4;

    return (
        <div
            className="relative"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="absolute inset-0">
                {/* Background ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(253,251,245,0.1)"
                    strokeWidth="2"
                />

                {/* Day dots */}
                {weeklyPattern.map((practiced, i) => {
                    const angle = (i * 360 / 7 - 90) * (Math.PI / 180);
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);

                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={dotSize}
                            fill={practiced ? 'var(--accent-color)' : 'rgba(253,251,245,0.2)'}
                            style={{
                                filter: practiced ? 'drop-shadow(0 0 4px var(--accent-50))' : 'none'
                            }}
                        />
                    );
                })}
            </svg>

            {/* Center number */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    color: streakInfo.current > 0 ? 'var(--accent-color)' : 'rgba(253,251,245,0.5)',
                    fontFamily: 'Georgia, serif',
                    fontSize: size > 50 ? '16px' : '12px',
                    fontWeight: 600
                }}
            >
                {streakInfo.current}
            </div>
        </div>
    );
}
