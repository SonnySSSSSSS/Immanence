import React, { useRef, useEffect } from 'react';

/**
 * LightModeInstrumentRing
 * A high-fidelity "Carved Stone + Glass" instrument ring for Light Mode.
 * Focuses on material truth: engraved cuts, edge compression, and directional light.
 */
export function LightModeInstrumentRing({
    size = 288,
    accent = 'var(--accent-color)',
    isPracticing = false,
    lightDirection = 315 // Degrees (top-right light source)
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const center = size / 2;
        const radius = (size / 2) * 0.92;
        const ringWidth = size * 0.08;

        const draw = () => {
            ctx.clearRect(0, 0, size, size);

            // 1. Thickness Logic — Inner Rim (Seat Depth)
            // Tighter, darker shadow where the stone meets the jewel
            ctx.globalCompositeOperation = 'multiply';
            const innerSeat = ctx.createRadialGradient(center, center, radius - ringWidth, center, center, radius - ringWidth + 4);
            innerSeat.addColorStop(0, 'rgba(45,40,35,0.22)');
            innerSeat.addColorStop(1, 'rgba(45,40,35,0)');
            ctx.fillStyle = innerSeat;
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();

            // 2. Thickness Logic — Outer Rim (Erosion Falloff)
            // Broader, softer shadow at the outer edge to imply age and roundness
            const outerErosion = ctx.createRadialGradient(center, center, radius, center, center, radius - 8);
            outerErosion.addColorStop(0, 'rgba(45,40,35,0.12)');
            outerErosion.addColorStop(1, 'rgba(45,40,35,0)');
            ctx.fillStyle = outerErosion;
            ctx.fill();

            // 3. Directional Influence (Top-Right Shadow Bias)
            // We subtly darken the bottom-left to emphasize the light source
            ctx.globalCompositeOperation = 'multiply';
            const lightRad = (lightDirection * Math.PI) / 180;
            const biasGrad = ctx.createLinearGradient(
                center + Math.cos(lightRad) * radius,
                center + Math.sin(lightRad) * radius,
                center - Math.cos(lightRad) * radius,
                center - Math.sin(lightRad) * radius
            );
            biasGrad.addColorStop(0, 'rgba(45,40,35,0)');
            biasGrad.addColorStop(1, 'rgba(45,40,35,0.08)');
            ctx.fillStyle = biasGrad;
            ctx.fill();

            // 4. Micro-Texture (Stone Grain)
            ctx.save();
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.arc(center, center, radius - ringWidth, 0, Math.PI * 2, true);
            ctx.clip();

            ctx.globalCompositeOperation = 'soft-light';
            for (let i = 0; i < 300; i++) {
                const rx = Math.random() * size;
                const ry = Math.random() * size;
                ctx.fillStyle = `rgba(45,40,35,${0.02 + Math.random() * 0.03})`;
                ctx.fillRect(rx, ry, 1, 1);
            }
            ctx.restore();

            // 5. Directional Highlight (Ivory Edge)
            // A VERY subtle highlight only on the top-right facing edge
            ctx.globalCompositeOperation = 'screen';
            const edgeHighlight = ctx.createLinearGradient(
                center + Math.cos(lightRad) * radius,
                center + Math.sin(lightRad) * radius,
                center - Math.cos(lightRad) * radius,
                center - Math.sin(lightRad) * radius
            );
            edgeHighlight.addColorStop(0, 'rgba(255,255,255,0.12)');
            edgeHighlight.addColorStop(0.4, 'rgba(255,255,255,0)');
            ctx.strokeStyle = edgeHighlight;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(center, center, radius - 0.5, lightRad - 0.8, lightRad + 0.8);
            ctx.stroke();
        };

        draw();
    }, [size, lightDirection]);

    const renderEngraving = () => {
        const radius = 45.2;
        const ringWidth = 7.5;

        const arcPath = (r, startDeg, endDeg) => {
            const toRad = (d) => (d * Math.PI) / 180;
            const sx = 50 + r * Math.cos(toRad(startDeg - 90));
            const sy = 50 + r * Math.sin(toRad(startDeg - 90));
            const ex = 50 + r * Math.cos(toRad(endDeg - 90));
            const ey = 50 + r * Math.sin(toRad(endDeg - 90));
            const large = endDeg - startDeg > 180 ? 1 : 0;
            return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
        };

        const ticks = [];
        for (let i = 0; i < 60; i++) {
            const isMajor = i % 5 === 0;
            const angle = (i / 60) * 360;
            const len = isMajor ? 5.5 : 3.2;

            // High-fidelity Engraving: Shadow Core (Cut) + Ivory Lip (Highlight)
            // The ivory highlight aligns with the top-right light source.
            // WhenSource is at 315 deg, we offset the highlight lip slightly toward source.
            const highlightOffset = 0.55;

            ticks.push(
                <g key={`t-inc-${i}`}>
                    {/* Highlight Lip (Light facing side) */}
                    <line
                        x1="50.2" y1={50 - radius - highlightOffset}
                        x2="50.2" y2={50 - radius + len - highlightOffset}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={isMajor ? 0.75 : 0.55}
                        strokeLinecap="round"
                        transform={`rotate(${angle} 50 50)`}
                    />
                    {/* Shadow Core (Cut) */}
                    <line
                        x1="50" y1={50 - radius}
                        x2="50" y2={50 - radius + len}
                        stroke="rgba(45,40,35,0.3)"
                        strokeWidth={isMajor ? 0.7 : 0.5}
                        strokeLinecap="round"
                        transform={`rotate(${angle} 50 50)`}
                    />
                </g>
            );
        }

        const arcs = [
            { start: 12, end: 38, r: 40.2, w: 1.1, a: 0.12, c: 'rgba(45,40,35,' },
            { start: 112, end: 141, r: 41.6, w: 0.9, a: 0.10, c: 'rgba(45,40,35,' },
            { start: 206, end: 232, r: 39.1, w: 1.0, a: 0.10, c: 'rgba(45,40,35,' },
            { start: 302, end: 344, r: 43.1, w: 1.2, a: 0.14, c: accent },
        ];

        const cardinalMarks = [0, 90, 180, 270].map(angle => (
            <path
                key={`card-${angle}`}
                d="M 49 4 L 50 6.5 L 51 4 Z"
                fill="rgba(45,40,35,0.35)"
                transform={`rotate(${angle} 50 50) translate(0, ${50 - radius - 2.5})`}
            />
        ));

        return (
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(45,40,35,0.18)" strokeWidth="0.4" />
                <circle cx="50" cy="50" r={radius - ringWidth} fill="none" stroke="rgba(45,40,35,0.14)" strokeWidth="0.3" />
                <g>{ticks}</g>
                <g>
                    {arcs.map((arc, i) => (
                        <path
                            key={`arc-${i}`}
                            d={arcPath(arc.r, arc.start, arc.end)}
                            fill="none"
                            stroke={arc.c.endsWith(',') ? `${arc.c}${arc.a})` : arc.c}
                            strokeWidth={arc.w}
                            strokeLinecap="round"
                            style={{ opacity: arc.c.endsWith(',') ? 1 : arc.a }}
                        />
                    ))}
                </g>
                <g>{cardinalMarks}</g>
            </svg>
        );
    };

    return (
        <div className="absolute flex items-center justify-center pointer-events-none" style={{ width: size, height: size }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '100%', height: '100%' }} />
            {renderEngraving()}
        </div>
    );
}
