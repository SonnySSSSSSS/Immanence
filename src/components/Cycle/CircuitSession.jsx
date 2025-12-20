// src/components/Cycle/CircuitSession.jsx
// Standalone circuit execution component - renders sequential practice sessions
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurriculumStore } from '../../state/curriculumStore';
import { logCircuitCompletion } from '../../services/circuitManager';
import { BreathingRing } from '../BreathingRing';
import { VipassanaVisual } from '../vipassana/VipassanaVisual';
import { BREATH_PRESETS } from '../BreathConfig';
import { SENSORY_TYPES } from '../SensoryConfig';

export function CircuitSession({ circuitId, circuit: customCircuit, onComplete, onCancel, avatarPath, showCore }) {
    const getCircuit = useCurriculumStore((state) => state.getCircuit);

    const [circuit, setCircuit] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [isExerciseRunning, setIsExerciseRunning] = useState(false);

    // Load circuit on mount - use customCircuit if provided, otherwise load by ID
    useEffect(() => {
        if (customCircuit) {
            setCircuit(customCircuit);
            setCurrentExerciseIndex(0);
            setCompletedExercises([]);
        } else if (circuitId) {
            const loadedCircuit = getCircuit(circuitId);
            if (loadedCircuit) {
                setCircuit(loadedCircuit);
                setCurrentExerciseIndex(0);
                setCompletedExercises([]);
            }
        }
    }, [circuitId, customCircuit, getCircuit]);

    if (!circuit) {
        return (
            <div className="p-6 text-center">
                <p className="text-white/50 font-[Outfit]">Circuit not found</p>
            </div>
        );
    }

    const currentExercise = circuit.exercises[currentExerciseIndex];
    const progressPercent = ((currentExerciseIndex + 1) / circuit.exercises.length) * 100;

    const handleExerciseComplete = () => {
        // Mark current exercise as complete
        const newCompleted = [...completedExercises, currentExercise];
        setCompletedExercises(newCompleted);
        setIsExerciseRunning(false);

        // Check if more exercises remain
        if (currentExerciseIndex < circuit.exercises.length - 1) {
            // Move to next exercise
            setTimeout(() => {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
            }, 1000); // Brief pause between exercises
        } else {
            // Circuit complete!
            handleCircuitComplete(newCompleted);
        }
    };

    const handleCircuitComplete = (completed) => {
        // Log completion to cycle system
        logCircuitCompletion(circuit.id, completed);

        // Notify parent
        if (onComplete) {
            onComplete({
                circuitId: circuit.id,
                exercisesCompleted: completed,
                totalDuration: circuit.totalDuration,
            });
        }
    };

    const handleStartExercise = () => {
        setIsExerciseRunning(true);
    };

    const handleCancelCircuit = () => {
        if (onCancel) {
            onCancel();
        }
    };

    // Render appropriate practice component based on exercise type
    const renderPracticeComponent = () => {
        if (!isExerciseRunning) {
            // Show exercise intro
            return (
                <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
                    <div className="text-6xl mb-6">
                        {currentExercise.type === 'breath' && '🌬️'}
                        {currentExercise.type === 'focus' && '🔥'}
                        {currentExercise.type === 'body' && '✨'}
                    </div>

                    <h3 className="text-2xl font-[Cinzel] text-white/90 mb-3 text-center">
                        {currentExercise.name}
                    </h3>

                    <p className="text-white/60 font-[Outfit] mb-6 text-center max-w-md">
                        {currentExercise.instructions}
                    </p>

                    <div className="text-white/50 font-[Outfit] mb-8">
                        Duration: {currentExercise.duration} minutes
                    </div>

                    <button
                        onClick={handleStartExercise}
                        className="px-8 py-3 bg-[#fcd34d] text-black rounded font-[Outfit] hover:bg-[#fcd34d]/90 transition-colors text-lg"
                    >
                        Begin Exercise
                    </button>
                </div>
            );
        }

        // Render actual practice UI based on exercise
        switch (currentExercise.type) {
            case 'breath':
                // Use BreathingRing for breath exercises
                // BREATH_PRESETS is an object keyed by preset name (e.g., "Box", "4-7-8")
                const breathPreset = currentExercise.preset && BREATH_PRESETS[currentExercise.preset]
                    ? BREATH_PRESETS[currentExercise.preset]
                    : BREATH_PRESETS.Box; // Default box breathing

                return (
                    <div className="relative">
                        <BreathingRing
                            duration={currentExercise.duration}
                            pattern={breathPreset}
                            onComplete={handleExerciseComplete}
                            showTimer={true}
                            avatarPath={avatarPath}
                            showCore={showCore}
                        />
                    </div>
                );

            case 'focus':
            case 'body':
                // Use VipassanaVisual for focus/body exercises
                const sensoryType = currentExercise.sensoryType || 'cognitive';

                return (
                    <div className="relative">
                        <VipassanaVisual
                            duration={currentExercise.duration}
                            sensoryType={sensoryType}
                            onComplete={handleExerciseComplete}
                            showTimer={true}
                        />
                    </div>
                );

            default:
                return (
                    <div className="p-6 text-center">
                        <p className="text-white/50 font-[Outfit]">
                            Exercise type not supported yet
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Circuit Header & Progress */}
            <div className="mb-6 p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-[Cinzel] text-white/90 mb-1">
                            {circuit.name}
                        </h2>
                        <div className="text-sm text-white/60 font-[Outfit]">
                            Exercise {currentExerciseIndex + 1} of {circuit.exercises.length}
                        </div>
                    </div>

                    <button
                        onClick={handleCancelCircuit}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/60 rounded font-[Outfit] text-sm transition-colors"
                    >
                        Exit Circuit
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#fcd34d] to-[#f59e0b]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Exercise List */}
                <div className="flex gap-2">
                    {circuit.exercises.map((ex, idx) => {
                        const isComplete = idx < currentExerciseIndex;
                        const isCurrent = idx === currentExerciseIndex;

                        return (
                            <div
                                key={idx}
                                className={`flex-1 p-2 rounded text-center text-xs font-[Outfit] transition-all ${isCurrent
                                    ? 'bg-[#fcd34d]/20 border border-[#fcd34d]/40 text-white/90'
                                    : isComplete
                                        ? 'bg-white/5 border border-white/10 text-white/40'
                                        : 'bg-white/5 border border-white/10 text-white/30'
                                    }`}
                            >
                                {isComplete && '✓ '}
                                {ex.name}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Practice Component */}
            <div className="bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden">
                {renderPracticeComponent()}
            </div>
        </div>
    );
}
