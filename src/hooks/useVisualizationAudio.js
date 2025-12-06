// src/hooks/useVisualizationAudio.js
// Web Audio API hook for visualization phase transition cues

import { useRef, useCallback, useEffect } from 'react';

export function useVisualizationAudio() {
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);

    // Initialize audio context on first use
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
        }
        return audioContextRef.current;
    }, []);

    /**
     * Play a bell/tingsha tone
     * Used at void start and void end
     */
    const playBell = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Create oscillator for fundamental frequency
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Bell-like tone with slight inharmonicity
        osc.frequency.setValueAtTime(1200, now); // High frequency for tingsha
        osc.type = 'sine';

        // Sharp attack, medium decay
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.3, now + 0.01); // 10ms attack
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // 1.5s decay

        osc.connect(oscGain);
        oscGain.connect(gainNodeRef.current);

        osc.start(now);
        osc.stop(now + 1.5);

        // Add harmonics for richer bell sound
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();

        harmonic.frequency.setValueAtTime(1800, now); // 1.5x fundamental
        harmonic.type = 'sine';

        harmonicGain.gain.setValueAtTime(0, now);
        harmonicGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        harmonic.connect(harmonicGain);
        harmonicGain.connect(gainNodeRef.current);

        harmonic.start(now);
        harmonic.stop(now + 1.2);
    }, [getAudioContext]);

    /**
     * Play a rising sweep/swoosh sound
     * Used 1 second before void ends as a warning
     */
    const playRisingSweep = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const duration = 0.8;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Frequency rises from 200Hz to 400Hz
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + duration);
        osc.type = 'sine';

        // Fade in and out
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        oscGain.gain.linearRampToValueAtTime(0.2, now + duration - 0.2);
        oscGain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(oscGain);
        oscGain.connect(gainNodeRef.current);

        osc.start(now);
        osc.stop(now + duration);
    }, [getAudioContext]);

    /**
     * Start a sustained drone (for extended phases if needed)
     * Currently not used but available for future enhancement
     */
    const startDrone = useCallback((duration) => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.frequency.setValueAtTime(100, now); // Low fundamental
        osc.type = 'sine';

        // Fade in, sustain, fade out
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.1, now + 1);
        oscGain.gain.setValueAtTime(0.1, now + duration - 1);
        oscGain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(oscGain);
        oscGain.connect(gainNodeRef.current);

        osc.start(now);
        osc.stop(now + duration);

        return () => {
            // Stop function if needed
            oscGain.gain.cancelScheduledValues(ctx.currentTime);
            oscGain.gain.setValueAtTime(0, ctx.currentTime);
        };
    }, [getAudioContext]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        playBell,
        playRisingSweep,
        startDrone,
    };
}
