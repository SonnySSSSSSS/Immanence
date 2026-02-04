import React, { useMemo, useState } from 'react';
import { ANIM, RADIUS, TYPOGRAPHY } from './tokens';
import { ChartTooltip, useChartTooltip } from './ChartTooltip';

/**
 * Horizontal bar chart for comparisons.
 * Shows multiple bars with labels and percentage values.
 *
 * Props:
 * - bars: Array of { label, value, color }
 * - maxValue: Override max value (otherwise uses max of data)
 * - height: Total chart height in pixels (default 24px per bar)
 * - showLabels: Show value labels on right (default true)
 * - showTooltip: Enable hover tooltips (default true)
 */
export function HorizontalBarStack({
    bars = [],
    maxValue = null,
    height = null,
    showLabels = true,
    showTooltip = true
}) {
    const { tooltipProps, showTooltip: onShowTooltip, hideTooltip, moveTooltip } = useChartTooltip();
    const [activeIndex, setActiveIndex] = useState(null);

    const barHeight = 24;
    const chartHeight = height ?? bars.length * (barHeight + 8);
    const computedMaxValue = maxValue ?? Math.max(1, ...bars.map(b => b.value || 0));

    // Container ref for tooltip positioning
    const containerWidth = 300;
    const labelWidth = 80;
    const chartWidth = containerWidth - labelWidth - 40;

    const handleMouseEnter = (e, bar, index) => {
        setActiveIndex(index);
        const barValue = Math.round((bar.value / computedMaxValue) * 100);
        onShowTooltip(
            { currentTarget: e.currentTarget },
            bar.value,
            `${barValue}% of max`
        );
    };

    const handleMouseLeave = () => {
        setActiveIndex(null);
        hideTooltip();
    };

    if (bars.length === 0) {
        return (
            <div
                style={{
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.4,
                    fontSize: '11px'
                }}
            >
                No data
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
            data-tooltip-container
        >
            {bars.map((bar, i) => {
                const percent = (bar.value / computedMaxValue) * 100;
                const barWidth = (percent / 100) * chartWidth;

                return (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: barHeight
                        }}
                    >
                        {/* Label */}
                        <div
                            style={{
                                width: labelWidth,
                                fontSize: `${TYPOGRAPHY.small.size}px`,
                                opacity: 0.7,
                                textAlign: 'right',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {bar.label}
                        </div>

                        {/* Bar */}
                        <div
                            style={{
                                flex: 1,
                                height: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: `${RADIUS.sm}px`,
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, bar, i)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${percent}%`,
                                    background: bar.color,
                                    borderRadius: `${RADIUS.sm}px`,
                                    transition: `width ${ANIM.hover}ms ease, opacity ${ANIM.hover}ms ease`,
                                    opacity: activeIndex === i ? 1 : 0.8
                                }}
                            />
                        </div>

                        {/* Percentage */}
                        {showLabels && (
                            <div
                                style={{
                                    width: '32px',
                                    fontSize: `${TYPOGRAPHY.small.size}px`,
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    opacity: activeIndex === i ? 1 : 0.7,
                                    transition: `opacity ${ANIM.hover}ms ease`
                                }}
                            >
                                {Math.round(percent)}%
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Tooltip */}
            {showTooltip && (
                <ChartTooltip {...tooltipProps} />
            )}
        </div>
    );
}

export default HorizontalBarStack;
