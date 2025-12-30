// src/components/vipassana/VipassanaVisual.jsx
// Visual component for Vipassana meditation practice
// Supports two variants: 'thought-labeling' (standard) and 'sakshi' (Distance Training)

import React from 'react';
import { ThoughtLabeling } from './ThoughtLabeling';

// Lazy import for DistanceTrainingStep to handle if not yet created
let DistanceTrainingStep = null;
try {
    DistanceTrainingStep = require('../DistanceTraining/DistanceTrainingStep').default;
} catch (e) {
    // DistanceTrainingStep not yet available - will use fallback
}

export function VipassanaVisual({
    isActive = false,
    phase = 'idle',
    intensity = 0,
    variant = 'thought-labeling', // 'thought-labeling' or 'sakshi'
    onComplete,
    onCancel,
}) {
    // If Sakshi variant selected and DistanceTrainingStep available
    if (variant === 'sakshi' && DistanceTrainingStep) {
        return (
            <DistanceTrainingStep
                isActive={isActive}
                onComplete={onComplete}
                onCancel={onCancel}
            />
        );
    }

    // Sakshi selected but component not available - fallback message
    if (variant === 'sakshi' && !DistanceTrainingStep) {
        return (
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
            >
                <div className="text-center p-6">
                    <span className="text-4xl mb-4 block">🪞</span>
                    <p className="text-sm opacity-70">
                        Distance Training (Sakshi) is being prepared...
                    </p>
                    <button
                        onClick={onCancel}
                        className="mt-4 px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Default: Thought Labeling variant
    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            {/* Vipassana visualization - body scan indicator */}
            <div
                className="w-24 h-48 rounded-full"
                style={{
                    background: `radial-gradient(ellipse at center, 
            rgba(139, 92, 246, ${0.1 + intensity * 0.2}) 0%, 
            transparent 70%)`,
                    filter: 'blur(20px)',
                    animation: isActive ? 'breathingPulse 4s ease-in-out infinite' : 'none',
                }}
            />
        </div>
    );
}

export default VipassanaVisual;
