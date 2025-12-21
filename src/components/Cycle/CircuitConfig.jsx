// src/components/Cycle/CircuitConfig.jsx
// Circuit configuration UI - Refined as "digital talisman"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_EXERCISES = [
    {
        id: 'breath',
        name: 'Breath Training',
        type: 'breath',
        icon: '🌬️',
        practiceType: 'Breath & Stillness',
        preset: 'box',
        glow: 'rgba(147, 197, 253, 0.4)', // Blue glow
    },
    {
        id: 'cognitive',
        name: 'Cognitive Vipassana',
        type: 'focus',
        icon: '🔥',
        practiceType: 'Cognitive Vipassana',
        glow: 'rgba(251, 146, 60, 0.4)', // Orange glow
    },
    {
        id: 'somatic',
        name: 'Somatic Vipassana',
        type: 'body',
        icon: '✨',
        practiceType: 'Somatic Vipassana',
        sensoryType: 'body',
        glow: 'rgba(196, 181, 253, 0.4)', // Purple glow
    },
    {
        id: 'visualization',
        name: 'Visualization',
        type: 'focus',
        icon: '🔮',
        practiceType: 'Visualization',
        glow: 'rgba(167, 139, 250, 0.4)', // Deep purple
    },
    {
        id: 'cymatics',
        name: 'Cymatics',
        type: 'focus',
        icon: '〰️',
        practiceType: 'Cymatics',
        glow: 'rgba(129, 140, 248, 0.4)', // Indigo
    },
    {
        id: 'sound',
        name: 'Sound Bath',
        type: 'body',
        icon: '🎵',
        practiceType: 'Sound',
        glow: 'rgba(192, 132, 252, 0.4)', // Violet
    },
];

const DURATION_OPTIONS = [3, 5, 7, 10, 12, 15, 20];

export function CircuitConfig({ value, onChange }) {
    // Per-exercise duration (user can change this)
    const [exerciseDuration, setExerciseDuration] = useState(value?.exerciseDuration || 5);
    const [pageIndex, setPageIndex] = useState(0);

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
            onChange({ exercises: selectedExercises, exerciseDuration });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update all exercises when duration changes
    const handleExerciseDurationChange = (newDuration) => {
        setExerciseDuration(newDuration);
        const updated = selectedExercises.map(e => ({
            ...e,
            duration: newDuration
        }));
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated, exerciseDuration: newDuration });
    };

    const MAX_EXERCISES = 6;

    const handleToggleExercise = (exercise) => {
        // Check if at max capacity
        if (selectedExercises.length >= MAX_EXERCISES) {
            return; // Can't add more
        }

        // Always add a new instance of the exercise (allow duplicates)
        const updated = [...selectedExercises, { exercise, duration: exerciseDuration }];
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated, exerciseDuration });
    };

    const handleDurationChange = (exerciseId, duration) => {
        const updated = selectedExercises.map((e) =>
            e.exercise.id === exerciseId ? { ...e, duration } : e
        );
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated });
    };

    // Remove exercise by index (needed for duplicates)
    const handleRemoveExercise = (indexToRemove) => {
        const updated = selectedExercises.filter((_, idx) => idx !== indexToRemove);
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated, exerciseDuration });
    };

    const handleReorder = (fromIndex, toIndex) => {
        const updated = [...selectedExercises];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated });
    };

    const totalDuration = selectedExercises.reduce((sum, e) => sum + e.duration, 0);

    return (
        <div className="space-y-6">
            {/* Total Duration - Hero Number with Pulse */}
            <div
                className="p-4 rounded relative"
                style={{
                    background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                    boxShadow: 'inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)',
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
                <div className="flex justify-between items-center">
                    <div>
                        <div
                            className="text-xs mb-1 tracking-wider uppercase font-medium"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)',
                            }}
                        >
                            Total Circuit
                        </div>
                        <div
                            className="text-3xl text-white/95 font-bold tracking-wide"
                            style={{
                                fontFamily: 'var(--font-display)',
                                animation: selectedExercises.length > 0 ? 'energy-pulse 2s ease-in-out infinite' : 'none'
                            }}
                        >
                            {totalDuration} <span className="text-lg text-white/50" style={{ fontFamily: 'var(--font-body)' }}>min</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div
                            className="text-xs mb-1 tracking-wider uppercase font-medium"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)',
                            }}
                        >
                            Per Exercise
                        </div>
                        <select
                            value={exerciseDuration}
                            onChange={(e) => handleExerciseDurationChange(parseInt(e.target.value))}
                            className="text-lg font-bold rounded px-2 py-1 cursor-pointer"
                            style={{
                                fontFamily: 'var(--font-display)',
                                background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                color: 'var(--accent-color)',
                                border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
                                letterSpacing: 'var(--tracking-wide)'
                            }}
                        >
                            {DURATION_OPTIONS.map((dur) => (
                                <option key={dur} value={dur} style={{ background: '#1a1a2e', color: '#fff' }}>
                                    {dur} min
                                </option>
                            ))}
                        </select>
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
                    <span style={{ color: selectedExercises.length >= MAX_EXERCISES ? 'var(--accent-color)' : 'inherit' }}>
                        {selectedExercises.length}/{MAX_EXERCISES}
                    </span>
                </div>

                <div className="relative overflow-hidden mb-4" style={{ height: '140px' }}>
                    <motion.div
                        className="flex gap-3 h-full px-1"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;
                            if (swipe < -50 && pageIndex < totalPages - 1) {
                                setPageIndex(prev => prev + 1);
                            } else if (swipe > 50 && pageIndex > 0) {
                                setPageIndex(prev => prev - 1);
                            }
                        }}
                        style={{ cursor: 'grab' }}
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
                                                padding: '16px 12px',
                                                borderRadius: '12px',
                                                border: isSelected
                                                    ? '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.5)'
                                                    : '1px solid rgba(255,255,255,0.08)',
                                                background: isSelected
                                                    ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)'
                                                    : 'rgba(255,255,255,0.03)',
                                                backdropFilter: 'blur(12px)',
                                                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                boxShadow: isSelected
                                                    ? `0 10px 30px -10px ${exercise.glow}, inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.05)`
                                                    : 'none',
                                                opacity: isAtMax ? 0.4 : 1,
                                                cursor: isAtMax ? 'not-allowed' : 'pointer',
                                            }}
                                            whileHover={isAtMax ? {} : { scale: 1.02, y: -2 }}
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
                                                        color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
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
                                background: i === pageIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)',
                                boxShadow: i === pageIndex ? '0 0 10px var(--accent-color)' : 'none'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Circuit Sequence - Energy Pathway */}
            {selectedExercises.length > 0 && (
                <div>
                    <div
                        className="text-[10px] text-white/40 mb-3 uppercase tracking-[0.2em] font-bold"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Energy Pathway · {selectedExercises.length} Nodes
                    </div>
                    <div className="relative">
                        <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                            {selectedExercises.map((item, index) => (
                                <div
                                    key={`${item.exercise.id}-${index}`}
                                    className="p-3 rounded flex items-center gap-3"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                        backdropFilter: 'blur(5px)',
                                    }}
                                >
                                    {/* Energy Node Number */}
                                    <div className="relative" style={{ width: '32px', height: '32px' }}>
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

                                    {/* Exercise Icon */}
                                    <div
                                        className="text-2xl"
                                        style={{
                                            filter: `drop-shadow(0 0 6px ${item.exercise.glow})`,
                                        }}
                                    >
                                        {item.exercise.icon}
                                    </div>

                                    {/* Exercise Name */}
                                    <div className="flex-1">
                                        <div
                                            className="text-sm text-white font-bold leading-tight"
                                            style={{
                                                fontFamily: 'var(--font-display)',
                                                letterSpacing: '0.04em'
                                            }}
                                        >
                                            {item.exercise.name}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div
                                        className="text-sm font-bold"
                                        style={{ fontFamily: 'var(--font-body)', color: 'var(--accent-color)', letterSpacing: '0.05em' }}
                                    >
                                        {item.duration}m
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={() => handleRemoveExercise(index)}
                                        className="text-white/30 hover:text-white/70 text-sm transition-colors"
                                    >
                                        ✕
                                    </button>
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
                        className="text-sm text-white/40 font-medium"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        Select practices above to build your circuit
                    </p>
                </div>
            )}
        </div>
    );
}
