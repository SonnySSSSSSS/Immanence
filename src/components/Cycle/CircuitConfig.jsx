// src/components/Cycle/CircuitConfig.jsx
// Circuit configuration UI - Refined as "digital talisman"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

void motion;

const AVAILABLE_EXERCISES = [
    {
        id: 'breath',
        name: 'Breath',
        type: 'breath',
        icon: '✦',
        practiceType: 'Breath & Stillness',
        preset: 'box',
        glow: 'rgba(147, 197, 253, 0.4)', // Blue glow
    },
    {
        id: 'cognitive',
        name: 'Cognitive',
        type: 'focus',
        icon: '👁',
        practiceType: 'Insight Meditation',
        sensoryType: 'cognitive_vipassana',
        glow: 'rgba(251, 146, 60, 0.4)', // Orange glow
    },
    {
        id: 'somatic',
        name: 'Somatic',
        type: 'body',
        icon: '✨',
        practiceType: 'Body Scan',
        sensoryType: 'somatic_vipassana',
        glow: 'rgba(196, 181, 253, 0.4)', // Purple glow
    },
    {
        id: 'emotion',
        name: 'Emotion',
        type: 'focus',
        icon: '💚',
        practiceType: 'Feeling Meditation',
        sensoryType: 'feeling',
        glow: 'rgba(134, 239, 172, 0.4)', // Green glow
    },
    {
        id: 'kasina',
        name: 'Kasina',
        type: 'focus',
        icon: '✧',
        practiceType: 'Visualization',
        glow: 'rgba(167, 139, 250, 0.4)', // Deep purple
    },
    {
        id: 'photic',
        name: 'Photonic',
        type: 'focus',
        icon: '◉',
        practiceType: 'Photic',
        glow: 'rgba(216, 180, 254, 0.4)', // Fuchsia
    },
    {
        id: 'sound',
        name: 'Sound',
        type: 'body',
        icon: '⌇',
        practiceType: 'Sound',
        glow: 'rgba(192, 132, 252, 0.4)', // Violet
    },
    {
        id: 'cymatics',
        name: 'Cymatics',
        type: 'focus',
        icon: '〰️',
        practiceType: 'Cymatics',
        glow: 'rgba(129, 140, 248, 0.4)', // Indigo
    },
];

export function CircuitConfig({ value, onChange, isLight = false }) {
    const [intervalBreakSec, setIntervalBreakSec] = useState(value?.intervalBreakSec || 10);
    const [pageIndex, setPageIndex] = useState(0);
    const [circuitError, setCircuitError] = useState(null);

    const EXERCISES_PER_PAGE = 2;
    const totalPages = Math.ceil(AVAILABLE_EXERCISES.length / EXERCISES_PER_PAGE);

    const exercisePages = [];
    for (let i = 0; i < AVAILABLE_EXERCISES.length; i += EXERCISES_PER_PAGE) {
        exercisePages.push(AVAILABLE_EXERCISES.slice(i, i + EXERCISES_PER_PAGE));
    }

    const [selectedExercises, setSelectedExercises] = useState(
        value?.exercises || [
            { exercise: AVAILABLE_EXERCISES[0], duration: 5 },
            { exercise: AVAILABLE_EXERCISES[1], duration: 5 },
            { exercise: AVAILABLE_EXERCISES[2], duration: 5 },
        ]
    );

    // Notify parent of initial state on mount (fixes Circuit START bug)
    useEffect(() => {
        if (onChange && !value) {
            onChange({ exercises: selectedExercises, intervalBreakSec });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!circuitError) return undefined;
        const timer = setTimeout(() => setCircuitError(null), 2000);
        return () => clearTimeout(timer);
    }, [circuitError]);

    const MAX_EXERCISES = 6;

    const handleToggleExercise = (exercise) => {
        // Check if at max capacity
        if (selectedExercises.length >= MAX_EXERCISES) {
            return; // Can't add more
        }

        const candidateType = exercise.type;
        const prevType = selectedExercises[selectedExercises.length - 1]?.exercise?.type;
        if (prevType && prevType === candidateType) {
            setCircuitError('Same practice cannot be placed consecutively.');
            return;
        }

        // Always add a new instance of the exercise (allow duplicates)
        const updated = [...selectedExercises, { exercise, duration: 5 }];
        setSelectedExercises(updated);
        setCircuitError(null);
        if (onChange) onChange({ exercises: updated, intervalBreakSec });
    };

    // Remove exercise by index (needed for duplicates)
    const handleRemoveExercise = (indexToRemove) => {
        const updated = selectedExercises.filter((_, idx) => idx !== indexToRemove);
        setSelectedExercises(updated);
        setCircuitError(null);
        if (onChange) onChange({ exercises: updated, intervalBreakSec });
    };

    // Compute total duration in seconds (internal representation)
    const exerciseDurationsSec = selectedExercises.reduce((sum, e) => sum + (e.duration * 60), 0);
    const breakTotalSec = selectedExercises.length > 1 ? intervalBreakSec * (selectedExercises.length - 1) : 0;
    const totalDurationSec = exerciseDurationsSec + breakTotalSec;
    // Format for display: convert to minutes and seconds
    const displayMinutes = Math.floor(totalDurationSec / 60);
    const displaySeconds = totalDurationSec % 60;

    return (
        <div className="space-y-5">
            {/* Total Duration - Hero Number with Pulse */}
            <div
                className="p-4 rounded relative"
                style={{
                    background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.12)',
                    boxShadow: 'inset 0 0 18px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)',
                }}
            >
                <style>{`
                    @keyframes energy-pulse {
                        0%, 100% { 
                            filter: drop-shadow(0 0 8px var(--accent-color)) drop-shadow(0 0 16px var(--accent-30));
                            transform: scale(1);
                        }
                        50% { 
                            filter: drop-shadow(0 0 16px var(--accent-color)) drop-shadow(0 0 32px var(--accent-50));
                            transform: scale(1.02);
                        }
                    }
                `}</style>
                <div>
                    {/* Header Labels */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '12px',
                        }}
                    >
                        <div
                            className="text-xs mb-2 tracking-wider uppercase font-medium"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)',
                            }}
                        >
                            Total Circuit
                        </div>
                        <div
                            className="text-xs mb-2 tracking-wider uppercase font-medium"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.5)',
                                fontSize: '10px',
                                lineHeight: '1',
                                whiteSpace: 'nowrap',
                                marginLeft: 'auto',
                                minWidth: '96px',
                                textAlign: 'left',
                            }}
                        >
                            Break Between
                        </div>
                    </div>
                    {/* Values Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Minutes */}
                        <div
                            className="text-3xl font-bold tracking-wide"
                            style={{
                                color: isLight ? 'var(--text-primary)' : 'rgba(255,255,255,0.95)',
                                fontFamily: 'var(--font-display)',
                                animation: selectedExercises.length > 0 ? 'energy-pulse 2s ease-in-out infinite' : 'none',
                                lineHeight: '1',
                            }}
                        >
                            {displayMinutes}
                        </div>
                        {/* Separator */}
                        <div
                            className="text-3xl font-bold"
                            style={{
                                opacity: 0.5,
                                lineHeight: '1',
                                fontFamily: 'var(--font-display)',
                            }}
                        >
                            :
                        </div>
                        {/* Seconds */}
                        <div
                            className="text-3xl font-bold tracking-wide"
                            style={{
                                color: isLight ? 'var(--text-primary)' : 'rgba(255,255,255,0.95)',
                                fontFamily: 'var(--font-display)',
                                animation: selectedExercises.length > 0 ? 'energy-pulse 2s ease-in-out infinite' : 'none',
                                lineHeight: '1',
                            }}
                        >
                            {displaySeconds.toString().padStart(2, '0')}
                        </div>
                        {/* Break Between */}
                        <div style={{ flex: '0 0 auto', marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', minWidth: '96px' }}>
                            <input
                                type="text"
                                    value={`0:${intervalBreakSec.toString().padStart(2, '0')}`}
                                    onChange={(e) => {
                                        const raw = e.target.value || '';
                                        // Extract digits only after optional "0:"
                                        const stripped = raw.replace(/^0:?/, '').replace(/\D/g, '');
                                        if (stripped === '') {
                                            setIntervalBreakSec(1);
                                            if (onChange) onChange({ exercises: selectedExercises, intervalBreakSec: 1 });
                                            return;
                                        }
                                        const parsed = parseInt(stripped, 10);
                                        const clamped = Math.max(1, Math.min(59, Number.isFinite(parsed) ? parsed : 1));
                                        setIntervalBreakSec(clamped);
                                        if (onChange) onChange({ exercises: selectedExercises, intervalBreakSec: clamped });
                                    }}
                                    onKeyDown={(e) => {
                                        const input = e.target;
                                        const cursorPos = input.selectionStart;
                                        // Prevent deleting the "0:" prefix (positions 0-2)
                                        if ((e.key === 'Backspace' && cursorPos <= 2) || (e.key === 'Delete' && cursorPos < 2)) {
                                            e.preventDefault();
                                        }
                                        // Arrow left stops at colon boundary
                                        if (e.key === 'ArrowLeft' && cursorPos === 2) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onClick={(e) => {
                                        const input = e.target;
                                        // Clicking before colon moves cursor to after colon
                                        if (input.selectionStart < 2) {
                                            input.setSelectionRange(2, 2);
                                        }
                                    }}
                                    onFocus={(e) => {
                                        const input = e.target;
                                        // Auto-select seconds portion for quick editing
                                        setTimeout(() => input.setSelectionRange(2, input.value.length), 0);
                                    }}
                                    className="text-lg font-bold rounded px-2 cursor-pointer text-center"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                        color: 'var(--accent-color)',
                                        border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
                                        letterSpacing: '0.02em',
                                        height: '32px',
                                        lineHeight: '32px',
                                        boxSizing: 'border-box',
                                        width: '72px'
                                    }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Swipable Exercise Carousel */}
            <div className="relative group">
                <div
                    className="text-xs text-white/40 mb-4 uppercase tracking-[0.15em] flex justify-between font-medium px-1"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    <span>Select Practices</span>
                    <span style={{ color: selectedExercises.length >= MAX_EXERCISES ? 'var(--accent-color)' : (isLight ? 'var(--text-muted)' : 'inherit') }}>
                        {selectedExercises.length}/{MAX_EXERCISES}
                    </span>
                </div>

                <div className="relative overflow-visible mb-4" style={{ height: '140px' }}>
                    <motion.div
                        className="flex gap-3 h-full px-1"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset }) => {
                            const swipe = offset.x;
                            if (swipe < -50 && pageIndex < totalPages - 1) {
                                setPageIndex(prev => prev + 1);
                            } else if (swipe > 50 && pageIndex > 0) {
                                setPageIndex(prev => prev - 1);
                            }
                        }}
                        style={{ cursor: 'grab', padding: '6px 0' }}
                        whileTap={{ cursor: 'grabbing' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pageIndex}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
                                className="flex gap-3 w-full"
                            >
                                {exercisePages[pageIndex].map((exercise) => {
                                    const isSelected = selectedExercises.some((e) => e.exercise.id === exercise.id);
                                    const isAtMax = selectedExercises.length >= MAX_EXERCISES;
                                    return (
                                        <motion.button
                                            key={exercise.id}
                                            onClick={() => handleToggleExercise(exercise)}
                                            className="flex-1 max-w-[calc(50%-6px)]"
                                            disabled={isAtMax}
                                            style={{
                                                padding: '14px 12px',
                                                borderRadius: '12px',
                                                border: isSelected
                                                    ? '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.5)'
                                                    : (isLight ? '1px solid var(--light-border)' : '1px solid rgba(255,255,255,0.08)'),
                                                background: isSelected
                                                    ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)'
                                                    : (isLight ? 'rgba(60,50,35,0.03)' : 'rgba(255,255,255,0.03)'),
                                                backdropFilter: 'blur(12px)',
                                                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                boxShadow: isSelected
                                                    ? `0 10px 30px -10px ${exercise.glow}, inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.05)`
                                                    : 'none',
                                                opacity: isAtMax ? 0.4 : 1,
                                                cursor: isAtMax ? 'not-allowed' : 'pointer',
                                            }}
                                            whileHover={isAtMax ? {} : { scale: 1.03, y: -2 }}
                                            whileTap={isAtMax ? {} : { scale: 0.98 }}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div
                                                    className="text-4xl"
                                                    style={{
                                                        filter: `drop-shadow(0 0 12px ${exercise.glow})`,
                                                    }}
                                                >
                                                    {exercise.icon}
                                                </div>
                                                <div
                                                    className="text-center leading-tight font-bold tracking-wide"
                                                    style={{
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: '11px',
                                                        letterSpacing: '0.04em',
                                                        color: isSelected
                                                            ? (isLight ? 'var(--text-primary)' : 'rgba(255,255,255,0.95)')
                                                            : (isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.65)'),
                                                    }}
                                                >
                                                    {exercise.name}
                                                </div>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#fcd34d] flex items-center justify-center shadow-lg"
                                                    >
                                                        <span className="text-[10px] text-black font-black">✓</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mb-2">
                    {exercisePages.map((_, i) => (
                        <div
                            key={i}
                            className="transition-all duration-300 rounded-full"
                            style={{
                                width: i === pageIndex ? '16px' : '6px',
                                height: '6px',
                                background: i === pageIndex ? 'var(--accent-color)' : (isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.15)'),
                                boxShadow: i === pageIndex ? '0 0 10px var(--accent-color)' : 'none'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Circuit Sequence - Energy Pathway */}
            {selectedExercises.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    {circuitError && (
                        <div
                            className="mb-3 px-3 py-2 rounded text-[11px] font-medium uppercase tracking-[0.15em]"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: isLight ? '#7a2f2f' : 'rgba(255,255,255,0.9)',
                                background: isLight ? 'rgba(255, 229, 229, 0.6)' : 'rgba(120, 20, 20, 0.4)',
                                border: isLight ? '1px solid rgba(122, 47, 47, 0.2)' : '1px solid rgba(255, 80, 80, 0.3)'
                            }}
                        >
                            {circuitError}
                        </div>
                    )}
                    <div
                        className="text-[10px] mb-3 uppercase tracking-[0.2em] font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.4)' }}
                    >
                        Energy Pathway
                    </div>
                    <div className="relative">
                        <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                            {selectedExercises.map((item, index) => (
                                <div
                                    key={`${item.exercise.id}-${index}`}
                                    className="p-2 rounded"
                                    style={{
                                        background: isLight ? 'rgba(60,50,35,0.03)' : 'rgba(255,255,255,0.04)',
                                        border: isLight ? '1px solid var(--light-border)' : '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                        backdropFilter: 'blur(5px)',
                                        display: 'grid',
                                        gridTemplateColumns: '32px minmax(0, 1fr) 92px',
                                        alignItems: 'center',
                                        columnGap: '10px',
                                        width: '100%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Left Zone: Badge Only */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                                        {/* Energy Node Number */}
                                        <div className="relative" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                                            <div
                                                className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    background: 'var(--accent-color)',
                                                    color: '#000',
                                                    boxShadow: '0 0 12px var(--accent-50), 0 0 24px var(--accent-30)',
                                                    border: '2px solid var(--accent-color)',
                                                    position: 'relative',
                                                    zIndex: 2
                                                }}
                                            >
                                                {index + 1}
                                            </div>
                                            {/* Outer energy ring */}
                                            <div
                                                className="absolute inset-0 rounded-full"
                                                style={{
                                                    border: '1px solid var(--accent-40)',
                                                    transform: 'scale(1.4)',
                                                    opacity: 0.4,
                                                    animation: 'energy-pulse 2s ease-in-out infinite',
                                                    animationDelay: `${index * 0.2}s`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Middle Zone: Exercise Name */}
                                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <div
                                            className="font-bold leading-tight"
                                            style={{
                                                color: isLight ? 'var(--text-primary)' : 'white',
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '13px',
                                                letterSpacing: '0.02em'
                                            }}
                                        >
                                            {item.exercise.name}
                                        </div>
                                    </div>

                                    {/* Right Zone: Duration Input + Remove Button */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', width: '92px', minWidth: '92px' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={item.duration}
                                            onChange={(e) => {
                                                const clamped = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                                                const updated = selectedExercises.map((ex, idx) =>
                                                    idx === index ? { ...ex, duration: clamped } : ex
                                                );
                                                setSelectedExercises(updated);
                                                if (onChange) onChange({ exercises: updated, intervalBreakSec });
                                            }}
                                            className="text-center font-bold rounded px-1 cursor-pointer"
                                            style={{
                                                fontFamily: 'var(--font-body)',
                                                fontSize: '13px',
                                                background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                                color: 'var(--accent-color)',
                                                border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
                                                width: '52px',
                                                height: '28px',
                                                lineHeight: '28px',
                                                boxSizing: 'border-box',
                                                textAlign: 'center'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleRemoveExercise(index)}
                                            className={`text-sm transition-colors ${isLight ? 'text-[#3D3425]/30 hover:text-[#3D3425]/70' : 'text-white/30 hover:text-white/70'}`}
                                            style={{ flexShrink: 0 }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedExercises.length === 0 && (
                <div
                    className="p-8 text-center rounded"
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <p
                        className="text-sm font-medium"
                        style={{ fontFamily: 'var(--font-body)', color: isLight ? 'var(--text-muted)' : 'rgba(255,255,255,0.4)' }}
                    >
                        Select practices above to build your circuit
                    </p>
                </div>
            )}
        </div>
    );
}
