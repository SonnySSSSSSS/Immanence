// src/components/vipassana/VipassanaVisual.jsx
// Visual component for Vipassana meditation practice
// Supports two variants: 'thought-labeling' (standard) and 'sakshi' (Distance Training)

import React from 'react';
import { ThoughtLabeling } from './ThoughtLabeling';

// Lazy import for DistanceTrainingStep is problematic with Vite and require
// We'll define a placeholder or if it's actually in the project we should import it properly.
// For now, we'll use a more robust check.
let DistanceTrainingStep = null;

export function VipassanaVisual({
    isActive = false,
    phase = 'idle',
    intensity = 0,
    variant = 'thought-labeling', // 'thought-labeling' or 'sakshi'
    onComplete,
    onCancel,
    onExit,
    durationSeconds,
}) {
    // If Sakshi variant selected and DistanceTrainingStep available
    if (variant === 'sakshi') {
        return (
            <div
                className="absolute inset-0 flex items-center justify-center p-8 text-center"
                style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
            >
                <div className="max-w-md">
                    <span className="text-6xl mb-6 block">🪞</span>
                    <h2 className="text-2xl font-bold mb-4">Sakshi — Distance Training</h2>
                    <p className="text-sm opacity-70 mb-8 leading-relaxed">
                        Distance Training involves witnessing consciousness from a place of radical compassion. 
                        Observe the observer, maintaining a gentle distance from arising phenomena.
                    </p>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
                        <p className="text-xs italic opacity-60">
                            "I am not the thought, I am the space in which the thought arises."
                        </p>
                    </div>
                    {/* Fallback control since this part is still under development */}
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={onCancel || onExit}
                            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-semibold uppercase tracking-wider"
                        >
                            Return to Selection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Thought Labeling variant
    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            {isActive && (
                <ThoughtLabeling 
                    durationSeconds={durationSeconds}
                    onComplete={onComplete}
                    onExit={onExit || onCancel}
                />
            )}
        </div>
    );
}

export default VipassanaVisual;
