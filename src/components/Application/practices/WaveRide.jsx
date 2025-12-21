// src/components/Application/practices/WaveRide.jsx
// Wave Mode: Emotional Capacity - Ride the intensity without acting out
// IE v1 Spec: Timer with emotion inventory, somatic scan, impulse tracking

import React, { useState, useEffect, useRef } from 'react';
import { useChainStore } from '../../../state/chainStore.js';
import { VoiceInput } from '../VoiceInput.jsx';

// Common emotion labels (user can type custom)
const EMOTION_PRESETS = [
    'Anxiety', 'Anger', 'Sadness', 'Fear', 'Shame',
    'Frustration', 'Dread', 'Panic', 'Numbness', 'Overwhelm',
    'Disgust', 'Guilt', 'Loneliness', 'Hopelessness', 'Jealousy',
];

// Somatic locations
const SOMATIC_LOCATIONS = [
    'Head / Temples', 'Jaw / Tension', 'Throat / Constriction',
    'Chest / Heart', 'Stomach / Gut', 'Shoulders / Upper back',
    'Lower back', 'Hands / Arms', 'Legs / Feet', 'Whole body',
];

export function WaveRide({ onComplete }) {
    const {
        activeChain,
        updateWaveData,
        addWaveEmotion,
        addWaveImpulse,
        lockWave,
        abortWave,
    } = useChainStore();

    // Local UI state
    const [phase, setPhase] = useState('inventory'); // inventory | somatic | impulse | ride | complete
    const [customEmotion, setCustomEmotion] = useState('');
    const [customImpulse, setCustomImpulse] = useState('');

    // Timer state
    const [timerRunning, setTimerRunning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(90);
    const [startIntensity, setStartIntensity] = useState(null);
    const [endIntensity, setEndIntensity] = useState(null);
    const timerRef = useRef(null);

    const waveData = activeChain?.wave || {};

    // Timer effect
    useEffect(() => {
        if (timerRunning && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(t => t - 1);
            }, 1000);
            return () => clearInterval(timerRef.current);
        } else if (timeRemaining === 0 && timerRunning) {
            setTimerRunning(false);
            setPhase('complete');
        }
    }, [timerRunning, timeRemaining]);

    // Handlers
    const handleAddEmotion = (emotion) => {
        if (emotion && !waveData.emotions?.includes(emotion)) {
            addWaveEmotion(emotion);
        }
        setCustomEmotion('');
    };

    const handleAddImpulse = () => {
        if (customImpulse.trim()) {
            addWaveImpulse(customImpulse.trim());
            setCustomImpulse('');
        }
    };

    const handleStartRide = () => {
        if (startIntensity === null) return;
        updateWaveData('startIntensity', startIntensity);
        setTimerRunning(true);
        setPhase('ride');
    };

    const handleAbort = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerRunning(false);
        abortWave();
        onComplete?.();
    };

    const handleComplete = () => {
        try {
            if (endIntensity !== null) {
                updateWaveData('endIntensity', endIntensity);
            }
            lockWave();
        } catch (err) {
            console.error('Error locking wave:', err);
        }
        // Always call onComplete to progress
        onComplete?.();
    };

    // Format time as M:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: Emotion Inventory
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'inventory') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Wave — Step 1 of 4
                </p>
                <h2
                    className="text-lg mb-6 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What emotions are present?
                </h2>

                {/* Selected emotions */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {(waveData.emotions || []).map((em, i) => (
                        <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs"
                            style={{
                                background: 'rgba(167, 139, 250, 0.3)',
                                color: 'rgba(255,255,255,0.9)',
                                border: '1px solid rgba(167, 139, 250, 0.5)',
                            }}
                        >
                            {em}
                        </span>
                    ))}
                </div>

                {/* Preset grid */}
                <div className="grid grid-cols-3 gap-2 mb-4 w-full max-w-sm">
                    {EMOTION_PRESETS.map((em) => (
                        <button
                            key={em}
                            onClick={() => handleAddEmotion(em)}
                            disabled={waveData.emotions?.includes(em)}
                            className="px-2 py-1.5 rounded text-xs transition-all"
                            style={{
                                background: waveData.emotions?.includes(em)
                                    ? 'rgba(167, 139, 250, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                color: waveData.emotions?.includes(em)
                                    ? 'rgba(167, 139, 250, 0.6)'
                                    : 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            {em}
                        </button>
                    ))}
                </div>

                {/* Custom input with voice */}
                <div className="flex gap-2 mb-6 w-full max-w-sm">
                    <input
                        type="text"
                        value={customEmotion}
                        onChange={(e) => setCustomEmotion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEmotion(customEmotion)}
                        placeholder="Or type your own..."
                        className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-400/50"
                    />
                    <VoiceInput onTranscription={(text) => setCustomEmotion(text)} />
                    <button
                        onClick={() => handleAddEmotion(customEmotion)}
                        className="px-4 py-2 rounded bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        Add
                    </button>
                </div>

                {/* Next */}
                <button
                    onClick={() => setPhase('somatic')}
                    disabled={(waveData.emotions || []).length === 0}
                    className="px-6 py-2 rounded border transition-all"
                    style={{
                        borderColor: (waveData.emotions || []).length > 0 ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255,255,255,0.2)',
                        color: (waveData.emotions || []).length > 0 ? 'rgba(167, 139, 250, 0.9)' : 'rgba(255,255,255,0.4)',
                        opacity: (waveData.emotions || []).length > 0 ? 1 : 0.5,
                    }}
                >
                    NEXT
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: Somatic Scan
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'somatic') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Wave — Step 2 of 4
                </p>
                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    Where do you feel it?
                </h2>
                <p
                    className="text-xs mb-6 text-center"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Locate the sensation in your body.
                </p>

                {/* Location buttons */}
                <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-sm">
                    {SOMATIC_LOCATIONS.map((loc) => (
                        <button
                            key={loc}
                            onClick={() => updateWaveData('somaticLocation', loc)}
                            className="px-3 py-2 rounded text-xs transition-all text-left"
                            style={{
                                background: waveData.somaticLocation === loc
                                    ? 'rgba(167, 139, 250, 0.3)'
                                    : 'rgba(255,255,255,0.05)',
                                color: waveData.somaticLocation === loc
                                    ? 'rgba(255,255,255,0.95)'
                                    : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${waveData.somaticLocation === loc ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                            }}
                        >
                            {loc}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('inventory')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        BACK
                    </button>
                    <button
                        onClick={() => setPhase('impulse')}
                        disabled={!waveData.somaticLocation}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: waveData.somaticLocation ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255,255,255,0.2)',
                            color: waveData.somaticLocation ? 'rgba(167, 139, 250, 0.9)' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        NEXT
                    </button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: Impulse Logging
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'impulse') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Wave — Step 3 of 4
                </p>
                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What do you want to do?
                </h2>
                <p
                    className="text-xs mb-6 text-center max-w-xs"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Name the urge. You will not act on it during the timer.
                </p>

                {/* Logged impulses */}
                <div className="w-full max-w-sm mb-4 space-y-2">
                    {(waveData.impulses || []).map((imp) => (
                        <div
                            key={imp.id}
                            className="px-3 py-2 rounded text-sm"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.8)',
                            }}
                        >
                            "{imp.text}"
                        </div>
                    ))}
                </div>

                {/* Add impulse with voice */}
                <div className="flex gap-2 mb-6 w-full max-w-sm">
                    <input
                        type="text"
                        value={customImpulse}
                        onChange={(e) => setCustomImpulse(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddImpulse()}
                        placeholder="E.g., Urge to send a text..."
                        className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-400/50"
                    />
                    <VoiceInput onTranscription={(text) => setCustomImpulse(text)} />
                    <button
                        onClick={handleAddImpulse}
                        className="px-4 py-2 rounded bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        Add
                    </button>
                </div>

                {/* Intensity slider */}
                <div className="w-full max-w-sm mb-6">
                    <p
                        className="text-xs mb-2 text-center"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Current intensity: {startIntensity !== null ? `${startIntensity}/10` : 'Set below'}
                    </p>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={startIntensity || 5}
                        onChange={(e) => setStartIntensity(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>1</span>
                        <span>10</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('somatic')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        BACK
                    </button>
                    <button
                        onClick={handleStartRide}
                        disabled={startIntensity === null}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: startIntensity !== null ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255,255,255,0.2)',
                            color: startIntensity !== null ? 'rgba(167, 139, 250, 0.9)' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        START TIMER
                    </button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 4: Wave Ride (Timer)
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'ride') {
        const progress = ((90 - timeRemaining) / 90) * 100;

        return (
            <div className="flex flex-col items-center justify-center h-full px-6">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-8"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Observing
                </p>

                {/* Timer display */}
                <div
                    className="relative w-40 h-40 mb-8"
                    style={{
                        background: `conic-gradient(rgba(167, 139, 250, 0.6) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
                        borderRadius: '50%',
                    }}
                >
                    <div
                        className="absolute inset-2 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(10, 10, 18, 0.95)' }}
                    >
                        <span
                            className="text-3xl"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: 'rgba(255,255,255,0.9)',
                            }}
                        >
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                </div>

                {/* Guidance */}
                <p
                    className="text-sm text-center mb-8 max-w-xs"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.6)',
                    }}
                >
                    Do not act. Just observe the sensation until the timer ends.
                </p>

                {/* Abort button */}
                <button
                    onClick={handleAbort}
                    className="px-6 py-2 rounded border border-red-400/30 text-red-400/70 hover:text-red-300 hover:border-red-400/50 transition-all text-xs"
                >
                    ABORT (Capacity Exceeded)
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 5: Complete
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'complete') {
        return (
            <div className="flex flex-col items-center justify-center h-full px-6">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-4"
                    style={{ color: 'rgba(167, 139, 250, 0.7)' }}
                >
                    Capacity Verified
                </p>

                <h2
                    className="text-lg mb-6 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    You held it without discharge.
                </h2>

                {/* End intensity */}
                <div className="w-full max-w-sm mb-6">
                    <p
                        className="text-xs mb-2 text-center"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Current intensity: {endIntensity !== null ? `${endIntensity}/10` : 'Rate now'}
                    </p>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={endIntensity || startIntensity || 5}
                        onChange={(e) => setEndIntensity(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>1</span>
                        <span>10</span>
                    </div>
                    {endIntensity !== null && startIntensity !== null && (
                        <p
                            className="text-xs text-center mt-2"
                            style={{ color: 'rgba(167, 139, 250, 0.7)' }}
                        >
                            Delta: {startIntensity - endIntensity > 0 ? '-' : '+'}{Math.abs(startIntensity - endIntensity)}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleComplete}
                    className="px-6 py-2 rounded border border-purple-400/50 text-purple-300 hover:text-purple-200 transition-all"
                >
                    LOCK WAVE
                </button>
            </div>
        );
    }

    return null;
}
