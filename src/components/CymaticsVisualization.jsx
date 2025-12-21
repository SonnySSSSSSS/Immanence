// src/components/CymaticsVisualization.jsx
import React, { useRef, useEffect, useState } from 'react';
import { CymaticsCanvas } from './CymaticsCanvas.jsx';
import { useVisualizationEngine } from '../hooks/useVisualizationEngine.js';
import { useCymaticsAudio } from '../hooks/useCymaticsAudio.js';

/**
 * Complete Cymatics visualization with engine and audio integration.
 * 
 * Key difference from standard visualization: Audio continues during void phase.
 * This trains the user to recall the visual pattern from sound alone.
 */

export function CymaticsVisualization({
    // Frequency config
    frequency = 528,
    n = 5,
    m = 7,

    // Timing config
    fadeInDuration = 2.5,
    displayDuration = 10,
    fadeOutDuration = 2.5,
    voidDuration = 10,

    // Features
    driftEnabled = false,
    audioEnabled = true,
    modes = null, // For chord mode: [{n, m, weight}, ...]

    // Callbacks
    onCycleComplete = null,
}) {
    const audioInitializedRef = useRef(false);
    const [volume, setVolume] = useState(0.3);

    const {
        setFrequency,
        addInterval,
        setDrift,
        setVolume: setAudioVolume,
        fadeIn: audioFadeIn,
        fadeOut: audioFadeOut,
    } = useCymaticsAudio();

    const {
        phase,
        progress,
        isRunning,
        start,
        stop,
    } = useVisualizationEngine({
        fadeInDuration,
        displayDuration,
        fadeOutDuration,
        voidDuration,
        onPhaseChange: (newPhase, oldPhase) => {
            // Audio continues through all phases, no changes needed here
        },
        onCycleComplete: (cycle) => {
            if (onCycleComplete) onCycleComplete(cycle);
        },
    });

    // Start engine on mount
    useEffect(() => {
        start();
        return () => {
            stop();
            // Fade out audio when component unmounts
            audioFadeOut(300);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize audio when isRunning becomes true
    useEffect(() => {
        if (isRunning && audioEnabled && !audioInitializedRef.current) {

            // Start audio
            const initAudio = async () => {
                setFrequency(frequency, 0);
                await addInterval(1.0); // Add root oscillator
                await audioFadeIn(fadeInDuration * 1000, volume);
                audioInitializedRef.current = true;
            };

            initAudio();
        }
    }, [isRunning, audioEnabled, frequency, setFrequency, addInterval, audioFadeIn, fadeInDuration, volume]);

    // Update frequency when it changes
    useEffect(() => {
        if (audioInitializedRef.current) {
            setFrequency(frequency, 500);
        }
    }, [frequency, setFrequency]);

    // Update drift when toggled
    useEffect(() => {
        setDrift(driftEnabled);
    }, [driftEnabled, setDrift]);

    // Update volume when slider changes
    useEffect(() => {
        if (audioInitializedRef.current) {
            setAudioVolume(volume, 100);
        }
    }, [volume, setAudioVolume]);

    // Render
    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
            }}
        >
            <div
                style={{
                    width: '400px',
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {phase === 'void' ? (
                    // Void phase: black screen with "VISUALIZE" text
                    <div
                        style={{
                            width: '400px',
                            height: '400px',
                            background: '#050508',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                        }}
                    >
                        <div
                            style={{
                                fontFamily: 'Georgia, serif',
                                fontSize: '18px',
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                color: 'rgba(253,251,245,0.3)',
                                marginBottom: '16px',
                            }}
                        >
                            VISUALIZE
                        </div>
                        <div
                            style={{
                                fontFamily: 'Georgia, serif',
                                fontSize: '14px',
                                letterSpacing: '0.15em',
                                color: 'var(--accent-color)',
                            }}
                        >
                            ♪ {frequency} Hz ♪
                        </div>
                    </div>
                ) : (
                    // All other phases: show particle canvas
                    <CymaticsCanvas
                        n={n}
                        m={m}
                        width={400}
                        height={400}
                        driftEnabled={driftEnabled && phase === 'display'}
                        modes={modes}
                        phase={phase}
                        phaseProgress={progress}
                    />
                )}
            </div>

            {/* Volume Slider */}
            <div
                style={{
                    width: '400px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--accent-15)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'rgba(253,251,245,0.6)',
                        }}
                    >
                        Volume
                    </span>
                    <span
                        style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: '10px',
                            color: 'var(--accent-color)',
                        }}
                    >
                        {Math.round(volume * 100)}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                />
            </div>
        </div>
    );
}
