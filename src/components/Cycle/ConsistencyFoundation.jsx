// src/components/Cycle/ConsistencyFoundation.jsx
// Navigation component showing current cycle status
import { useCycleStore } from '../../state/cycleStore';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { useState } from 'react';
import { CycleChoiceModal } from './CycleChoiceModal';
import { motion } from 'framer-motion';

export function ConsistencyFoundation() {
    const currentCycle = useCycleStore((state) => state.currentCycle);
    const getCycleInfo = useCycleStore((state) => state.getCycleInfo);
    const canSwitchMode = useCycleStore((state) => state.canSwitchMode);

    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // No cycle active - show call to action
    if (!currentCycle) {
        return (
            <>
                <motion.div
                    className="p-6 rounded-3xl mb-4 border transition-all duration-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: isLight
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                            : 'linear-gradient(135deg, #161625 0%, #1a1a2e 100%)',
                        borderColor: isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255,255,255,0.1)',
                        boxShadow: isLight ? '0 10px 30px rgba(180, 140, 90, 0.1)' : '0 10px 30px rgba(0,0,0,0.3)',
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3
                            className="text-lg font-bold tracking-wide"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'white'
                            }}
                        >
                            Consistency Foundation
                        </h3>
                        <div className="text-2xl" style={{ color: isLight ? 'rgba(180, 140, 90, 0.6)' : 'rgba(252, 211, 77, 0.6)' }}>◯</div>
                    </div>

                    <p
                        className="text-sm font-medium mb-6 leading-relaxed"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(255, 255, 255, 0.6)'
                        }}
                    >
                        Ready to establish your practice foundation? Choose your commitment structure.
                    </p>

                    <button
                        onClick={() => setShowCycleChoice(true)}
                        className="w-full px-4 py-3 rounded-xl font-bold tracking-wide transition-all active:scale-95"
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '12px',
                            background: isLight ? 'rgba(180, 140, 90, 0.8)' : '#fcd34d',
                            color: isLight ? 'white' : 'black',
                            boxShadow: isLight ? '0 4px 12px rgba(180, 140, 90, 0.3)' : '0 4px 12px rgba(252, 211, 77, 0.2)'
                        }}
                    >
                        BEGIN FOUNDATION CYCLE
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
            className="p-6 rounded-3xl mb-4 border transition-all duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)'
                    : 'linear-gradient(135deg, #161625 0%, #1a1a2e 100%)',
                borderColor: isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(255,255,255,0.1)',
                boxShadow: isLight ? '0 10px 30px rgba(180, 140, 90, 0.1)' : '0 10px 30px rgba(0,0,0,0.3)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3
                        className="text-lg font-bold tracking-wide capitalize"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: isLight ? 'rgba(60, 52, 37, 0.9)' : 'white'
                        }}
                    >
                        {info.type} Cycle
                    </h3>
                    <div
                        className="text-xs font-medium"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: isLight ? 'rgba(90, 77, 60, 0.5)' : 'rgba(255, 255, 255, 0.5)'
                        }}
                    >
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
                <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' }}
                >
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
                {[
                    { label: 'Practice Days', value: `${info.practiceDays} / ${Math.ceil(info.targetDays * (info.baseline / 100))}` },
                    { label: 'Consistency', value: `${info.consistencyRate}%` },
                    { label: 'Effective Days', value: info.effectiveDays },
                    { label: 'Projected', value: `Day ${info.projectedCompletion}` }
                ].map((m, i) => (
                    <div
                        key={i}
                        className="p-3 rounded border transition-colors duration-500"
                        style={{
                            background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: isLight ? 'rgba(180, 140, 90, 0.15)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <div
                            className="text-[10px] uppercase tracking-wider font-bold mb-1"
                            style={{
                                fontFamily: 'var(--font-body)',
                                color: isLight ? 'rgba(90, 77, 60, 0.4)' : 'rgba(255, 255, 255, 0.4)'
                            }}
                        >
                            {m.label}
                        </div>
                        <div
                            className="text-lg font-bold"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: isLight ? 'rgba(60, 52, 37, 0.85)' : 'rgba(255, 255, 255, 0.9)'
                            }}
                        >
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Next Checkpoint */}
            {info.nextCheckpoint && (
                <div
                    className="p-3 border rounded transition-colors duration-500"
                    style={{
                        background: isLight ? 'rgba(180, 140, 90, 0.1)' : 'rgba(252, 211, 77, 0.1)',
                        borderColor: isLight ? 'rgba(180, 140, 90, 0.2)' : 'rgba(252, 211, 77, 0.2)'
                    }}
                >
                    <div
                        className="text-[10px] uppercase tracking-wider font-bold mb-1"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: isLight ? 'rgba(140, 100, 40, 0.8)' : 'rgba(252, 211, 77, 0.8)'
                        }}
                    >
                        Next Checkpoint
                    </div>
                    <div
                        className="text-sm font-bold"
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: isLight ? 'rgba(140, 100, 40, 1)' : '#fcd34d'
                        }}
                    >
                        {new Date(info.nextCheckpoint).toLocaleDateString()}
                        {canSwitchMode && ' · Mode change available'}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
