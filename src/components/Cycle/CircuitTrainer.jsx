// src/components/Cycle/CircuitTrainer.jsx
// Circuit selection UI - PracticeSection handles the actual execution
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAvailableCircuits } from '../../services/circuitManager';

export function CircuitTrainer({ onSelectCircuit }) {
    const [circuits, setCircuits] = useState([]);

    useEffect(() => {
        const available = getAvailableCircuits();
        setCircuits(available);
    }, []);

    const handleStartCircuit = (circuit) => {
        if (onSelectCircuit) {
            onSelectCircuit(circuit);
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
                        onClick={() => handleStartCircuit(circuit)}
                        className="w-full px-4 py-2 bg-[#fcd34d] text-black rounded font-[Outfit] hover:bg-[#fcd34d]/90 transition-colors"
                    >
                        Start Circuit
                    </button>
                </motion.div>
            ))}

            {circuits.length === 0 && (
                <div className="p-6 bg-white/5 rounded border border-white/10 text-center">
                    <p className="text-sm text-white/50 font-[Outfit]">
                        No circuits available yet
                    </p>
                </div>
            )}
        </div>
    );
}
