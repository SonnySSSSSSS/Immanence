// src/components/Cycle/CircuitConfig.jsx
// Circuit configuration UI - Refined as "digital talisman"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

    const handleToggleExercise = (exercise) => {
        const exists = selectedExercises.find((e) => e.exercise.id === exercise.id);

        if (exists) {
            const updated = selectedExercises.filter((e) => e.exercise.id !== exercise.id);
            setSelectedExercises(updated);
            if (onChange) onChange({ exercises: updated, exerciseDuration });
        } else {
            // Add with the current exerciseDuration
            const updated = [...selectedExercises, { exercise, duration: exerciseDuration }];
            setSelectedExercises(updated);
            if (onChange) onChange({ exercises: updated, exerciseDuration });
        }
    };

    const handleDurationChange = (exerciseId, duration) => {
        const updated = selectedExercises.map((e) =>
            e.exercise.id === exerciseId ? { ...e, duration } : e
        );
        setSelectedExercises(updated);
        if (onChange) onChange({ exercises: updated });
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
            {/* Total Duration - Glassmorphic */}
            <div
                className="p-4 rounded"
                style={{
                    background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                    boxShadow: 'inset 0 0 20px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)',
                }}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <div
                            className="text-xs font-[Outfit] mb-1 tracking-wider uppercase"
                            style={{
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)',
                            }}
                        >
                            Total Circuit
                        </div>
                        <div className="text-3xl font-[Cinzel] text-white/95 font-light tracking-wide">
                            {totalDuration} <span className="text-lg text-white/50">min</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div
                            className="text-xs font-[Outfit] mb-1 tracking-wider uppercase"
                            style={{
                                color: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.6)',
                            }}
                        >
                            Per Exercise
                        </div>
                        <select
                            value={exerciseDuration}
                            onChange={(e) => handleExerciseDurationChange(parseInt(e.target.value))}
                            className="text-lg font-[Cinzel] font-light rounded px-2 py-1 cursor-pointer"
                            style={{
                                background: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                color: 'var(--accent-color)',
                                border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3)',
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

            {/* Horizontal Exercise Ribbon */}
            <div>
                <div className="text-xs text-white/40 font-[Outfit] mb-3 uppercase tracking-[0.15em]">
                    Select Practices
                </div>
                <div
                    className="flex gap-3 pb-2"
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.3) rgba(255,255,255,0.05)',
                    }}
                >
                    {AVAILABLE_EXERCISES.map((exercise) => {
                        const isSelected = selectedExercises.some((e) => e.exercise.id === exercise.id);
                        return (
                            <motion.button
                                key={exercise.id}
                                onClick={() => handleToggleExercise(exercise)}
                                className="flex-shrink-0"
                                style={{
                                    width: '120px',
                                    padding: '14px 10px',
                                    borderRadius: '8px',
                                    border: isSelected
                                        ? '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.4)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    background: isSelected
                                        ? 'hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.12)'
                                        : 'rgba(255,255,255,0.03)',
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isSelected
                                        ? `0 0 20px ${exercise.glow}, inset 0 0 15px hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.1)`
                                        : 'none',
                                    scrollSnapAlign: 'start',
                                }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="text-3xl"
                                        style={{
                                            filter: `drop-shadow(0 0 8px ${exercise.glow})`,
                                        }}
                                    >
                                        {exercise.icon}
                                    </div>
                                    <div
                                        className="text-xs font-[Outfit] text-center leading-tight"
                                        style={{
                                            color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                                        }}
                                    >
                                        {exercise.name}
                                    </div>
                                    {isSelected && (
                                        <div className="text-sm" style={{ color: 'var(--accent-color)' }}>✓</div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Circuit Sequence - Clean List */}
            {selectedExercises.length > 0 && (
                <div>
                    <div className="text-xs text-white/40 font-[Outfit] mb-3 uppercase tracking-[0.15em]">
                        Circuit Sequence · {selectedExercises.length} Paths
                    </div>
                    <div className="space-y-2">
                        {selectedExercises.map((item, index) => (
                            <div
                                key={item.exercise.id}
                                className="p-3 rounded flex items-center gap-3"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.15)',
                                    backdropFilter: 'blur(5px)',
                                }}
                            >
                                {/* Sequence Number */}
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{
                                        background: 'var(--accent-color)',
                                        color: '#000',
                                    }}
                                >
                                    {index + 1}
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
                                    <div className="text-sm font-[Outfit] text-white/80">
                                        {item.exercise.name}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div
                                    className="text-sm font-[Outfit]"
                                    style={{ color: 'var(--accent-color)' }}
                                >
                                    {item.duration}m
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => handleToggleExercise(item.exercise)}
                                    className="text-white/30 hover:text-white/70 text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
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
                    <p className="text-sm text-white/40 font-[Outfit]">
                        Select practices above to build your circuit
                    </p>
                </div>
            )}
        </div>
    );
}
