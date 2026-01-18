// src/components/CycleRingControl.jsx
// Donut chart control for visualization phase timing
import React, { useState, useRef, useCallback } from 'react';

export function CycleRingControl({
    fadeInDuration,
    setFadeInDuration,
    displayDuration,
    setDisplayDuration,
    fadeOutDuration,
    setFadeOutDuration,
    voidDuration,
    setVoidDuration,
    isLight = false,
    size: propSize = 180,
    showLegend = true,
}) {
    const PHASES = [
        { key: 'fadeIn', label: 'IN', color: 'var(--accent-color)', min: 1, max: 5 },
        { key: 'display', label: 'HOLD', color: isLight ? 'var(--text-primary)' : 'rgba(255,255,255,0.8)', min: 1, max: 30 },
        { key: 'fadeOut', label: 'OUT', color: isLight ? 'var(--accent-60)' : 'var(--accent-60)', min: 1, max: 5 },
        { key: 'void', label: 'VOID', color: isLight ? 'rgba(180,155,110,0.15)' : 'rgba(50,50,50,0.9)', min: 1, max: 30 }
    ];

    const svgRef = useRef(null);
    const [activeHandle, setActiveHandle] = useState(null);

    const values = {
        fadeIn: fadeInDuration,
        display: displayDuration,
        fadeOut: fadeOutDuration,
        void: voidDuration
    };

    const setters = {
        fadeIn: setFadeInDuration,
        display: setDisplayDuration,
        fadeOut: setFadeOutDuration,
        void: setVoidDuration
    };

    const total = values.fadeIn + values.display + values.fadeOut + values.void;

    // SVG dimensions
    const size = propSize;
    const center = size / 2;
    const outerRadius = 70;
    const innerRadius = 45;
    const midRadius = (outerRadius + innerRadius) / 2;

    // Convert polar to cartesian
    const polarToCartesian = useCallback((angle, radius) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: center + radius * Math.cos(rad),
            y: center + radius * Math.sin(rad)
        };
    }, [center]);

    // Calculate arc angles
    const getArcs = useCallback(() => {
        let startAngle = -90; // Start from top
        return PHASES.map((phase) => {
            const value = values[phase.key];
            const sweepAngle = (value / total) * 360;
            const endAngle = startAngle + sweepAngle;

            const arc = {
                ...phase,
                value,
                startAngle,
                endAngle,
                sweepAngle
            };

            startAngle = endAngle;
            return arc;
        });
    }, [values, total]);

    const arcs = getArcs();

    // Create SVG arc path
    const createArcPath = useCallback((startAngle, endAngle, outerR, innerR) => {
        if (Math.abs(endAngle - startAngle) < 0.1) return '';

        const start = polarToCartesian(startAngle, outerR);
        const end = polarToCartesian(endAngle, outerR);
        const innerStart = polarToCartesian(endAngle, innerR);
        const innerEnd = polarToCartesian(startAngle, innerR);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return [
            `M ${start.x} ${start.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}`,
            `L ${innerStart.x} ${innerStart.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
            'Z'
        ].join(' ');
    }, [polarToCartesian]);

    // Handle click on arc to adjust value
    const handleArcClick = (phaseKey, delta) => {
        const phase = PHASES.find(p => p.key === phaseKey);
        if (!phase) return;

        const currentValue = values[phaseKey];
        const newValue = Math.max(phase.min, Math.min(phase.max, currentValue + delta));
        setters[phaseKey](newValue);
    };

    return (
        <div className="flex flex-col items-center">
            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Background ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={midRadius}
                    fill="none"
                    stroke={isLight ? 'rgba(60,50,35,0.05)' : "rgba(0,0,0,0.3)"}
                    strokeWidth={outerRadius - innerRadius}
                />

                {/* Phase arcs - clickable to adjust */}
                {arcs.map((arc) => (
                    <g key={arc.key}>
                        <path
                            d={createArcPath(arc.startAngle, arc.endAngle, outerRadius, innerRadius)}
                            fill={arc.color}
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth="1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleArcClick(arc.key, 1)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleArcClick(arc.key, -1);
                            }}
                        />
                        {/* Arc label */}
                        {arc.sweepAngle > 20 && (() => {
                            const midAngle = (arc.startAngle + arc.endAngle) / 2;
                            const labelPos = polarToCartesian(midAngle, midRadius);
                            return (
                                <text
                                    x={labelPos.x}
                                    y={labelPos.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={arc.key === 'void' ? (isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.4)') : (isLight ? 'var(--text-primary)' : 'rgba(0,0,0,0.6)')}
                                    fontSize="9"
                                    fontFamily="var(--font-display)"
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {arc.value}
                                </text>
                            );
                        })()}
                    </g>
                ))}

                {/* Center label */}
                <text
                    x={center}
                    y={center - 8}
                    textAnchor="middle"
                    fill={isLight ? 'var(--text-muted)' : "rgba(255,255,255,0.5)"}
                    fontSize="9"
                    fontFamily="var(--font-display)"
                    fontWeight="600"
                    letterSpacing="0.1em"
                >
                    CYCLE
                </text>
                <text
                    x={center}
                    y={center + 10}
                    textAnchor="middle"
                    fill="var(--accent-color)"
                    fontSize="18"
                    fontFamily="var(--font-display)"
                    fontWeight="bold"
                >
                    {total}s
                </text>
            </svg>

            {showLegend && (
                <>
                    {/* Legend with +/- buttons */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                        {arcs.map((arc) => {
                            const phase = PHASES.find(p => p.key === arc.key);
                            return (
                                <div key={arc.key} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-sm"
                                        style={{ background: arc.color, border: '1px solid rgba(255,255,255,0.2)' }}
                                    />
                                    <span className={`text-[10px] ${isLight ? 'text-[var(--text-muted)]' : 'text-[rgba(253,251,245,0.5)]'} uppercase tracking-wider w-8`}>
                                        {arc.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleArcClick(arc.key, -1)}
                                            className="w-5 h-5 rounded-full text-xs flex items-center justify-center"
                                            style={{
                                                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(255,255,255,0.1)',
                                                color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.6)',
                                                border: isLight ? '1px solid var(--light-border)' : '1px solid rgba(255,255,255,0.15)'
                                            }}
                                            disabled={values[arc.key] <= phase.min}
                                        >
                                            −
                                        </button>
                                        <span className="text-xs text-[var(--accent-color)] w-6 text-center font-bold">
                                            {arc.value}
                                        </span>
                                        <button
                                            onClick={() => handleArcClick(arc.key, 1)}
                                            className="w-5 h-5 rounded-full text-xs flex items-center justify-center"
                                            style={{
                                                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(255,255,255,0.1)',
                                                color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.6)',
                                                border: isLight ? '1px solid var(--light-border)' : '1px solid rgba(255,255,255,0.15)'
                                            }}
                                            disabled={values[arc.key] >= phase.max}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={`text-[9px] ${isLight ? 'text-[var(--text-muted)]' : 'text-[rgba(253,251,245,0.3)]'} mt-2`}>
                        Click arc to increase • Right-click to decrease
                    </div>
                </>
            )}
        </div>
    );
}
