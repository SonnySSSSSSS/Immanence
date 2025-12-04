// src/components/VisualizationCanvas.jsx
// Canvas component for rendering geometric forms during visualization practice

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
    } = useVisualizationEngine({
        fadeInDuration,
        displayDuration,
        fadeOutDuration,
        voidDuration,
        onPhaseChange: (newPhase) => {
            console.log(`Phase: ${newPhase}`);
        },
        onCycleComplete: (cycle) => {
            console.log(`Cycle ${cycle} complete`);
            if (onCycleComplete) onCycleComplete(cycle);
        },
    });

    // Get computed CSS variables for colors
    const getAccentColor = (variable) => {
        if (typeof window === 'undefined') return '#fcd34d';
        return getComputedStyle(document.documentElement)
            .getPropertyValue(variable)
            .trim() || '#fcd34d';
    };

    // Render geometry to canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size for retina displays
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Clear canvas
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (phase === 'void') {
            // Void phase - show "VISUALIZE" text
            ctx.save();
            ctx.fillStyle = 'rgba(253,251,245,0.3)';
            ctx.font = '14px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VISUALIZE', rect.width / 2, rect.height / 2);
            ctx.restore();
            return;
        }

        // Get geometry renderer
        const renderer = getGeometryRenderer(geometry);

        // Calculate procedural variance from sessionSeed
        const rotation = sessionSeed * 360;
        const scale = 0.9 + sessionSeed * 0.2; // 90%-110%
        const strokeWidth = 1.5 + sessionSeed * 1.0; // 1.5-2.5px

        // Get accent colors from CSS variables
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

        // Save context for alpha manipulation
        ctx.save();

        // Apply fade during fadeOut phase
        if (phase === 'fadeOut') {
            ctx.globalAlpha = 1.0 - progress; // Fade from 1.0 to 0.0
        }

        // Render geometry
        if (phase === 'fadeIn') {
            // Lines grow during fadeIn
            renderer(ctx, progress, config);
        } else if (phase === 'display' || phase === 'fadeOut') {
            // Full geometry during display/fadeOut
            renderer(ctx, 1.0, config);
        }

        ctx.restore();

    }, [phase, progress, geometry, sessionSeed]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '500px',
                    maxHeight: '500px',
                }}
            />
        </div>
    );
}
