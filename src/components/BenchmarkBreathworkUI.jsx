import { useCallback, useEffect, useRef, useState } from 'react';
import { useDisplayModeStore } from '../state/displayModeStore';

const PHASES = [
    { key: 'inhale', label: 'Inhale', hint: 'Breathe in until you reach your comfortable limit.' },
    { key: 'hold1', label: 'Hold In', hint: 'Hold with lungs full while staying relaxed.' },
    { key: 'exhale', label: 'Exhale', hint: 'Release slowly until empty.' },
    { key: 'hold2', label: 'Hold Out', hint: 'Pause empty without strain.' },
];

const formatPct = (value) => {
    if (!Number.isFinite(value)) return '0%';
    const rounded = Math.round(value);
    if (Object.is(rounded, -0)) return '0%';
    return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

const calculateDeltas = (current, baseline) => {
    if (!baseline) return null;
    const keys = ['inhale', 'hold1', 'exhale', 'hold2', 'total'];
    const out = {};
    for (const key of keys) {
        const base = Number(baseline[key] || 0);
        const now = Number(current[key] || 0);
        if (!Number.isFinite(base) || base <= 0) {
            out[key] = null;
            continue;
        }
        out[key] = ((now - base) / base) * 100;
    }
    return out;
};

export function BenchmarkBreathworkUI({
    isOpen,
    dayNumber = 1,
    comparisonBaseline = null,
    onCancel,
    onSave,
}) {
    const colorScheme = useDisplayModeStore((s) => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [stage, setStage] = useState('intro');
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [results, setResults] = useState({ inhale: 0, hold1: 0, exhale: 0, hold2: 0, total: 0 });

    const startedAtRef = useRef(null);
    const rafRef = useRef(null);

    const stopTimer = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const updateTimer = useCallback(() => {
        if (startedAtRef.current) {
            setElapsedMs(Date.now() - startedAtRef.current);
            rafRef.current = requestAnimationFrame(updateTimer);
        }
    }, []);

    const beginPhase = useCallback(() => {
        startedAtRef.current = Date.now();
        setElapsedMs(0);
        stopTimer();
        rafRef.current = requestAnimationFrame(updateTimer);
    }, [stopTimer, updateTimer]);

    const finishPhase = useCallback(() => {
        stopTimer();
        const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
        startedAtRef.current = null;
        return Math.max(0, Math.round(elapsed / 1000));
    }, [stopTimer]);

    const resetFlow = useCallback(() => {
        stopTimer();
        startedAtRef.current = null;
        setStage('intro');
        setPhaseIndex(0);
        setElapsedMs(0);
        setResults({ inhale: 0, hold1: 0, exhale: 0, hold2: 0, total: 0 });
    }, [stopTimer]);

    useEffect(() => {
        if (isOpen) {
            resetFlow();
        } else {
            stopTimer();
            startedAtRef.current = null;
        }
    }, [isOpen, resetFlow, stopTimer]);

    useEffect(() => () => stopTimer(), [stopTimer]);

    const handleAdvance = () => {
        if (stage === 'intro') {
            setStage('measuring');
            setPhaseIndex(0);
            beginPhase();
            return;
        }

        if (stage !== 'measuring') return;

        const seconds = finishPhase();
        const phase = PHASES[phaseIndex];
        const nextResults = {
            ...results,
            [phase.key]: seconds,
        };

        if (phaseIndex < PHASES.length - 1) {
            setResults(nextResults);
            setPhaseIndex((prev) => prev + 1);
            beginPhase();
            return;
        }

        const total = nextResults.inhale + nextResults.hold1 + nextResults.exhale + nextResults.hold2;
        setResults({ ...nextResults, total });
        setStage('results');
    };

    const handleSave = () => {
        if (typeof onSave === 'function') {
            onSave(results);
        }
    };

    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const elapsedTenths = Math.floor((elapsedMs % 1000) / 100);
    const activePhase = PHASES[phaseIndex] || PHASES[0];
    const deltas = stage === 'results' ? calculateDeltas(results, comparisonBaseline) : null;
    const isComparisonDay = Number(dayNumber) === 14;

    if (!isOpen) return null;

    const bgColor = isLight ? 'rgba(246, 241, 232, 0.98)' : 'rgba(8, 10, 16, 0.98)';
    const textColor = isLight ? '#2f2619' : '#f4f0e8';
    const muted = isLight ? 'rgba(47, 38, 25, 0.65)' : 'rgba(244, 240, 232, 0.65)';
    const accent = isLight ? '#8b6b3d' : '#f5d18a';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10020,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: bgColor,
                color: textColor,
                padding: '20px',
                fontFamily: 'var(--font-body)',
                cursor: stage === 'measuring' ? 'pointer' : 'default',
            }}
            onClick={stage === 'measuring' || stage === 'intro' ? handleAdvance : undefined}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onCancel?.();
                }}
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    border: 'none',
                    background: 'transparent',
                    color: muted,
                    fontSize: 28,
                    cursor: 'pointer',
                }}
                aria-label="Close benchmark"
            >
                x
            </button>

            {stage === 'intro' && (
                <div style={{ width: '100%', maxWidth: 540, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
                        Day {dayNumber} Benchmark
                    </div>
                    <h2 style={{ marginTop: 10, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        Breath Capacity Capture
                    </h2>
                    <p style={{ margin: 0, lineHeight: 1.6, color: muted }}>
                        Tap to begin each phase. Tap again when you reach your comfortable maximum.
                    </p>
                    <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {PHASES.map((phase, idx) => (
                            <span
                                key={phase.key}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 999,
                                    border: `1px solid ${isLight ? 'rgba(47, 38, 25, 0.2)' : 'rgba(244, 240, 232, 0.2)'}`,
                                    fontSize: 12,
                                    color: muted,
                                }}
                            >
                                {idx + 1}. {phase.label}
                            </span>
                        ))}
                    </div>
                    <div style={{ marginTop: 24, color: accent, letterSpacing: '0.14em', fontSize: 12, textTransform: 'uppercase' }}>
                        Tap to Start
                    </div>
                </div>
            )}

            {stage === 'measuring' && (
                <div style={{ width: '100%', maxWidth: 540, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 22 }}>
                        {PHASES.map((phase, idx) => (
                            <div
                                key={phase.key}
                                style={{
                                    width: 42,
                                    height: 4,
                                    borderRadius: 999,
                                    background: idx < phaseIndex
                                        ? accent
                                        : idx === phaseIndex
                                            ? textColor
                                            : (isLight ? 'rgba(47,38,25,0.15)' : 'rgba(244,240,232,0.15)'),
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
                        Phase {phaseIndex + 1} of 4
                    </div>
                    <h3 style={{ marginTop: 12, marginBottom: 8, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        {activePhase.label}
                    </h3>
                    <p style={{ margin: 0, color: muted }}>{activePhase.hint}</p>
                    <div style={{ marginTop: 28, fontSize: 74, fontFamily: 'var(--font-mono, monospace)', fontWeight: 300 }}>
                        {elapsedSeconds}
                        <span style={{ fontSize: 32, color: muted }}>.{elapsedTenths}</span>
                    </div>
                    <div style={{ marginTop: 18, color: accent, letterSpacing: '0.14em', fontSize: 12, textTransform: 'uppercase' }}>
                        Tap When Complete
                    </div>
                </div>
            )}

            {stage === 'results' && (
                <div style={{ width: '100%', maxWidth: 620, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
                        Day {dayNumber} Snapshot
                    </div>
                    <h2 style={{ marginTop: 10, marginBottom: 16, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                        Results
                    </h2>

                    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                        {PHASES.map((phase) => (
                            <div
                                key={phase.key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                                }}
                            >
                                <span style={{ color: muted }}>{phase.label}</span>
                                <strong>{results[phase.key]}s</strong>
                            </div>
                        ))}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: `1px solid ${isLight ? 'rgba(47,38,25,0.2)' : 'rgba(244,240,232,0.2)'}`,
                            }}
                        >
                            <span style={{ color: muted }}>Total</span>
                            <strong>{results.total}s</strong>
                        </div>
                    </div>

                    {isComparisonDay && comparisonBaseline && deltas && (
                        <div
                            style={{
                                textAlign: 'left',
                                padding: 12,
                                borderRadius: 10,
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                                marginBottom: 16,
                            }}
                        >
                            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 8 }}>
                                Day 14 vs Day 1
                            </div>
                            {[
                                ['Inhale', 'inhale'],
                                ['Hold In', 'hold1'],
                                ['Exhale', 'exhale'],
                                ['Hold Out', 'hold2'],
                                ['Total', 'total'],
                            ].map(([label, key]) => {
                                const delta = deltas[key];
                                return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                        <span style={{ color: muted }}>{label}</span>
                                        <span>{delta === null ? 'n/a' : formatPct(delta)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={resetFlow}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: `1px solid ${isLight ? 'rgba(47, 38, 25, 0.25)' : 'rgba(244, 240, 232, 0.25)'}`,
                                background: 'transparent',
                                color: textColor,
                                cursor: 'pointer',
                            }}
                        >
                            Retry
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: 'none',
                                background: accent,
                                color: isLight ? '#fff' : '#111',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                        >
                            Save Snapshot
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BenchmarkBreathworkUI;
