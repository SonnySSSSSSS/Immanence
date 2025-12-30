// src/components/vipassana/VipassanaVariantSelector.jsx
// Modal for selecting Vipassana practice variant before session starts
// Options: Thought Labeling (standard) or Sakshi (Distance Training)

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

export function VipassanaVariantSelector({ onSelect, onCancel }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const variants = [
        {
            id: 'thought-labeling',
            name: 'Thought Labeling',
            icon: '🌬️',
            description: 'Observe thoughts arising with neutral awareness. Label and release.',
            color: isLight ? 'hsl(200, 60%, 50%)' : 'hsl(200, 70%, 60%)',
        },
        {
            id: 'sakshi',
            name: 'Sakshi — Distance Training',
            icon: '🪞',
            description: 'Witness consciousness. Observe yourself observing. Build capacity through compassion.',
            color: isLight ? 'hsl(280, 50%, 55%)' : 'hsl(280, 60%, 65%)',
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: isLight
                    ? 'rgba(255, 250, 240, 0.85)'
                    : 'rgba(10, 5, 15, 0.9)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <div
                className="w-full max-w-sm rounded-2xl p-5 relative"
                style={{
                    background: isLight
                        ? 'linear-gradient(145deg, rgba(255, 252, 245, 0.98) 0%, rgba(250, 245, 235, 0.95) 100%)'
                        : 'linear-gradient(145deg, rgba(30, 20, 35, 0.98) 0%, rgba(20, 12, 25, 0.95) 100%)',
                    border: isLight
                        ? '1.5px solid rgba(175, 139, 44, 0.3)'
                        : '1.5px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: isLight
                        ? '0 8px 32px rgba(120, 90, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                        : '0 12px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Header */}
                <div className="text-center mb-5">
                    <h2
                        className="text-lg font-semibold tracking-wide"
                        style={{
                            color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)',
                        }}
                    >
                        Choose Your Practice
                    </h2>
                    <p
                        className="text-xs mt-1"
                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.6)' }}
                    >
                        Select a Vipassana modality
                    </p>
                </div>

                {/* Variant Cards */}
                <div className="space-y-3 mb-4">
                    {variants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => onSelect(variant.id)}
                            className="w-full text-left rounded-xl p-4 transition-all duration-200 group"
                            style={{
                                background: isLight
                                    ? 'rgba(255, 255, 255, 0.6)'
                                    : 'rgba(255, 255, 255, 0.04)',
                                border: isLight
                                    ? '1px solid rgba(175, 139, 44, 0.2)'
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = variant.color;
                                e.currentTarget.style.boxShadow = `0 0 12px ${variant.color}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isLight
                                    ? 'rgba(175, 139, 44, 0.2)'
                                    : 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className="text-2xl"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                >
                                    {variant.icon}
                                </span>
                                <div className="flex-1">
                                    <h3
                                        className="font-medium text-sm"
                                        style={{ color: isLight ? 'rgba(45, 40, 35, 0.95)' : 'rgba(253, 251, 245, 0.95)' }}
                                    >
                                        {variant.name}
                                    </h3>
                                    <p
                                        className="text-xs mt-1 leading-relaxed"
                                        style={{ color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.55)' }}
                                    >
                                        {variant.description}
                                    </p>
                                </div>
                                <span
                                    className="text-lg opacity-40 group-hover:opacity-100 transition-opacity"
                                    style={{ color: variant.color }}
                                >
                                    →
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Cancel Button */}
                <button
                    onClick={onCancel}
                    className="w-full py-2 text-sm rounded-lg transition-all duration-200"
                    style={{
                        color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253, 251, 245, 0.5)',
                        background: 'transparent',
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default VipassanaVariantSelector;
