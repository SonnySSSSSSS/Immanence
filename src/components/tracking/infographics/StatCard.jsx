import React, { useState } from 'react';
import { TYPOGRAPHY, RADIUS, ANIM, ELEVATION } from './tokens';
import { TrendArrow } from './TrendArrow';

/**
 * Icon + number card for displaying key metrics.
 *
 * Props:
 * - icon: Emoji or icon component
 * - value: The main metric value (number or string)
 * - label: Text label for the metric
 * - sublabel: Optional secondary label
 * - trend: { direction: 'up' | 'down' | 'neutral', value: number }
 * - color: Accent color for left border
 * - definition: Tooltip text explaining the metric
 * - sparkline: Optional sparkline component to render
 * - isLight: Light mode styling
 */
export function StatCard({
    icon,
    value,
    label,
    sublabel,
    trend,
    color,
    definition,
    sparkline,
    isLight = false
}) {
    const [showDefinition, setShowDefinition] = useState(false);

    // Theme colors
    const theme = isLight
        ? {
            bg: 'rgba(252, 248, 240, 0.6)',
            border: 'rgba(180, 155, 110, 0.25)',
            text: 'rgba(45, 40, 35, 0.95)',
            textMuted: 'rgba(60, 50, 40, 0.5)'
        }
        : {
            bg: 'rgba(20, 25, 35, 0.8)',
            border: 'rgba(255, 255, 255, 0.1)',
            text: 'rgba(255, 255, 255, 0.95)',
            textMuted: 'rgba(255, 255, 255, 0.4)'
        };

    const containerStyle = {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '12px 14px',
        background: theme.bg,
        border: theme.border,
        borderRadius: `${RADIUS.md}px`,
        borderLeft: color ? `3px solid ${color}` : theme.border,
        boxShadow: ELEVATION.boxShadow,
        transition: `transform ${ANIM.hover}ms ease, box-shadow ${ANIM.hover}ms ease`,
        cursor: definition ? 'help' : 'default',
        minWidth: '120px'
    };

    const hoverStyle = {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
    };

    return (
        <div
            style={containerStyle}
            onMouseEnter={() => definition && setShowDefinition(true)}
            onMouseLeave={() => setShowDefinition(false)}
        >
            {/* Top row: Icon + Value + Trend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon && (
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>
                        {icon}
                    </span>
                )}

                <span
                    style={{
                        fontSize: `${TYPOGRAPHY.large.size}px`,
                        fontWeight: 700,
                        color: theme.text,
                        lineHeight: TYPOGRAPHY.large.lineHeight
                    }}
                >
                    {value}
                </span>

                {trend && (
                    <TrendArrow
                        direction={trend.direction}
                        value={trend.value}
                        size="sm"
                    />
                )}
            </div>

            {/* Label */}
            {label && (
                <span
                    style={{
                        fontSize: `${TYPOGRAPHY.small.size}px`,
                        color: theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}
                >
                    {label}
                </span>
            )}

            {/* Sublabel */}
            {sublabel && (
                <span
                    style={{
                        fontSize: `${TYPOGRAPHY.micro.size}px`,
                        color: theme.textMuted,
                        opacity: 0.7
                    }}
                >
                    {sublabel}
                </span>
            )}

            {/* Optional sparkline */}
            {sparkline && (
                <div style={{ marginTop: '8px' }}>
                    {sparkline}
                </div>
            )}

            {/* Definition tooltip */}
            {definition && showDefinition && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '6px 10px',
                        background: 'rgba(15, 15, 25, 0.95)',
                        color: '#fff',
                        fontSize: `${TYPOGRAPHY.micro.size}px`,
                        borderRadius: `${RADIUS.sm}px`,
                        whiteSpace: 'normal',
                        maxWidth: '200px',
                        textAlign: 'center',
                        zIndex: 50,
                        lineHeight: 1.4
                    }}
                >
                    {definition}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(15, 15, 25, 0.95)'
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default StatCard;
