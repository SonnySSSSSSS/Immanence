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

    const handleMouseEnter = (id) => {
        window.dispatchEvent(new CustomEvent('ritual:hover', { detail: { id } }));
    };

    const handleMouseLeave = () => {
        window.dispatchEvent(new CustomEvent('ritual:leave'));
    };

    return (
        <div className="w-full">
            {/* Header - "Invocation" verbiage */}
            <div
                className="mb-4 text-center"
                style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-mythic)',
                    textTransform: 'uppercase',
                    color: 'rgba(253,251,245,0.4)',
                }}
            >
                Invoke a Ritual
            </div>

            {/* Grid container */}
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
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            color: 'rgba(253,251,245,0.5)',
                        }}
                    >
                        No rituals available yet
                    </div>
                ) : (
                    rituals.map((ritual) => {
                        const isSelected = selectedRitualId === ritual.id;

                        return (
                            <button
                                key={ritual.id}
                                onClick={() => onSelectRitual(ritual)}
                                onMouseEnter={() => handleMouseEnter(ritual.id)}
                                onMouseLeave={handleMouseLeave}
                                className="rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                style={{
                                    background: isSelected
                                        ? 'linear-gradient(180deg, rgba(255,147,0,0.15) 0%, rgba(20,20,30,0.8) 100%)'
                                        : 'linear-gradient(180deg, rgba(22,22,37,0.4) 0%, rgba(15,15,26,0.6) 100%)',
                                    border: isSelected
                                        ? '1px solid rgba(255,147,0,0.4)'
                                        : '1px solid rgba(255,255,255,0.03)',
                                    boxShadow: isSelected
                                        ? '0 0 30px rgba(255,100,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                                        : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
                                }}
                            >
                                {/* Major Icon */}
                                <div
                                    className="text-3xl mb-3 transition-all duration-500"
                                    style={{
                                        color: isSelected ? '#ffb366' : 'rgba(255,255,255,0.7)',
                                        filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,160,50,0.5))' : 'none',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {ritual.icon || '◇'}
                                </div>

                                {/* Title - Uppercase & Clean */}
                                <div
                                    className="mb-1.5"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '11px',
                                        letterSpacing: 'var(--tracking-wide)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                        color: isSelected ? '#fff' : 'rgba(253,251,245,0.85)',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {ritual.name.split('(')[0].trim()}
                                </div>

                                {/* Duration - Subordinate */}
                                <div
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '9px',
                                        letterSpacing: '0.05em',
                                        color: 'rgba(253,251,245,0.4)',
                                    }}
                                >
                                    {formatDuration(ritual.duration)}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
