// src/components/Cycle/CircuitTrainer.jsx
// Circuit selection UI with custom circuit builder
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAvailableCircuits } from '../../services/circuitManager';
import { CircuitConfig } from './CircuitConfig';

export function CircuitTrainer({ onSelectCircuit }) {
    const [circuits, setCircuits] = useState([]);
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);
    const [customCircuitConfig, setCustomCircuitConfig] = useState(null);

    useEffect(() => {
        const available = getAvailableCircuits();
        setCircuits(available);
    }, []);

    const handleStartPresetCircuit = (circuit) => {
        if (onSelectCircuit) {
            onSelectCircuit(circuit);
        }
    };

    const handleStartCustomCircuit = () => {
        if (!customCircuitConfig || customCircuitConfig.exercises.length === 0) return;

        // Build circuit object from custom config
        const customCircuit = {
            id: 'custom_circuit',
            name: 'Custom Circuit',
            description: 'Your personalized training sequence',
            totalDuration: customCircuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0),
            exercises: customCircuitConfig.exercises.map((item) => ({
                type: item.exercise.type,
                name: item.exercise.name,
                duration: item.duration,
                instructions: `${item.duration}-minute ${item.exercise.name.toLowerCase()}`,
                practiceType: item.exercise.practiceType,
                preset: item.exercise.preset,
                sensoryType: item.exercise.sensoryType,
            })),
        };

        if (onSelectCircuit) {
            onSelectCircuit(customCircuit);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="text-xl font-[Cinzel] text-white/90 mb-1">Circuit Trainer</h3>
                <p className="text-sm text-white/60 font-[Outfit]">
                    Sequential practice sessions across multiple paths
                </p>
            </div>

            {/* Toggle between preset and custom */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setShowCustomBuilder(false)}
                    className={`flex-1 px-4 py-2 rounded font-[Outfit] text-sm transition-all ${!showCustomBuilder
                            ? 'bg-[#fcd34d] text-black'
                            : 'bg-white/10 text-white/60 hover:bg-white/15'
                        }`}
                >
                    Preset Circuits
                </button>
                <button
                    onClick={() => setShowCustomBuilder(true)}
                    className={`flex-1 px-4 py-2 rounded font-[Outfit] text-sm transition-all ${showCustomBuilder
                            ? 'bg-[#fcd34d] text-black'
                            : 'bg-white/10 text-white/60 hover:bg-white/15'
                        }`}
                >
                    Custom Circuit
                </button>
            </div>

            {/* Preset Circuits */}
            {!showCustomBuilder && (
                <div className="space-y-4">
                    {circuits.map((circuit) => (
                        <motion.div
                            key={circuit.id}
                            className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg"
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-[Cinzel] text-white/90 mb-1">
                                        {circuit.name}
                                    </h4>
                                    <p className="text-sm text-white/60 font-[Outfit]">
                                        {circuit.description}
                                    </p>
                                </div>
                                <div className="text-sm text-white/50 font-[Outfit]">
                                    {circuit.totalDuration} min
                                </div>
                            </div>

                            {/* Exercises Preview */}
                            <div className="space-y-2 mb-4">
                                {circuit.exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10"
                                    >
                                        <div className="text-2xl">
                                            {ex.type === 'breath' && '🌬️'}
                                            {ex.type === 'focus' && '🔥'}
                                            {ex.type === 'body' && '✨'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-[Cinzel] text-white/80 mb-1">
                                                {ex.name}
                                            </div>
                                            <div className="text-xs text-white/50 font-[Outfit]">
                                                {ex.instructions}
                                            </div>
                                        </div>
                                        <div className="text-xs text-white/50 font-[Outfit]">
                                            {ex.duration}m
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleStartPresetCircuit(circuit)}
                                className="w-full px-4 py-2 bg-[#fcd34d] text-black rounded font-[Outfit] hover:bg-[#fcd34d]/90 transition-colors"
                            >
                                Start Circuit
                            </button>
                        </motion.div>
                    ))}

                    {circuits.length === 0 && (
                        <div className="p-6 bg-white/5 rounded border border-white/10 text-center">
                            <p className="text-sm text-white/50 font-[Outfit]">
                                No preset circuits available
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Circuit Builder */}
            {showCustomBuilder && (
                <div className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg">
                    <div className="mb-4">
                        <h4 className="text-lg font-[Cinzel] text-white/90 mb-1">
                            Build Your Circuit
                        </h4>
                        <p className="text-sm text-white/60 font-[Outfit]">
                            Choose exercises and set durations
                        </p>
                    </div>

                    <CircuitConfig
                        value={customCircuitConfig}
                        onChange={setCustomCircuitConfig}
                    />

                    <button
                        onClick={handleStartCustomCircuit}
                        disabled={!customCircuitConfig || customCircuitConfig.exercises.length === 0}
                        className={`w-full mt-4 px-4 py-2 rounded font-[Outfit] transition-all ${customCircuitConfig && customCircuitConfig.exercises.length > 0
                                ? 'bg-[#fcd34d] text-black hover:bg-[#fcd34d]/90'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        Start Custom Circuit
                    </button>
                </div>
            )}
        </div>
    );
}
