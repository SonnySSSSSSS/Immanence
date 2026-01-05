// src/hooks/useCymaticsAudio.js
import { useRef, useCallback, useEffect } from 'react';

/**
 * Audio hook for Cymatics visualization.
 * Supports multiple oscillators for chords, smooth transitions, and drift modulation.
 */

export function useCymaticsAudio() {
    const audioContextRef = useRef(null);
    const oscillatorsRef = useRef(new Map()); // Map<ratio, {osc, gain}>
    const masterGainRef = useRef(null);
    const driftIntervalRef = useRef(null);
    const baseFrequencyRef = useRef(256);
    const isDriftEnabledRef = useRef(false);

    // Initialize audio context and master gain
    const initAudio = useCallback(async () => {
        if (audioContextRef.current) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();

        // Resume if suspended (autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0; // Start silent
        masterGainRef.current.connect(audioContextRef.current.destination);
    }, []);

    // Set base frequency with smooth transition
    const setFrequency = useCallback((hz, transitionMs = 500) => {
        baseFrequencyRef.current = hz;

        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        const transitionSec = transitionMs / 1000;

        // Update all active oscillators
        for (const [ratio, nodes] of oscillatorsRef.current.entries()) {
            const targetFreq = hz * ratio;
            nodes.osc.frequency.cancelScheduledValues(now);
            nodes.osc.frequency.setValueAtTime(nodes.osc.frequency.value, now);
            nodes.osc.frequency.linearRampToValueAtTime(targetFreq, now + transitionSec);
        }
    }, []);

    // Add an interval to create a chord
    const addInterval = useCallback(async (ratio) => {
        await initAudio();

        // Don't add if already exists
        if (oscillatorsRef.current.has(ratio)) return;

        const ctx = audioContextRef.current;
        const freq = baseFrequencyRef.current * ratio;

        // Create oscillator + gain
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Individual oscillator gain (balance in chord)
        gain.gain.setValueAtTime(0.3, ctx.currentTime);

        osc.connect(gain);
        gain.connect(masterGainRef.current);

        osc.start();

        oscillatorsRef.current.set(ratio, { osc, gain });
    }, [initAudio]);

    // Remove an interval
    const removeInterval = useCallback((ratio) => {
        const nodes = oscillatorsRef.current.get(ratio);
        if (!nodes) return;

        const ctx = audioContextRef.current;
        const now = ctx.currentTime;

        // Fade out before stopping
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
        nodes.gain.gain.linearRampToValueAtTime(0, now + 0.05);

        setTimeout(() => {
            nodes.osc.stop();
            nodes.osc.disconnect();
            nodes.gain.disconnect();
            oscillatorsRef.current.delete(ratio);
        }, 100);
    }, []);

    // Clear all intervals and reset to root
    const clearToRoot = useCallback(() => {
        const ratios = Array.from(oscillatorsRef.current.keys());
        for (const ratio of ratios) {
            if (ratio !== 1.0) {
                removeInterval(ratio);
            }
        }
    }, [removeInterval]);

    // Enable/disable frequency drift
    const setDrift = useCallback((enabled) => {
        isDriftEnabledRef.current = enabled;

        if (enabled && !driftIntervalRef.current) {
            // Start drift modulation
            const driftRate = 0.2; // Hz (5 second cycle)
            const driftAmount = 4; // ±4 Hz
            let phase = 0;

            driftIntervalRef.current = setInterval(() => {
                if (!audioContextRef.current || oscillatorsRef.current.size === 0) return;

                const ctx = audioContextRef.current;
                const now = ctx.currentTime;

                phase += driftRate * 0.05; // Update every 50ms
                const drift = Math.sin(phase * Math.PI * 2) * driftAmount;

                // Apply drift to all oscillators proportionally
                for (const [ratio, nodes] of oscillatorsRef.current.entries()) {
                    const targetFreq = (baseFrequencyRef.current + drift) * ratio;
                    nodes.osc.frequency.setValueAtTime(targetFreq, now);
                }
            }, 50);
        } else if (!enabled && driftIntervalRef.current) {
            // Stop drift, return to exact frequencies
            clearInterval(driftIntervalRef.current);
            driftIntervalRef.current = null;

            if (audioContextRef.current) {
                const ctx = audioContextRef.current;
                const now = ctx.currentTime;

                for (const [ratio, nodes] of oscillatorsRef.current.entries()) {
                    const exactFreq = baseFrequencyRef.current * ratio;
                    nodes.osc.frequency.cancelScheduledValues(now);
                    nodes.osc.frequency.setValueAtTime(nodes.osc.frequency.value, now);
                    nodes.osc.frequency.linearRampToValueAtTime(exactFreq, now + 0.2);
                }
            }
        }
    }, []);

    // Set master volume with fade
    const setVolume = useCallback((level, fadeMs = 100) => {
        if (!masterGainRef.current) return;

        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        const fadeSec = fadeMs / 1000;

        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
        masterGainRef.current.gain.linearRampToValueAtTime(level, now + fadeSec);
    }, []);

    // Fade in (from 0 to target volume)
    const fadeIn = useCallback(async (durationMs, targetVolume = 0.4) => {
        await initAudio();

        // Resume audio context (required in some browsers)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        setVolume(targetVolume, durationMs);
    }, [initAudio, setVolume]);

    // Fade out (to 0)
    const fadeOut = useCallback((durationMs) => {
        setVolume(0, durationMs);
    }, [setVolume]);

    // Get current frequencies for display
    const getCurrentFrequencies = useCallback(() => {
        const freqs = [];
        for (const [ratio] of oscillatorsRef.current.entries()) {
            freqs.push({
                ratio,
                frequency: baseFrequencyRef.current * ratio
            });
        }
        return freqs.sort((a, b) => a.ratio - b.ratio);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (driftIntervalRef.current) {
                clearInterval(driftIntervalRef.current);
            }

            for (const [, nodes] of oscillatorsRef.current.entries()) {
                try {
                    nodes.osc.stop();
                    nodes.osc.disconnect();
                    nodes.gain.disconnect();
                } catch {
                    // Oscillator may already be stopped
                }
            }

            oscillatorsRef.current.clear();

            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        setFrequency,
        addInterval,
        removeInterval,
        clearToRoot,
        setDrift,
        setVolume,
        fadeIn,
        fadeOut,
        getCurrentFrequencies
    };
}
