// src/components/PathJourneyLog.jsx
// Path history timeline and practice distribution stats

import React from 'react';
import { usePathStore, PATH_SYMBOLS, PATH_NAMES } from '../state/pathStore';
import { useLunarStore } from '../state/lunarStore';

/**
 * PathJourneyLog — Shows path history timeline and practice stats
 * 
 * Displays:
 * - Timeline of path changes
 * - Statistics breakdown by domain
 * - Charts showing practice distribution
 */
export function PathJourneyLog() {
    const getDisplayPath = usePathStore(s => s.getDisplayPath);
    const rawPath = usePathStore(s => s.currentPath);
    const pathStatus = usePathStore(s => s.pathStatus);
    const getPathJourney = usePathStore(s => s.getPathJourney);
    const getPracticeDistribution = usePathStore(s => s.getPracticeDistribution);
    const pathEmergenceDate = usePathStore(s => s.pathEmergenceDate);
    const stage = useLunarStore(s => s.getCurrentStage());
    const currentPath = getDisplayPath ? getDisplayPath(stage) : rawPath;

    const journey = getPathJourney();
    const distribution = getPracticeDistribution();

    const stageLower = (stage || 'seedling').toLowerCase();
    const isSeedling = stageLower === 'seedling';

    // If no path yet, show minimal state
    if (!currentPath && (pathStatus === 'forming' || pathStatus === 'balanced' || isSeedling)) {
        return (
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '1.5rem',
                    marginTop: '1.5rem',
                }}
            >
                <h3
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-wide)',
                        fontSize: '1rem',
                        color: 'var(--accent-color, #fcd34d)',
                        marginBottom: '1rem',
                        textAlign: 'center',
                    }}
                >
                    Path Journey
                </h3>
                <p
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                        fontSize: '0.9375rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        textAlign: 'center',
                        lineHeight: 1.6,
                    }}
                >
                    {pathStatus === 'balanced'
                        ? 'Your attention is balanced across interfaces. No single path dominates yet.'
                        : 'Your path is still forming. Practice consistently and your unique path will emerge after 90 days.'}
                </p>
            </div>
        );
    }

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '1.5rem',
                marginTop: '1.5rem',
            }}
        >
            <h3
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-wide)',
                    fontSize: '1rem',
                    color: 'var(--accent-color, #fcd34d)',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                }}
            >
                Path Journey
            </h3>

            {/* Current Path */}
            {currentPath && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '0.75rem',
                    }}
                >
                    <span style={{ fontSize: '2rem' }}>{PATH_SYMBOLS[currentPath]}</span>
                    <div>
                        <div
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600,
                                letterSpacing: 'var(--tracking-mythic)',
                                fontSize: '1.125rem',
                                color: 'var(--accent-color, #fcd34d)',
                                fontWeight: 600,
                            }}
                        >
                            {PATH_NAMES[currentPath]} Path
                        </div>
                        {pathEmergenceDate && (
                            <div
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    letterSpacing: 'var(--tracking-mythic)',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                }}
                            >
                                Since {new Date(pathEmergenceDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Path Distribution */}
            {distribution && distribution.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-mythic)',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '0.75rem',
                        }}
                    >
                        Path Distribution
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {distribution
                            .filter(d => d.minutes > 0)
                            .sort((a, b) => b.percentage - a.percentage)
                            .map(({ path, symbol, percentage }) => (
                                <div
                                    key={path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span style={{ fontSize: '0.875rem', width: '1.5rem' }}>{symbol}</span>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                height: '6px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: 'var(--accent-color, #fcd34d)',
                                                    opacity: percentage > 40 ? 1 : 0.6,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 600,
                                            letterSpacing: 'var(--tracking-mythic)',
                                            fontSize: '0.6875rem',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            width: '3rem',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {percentage.toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Journey Timeline */}
            {journey.length > 0 && (
                <div>
                    <h4
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-mythic)',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '0.75rem',
                        }}
                    >
                        Path History
                    </h4>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                    >
                        {journey.map((entry, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '0.5rem',
                                    borderLeft: '2px solid var(--accent-color, #fcd34d)',
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{entry.symbol}</span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 600,
                                            letterSpacing: 'var(--tracking-mythic)',
                                            fontSize: '0.875rem',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                        }}
                                    >
                                        {entry.trigger === 'emergence' ? 'Path Emerged' : 'Path Shifted'}
                                        {' → '}
                                        <span style={{ color: 'var(--accent-color, #fcd34d)' }}>
                                            {entry.pathName || 'Balanced'}
                                        </span>
                                        {entry.legacyToPathName && entry.legacyToPathName !== entry.pathName && (
                                            <span style={{ color: 'rgba(255, 255, 255, 0.4)', marginLeft: '0.35rem' }}>
                                                (legacy: {entry.legacyToPathName})
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 600,
                                            letterSpacing: 'var(--tracking-mythic)',
                                            fontSize: '0.6875rem',
                                            color: 'rgba(255, 255, 255, 0.4)',
                                        }}
                                    >
                                        {entry.formattedDate}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PathJourneyLog;
