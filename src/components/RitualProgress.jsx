import React from 'react';
import { motion } from 'framer-motion';

const RitualProgress = ({
    currentStepIndex,
    totalSteps,
    stepTimeRemaining,
    stepDuration,
    totalTimeElapsed,
    totalDurationEstimated
}) => {
    // Calculate percentage for current step
    const stepProgress = Math.max(0, Math.min(100, ((stepDuration - stepTimeRemaining) / stepDuration) * 100));

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-2xl px-6 pb-6 pt-2 flex flex-col gap-2 z-20">
            {/* Step Indicators */}
            <div className="flex gap-1 w-full h-1.5 mb-2">
                {Array.from({ length: totalSteps }).map((_, idx) => {
                    let status = 'pending'; // or 'active', 'completed'
                    if (idx < currentStepIndex) status = 'completed';
                    if (idx === currentStepIndex) status = 'active';

                    return (
                        <div
                            key={idx}
                            className="h-full flex-1 rounded-full overflow-hidden bg-white/10 relative"
                        >
                            {/* Completed State */}
                            {status === 'completed' && (
                                <div className="absolute inset-0 bg-[var(--accent-primary)] opacity-50" />
                            )}

                            {/* Active State - Animated Progress */}
                            {status === 'active' && (
                                <motion.div
                                    className="absolute left-0 top-0 bottom-0 bg-[var(--accent-primary)]"
                                    style={{ width: `${stepProgress}%` }}
                                    transition={{ duration: 0.1, ease: "linear" }} // Smooth updates
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Timer Display */}
            <div className="flex justify-between items-center text-xs font-mono text-[var(--accent-muted)] opacity-80">
                <span>Step {currentStepIndex + 1}</span>
                <span className="text-[var(--accent-primary)] font-bold text-sm">
                    {formatTime(stepTimeRemaining)}
                </span>
                <span>
                    Total {formatTime(totalTimeElapsed)}
                </span>
            </div>
        </div>
    );
};

export default RitualProgress;
