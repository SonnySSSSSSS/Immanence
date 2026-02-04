import React, { useMemo, useState } from 'react';
import { STROKE, ANIM, DOMAIN_COLORS } from './tokens';
import { ChartTooltip, useChartTooltip } from './ChartTooltip';

/**
 * Mini inline trend line (80-120px wide).
 * Shows data trend with optional area fill and hover tooltips.
 *
 * Props:
 * - data: Array of { value: number, label?: string }
 * - width: Width in pixels (default 100)
 * - height: Height in pixels (default 32)
 * - color: Line color (default gold)
 * - showArea: Show gradient fill under line (default false)
 * - showDot: Highlight last point with dot (default true)
 * - showTooltip: Enable hover tooltips (default true)
 */
export function Sparkline({
    data = [],
    width = 100,
    height = 32,
    color = DOMAIN_COLORS.practice,
    showArea = false,
    showDot = true,
    showTooltip = true
}) {
    const { tooltipProps, showTooltip: onShowTooltip, hideTooltip, moveTooltip } = useChartTooltip();
    const [activeIndex, setActiveIndex] = useState(null);

    // Compute line path and points
    const { path, areaPath, points, minValue, maxValue } = useMemo(() => {
        if (!data.length) {
            return { path: '', areaPath: '', points: [], minValue: 0, maxValue: 0 };
        }

        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1; // Avoid division by zero

        // Padding for dot
        const padding = 4;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Calculate points
        const pts = data.map((d, i) => {
            const x = padding + (i / Math.max(1, data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
            return { x, y, value: d.value, label: d.label };
        });

        // Build SVG path
        const linePath = pts.map((p, i) =>
            (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
        ).join(' ');

        // Build area path (closes to bottom)
        const area = linePath +
            ` L${pts[pts.length - 1]?.x || 0},${height - padding}` +
            ` L${padding},${height - padding} Z`;

        return {
            path: linePath,
            areaPath: area,
            points: pts,
            minValue: min,
            maxValue: max
        };
    }, [data, width, height]);

    // Gradient ID
    const gradientId = useMemo(() => `sparkline-grad-${Math.random().toString(36).slice(2)}`, []);

    // Handle mouse events for tooltip
    const handleMouseMove = (e) => {
        if (!showTooltip || !points.length) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        // Find closest point
        let closestIdx = 0;
        let closestDist = Infinity;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - mouseX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        });

        setActiveIndex(closestIdx);
        const point = points[closestIdx];
        onShowTooltip(
            { currentTarget: e.currentTarget, clientX: rect.left + point.x, clientY: rect.top + point.y },
            point.value,
            point.label
        );
    };

    const handleMouseLeave = () => {
        setActiveIndex(null);
        hideTooltip();
    };

    if (!data.length) {
        return (
            <div
                style={{
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '9px'
                }}
            >
                No data
            </div>
        );
    }

    return (
        <div
            style={{ position: 'relative', width, height }}
            data-tooltip-container
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <svg width={width} height={height} style={{ display: 'block' }}>
                {/* Gradient definition for area fill */}
                {showArea && (
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                )}

                {/* Area fill */}
                {showArea && areaPath && (
                    <path
                        d={areaPath}
                        fill={`url(#${gradientId})`}
                    />
                )}

                {/* Line */}
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={STROKE.sm}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transition: `d ${ANIM.mount}ms ease-out`
                    }}
                />

                {/* End dot */}
                {showDot && points.length > 0 && (
                    <circle
                        cx={points[points.length - 1].x}
                        cy={points[points.length - 1].y}
                        r={3}
                        fill={color}
                    />
                )}

                {/* Active point indicator */}
                {activeIndex !== null && points[activeIndex] && (
                    <circle
                        cx={points[activeIndex].x}
                        cy={points[activeIndex].y}
                        r={4}
                        fill={color}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={1.5}
                    />
                )}
            </svg>

            {/* Tooltip */}
            {showTooltip && (
                <ChartTooltip {...tooltipProps} />
            )}
        </div>
    );
}

export default Sparkline;
