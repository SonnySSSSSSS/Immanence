// src/components/PathFormingIndicator.jsx
// Shows progress during first 90 days before path emerges

import React from 'react';
import { usePathStore, PATH_SYMBOLS, PATH_NAMES } from '../state/pathStore';

/**
 * PathFormingIndicator — Display for users in their first 90 days
 * 
 * Shows:
 * - Progress ring toward path emergence
 * - Dominant tendency preview
 * - "This may change" disclaimer
 */
export function PathFormingIndicator({ compact = false }) {
    const pathStatus = usePathStore(s => s.pathStatus);
    const getFormingInfo = usePathStore(s => s.getFormingInfo);

    // Only show if still forming
    if (pathStatus !== 'forming') {
        return null;
    }

    const { daysUntilEmergence, dominantTendency, progress } = getFormingInfo();

    const ringSize = compact ? 60 : 100;
    const strokeWidth = compact ? 4 : 6;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    const symbol = dominantTendency ? PATH_SYMBOLS[dominantTendency] : '○';
    const tendencyName = dominantTendency ? PATH_NAMES[dominantTendency] : null;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: compact ? '0.5rem' : '1rem',
                padding: compact ? '0.75rem' : '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
        >
            {/* Title */}
            <div
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-mythic)',
                    fontSize: compact ? '0.75rem' : '0.875rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}
            >
                Path Forming
            </div>

            {/* Progress Ring */}
            <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background ring */}
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress ring */}
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--accent-color, #fcd34d)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
                {/* Center content */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: compact ? '1.25rem' : '1.75rem',
                            opacity: dominantTendency ? 0.8 : 0.4,
                        }}
                    >
                        {symbol}
                    </span>
                </div>
            </div>

            {/* Days until emergence */}
            <div
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-mythic)',
                    fontSize: compact ? '0.875rem' : '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                }}
            >
                <span style={{ color: 'var(--accent-color, #fcd34d)', fontWeight: 600 }}>
                    {daysUntilEmergence}
                </span>
                {' days until reveal'}
            </div>

            {/* Dominant tendency */}
            {tendencyName && (
                <div
                    style={{
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            letterSpacing: 'var(--tracking-mythic)',
                            fontSize: compact ? '0.75rem' : '0.8125rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        Dominant tendency: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{tendencyName}</span>
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            fontSize: compact ? '0.6875rem' : '0.75rem',
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontStyle: 'italic',
                            marginTop: '0.25rem',
                        }}
                    >
                        This may change
                    </div>
                </div>
            )}
        </div>
    );
}

export default PathFormingIndicator;
