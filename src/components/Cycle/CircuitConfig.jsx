// src/components/Cycle/CircuitConfig.jsx
// Circuit configuration UI for customizing exercises and durations
import { useState } from 'react';
import { motion } from 'framer-motion';

const AVAILABLE_EXERCISES = [
    {
        id: 'breath',
        name: 'Breath Training',
        type: 'breath',
        icon: '🌬️',
        practiceType: 'Breath & Stillness',
        preset: 'box',
    },
    {
        id: 'cognitive',
        name: 'Thought Labeling',
        type: 'focus',
        icon: '🔥',
        practiceType: 'Somatic Vipassana',
        sensoryType: 'cognitive',
    },
    {
        id: 'body',
        name: 'Body Scan',
        type: 'body',
        icon: '✨',
        practiceType: 'Somatic Vipassana',
        sensoryType: 'body',
    },
    {
        id: 'sound',
        name: 'Sound Bath',
        type: 'body',
        icon: '🎵',
        practiceType: 'Somatic Vipassana',
        sensoryType: 'sound',
    },
];

const DURATION_OPTIONS = [3, 5, 7, 10, 12, 15, 20];

export function CircuitConfig({ value, onChange }) {
    // value = { exercises: [{ exercise, duration }], name }
    const [selectedExercises, setSelectedExercises] = useState(
        value?.exercises || [
            { exercise: AVAILABLE_EXERCISES[0], duration: 5 },
            { exercise: AVAILABLE_EXERCISES[1], duration: 5 },
            { exercise: AVAILABLE_EXERCISES[2], duration: 5 },
        ]
    );

    const handleToggleExercise = (exercise) => {
        const exists = selectedExercises.find((e) => e.exercise.id === exercise.id);

        if (exists) {
            // Remove if already selected
            const updated = selectedExercises.filter((e) => e.exercise.id !== exercise.id);
            setSelectedExercises(updated);
            if (onChange) onChange({ exercises: updated });
        } else {
            // Add with default 5 min duration
            const updated = [...selectedExercises, { exercise, duration: 5 }];
            setSelectedExercises(updated);
            if (onChange) onChange({ exercises: updated });
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
        <div className="space-y-4">
            {/* Total Duration Display */}
            <div className="p-4 bg-[#fcd34d]/10 border border-[#fcd34d]/20 rounded">
                <div className="text-xs text-[#fcd34d]/60 font-[Outfit] mb-1">Total Circuit Duration</div>
                <div className="text-2xl font-[Cinzel] text-white/90">{totalDuration} minutes</div>
            </div>

            {/* Exercise Selection */}
            <div>
                <div className="text-xs text-white/50 font-[Outfit] mb-2 uppercase tracking-wider">
                    Select Exercises
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EXERCISES.map((exercise) => {
                        const isSelected = selectedExercises.some((e) => e.exercise.id === exercise.id);
                        return (
                            <motion.button
                                key={exercise.id}
                                onClick={() => handleToggleExercise(exercise)}
                                className={`p-3 rounded border transition-all ${isSelected
                                        ? 'bg-[#fcd34d]/20 border-[#fcd34d]/40'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl">{exercise.icon}</div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-[Outfit] text-white/80">{exercise.name}</div>
                                    </div>
                                    {isSelected && <div className="text-[#fcd34d]">✓</div>}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Exercises with Duration */}
            {selectedExercises.length > 0 && (
                <div>
                    <div className="text-xs text-white/50 font-[Outfit] mb-2 uppercase tracking-wider">
                        Circuit Sequence ({selectedExercises.length} exercises)
                    </div>
                    <div className="space-y-2">
                        {selectedExercises.map((item, index) => (
                            <div
                                key={item.exercise.id}
                                className="p-3 bg-white/5 border border-white/10 rounded flex items-center gap-3"
                            >
                                {/* Reorder buttons */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => index > 0 && handleReorder(index, index - 1)}
                                        disabled={index === 0}
                                        className={`text-xs ${index === 0 ? 'text-white/20' : 'text-white/50 hover:text-white/80'
                                            }`}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        onClick={() => index < selectedExercises.length - 1 && handleReorder(index, index + 1)}
                                        disabled={index === selectedExercises.length - 1}
                                        className={`text-xs ${index === selectedExercises.length - 1 ? 'text-white/20' : 'text-white/50 hover:text-white/80'
                                            }`}
                                    >
                                        ▼
                                    </button>
                                </div>

                                {/* Exercise info */}
                                <div className="text-xl">{item.exercise.icon}</div>
                                <div className="flex-1">
                                    <div className="text-sm font-[Outfit] text-white/80">{item.exercise.name}</div>
                                </div>

                                {/* Duration selector */}
                                <select
                                    value={item.duration}
                                    onChange={(e) => handleDurationChange(item.exercise.id, parseInt(e.target.value))}
                                    className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm font-[Outfit] text-white/90 focus:outline-none focus:border-[#fcd34d]/50"
                                >
                                    {DURATION_OPTIONS.map((dur) => (
                                        <option key={dur} value={dur}>
                                            {dur} min
                                        </option>
                                    ))}
                                </select>

                                {/* Remove button */}
                                <button
                                    onClick={() => handleToggleExercise(item.exercise)}
                                    className="text-white/40 hover:text-white/80 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedExercises.length === 0 && (
                <div className="p-6 text-center text-white/50 font-[Outfit] text-sm">
                    Select at least one exercise to create a circuit
                </div>
            )}
        </div>
    );
}
