// src/components/TrajectoryCard.jsx
// Compact trajectory indicator for Hub - tap to see full report

import React, { useMemo } from 'react';
import { useProgressStore } from '../state/progressStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { useTheme } from '../context/ThemeContext';

export function TrajectoryCard({ onTap }) {
    // Get raw sessions data as dependency
    const getTrajectory = useProgressStore(s => s.getTrajectory);
    const sessionsCount = useProgressStore(s => s.sessions.length);
    const isLight = useDisplayModeStore(s => s.colorScheme === 'light');
    const theme = useTheme();
    const stage = theme?.stage || 'flame';

    // Memoize trajectory computation - only recalculate when sessions/dailyLogs change
    const trajectory = useMemo(() => {
        return getTrajectory(8);
    }, [getTrajectory, sessionsCount]);

    // Sparkline data (last 8 weeks)
    const consistencyData = trajectory.weeks.map(w => w.daysActive);
    const precisionData = trajectory.weeks.map(w => w.avgPrecision.breath || 0);
    const volumeData = trajectory.weeks.map(w => w.totalMinutes);

    // Normalize to 0-1 for sparkline
    const normalize = (data) => {
        const max = Math.max(...data, 1);
        return data.map(v => v / max);
    };

    // Trend arrow
    const { direction, directionLabel } = trajectory.trends;
    const arrow = direction === 'ascending' ? '↑' :
        direction === 'declining' ? '↓' : '→';

    const arrowColor = direction === 'ascending' ? (isLight ? '#16a34a' : '#4ade80') :
        direction === 'declining' ? (isLight ? '#dc2626' : '#f87171') :
            (isLight ? '#ca8a04' : '#fbbf24');

    // Generate headline insight
    const getHeadline = () => {
        const { precisionDelta, practiceChanges } = trajectory.insights;

        if (precisionDelta !== null && Math.abs(precisionDelta) > 10) {
            const sign = precisionDelta > 0 ? '+' : '';
            return `Breath precision ${sign}${Math.round(precisionDelta)}% over 8 weeks`;
        }

        if (practiceChanges.length > 0) {
            const latest = practiceChanges[practiceChanges.length - 1];
            return `Added ${latest.added[0]} practice`;
        }

        const totalMinutes = trajectory.weeks.reduce((sum, w) => sum + w.totalMinutes, 0);
        return `${totalMinutes} minutes across 8 weeks`;
    };

    // Sparkline mini-chart component
    const Sparkline = ({ data, color }) => {
        const normalized = normalize(data);
        const width = 78; // Increased from 60 (30% larger)
        const height = 26; // Increased from 20 (30% larger)
        const points = normalized.map((v, i) => {
            const x = (i / (normalized.length - 1)) * width;
            const y = height - (v * height);
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width={width} height={height} className="opacity-60">
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2" // Increased from 1.5
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.8 }}
                />
            </svg>
        );
    };

    return (
        <div
            onClick={onTap}
            className="w-full rounded-[32px] px-6 py-5 relative overflow-hidden transition-all duration-700 cursor-pointer hover:shadow-2xl active:scale-[0.99]"
            style={{
                maxWidth: '430px',
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
            {isLight && (
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
            )}
            {/* Header: Trajectory Indicator */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="text-2xl"
                        style={{ color: arrowColor }}
                    >
                        {arrow}
                    </div>
                    <div className="flex flex-col">
                        <div
                            className="text-xs uppercase tracking-wider font-semibold"
                            style={{
                                color: isLight ? 'rgba(80, 60, 40, 0.7)' : 'rgba(253, 251, 245, 0.5)',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            Trajectory
                        </div>
                        <div
                            className="text-sm font-semibold"
                            style={{
                                color: arrowColor,
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            {directionLabel}
                        </div>
                    </div>
                </div>

                <div
                    className="text-[10px] uppercase tracking-wider font-bold"
                    style={{
                        color: isLight ? 'rgba(80, 60, 40, 0.6)' : 'rgba(253, 251, 245, 0.4)',
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    Past 8 Weeks
                </div>
            </div>

            {/* Sparklines */}
            <div className="flex justify-between items-end mb-4 px-2">
                <div className="flex flex-col gap-1.5">
                    <div
                        className="text-[9px] uppercase tracking-wider font-bold"
                        style={{
                            color: isLight ? 'rgba(70, 55, 35, 0.65)' : 'rgba(253, 251, 245, 0.4)',
                        }}
                    >
                        Consistency
                    </div>
                    <Sparkline
                        data={consistencyData}
                        color={isLight ? '#ca8a04' : '#fbbf24'}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <div
                        className="text-[9px] uppercase tracking-wider font-bold"
                        style={{
                            color: isLight ? 'rgba(70, 55, 35, 0.65)' : 'rgba(253, 251, 245, 0.4)',
                        }}
                    >
                        Precision
                    </div>
                    <Sparkline
                        data={precisionData}
                        color={isLight ? '#16a34a' : '#4ade80'}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <div
                        className="text-[9px] uppercase tracking-wider font-bold"
                        style={{
                            color: isLight ? 'rgba(70, 55, 35, 0.65)' : 'rgba(253, 251, 245, 0.4)',
                        }}
                    >
                        Volume
                    </div>
                    <Sparkline
                        data={volumeData}
                        color={isLight ? '#2563eb' : '#60a5fa'}
                    />
                </div>
            </div>

            {/* Headline Insight */}
            <div
                className="text-xs italic leading-relaxed"
                style={{
                    color: isLight ? 'rgba(50, 38, 25, 0.85)' : 'rgba(253, 251, 245, 0.7)',
                    fontFamily: 'var(--font-body)',
                }}
            >
                {getHeadline()}
            </div>
        </div>
    );
}

export default TrajectoryCard;
