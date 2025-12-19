// src/components/Cycle/ModeSwitchDialog.jsx
// Confirmation dialog for switching modes
import { motion, AnimatePresence } from 'framer-motion';
import { useCycleStore, CYCLE_MODES } from '../../state/cycleStore';
import { recalibrateOnModeSwitch } from '../../services/cycleManager';

export function ModeSwitchDialog({ isOpen, onClose, onConfirm }) {
    const currentCycle = useCycleStore((state) => state.currentCycle);
    const getCycleInfo = useCycleStore((state) => state.getCycleInfo);

    if (!isOpen || !currentCycle) return null;

    const info = getCycleInfo();
    const newMode = info.mode === CYCLE_MODES.CONSECUTIVE
        ? CYCLE_MODES.FLEXIBLE
        : CYCLE_MODES.CONSECUTIVE;

    // Calculate what would happen if switched
    const currentEffective = info.effectiveDays;
    const currentRate = info.consistencyRate / 100;
    const newBaseline = newMode === CYCLE_MODES.CONSECUTIVE ? 1.0 : 0.67;
    const recalibratedDays = Math.floor(info.practiceDays * (currentRate / newBaseline));
    const timelineChange = recalibratedDays - currentEffective;

    const handleConfirm = () => {
        const result = recalibrateOnModeSwitch(newMode);
        if (result.success) {
            onConfirm();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/90" onClick={onClose} />

                {/* Dialog */}
                <motion.div
                    className="relative w-full max-w-md bg-[#161625] border border-white/10 rounded-lg p-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-xl font-[Cinzel] text-white/90 mb-2">
                            Switch to {newMode}?
                        </h3>
                        <p className="text-sm text-white/60 font-[Outfit]">
                            This will recalibrate your timeline based on the new standard.
                        </p>
                    </div>

                    {/* Current Progress */}
                    <div className="mb-4 p-4 bg-white/5 rounded border border-white/10">
                        <div className="text-xs text-white/50 font-[Outfit] mb-2">Current Progress</div>
                        <div className="space-y-2 text-sm text-white/70 font-[Outfit]">
                            <div>· {info.practiceDays} practice days over {info.currentDay} elapsed</div>
                            <div>· Effective progress: {currentEffective} days toward goal</div>
                        </div>
                    </div>

                    {/* After Switch */}
                    <div className="mb-4 p-4 bg-[#fcd34d]/10 border border-[#fcd34d]/20 rounded">
                        <div className="text-xs text-[#fcd34d]/80 font-[Outfit] mb-2">After Switch</div>
                        <div className="space-y-2 text-sm text-white/70 font-[Outfit]">
                            <div>· Same {info.practiceDays} practice days</div>
                            <div>
                                · New effective progress: {recalibratedDays} days
                                {newMode === CYCLE_MODES.CONSECUTIVE ? ' (higher bar)' : ' (lower bar)'}
                            </div>
                            <div className={timelineChange > 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}>
                                · Timeline {timelineChange > 0 ? 'shrinks' : 'extends'} by ~{Math.abs(timelineChange)} days
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                        <p className="text-xs text-orange-200/80 font-[Outfit]">
                            This change locks for 2 weeks. You won't be able to switch again
                            until the next checkpoint.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 rounded font-[Outfit] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-2 bg-[#fcd34d] text-black rounded font-[Outfit] hover:bg-[#fcd34d]/90 transition-colors"
                        >
                            Confirm Switch
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
