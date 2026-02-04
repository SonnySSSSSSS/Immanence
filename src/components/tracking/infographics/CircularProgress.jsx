import React, { useMemo } from 'react';
import {
    RING_SIZE,
    STROKE,
    TYPOGRAPHY,
    ANIM,
    ELEVATION,
    HERO_GLOW,
    getMetricStateColor
} from './tokens';

/**
 * Radial progress ring for displaying percentages.
 * Used for accuracy, adherence, completion rates.
 *
 * Props:
 * - value: Current value
 * - max: Maximum value (default 100)
 * - size: 'sm' | 'md' | 'lg' (default 'md')
 * - color: Override color (otherwise uses metric state color)
 * - label: Text label below percentage
 * - definition: Micro text explaining the metric
 * - isHero: If true, applies glow effect (one per tab max)
 * - isLight: Light mode styling
 */
export function CircularProgress({
    value = 0,
    max = 100,
    size = 'md',
    color,
    label,
    definition,
    isHero = false,
    isLight = false
}) {
    const ringSize = RING_SIZE[size];
    const strokeWidth = STROKE[size];
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const offset = circumference - (percentage / 100) * circumference;

    // Use provided color or derive from metric state
    const fillColor = color || getMetricStateColor(value, max);

    // Track color (background ring)
    const trackColor = isLight
        ? 'rgba(0, 0, 0, 0.08)'
        : 'rgba(255, 255, 255, 0.08)';

    // Text colors
    const textPrimary = isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const textMuted = isLight ? 'rgba(60, 50, 40, 0.5)' : 'rgba(255, 255, 255, 0.4)';

    // Container styles
    const containerStyle = useMemo(() => ({
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        ...(isHero ? HERO_GLOW(fillColor) : {})
    }), [isHero, fillColor]);

    // Font sizes based on ring size
    const valueFontSize = size === 'lg' ? TYPOGRAPHY.hero.size
        : size === 'md' ? TYPOGRAPHY.large.size
        : TYPOGRAPHY.medium.size;

    return (
        <div style={containerStyle}>
            <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
                <svg
                    width={ringSize}
                    height={ringSize}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Background track */}
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke={trackColor}
                        strokeWidth={strokeWidth}
                    />

                    {/* Progress arc */}
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke={fillColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            transition: `stroke-dashoffset ${ANIM.mount}ms ease-out`
                        }}
                    />
                </svg>

                {/* Center value */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span
                        style={{
                            fontSize: `${valueFontSize}px`,
                            fontWeight: 700,
                            color: textPrimary,
                            lineHeight: 1
                        }}
                    >
                        {Math.round(percentage)}%
                    </span>
                </div>
            </div>

            {/* Label */}
            {label && (
                <span
                    style={{
                        fontSize: `${TYPOGRAPHY.small.size}px`,
                        color: textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textAlign: 'center'
                    }}
                >
                    {label}
                </span>
            )}

            {/* Definition (micro text) */}
            {definition && (
                <span
                    style={{
                        fontSize: `${TYPOGRAPHY.micro.size}px`,
                        color: textMuted,
                        opacity: 0.7,
                        textAlign: 'center',
                        maxWidth: ringSize * 1.5,
                        lineHeight: TYPOGRAPHY.micro.lineHeight
                    }}
                >
                    {definition}
                </span>
            )}
        </div>
    );
}

export default CircularProgress;
