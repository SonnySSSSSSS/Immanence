// src/components/Cycle/CycleChoiceModal.jsx
// Modal for choosing cycle type and mode
import { motion, AnimatePresence } from 'framer-motion';
import { useCycleStore, CYCLE_TYPES, CYCLE_MODES } from '../../state/cycleStore';
import { useState } from 'react';

export function CycleChoiceModal({ isOpen, onClose, cycleType = 'foundation' }) {
    const startCycle = useCycleStore((state) => state.startCycle);
    const [selectedMode, setSelectedMode] = useState(null);

    const handleStartCycle = () => {
        if (!selectedMode) return;

        startCycle(cycleType, selectedMode);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-2xl mx-4 p-8 bg-[#161625] border border-white/10 rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-[Cinzel] text-white/90 mb-2">
                            Choose Your Path
                        </h2>
                        <p className="text-white/60 font-[Outfit]">
                            {cycleType === 'foundation' && 'Establish your baseline consistency over 14 days'}
                            {cycleType === 'transformation' && 'Deepen your practice over 90 days'}
                            {cycleType === 'integration' && 'Sustain long-term commitment over 180 days'}
                        </p>
                    </div>

                    {/* Mode Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Consecutive Mode */}
                        <motion.button
                            className={`p-6 border-2 rounded-lg text-left transition-all ${selectedMode === CYCLE_MODES.CONSECUTIVE
                                    ? 'border-[#fcd34d] bg-[#fcd34d]/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                            onClick={() => setSelectedMode(CYCLE_MODES.CONSECUTIVE)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-[Cinzel] text-white/90">Consecutive</h3>
                                <div className="text-2xl">⚡</div>
                            </div>

                            <div className="mb-3">
                                <div className="text-sm text-white/50 font-[Outfit] mb-1">
                                    {cycleType === 'foundation' && '14 days unbroken'}
                                    {cycleType === 'transformation' && '90 days unbroken'}
                                    {cycleType === 'integration' && '180 days unbroken'}
                                </div>
                                <div className="text-xs text-white/40">100% required</div>
                            </div>

                            <p className="text-sm text-white/60 font-[Outfit] leading-relaxed">
                                Unbroken discipline. Every day counts. Rewards consistency over flexibility.
                                Higher bar, faster recognition.
                            </p>
                        </motion.button>

                        {/* Flexible Mode */}
                        <motion.button
                            className={`p-6 border-2 rounded-lg text-left transition-all ${selectedMode === CYCLE_MODES.FLEXIBLE
                                    ? 'border-[#22d3ee] bg-[#22d3ee]/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                            onClick={() => setSelectedMode(CYCLE_MODES.FLEXIBLE)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-[Cinzel] text-white/90">Flexible</h3>
                                <div className="text-2xl">🌊</div>
                            </div>

                            <div className="mb-3">
                                <div className="text-sm text-white/50 font-[Outfit] mb-1">
                                    {cycleType === 'foundation' && '14 of 21 days'}
                                    {cycleType === 'transformation' && '60 of 90 days'}
                                    {cycleType === 'integration' && '120 of 180 days'}
                                </div>
                                <div className="text-xs text-white/40">67% required</div>
                            </div>

                            <p className="text-sm text-white/60 font-[Outfit] leading-relaxed">
                                Life happens, you adapt. Rewards persistence over perfection.
                                Sustainable for real-world commitments.
                            </p>
                        </motion.button>
                    </div>

                    {/* Footer Note */}
                    <div className="mb-6 p-4 bg-white/5 rounded border border-white/10">
                        <p className="text-xs text-white/50 font-[Outfit] leading-relaxed">
                            No judgment. Your choice reflects your current capacity.
                            We use this to calibrate your journey. You can switch modes
                            at 2-week checkpoints.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-white/60 hover:text-white/80 font-[Outfit] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStartCycle}
                            disabled={!selectedMode}
                            className={`px-6 py-2 rounded font-[Outfit] transition-all ${selectedMode
                                    ? 'bg-[#fcd34d] text-black hover:bg-[#fcd34d]/90'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            Begin Cycle
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
