// src/components/tracking/reports/MetricCalloutCard.jsx
// Reusable metric + insight card with optional sparkline

import React from 'react';

export function MetricCalloutCard({
    metric,
    unit = '',
    label,
    deltaValue = null,
    deltaLabel = '',
    insight = '',
    sparklineComponent = null,
    domainColor = '#2563eb',
    isLight = false
}) {
    const config = {
        light: {
            bg: 'rgba(252, 248, 240, 0.6)',
            border: 'rgba(180, 155, 110, 0.25)',
            text: 'rgba(45, 40, 35, 0.95)',
            textSub: 'rgba(60, 50, 40, 0.7)',
            textMuted: 'rgba(60, 50, 40, 0.5)'
        },
        dark: {
            bg: 'rgba(20, 25, 35, 0.8)',
            border: 'rgba(255, 255, 255, 0.1)',
            text: 'rgba(255, 255, 255, 0.95)',
            textSub: 'rgba(255, 255, 255, 0.7)',
            textMuted: 'rgba(255, 255, 255, 0.5)'
        }
    };

    const theme = config[isLight ? 'light' : 'dark'];

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                padding: '16px'
            }}
        >
            {/* Top accent line */}
            <div
                className="w-full h-1 rounded-full mb-3"
                style={{
                    background: domainColor,
                    opacity: 0.6
                }}
            />

            {/* Metric + Delta Row */}
            <div className="flex items-end justify-between mb-2">
                <div className="flex flex-col">
                    <span
                        className="text-3xl font-black"
                        style={{ color: theme.text }}
                    >
                        {metric}
                    </span>
                    <span
                        className="text-xs uppercase tracking-wider mt-1"
                        style={{ color: theme.textMuted }}
                    >
                        {label}
                    </span>
                </div>

                {deltaValue !== null && (
                    <div className="flex flex-col items-end">
                        <span
                            className="text-lg font-bold"
                            style={{
                                color: deltaValue > 0 ? '#22c55e' : deltaValue < 0 ? '#ef4444' : theme.textSub
                            }}
                        >
                            {deltaValue > 0 ? '+' : ''}{deltaValue}
                        </span>
                        <span
                            className="text-[10px] uppercase tracking-tight"
                            style={{ color: theme.textMuted }}
                        >
                            {deltaLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Unit suffix */}
            {unit && (
                <span className="text-sm" style={{ color: theme.textMuted }}>
                    {unit}
                </span>
            )}

            {/* Sparkline or custom component */}
            {sparklineComponent && (
                <div className="my-3 h-12">
                    {sparklineComponent}
                </div>
            )}

            {/* Insight text */}
            {insight && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
                    <p
                        className="text-xs italic leading-relaxed"
                        style={{ color: theme.textSub }}
                    >
                        📌 {insight}
                    </p>
                </div>
            )}
        </div>
    );
}
