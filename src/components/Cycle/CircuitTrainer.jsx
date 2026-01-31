// src/components/Cycle/CircuitTrainer.jsx
// Circuit selection UI with custom circuit builder
// Phase 2: Wired to Zustand store via useCircuitManager
import { useState } from 'react';
import { useCircuitManager } from '../../state/circuitManager';
import { CircuitConfig } from './CircuitConfig.jsx';

export function CircuitTrainer({ onSelectCircuit }) {
    const allCircuits = useCircuitManager(s => s.getAllCircuits());
    const circuits = allCircuits || [];
    
    const [showCustomBuilder, setShowCustomBuilder] = useState(false);
    const [customCircuitConfig, setCustomCircuitConfig] = useState(null);

    const handleStartPresetCircuit = (circuit) => {
        if (onSelectCircuit) {
            onSelectCircuit(circuit);
        }
    };

    const handleStartCustomCircuit = () => {
        if (!customCircuitConfig || customCircuitConfig.exercises.length === 0) return;

        // Calculate total duration including breaks
        const exerciseDuration = customCircuitConfig.exercises.reduce((sum, e) => sum + e.duration, 0);
        const breakDuration = customCircuitConfig.exercises.length > 1 
            ? (customCircuitConfig.intervalBreakSec / 60) * (customCircuitConfig.exercises.length - 1)
            : 0;
        const totalWithBreaks = exerciseDuration + breakDuration;

        const customCircuit = {
            id: 'custom_circuit',
            name: 'Custom Circuit',
            description: 'Your personalized training sequence',
            totalDuration: totalWithBreaks,
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
                <h3 className="text-xl font-bold tracking-wide text-white/90 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Circuit Trainer</h3>
                <p className="text-sm text-white/60 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Sequential practice sessions across multiple paths</p>
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setShowCustomBuilder(false)} className={`flex-1 px-4 py-2 rounded font-bold tracking-wide text-sm transition-all ${!showCustomBuilder ? 'bg-[#fcd34d] text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`} style={{ fontFamily: 'var(--font-body)' }}>Preset Circuits</button>
                <button onClick={() => setShowCustomBuilder(true)} className={`flex-1 px-4 py-2 rounded font-bold tracking-wide text-sm transition-all ${showCustomBuilder ? 'bg-[#fcd34d] text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`} style={{ fontFamily: 'var(--font-body)' }}>Custom Circuit</button>
            </div>

            {!showCustomBuilder && (
                <div className="space-y-4">
                    {circuits.map((circuit) => (
                        <motion.div key={circuit.id} className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg" whileHover={{ scale: 1.01 }}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-bold tracking-wide text-white/90 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{circuit.name}</h4>
                                    <p className="text-sm text-white/60 font-medium" style={{ fontFamily: 'var(--font-body)' }}>{circuit.description}</p>
                                </div>
                                <div className="text-sm text-white/50 font-medium" style={{ fontFamily: 'var(--font-body)' }}>{circuit.totalDuration} min</div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {circuit.exercises.map((ex, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                                        <div className="text-2xl">{ex.targetDomain === 'breath' && '🌬️'}{ex.targetDomain === 'focus' && '🔥'}{ex.targetDomain === 'body' && '✨'}</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold tracking-wide text-white/80 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{ex.name}</div>
                                            <div className="text-xs text-white/50 font-medium" style={{ fontFamily: 'var(--font-body)' }}>{ex.practiceType || ex.name}</div>
                                        </div>
                                        <div className="text-xs text-white/50 font-bold" style={{ fontFamily: 'var(--font-body)' }}>{ex.duration}m</div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => handleStartPresetCircuit(circuit)} className="w-full px-4 py-2 bg-[#fcd34d] text-black rounded font-bold tracking-wide hover:bg-[#fcd34d]/90 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>Start Circuit</button>
                        </motion.div>
                    ))}

                    {circuits.length === 0 && (
                        <div className="p-6 bg-white/5 rounded border border-white/10 text-center">
                            <p className="text-sm text-white/50 font-medium" style={{ fontFamily: 'var(--font-body)' }}>No preset circuits available</p>
                        </div>
                    )}
                </div>
            )}

            {showCustomBuilder && (
                <div className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg">
                    <div className="mb-4">
                        <h4 className="text-lg font-bold tracking-wide text-white/90 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Build Your Circuit</h4>
                        <p className="text-sm text-white/60 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Choose exercises and set durations</p>
                    </div>
                    <CircuitConfig value={customCircuitConfig} onChange={setCustomCircuitConfig} />
                    <button onClick={handleStartCustomCircuit} disabled={!customCircuitConfig || customCircuitConfig.exercises.length === 0} className={`w-full mt-4 px-4 py-2 rounded font-bold tracking-wide transition-all ${customCircuitConfig && customCircuitConfig.exercises.length > 0 ? 'bg-[#fcd34d] text-black hover:bg-[#fcd34d]/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-body)' }}>Start Custom Circuit</button>
                </div>
            )}
        </div>
    );
}

export default CircuitTrainer;