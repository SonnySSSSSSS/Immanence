import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { useTempoAudioStore } from '../state/tempoAudioStore.js';

/**
 * useBreathSoundEngine - Web Audio API breath sound generator
 *
 * Produces continuous audio feedback synced to breath phases:
 * - Inhale: Rising pitch (180Hz → 320Hz) with breathy texture
 * - Hold (top): Steady 320Hz tone with subtle vibrato
 * - Exhale: Falling pitch (280Hz → 140Hz) with breathy texture
 * - Hold (bottom): Steady 140Hz tone with subtle vibrato
 */
export function useBreathSoundEngine({ phase, pattern, isRunning, _progress }) {
    const breathSoundEnabled = useSettingsStore(s => s.breathSoundEnabled);

    const audioContextRef = useRef(null);
    const activeNodesRef = useRef([]);
    const currentPhaseRef = useRef(null);

    // Cleanup function
    const stopAllSounds = useCallback(() => {
        activeNodesRef.current.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {
                // Ignore errors from already-stopped nodes
            }
        });
        activeNodesRef.current = [];
    }, []);

    // Create breathy noise texture
    const createNoiseBuffer = useCallback((audioContext, durationSec) => {
        const sampleRate = audioContext.sampleRate;
        const bufferSize = Math.floor(sampleRate * durationSec);
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        return buffer;
    }, []);

    // Play inhale sound (rising pitch)
    const playInhale = useCallback((durationSec) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        stopAllSounds();

        // Main oscillator - rising pitch
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + durationSec);

        // Gain envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + durationSec - 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        // Breathy noise layer
        const noiseBuffer = createNoiseBuffer(ctx, durationSec);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
        noiseFilter.frequency.linearRampToValueAtTime(1200, ctx.currentTime + durationSec);
        noiseFilter.Q.value = 1;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + durationSec - 0.1);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        // Connect
        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // Start
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durationSec);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + durationSec);

        activeNodesRef.current = [osc, gain, noise, noiseFilter, noiseGain];
    }, [stopAllSounds, createNoiseBuffer]);

    // Play exhale sound (falling pitch)
    const playExhale = useCallback((durationSec) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        stopAllSounds();

        // Main oscillator - falling pitch
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + durationSec);

        // Gain envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + durationSec - 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        // Breathy noise layer
        const noiseBuffer = createNoiseBuffer(ctx, durationSec);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);
        noiseFilter.frequency.linearRampToValueAtTime(600, ctx.currentTime + durationSec);
        noiseFilter.Q.value = 1;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        noiseGain.gain.setValueAtTime(0.08, ctx.currentTime + durationSec - 0.1);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        // Connect
        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // Start
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durationSec);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + durationSec);

        activeNodesRef.current = [osc, gain, noise, noiseFilter, noiseGain];
    }, [stopAllSounds, createNoiseBuffer]);

    // Play hold sound (steady tone with subtle vibrato)
    const playHold = useCallback((durationSec, isTopHold) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        stopAllSounds();

        // Base frequency depends on which hold (top = from inhale peak, bottom = from exhale bottom)
        const baseFreq = isTopHold ? 320 : 140;

        // Main oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        // LFO for subtle vibrato - very small deviation (1-3 Hz)
        const lfo = ctx.createOscillator();
        const oscillationDepth = Math.min(3, 1 + durationSec * 0.1); // 1-3 Hz deviation max
        const oscillationRate = Math.max(0.3, 1.5 - durationSec * 0.05); // Slower for longer holds
        lfo.frequency.setValueAtTime(oscillationRate, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(oscillationDepth, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // Main gain envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + durationSec - 0.15);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

        // Connect
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Start
        lfo.start(ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + durationSec);
        lfo.stop(ctx.currentTime + durationSec);

        activeNodesRef.current = [osc, gain, lfo, lfoGain];
    }, [stopAllSounds]);

    // Initialize AudioContext on first run
    useEffect(() => {
        if (isRunning && breathSoundEnabled && !audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        return () => {
            stopAllSounds();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [isRunning, breathSoundEnabled, stopAllSounds]);

    // Handle phase changes
    useEffect(() => {
        if (!isRunning || !breathSoundEnabled || !phase || !pattern) {
            stopAllSounds();
            currentPhaseRef.current = null;
            return;
        }

        // Only trigger on phase change
        if (phase === currentPhaseRef.current) return;
        currentPhaseRef.current = phase;

        const { hasSong, isPlaying } = useTempoAudioStore.getState();
        if (hasSong && isPlaying) {
            stopAllSounds();
            return;
        }

        // Resume context if suspended
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Play appropriate sound for phase
        switch (phase) {
            case 'inhale':
                playInhale(pattern.inhale || 4);
                break;
            case 'holdTop':
                playHold(pattern.holdTop || 4, true);
                break;
            case 'exhale':
                playExhale(pattern.exhale || 4);
                break;
            case 'holdBottom':
                playHold(pattern.holdBottom || 4, false);
                break;
            default:
                stopAllSounds();
        }
    }, [phase, pattern, isRunning, breathSoundEnabled, playInhale, playExhale, playHold, stopAllSounds]);

    // Stop sounds when practice ends
    useEffect(() => {
        if (!isRunning) {
            stopAllSounds();
            currentPhaseRef.current = null;
        }
    }, [isRunning, stopAllSounds]);

    return null;
}
