import React from 'react';

export function LineChart({ series, height = 90, width = 420 }) {
    const maxValue = Math.max(
        1,
        ...series.flatMap((s) => s.data.map((point) => point.value || 0))
    );

    const buildPoints = (data) => data.map((point, index) => {
        const x = (index / Math.max(1, data.length - 1)) * width;
        const y = height - (point.value / maxValue) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {series.map((line) => (
                <polyline
                    key={line.label}
                    points={buildPoints(line.data)}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                />
            ))}
        </svg>
    );
}

export function BarChart({ data, height = 80, barColor = '#4b5563' }) {
    const maxValue = Math.max(1, ...data.map((point) => point.value || 0));
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height }}>
            {data.map((point) => (
                <div key={point.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                    <div
                        style={{
                            width: '18px',
                            height: `${Math.round((point.value / maxValue) * (height - 18))}px`,
                            background: barColor,
                            borderRadius: '4px'
                        }}
                    />
                    <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>{point.label}</div>
                </div>
            ))}
        </div>
    );
}
