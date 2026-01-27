import React from 'react';
import { getAllRituals } from '../data/rituals/index.js';
import { isRitualEmpty } from '../data/bhaktiRituals.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function RitualSelectionDeck({ onSelectRitual, selectedRitualId }) {
    const rituals = getAllRituals();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

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

    const textColors = {
        primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.9)',
        secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.7)',
        muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.4)',
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
                    color: textColors.muted,
                }}
            >
                Invoke a Ritual
            </div>

            {/* Grid container */}
            <div
                className="grid gap-3 pb-4 custom-scrollbar"
                style={{
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingLeft: '12px',
                    paddingRight: '14px',
                    boxSizing: 'border-box',
                }}
            >
                {rituals.length === 0 ? (
                    <div
                        className="col-span-2 text-center py-8"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            color: textColors.muted,
                        }}
                    >
                        No rituals available yet
                    </div>
                ) : (
                    rituals.map((ritual) => {
                        const isActive = ritual?.isActive !== undefined ? ritual.isActive : !isRitualEmpty(ritual);
                        const isDisabled = !isActive;
                        const isSelected = selectedRitualId === ritual.id;

                        return (
                            <button
                                key={ritual.id}
                                onClick={() => {
                                    if (isDisabled) return;
                                    onSelectRitual(ritual);
                                }}
                                onMouseEnter={() => {
                                    if (isDisabled) return;
                                    handleMouseEnter(ritual.id);
                                }}
                                onMouseLeave={() => {
                                    if (isDisabled) return;
                                    handleMouseLeave();
                                }}
                                disabled={isDisabled}
                                className="rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                style={{
                                    minWidth: 0, /* Prevents overflow in grid */
                                    opacity: isDisabled ? 0.45 : 1,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    background: isSelected
                                        ? (isLight 
                                            ? 'linear-gradient(180deg, rgba(160,120,60,0.15) 0%, rgba(255,255,255,0.8) 100%)'
                                            : 'linear-gradient(180deg, rgba(255,147,0,0.15) 0%, rgba(20,20,30,0.8) 100%)')
                                        : (isLight 
                                            ? 'linear-gradient(180deg, rgba(160,120,60,0.05) 0%, rgba(255,255,255,0.3) 100%)'
                                            : 'linear-gradient(180deg, rgba(22,22,37,0.4) 0%, rgba(15,15,26,0.6) 100%)'),
                                    border: isSelected
                                        ? (isLight ? '1px solid rgba(160,120,60,0.4)' : '1px solid rgba(255,147,0,0.4)')
                                        : (isLight ? '1px solid rgba(160,120,60,0.1)' : '1px solid rgba(255,255,255,0.03)'),
                                    boxShadow: isSelected
                                        ? (isLight ? '0 10px 30px rgba(160,120,60,0.15)' : '0 0 30px rgba(255,100,0,0.15)')
                                        : '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                            >
                                {/* Major Icon */}
                                <div
                                    className="text-3xl mb-3 transition-all duration-500"
                                    style={{
                                        color: isSelected ? (isLight ? '#A0783C' : '#ffb366') : textColors.secondary,
                                        filter: isSelected ? `drop-shadow(0 0 8px ${isLight ? 'rgba(160,120,60,0.3)' : 'rgba(255,160,50,0.5)'})` : 'none',
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
                                        color: isSelected ? (isLight ? '#3D3425' : '#fff') : textColors.primary,
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
                                        color: textColors.muted,
                                    }}
                                >
                                    {formatDuration(ritual.duration)}
                                </div>

                                {!isActive && (
                                    <div
                                        className="mt-2"
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '8px',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: textColors.muted,
                                            opacity: 0.7,
                                        }}
                                    >
                                        Coming soon
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
