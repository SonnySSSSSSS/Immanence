import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore';
import { useDisplayModeStore } from '../state/displayModeStore';

void motion;

const PHASES = [
    { key: 'inhale', label: 'INHALE', instruction: 'Breathe in slowly until you cannot inhale anymore', minSeconds: 2 },
    { key: 'hold1', label: 'HOLD', instruction: 'Hold your breath as long as comfortable', minSeconds: 1 },
    { key: 'exhale', label: 'EXHALE', instruction: 'Breathe out slowly until lungs are empty', minSeconds: 2 },
    { key: 'hold2', label: 'HOLD', instruction: 'Keep lungs empty as long as comfortable', minSeconds: 1 },
];

/**
 * BreathBenchmark - Full-screen modal for measuring breath capacity
 *
 * Flow: intro → 4 phases (tap to advance) → results (with retry option)
 */
export function BreathBenchmark({ isOpen, onClose }) {
    const setBenchmark = useBreathBenchmarkStore(s => s.setBenchmark);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const isHearth = useDisplayModeStore(s => s.isHearth)();

    const [stage, setStage] = useState('intro'); // 'intro' | 'measuring' | 'results'
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [results, setResults] = useState({ inhale: 0, hold1: 0, exhale: 0, hold2: 0 });
    const [elapsedMs, setElapsedMs] = useState(0);
    const [showRetryPrompt, setShowRetryPrompt] = useState(false);

    const startTimeRef = useRef(null);
    const rafRef = useRef(null);

    // Timer loop
    const updateTimer = useCallback(() => {
        if (startTimeRef.current) {
            setElapsedMs(Date.now() - startTimeRef.current);
        }
        rafRef.current = requestAnimationFrame(updateTimer);
    }, []);

    // Start measuring a phase
    const startPhase = useCallback(() => {
        startTimeRef.current = Date.now();
        setElapsedMs(0);
        rafRef.current = requestAnimationFrame(updateTimer);
    }, [updateTimer]);

    // Stop measuring and record result
    const stopPhase = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        startTimeRef.current = null;
        return Math.round(elapsed / 1000); // Convert to seconds
    }, []);

    // Handle tap to advance
    const handleTap = useCallback(() => {
        if (stage === 'intro') {
            setStage('measuring');
            setCurrentPhaseIndex(0);
            setResults({ inhale: 0, hold1: 0, exhale: 0, hold2: 0 });
            startPhase();
            return;
        }

        if (stage === 'measuring') {
            const seconds = stopPhase();
            const phase = PHASES[currentPhaseIndex];
            const newResults = { ...results, [phase.key]: seconds };
            setResults(newResults);

            if (currentPhaseIndex < PHASES.length - 1) {
                // Next phase
                setCurrentPhaseIndex(prev => prev + 1);
                startPhase();
            } else {
                // All phases complete - check if results seem too short
                const tooShort = PHASES.some((p, i) => {
                    const val = i === PHASES.length - 1 ? seconds : newResults[p.key];
                    return val < p.minSeconds;
                });
                setShowRetryPrompt(tooShort);
                setStage('results');
            }
        }
    }, [stage, currentPhaseIndex, results, startPhase, stopPhase]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStage('intro');
            setCurrentPhaseIndex(0);
            setResults({ inhale: 0, hold1: 0, exhale: 0, hold2: 0 });
            setElapsedMs(0);
            setShowRetryPrompt(false);
        }
    }, [isOpen]);

    const handleAccept = () => {
        setBenchmark(results);
        onClose(results);
    };

    const handleRetry = () => {
        setStage('intro');
        setCurrentPhaseIndex(0);
        setResults({ inhale: 0, hold1: 0, exhale: 0, hold2: 0 });
        setElapsedMs(0);
        setShowRetryPrompt(false);
    };

    const handleCancel = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        onClose(null);
    };

    if (!isOpen) return null;

    const currentPhase = PHASES[currentPhaseIndex];
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const elapsedTenths = Math.floor((elapsedMs % 1000) / 100);

    // Calculate 75% pattern for display
    const startingPattern = {
        inhale: Math.round(results.inhale * 0.75),
        hold1: Math.round(results.hold1 * 0.75),
        exhale: Math.round(results.exhale * 0.75),
        hold2: Math.round(results.hold2 * 0.75),
    };

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 10, 20, 0.98)';
    const textColor = isLight ? '#3d3424' : '#f0f0f0';
    const mutedColor = isLight ? '#5a4d3c' : '#a0a0a0';
    const accentColor = isLight ? '#8b7355' : '#60a5fa';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    background: bgColor,
                    display: 'flex',
                    justifyContent: 'center',
                    overflowY: 'auto',
                }}
                onClick={stage !== 'results' ? handleTap : undefined}
            >
            <div style={{
                width: '100%',
                maxWidth: isHearth ? '430px' : '760px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: textColor,
                fontFamily: 'var(--font-body)',
                cursor: stage === 'results' ? 'default' : 'pointer',
                padding: '24px 16px',
                boxSizing: 'border-box',
                position: 'relative',
            }}>
                {/* Close button */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: 'none',
                        border: 'none',
                        color: mutedColor,
                        fontSize: 24,
                        cursor: 'pointer',
                        padding: 8,
                    }}
                >
                    ✕
                </button>

                {/* INTRO */}
                {stage === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 28,
                            marginBottom: 24,
                            letterSpacing: '0.05em',
                        }}>
                            BREATH CAPACITY TEST
                        </h2>
                        <p style={{ color: mutedColor, lineHeight: 1.6, marginBottom: 32 }}>
                            You will measure your maximum capacity for each breath phase.
                            Tap anywhere to advance through each phase when you reach your limit.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'center',
                            marginBottom: 32,
                        }}>
                            {PHASES.map((p, i) => (
                                <div key={p.key} style={{
                                    padding: '8px 12px',
                                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    letterSpacing: '0.1em',
                                }}>
                                    {i + 1}. {p.label}
                                </div>
                            ))}
                        </div>
                        <p style={{
                            color: accentColor,
                            fontSize: 14,
                            letterSpacing: '0.15em',
                        }}>
                            TAP TO BEGIN
                        </p>
                    </motion.div>
                )}

                {/* MEASURING */}
                {stage === 'measuring' && (
                    <motion.div
                        key={currentPhaseIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: 40 }}
                    >
                        {/* Phase indicator */}
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'center',
                            marginBottom: 40,
                        }}>
                            {PHASES.map((p, i) => (
                                <div key={p.key} style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    background: i < currentPhaseIndex
                                        ? accentColor
                                        : i === currentPhaseIndex
                                            ? textColor
                                            : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                }} />
                            ))}
                        </div>

                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 36,
                            marginBottom: 16,
                            letterSpacing: '0.1em',
                        }}>
                            {currentPhase.label}
                        </h2>

                        <p style={{ color: mutedColor, marginBottom: 48 }}>
                            {currentPhase.instruction}
                        </p>

                        {/* Timer display */}
                        <div style={{
                            fontSize: 72,
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 300,
                            marginBottom: 48,
                        }}>
                            {elapsedSeconds}<span style={{ fontSize: 36, color: mutedColor }}>.{elapsedTenths}</span>
                        </div>

                        <p style={{
                            color: accentColor,
                            fontSize: 14,
                            letterSpacing: '0.15em',
                        }}>
                            TAP WHEN DONE
                        </p>
                    </motion.div>
                )}

                {/* RESULTS */}
                {stage === 'results' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}
                    >
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 28,
                            marginBottom: 32,
                            letterSpacing: '0.05em',
                        }}>
                            YOUR CAPACITY
                        </h2>

                        {/* Results bars */}
                        <div style={{ marginBottom: 32 }}>
                            {PHASES.map(p => {
                                const value = results[p.key];
                                const maxDisplay = 30; // Max seconds for bar width
                                const width = Math.min(100, (value / maxDisplay) * 100);
                                const isTooShort = value < p.minSeconds;

                                return (
                                    <div key={p.key} style={{ marginBottom: 16 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 4,
                                            fontSize: 12,
                                            letterSpacing: '0.1em',
                                        }}>
                                            <span style={{ color: mutedColor }}>{p.label}</span>
                                            <span style={{ color: isTooShort ? '#ef4444' : textColor }}>
                                                {value}s
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 8,
                                            background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${width}%`,
                                                height: '100%',
                                                background: isTooShort ? '#ef4444' : accentColor,
                                                borderRadius: 4,
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Starting pattern preview */}
                        <div style={{
                            padding: 16,
                            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            marginBottom: 32,
                        }}>
                            <p style={{
                                fontSize: 11,
                                letterSpacing: '0.15em',
                                color: mutedColor,
                                marginBottom: 8,
                            }}>
                                STARTING PATTERN (75%)
                            </p>
                            <p style={{ fontSize: 18, fontFamily: 'var(--font-mono, monospace)' }}>
                                {startingPattern.inhale}-{startingPattern.hold1}-{startingPattern.exhale}-{startingPattern.hold2}
                            </p>
                        </div>

                        {/* Retry prompt */}
                        {showRetryPrompt && (
                            <p style={{
                                color: '#f59e0b',
                                fontSize: 13,
                                marginBottom: 24,
                                lineHeight: 1.5,
                            }}>
                                Some values seem short. Would you like to retry?
                            </p>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={handleRetry}
                                style={{
                                    padding: '12px 24px',
                                    background: 'none',
                                    border: `1px solid ${mutedColor}`,
                                    borderRadius: 8,
                                    color: textColor,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Retry
                            </button>
                            <button
                                onClick={handleAccept}
                                style={{
                                    padding: '12px 24px',
                                    background: accentColor,
                                    border: 'none',
                                    borderRadius: 8,
                                    color: isLight ? '#fff' : '#000',
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    letterSpacing: '0.05em',
                                    fontWeight: 500,
                                }}
                            >
                                Accept
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
            </motion.div>
        </AnimatePresence>
    );
}
