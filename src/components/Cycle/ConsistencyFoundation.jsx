// src/components/Cycle/ConsistencyFoundation.jsx
// Navigation component showing current cycle status
import { useCycleStore } from '../../state/cycleStore';
import { useState } from 'react';
import { CycleChoiceModal } from './CycleChoiceModal';
import { motion } from 'framer-motion';

export function ConsistencyFoundation() {
    const currentCycle = useCycleStore((state) => state.currentCycle);
    const getCycleInfo = useCycleStore((state) => state.getCycleInfo);
    const canSwitchMode = useCycleStore((state) => state.canSwitchMode);

    const [showCycleChoice, setShowCycleChoice] = useState(false);

    // No cycle active - show call to action
    if (!currentCycle) {
        return (
            <>
                <motion.div
                    className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-[Cinzel] text-white/90">
                            Consistency Foundation
                        </h3>
                        <div className="text-2xl">◯</div>
                    </div>

                    <p className="text-sm text-white/60 font-[Outfit] mb-4 leading-relaxed">
                        Ready to establish your practice foundation? Choose your commitment structure.
                    </p>

                    <button
                        onClick={() => setShowCycleChoice(true)}
                        className="w-full px-4 py-2 bg-[#fcd34d] text-black rounded font-[Outfit] hover:bg-[#fcd34d]/90 transition-colors"
                    >
                        Begin Foundation Cycle
                    </button>
                </motion.div>

                <CycleChoiceModal
                    isOpen={showCycleChoice}
                    onClose={() => setShowCycleChoice(false)}
                    cycleType="foundation"
                />
            </>
        );
    }

    // Cycle in progress
    const info = getCycleInfo();
    if (!info) return null;

    const progressPercent = (info.effectiveDays / info.targetDays) * 100;

    return (
        <motion.div
            className="p-6 bg-gradient-to-br from-[#161625] to-[#1a1a2e] border border-white/10 rounded-lg mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-[Cinzel] text-white/90 capitalize">
                        {info.type} Cycle
                    </h3>
                    <div className="text-xs text-white/50 font-[Outfit]">
                        Day {info.currentDay} of {info.targetDays} · {info.mode}
                    </div>
                </div>
                <div className="text-3xl">
                    {info.type === 'foundation' && '🌱'}
                    {info.type === 'transformation' && '🔥'}
                    {info.type === 'integration' && '⭐'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#fcd34d] to-[#f59e0b]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progressPercent)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-white/50 font-[Outfit] mb-1">Practice Days</div>
                    <div className="text-lg font-[Cinzel] text-white/90">
                        {info.practiceDays} / {Math.ceil(info.targetDays * (info.baseline / 100))}
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-white/50 font-[Outfit] mb-1">Consistency</div>
                    <div className="text-lg font-[Cinzel] text-white/90">
                        {info.consistencyRate}%
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-white/50 font-[Outfit] mb-1">Effective Days</div>
                    <div className="text-lg font-[Cinzel] text-white/90">
                        {info.effectiveDays}
                    </div>
                </div>

                <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-white/50 font-[Outfit] mb-1">Projected</div>
                    <div className="text-lg font-[Cinzel] text-white/90">
                        Day {info.projectedCompletion}
                    </div>
                </div>
            </div>

            {/* Next Checkpoint */}
            {info.nextCheckpoint && (
                <div className="p-3 bg-[#fcd34d]/10 border border-[#fcd34d]/20 rounded">
                    <div className="text-xs text-[#fcd34d]/80 font-[Outfit] mb-1">
                        Next Checkpoint
                    </div>
                    <div className="text-sm text-[#fcd34d] font-[Outfit]">
                        {new Date(info.nextCheckpoint).toLocaleDateString()}
                        {canSwitchMode && ' · Mode change available'}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
