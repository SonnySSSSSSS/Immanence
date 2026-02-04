import React, { useMemo } from 'react';
import { CircularProgress } from './CircularProgress';
import { StatCard } from './StatCard';
import { Sparkline } from './Sparkline';
import { DOMAIN_COLORS, METRIC_STATE_COLORS } from './tokens';

/**
 * Dashboard header for Practice tab.
 * Shows hero accuracy ring + stat cards for sessions, minutes, streak.
 *
 * Props:
 * - practiceSummary: { totalSessions, totalMinutes, avgAccuracy, domainRows }
 * - trajectory: { weeks: [...] } - 8-week data for sparkline
 * - isLight: Light mode styling
 */
export function PracticeDashboardHeader({
    practiceSummary,
    trajectory,
    isLight = false
}) {
    const {
        totalSessions = 0,
        totalMinutes = 0,
        avgAccuracy = null,
        domainRows = []
    } = practiceSummary || {};

    // Calculate streak from trajectory weeks
    const currentStreak = useMemo(() => {
        if (!trajectory?.weeks?.length) return 0;
        // Count consecutive weeks with activity from most recent
        let streak = 0;
        for (let i = trajectory.weeks.length - 1; i >= 0; i--) {
            if (trajectory.weeks[i].daysActive > 0) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [trajectory]);

    // Build sparkline data from trajectory
    const sparklineData = useMemo(() => {
        if (!trajectory?.weeks?.length) return [];
        return trajectory.weeks.slice(-7).map((w, i) => ({
            value: w.totalMinutes || 0,
            label: `Week ${i + 1}`
        }));
    }, [trajectory]);

    // Average duration
    const avgDuration = totalSessions > 0
        ? Math.round(totalMinutes / totalSessions)
        : 0;

    // Format minutes helper
    const formatMinutes = (min) => {
        if (min >= 60) {
            const hours = Math.floor(min / 60);
            const mins = Math.round(min % 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${Math.round(min)}m`;
    };

    // Accuracy as percentage (0-100)
    const accuracyPercent = avgAccuracy !== null ? Math.round(avgAccuracy * 100) : null;

    return (
        <div style={{ marginBottom: '16px' }}>
            {/* Hero Row: Accuracy Ring + Stats */}
            <div
                style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                }}
            >
                {/* Hero: Breath Accuracy */}
                {accuracyPercent !== null ? (
                    <CircularProgress
                        value={accuracyPercent}
                        max={100}
                        size="lg"
                        color={DOMAIN_COLORS.practice}
                        label="Breath Accuracy"
                        definition="Tap timing deviation, last 30 sessions"
                        isHero={true}
                        isLight={isLight}
                    />
                ) : (
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.4
                        }}
                    >
                        <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                            No accuracy data
                        </span>
                    </div>
                )}

                {/* Stat Cards Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        flex: 1,
                        minWidth: '240px'
                    }}
                >
                    <StatCard
                        icon="🧘"
                        value={totalSessions}
                        label="Sessions"
                        color={DOMAIN_COLORS.practice}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="⏱️"
                        value={formatMinutes(totalMinutes)}
                        label="Total Time"
                        color={DOMAIN_COLORS.practice}
                        sparkline={sparklineData.length > 2 ? (
                            <Sparkline
                                data={sparklineData}
                                width={80}
                                height={24}
                                color={DOMAIN_COLORS.practice}
                                showArea={true}
                                showTooltip={false}
                            />
                        ) : null}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="🔥"
                        value={`${currentStreak}w`}
                        label="Streak"
                        definition="Consecutive weeks with activity"
                        color={currentStreak >= 4 ? METRIC_STATE_COLORS.excellent : DOMAIN_COLORS.practice}
                        isLight={isLight}
                    />

                    <StatCard
                        icon="📊"
                        value={formatMinutes(avgDuration)}
                        label="Avg Session"
                        color={DOMAIN_COLORS.practice}
                        isLight={isLight}
                    />
                </div>
            </div>

            {/* Domain breakdown (compact) */}
            {domainRows.length > 0 && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        fontSize: '11px',
                        opacity: 0.7
                    }}
                >
                    {domainRows.slice(0, 4).map(row => (
                        <div key={row.domain} style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                {row.domain}:
                            </span>
                            <span>{row.count} ({formatMinutes(row.totalMinutes)})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PracticeDashboardHeader;
