// src/components/Cycle/CheckpointReview.jsx
// Checkpoint review modal (every 2 weeks)
import { motion, AnimatePresence } from 'framer-motion';
import { useCycleStore } from '../../state/cycleStore';
import { getAllBenchmarkSummary } from '../../services/benchmarkManager';
import { useState } from 'react';
import { ModeSwitchDialog } from './ModeSwitchDialog';

export function CheckpointReview({ isOpen, onClose }) {
    const currentCycle = useCycleStore((state) => state.currentCycle);
    const getCycleInfo = useCycleStore((state) => state.getCycleInfo);
    const canSwitchMode = useCycleStore((state) => state.canSwitchMode);

    const [showModeSwitch, setShowModeSwitch] = useState(false);

    if (!isOpen || !currentCycle) return null;

    const info = getCycleInfo();
    const benchmarks = getAllBenchmarkSummary();

    const hasBreathData = benchmarks.breath && Object.keys(benchmarks.breath).length > 0;
    const hasFocusData = benchmarks.focus && Object.keys(benchmarks.focus).length > 0;
    const hasBodyData = benchmarks.body && Object.keys(benchmarks.body).length > 0;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/80" onClick={onClose} />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-[#161625] border border-white/10 rounded-lg p-8"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="mb-6">
                        <h2
                            className="text-2xl tracking-wide font-bold text-white/90 mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Checkpoint: Day {info.currentDay}
                        </h2>
                        <p
                            className="text-white/60 tracking-tight font-medium"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Review your progress and consider your path forward
                        </p>
                    </div>

                    {/* Metrics Summary */}
                    <div className="mb-6">
                        <h3
                            className="text-lg tracking-wide font-bold text-white/80 mb-3"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Your Metrics
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div className="p-4 bg-white/5 rounded border border-white/10">
                                <div
                                    className="text-xs text-white/50 tracking-tight font-medium mb-1"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    Consistency Rate
                                </div>
                                <div
                                    className="text-2xl tracking-wide font-bold text-white/90"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {info.consistencyRate}%
                                </div>
                                <div className="text-xs text-white/40 mt-1">
                                    Target: {info.baseline}%
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded border border-white/10">
                                <div
                                    className="text-xs text-white/50 tracking-tight font-medium mb-1"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    Practice Days
                                </div>
                                <div
                                    className="text-2xl tracking-wide font-bold text-white/90"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {info.practiceDays} / {info.currentDay}
                                </div>
                                <div className="text-xs text-white/40 mt-1">Elapsed days</div>
                            </div>

                            <div className="p-4 bg-white/5 rounded border border-white/10">
                                <div
                                    className="text-xs text-white/50 tracking-tight font-medium mb-1"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    Projected
                                </div>
                                <div
                                    className="text-2xl tracking-wide font-bold text-white/90"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    Day {info.projectedCompletion}
                                </div>
                                <div className="text-xs text-white/40 mt-1">At current rate</div>
                            </div>
                        </div>

                        {/* Benchmark highlights */}
                        {(hasBreathData || hasFocusData || hasBodyData) && (
                            <div className="p-4 bg-[#fcd34d]/10 border border-[#fcd34d]/20 rounded">
                                <div
                                    className="text-sm text-[#fcd34d]/80 tracking-tight font-medium mb-2"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    Benchmark Progress
                                </div>
                                <div
                                    className="text-xs text-white/60 tracking-tight font-medium"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    {hasBreathData && '✓ Breath metrics logged · '}
                                    {hasFocusData && '✓ Focus metrics logged · '}
                                    {hasBodyData && '✓ Body metrics logged'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Path Assessment */}
                    <div className="mb-6">
                        <h3
                            className="text-lg tracking-wide font-bold text-white/80 mb-3"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Assess Your Path
                        </h3>

                        <div className="p-4 bg-white/5 rounded border border-white/10 mb-3">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div
                                        className="text-sm text-white/70 tracking-tight font-medium mb-1"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        Current Mode
                                    </div>
                                    <div
                                        className="text-lg tracking-wide font-bold text-white/90 capitalize"
                                        style={{ fontFamily: 'var(--font-display)' }}
                                    >
                                        {info.mode}
                                    </div>
                                </div>
                                <div className="text-2xl">
                                    {info.mode === 'consecutive' ? '⚡' : '🌊'}
                                </div>
                            </div>

                            {canSwitchMode && (
                                <button
                                    onClick={() => setShowModeSwitch(true)}
                                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 rounded tracking-tight font-medium text-sm transition-colors"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    Consider Mode Switch
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-[#fcd34d] text-black rounded tracking-tight font-medium hover:bg-[#fcd34d]/90 transition-colors"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Continue {info.mode}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Mode Switch Dialog */}
            <ModeSwitchDialog
                isOpen={showModeSwitch}
                onClose={() => setShowModeSwitch(false)}
                onConfirm={() => {
                    setShowModeSwitch(false);
                    onClose();
                }}
            />
        </AnimatePresence>
    );
}
