// src/components/Cycle/CircuitSigil.jsx
// Living sigil that charges as exercises are selected
import React from 'react';
import { useThemeStore } from '../../state/themeStore';

const SIGIL_SIZE = 200;
const CENTER_SIZE = 60;
const RING_COUNT = 6; // Max exercises
const RING_RADIUS = 80;
const RING_WIDTH = 8;
const SEGMENT_GAP = 4; // Gap between segments in degrees

// Exercise type to glyph symbol mapping
const EXERCISE_GLYPHS = {
    'breath': '◉',      // Circle with dot - centered breath
    'cognitive': '△',   // Triangle - ascending thought
    'somatic': '◊',     // Diamond - body awareness
    'visualization': '✦', // Star - visual focus
    'cymatics': '≋',    // Waves - sound/frequency
    'sound': '♪',       // Music note - auditory
};

export function CircuitSigil({ selectedExercises = [], totalExercises = 6 }) {
    const safeTotal = Number.isFinite(totalExercises) && totalExercises > 0 ? totalExercises : 1;
    const rawProgress = selectedExercises.length / safeTotal;
    const progress = Number.isFinite(rawProgress) ? Math.min(Math.max(rawProgress, 0), 1) : 0;

    // Calculate segment angle for each ring slot
    const segmentAngle = 360 / RING_COUNT;

    return (
        <div className="flex items-center justify-center" style={{ width: SIGIL_SIZE, height: SIGIL_SIZE }}>
            <svg width={SIGIL_SIZE} height={SIGIL_SIZE} viewBox={`0 0 ${SIGIL_SIZE} ${SIGIL_SIZE}`}>
                <defs>
                    {/* Glow filter for active segments */}
                    <filter id="segment-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Core glow for center */}
                    <radialGradient id="core-gradient">
                        <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Center core - pulses with selection */}
                <motion.circle
                    cx={SIGIL_SIZE / 2}
                    cy={SIGIL_SIZE / 2}
                    r={CENTER_SIZE / 2}
                    fill="url(#core-gradient)"
                    initial={{ opacity: 0.3, scale: 1 }}
                    animate={{
                        opacity: 0.3 + (progress * 0.4),
                        scale: 1 + (progress * 0.1)
                    }}
                    transition={{ duration: 0.5 }}
                />

                {/* Inner circle border */}
                <circle
                    cx={SIGIL_SIZE / 2}
                    cy={SIGIL_SIZE / 2}
                    r={CENTER_SIZE / 2}
                    fill="none"
                    stroke="var(--accent-color)"
                    strokeWidth="1"
                    opacity="0.4"
                />

                {/* Exercise ring segments */}
                <g>
                    {Array.from({ length: RING_COUNT }).map((_, index) => {
                        const exercise = selectedExercises[index];
                        const isActive = !!exercise;

                        const startAngle = index * segmentAngle - 90 + SEGMENT_GAP / 2;
                        const endAngle = (index + 1) * segmentAngle - 90 - SEGMENT_GAP / 2;

                        // Convert to radians
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        // Calculate arc path
                        const innerRadius = RING_RADIUS - RING_WIDTH / 2;
                        const outerRadius = RING_RADIUS + RING_WIDTH / 2;

                        const x1 = SIGIL_SIZE / 2 + Math.cos(startRad) * innerRadius;
                        const y1 = SIGIL_SIZE / 2 + Math.sin(startRad) * innerRadius;
                        const x2 = SIGIL_SIZE / 2 + Math.cos(endRad) * innerRadius;
                        const y2 = SIGIL_SIZE / 2 + Math.sin(endRad) * innerRadius;
                        const x3 = SIGIL_SIZE / 2 + Math.cos(endRad) * outerRadius;
                        const y3 = SIGIL_SIZE / 2 + Math.sin(endRad) * outerRadius;
                        const x4 = SIGIL_SIZE / 2 + Math.cos(startRad) * outerRadius;
                        const y4 = SIGIL_SIZE / 2 + Math.sin(startRad) * outerRadius;

                        const pathData = `
                            M ${x1} ${y1}
                            A ${innerRadius} ${innerRadius} 0 0 1 ${x2} ${y2}
                            L ${x3} ${y3}
                            A ${outerRadius} ${outerRadius} 0 0 0 ${x4} ${y4}
                            Z
                        `;

                        return (
                            <motion.path
                                key={index}
                                d={pathData}
                                fill={isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)'}
                                stroke={isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)'}
                                strokeWidth="0.5"
                                initial={{ opacity: 0.3 }}
                                animate={{
                                    opacity: isActive ? 0.8 : 0.3,
                                    filter: isActive ? 'url(#segment-glow)' : 'none'
                                }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            />
                        );
                    })}
                </g>

                {/* Exercise glyphs on ring */}
                {selectedExercises.map((item, index) => {
                    const angle = index * segmentAngle - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x = SIGIL_SIZE / 2 + Math.cos(rad) * RING_RADIUS;
                    const y = SIGIL_SIZE / 2 + Math.sin(rad) * RING_RADIUS;

                    const glyph = EXERCISE_GLYPHS[item.exercise.id] || '○';

                    return (
                        <motion.text
                            key={`${item.exercise.id}-${index}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="var(--accent-color)"
                            fontSize="16"
                            fontWeight="bold"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            style={{
                                filter: 'drop-shadow(0 0 4px var(--accent-color))',
                            }}
                        >
                            {glyph}
                        </motion.text>
                    );
                })}

                {/* Connecting lines from glyphs to center */}
                {selectedExercises.map((item, index) => {
                    const angle = index * segmentAngle - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = SIGIL_SIZE / 2 + Math.cos(rad) * (CENTER_SIZE / 2 + 5);
                    const y1 = SIGIL_SIZE / 2 + Math.sin(rad) * (CENTER_SIZE / 2 + 5);
                    const x2 = SIGIL_SIZE / 2 + Math.cos(rad) * (RING_RADIUS - RING_WIDTH / 2 - 5);
                    const y2 = SIGIL_SIZE / 2 + Math.sin(rad) * (RING_RADIUS - RING_WIDTH / 2 - 5);

                    return (
                        <motion.line
                            key={`line-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="var(--accent-color)"
                            strokeWidth="0.5"
                            opacity="0.2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                    );
                })}
            </svg>

            {/* Center progress text */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ width: SIGIL_SIZE, height: SIGIL_SIZE }}
            >
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div
                        className="text-3xl font-bold tracking-wide"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-color)' }}
                    >
                        {selectedExercises.length}
                    </div>
                    <div
                        className="text-[9px] uppercase tracking-wider font-bold"
                        style={{ fontFamily: 'var(--font-body)', color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.5)' }}
                    >
                        Paths
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
