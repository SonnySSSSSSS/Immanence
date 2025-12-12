// src/components/RitualSelectionDeck.jsx
// Grid layout for selecting rituals - shows all rituals at once

import React from 'react';
import { getAllRituals, RITUAL_CATEGORIES } from '../data/rituals/index.js';

export function RitualSelectionDeck({ onSelectRitual, selectedRitualId }) {
    const rituals = getAllRituals();

    const formatDuration = (duration) => {
        if (!duration) return '';
        const mins = Math.round((duration.min + duration.max) / 2);
        return `~${mins} min`;
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div
                className="mb-4 text-center"
                style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '9px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(253,251,245,0.4)',
                }}
            >
                Select a Ritual ({rituals.length} available)
            </div>

            {/* Grid container - shows all rituals */}
            <div
                className="grid gap-3 px-2 pb-4"
                style={{
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                }}
            >
                {rituals.length === 0 ? (
                    <div
                        className="col-span-2 text-center py-8"
                        style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: '11px',
                            color: 'rgba(253,251,245,0.5)',
                        }}
                    >
                        No rituals available yet
                    </div>
                ) : (
                    rituals.map((ritual) => {
                        const category = RITUAL_CATEGORIES.find(c => c.id === ritual.category);
                        const isSelected = selectedRitualId === ritual.id;

                        return (
                            <button
                                key={ritual.id}
                                onClick={() => onSelectRitual(ritual)}
                                className="rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: isSelected
                                        ? 'linear-gradient(180deg, var(--accent-color) 0%, var(--accent-secondary) 100%)'
                                        : 'linear-gradient(180deg, rgba(22,22,37,0.95) 0%, rgba(15,15,26,0.98) 100%)',
                                    border: isSelected
                                        ? '1px solid var(--accent-color)'
                                        : '1px solid var(--accent-15)',
                                    boxShadow: isSelected
                                        ? '0 0 24px var(--accent-30), inset 0 1px 0 rgba(255,255,255,0.15)'
                                        : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                                }}
                            >
                                {/* Category badge */}
                                <div
                                    className="mb-2"
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        fontSize: '8px',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        color: isSelected ? 'rgba(5,5,8,0.6)' : 'var(--accent-50)',
                                    }}
                                >
                                    {category?.name || ritual.category}
                                </div>

                                {/* Icon + Name */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className="text-xl"
                                        style={{
                                            filter: isSelected ? 'none' : 'saturate(0.7)',
                                        }}
                                    >
                                        {ritual.icon || '◇'}
                                    </span>
                                    <div
                                        style={{
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            color: isSelected ? '#050508' : 'rgba(253,251,245,0.9)',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {ritual.name.split('(')[0].trim()}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        fontSize: '10px',
                                        color: isSelected ? 'rgba(5,5,8,0.7)' : 'var(--accent-60)',
                                    }}
                                >
                                    {formatDuration(ritual.duration)}
                                </div>

                                {/* Step count indicator */}
                                <div className="mt-2 flex gap-1">
                                    {ritual.steps?.map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-1 rounded-full"
                                            style={{
                                                background: isSelected
                                                    ? 'rgba(5,5,8,0.3)'
                                                    : 'var(--accent-25)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
