import React, { useRef, useEffect } from 'react';
import { useVisualizationEngine } from '../hooks/useVisualizationEngine.js';
import { useVisualizationAudio } from '../hooks/useVisualizationAudio.js';
import { getGeometryRenderer } from '../utils/geometryRenderers.js';

export function VisualizationCanvas({
    geometry = 'enso',
    fadeInDuration = 2.5,
    displayDuration = 10,
    fadeOutDuration = 2.5,
    voidDuration = 10,
    audioEnabled = true,
    onCycleComplete = null,
}) {
    const canvasRef = useRef(null);
    const { playBell, playRisingSweep } = useVisualizationAudio();
    const voidWarningTimerRef = useRef(null);

    const {
        phase,
        progress,
        cycleCount,
        isRunning,
        sessionSeed,
        start,
        stop,
    } = useVisualizationEngine({
        fadeInDuration,
        displayDuration,
        fadeOutDuration,
        voidDuration,
        onPhaseChange: (newPhase, oldPhase) => {
            console.log('Phase:', oldPhase, '->', newPhase);

            if (!audioEnabled) return;

            if (newPhase === 'void') {
                playBell();
                const warningTime = (voidDuration - 1) * 1000;
                voidWarningTimerRef.current = setTimeout(() => {
                    playRisingSweep();
                }, warningTime);
            }

            if (oldPhase === 'void' && newPhase === 'fadeIn') {
                playBell();
                if (voidWarningTimerRef.current) {
                    clearTimeout(voidWarningTimerRef.current);
                    voidWarningTimerRef.current = null;
                }
            }
        },
        onCycleComplete: (cycle) => {
            console.log('Cycle', cycle, 'complete');
            if (onCycleComplete) onCycleComplete(cycle);
        },
    });

    useEffect(() => {
        start();
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only

    const getAccentColor = (variable) => {
        if (typeof window === 'undefined') return '#fcd34d';
        return getComputedStyle(document.documentElement)
            .getPropertyValue(variable)
            .trim() || '#fcd34d';
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = 300;
        const height = 300;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, width, height);

        // Draw subtle grid background
        const gridColor = getAccentColor('--accent-color');
        const gridSpacing = 15; // 15px grid cells (finer grid)
        ctx.save();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4; // 40% opacity

        // Vertical lines
        for (let x = gridSpacing; x < width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = gridSpacing; y < height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw center crosshairs slightly brighter
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.restore();

        if (phase === 'void') {
            ctx.save();
            ctx.fillStyle = 'rgba(253,251,245,0.3)';
            ctx.font = '14px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VISUALIZE', width / 2, height / 2);
            ctx.restore();
            return;
        }

        const renderer = getGeometryRenderer(geometry);
        const rotation = sessionSeed * 360;
        const scale = 0.9 + sessionSeed * 0.2;
        const strokeWidth = 1.5 + sessionSeed * 1.0;

        const accentColor = getAccentColor('--accent-color');
        const accentSecondary = getAccentColor('--accent-secondary');
        const accent40 = getAccentColor('--accent-40');

        const config = {
            accentColor,
            accentSecondary,
            accent40,
            rotation,
            scale,
            strokeWidth,
        };

        ctx.save();

        if (phase === 'fadeOut') {
            ctx.globalAlpha = 1.0 - progress;
        }

        if (phase === 'fadeIn') {
            renderer(ctx, progress, config);
        } else if (phase === 'display' || phase === 'fadeOut') {
            renderer(ctx, 1.0, config);
        }

        ctx.restore();

    }, [phase, progress, geometry, sessionSeed]);

    return (
        <div
            style={{
                position: 'relative',
                width: '300px',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '300px',
                    height: '300px',
                }}
            />
        </div>
    );
}
