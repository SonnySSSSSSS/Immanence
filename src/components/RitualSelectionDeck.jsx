import React, { useEffect, useMemo, useState } from 'react';
import { getAllRituals } from '../data/rituals/index.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

const RITUAL_PLACEHOLDERS = {
    sankalpa: "Set a clean intention and bind it to the body’s rhythm. This is for directional clarity—what you are choosing, and what you are not.",
    divineLight: "A downward current of clarity. Use this when you feel scattered, murky, or morally fatigued—aimed at purification and calm authority.",
    ancestralHealing: "A gentle reconnection to lineage and inherited patterning. Use to soften old grief, stabilize identity, and return to a wider belonging.",
    heartOpening: "A warming practice for tenderness and human contact. Use when you are closed, defended, or self-protective, and want to restore trust.",
    deityYoga: "Invocation through symbol and attitude. Use to borrow strength from an archetype and align behavior with its qualities.",
    forgiveness: "A clearing ritual for lingering entanglement. Use when you keep replaying someone’s energy or story, and need separation with dignity.",
};

export function RitualSelectionDeck({ onSelectRitual, selectedRitualId }) {
    const rituals = getAllRituals();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [localSelectedId, setLocalSelectedId] = useState(null);

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

    useEffect(() => {
        if (selectedRitualId) {
            setLocalSelectedId(selectedRitualId);
        }
    }, [selectedRitualId]);

    useEffect(() => {
        if (!selectedRitualId && rituals.length > 0 && !localSelectedId) {
            setLocalSelectedId(rituals[0].id);
        }
    }, [selectedRitualId, rituals, localSelectedId]);

    const resolvedSelectedId = selectedRitualId || localSelectedId || rituals[0]?.id;
    const selectedRitual = useMemo(() => {
        if (!rituals.length) return null;
        return rituals.find((ritual) => ritual.id === resolvedSelectedId) || rituals[0];
    }, [rituals, resolvedSelectedId]);

    const selectedDescription = useMemo(() => {
        if (!selectedRitual) return '';
        const direct = RITUAL_PLACEHOLDERS[selectedRitual.id];
        if (direct) return direct;
        const name = selectedRitual.name?.toLowerCase() || '';
        if (name.includes('cord')) return RITUAL_PLACEHOLDERS.forgiveness;
        if (name.includes('deity')) return RITUAL_PLACEHOLDERS.deityYoga;
        if (name.includes('sankalpa')) return RITUAL_PLACEHOLDERS.sankalpa;
        if (name.includes('divine light')) return RITUAL_PLACEHOLDERS.divineLight;
        if (name.includes('ancestral')) return RITUAL_PLACEHOLDERS.ancestralHealing;
        if (name.includes('heart')) return RITUAL_PLACEHOLDERS.heartOpening;
        return 'A focused ritual practice with room to deepen. Placeholder copy will be refined.';
    }, [selectedRitual]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div
                style={{
                    borderRadius: '16px',
                    padding: '14px 12px 12px',
                    background: isLight ? 'rgba(255,255,255,0.65)' : 'rgba(18,18,28,0.45)',
                    border: isLight ? '1px solid rgba(160,120,60,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isLight ? '0 10px 28px rgba(0,0,0,0.08)' : '0 10px 28px rgba(0,0,0,0.25)',
                }}
            >
                {/* Header - selection */}
                <div
                    className="mb-3 text-center"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    Select a ritual
                </div>

                {/* Grid container */}
                <div
                    className="grid gap-3 pb-2 custom-scrollbar"
                    style={{
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        paddingLeft: '8px',
                        paddingRight: '10px',
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
                            const isSelected = resolvedSelectedId === ritual.id;

                            return (
                                <button
                                    key={ritual.id}
                                    onClick={() => {
                                        setLocalSelectedId(ritual.id);
                                        onSelectRitual(ritual);
                                    }}
                                    onMouseEnter={() => handleMouseEnter(ritual.id)}
                                    onMouseLeave={handleMouseLeave}
                                    className="rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                                    style={{
                                        minWidth: 0,
                                        minHeight: '122px',
                                        padding: '14px 10px',
                                        background: isSelected
                                            ? (isLight 
                                                ? 'linear-gradient(180deg, rgba(160,120,60,0.15) 0%, rgba(255,255,255,0.85) 100%)'
                                                : 'linear-gradient(180deg, rgba(255,147,0,0.15) 0%, rgba(20,20,30,0.85) 100%)')
                                            : (isLight 
                                                ? 'linear-gradient(180deg, rgba(160,120,60,0.05) 0%, rgba(255,255,255,0.4) 100%)'
                                                : 'linear-gradient(180deg, rgba(22,22,37,0.4) 0%, rgba(15,15,26,0.65) 100%)'),
                                        border: isSelected
                                            ? (isLight ? '1px solid rgba(160,120,60,0.45)' : '1px solid rgba(255,147,0,0.5)')
                                            : (isLight ? '1px solid rgba(160,120,60,0.12)' : '1px solid rgba(255,255,255,0.05)'),
                                        boxShadow: isSelected
                                            ? (isLight ? '0 8px 24px rgba(160,120,60,0.18)' : '0 0 26px rgba(255,100,0,0.18)')
                                            : '0 4px 18px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    {/* Major Icon */}
                                    <div
                                        className="text-2xl mb-2 transition-all duration-500"
                                        style={{
                                            color: isSelected ? (isLight ? '#A0783C' : '#ffb366') : textColors.secondary,
                                            filter: isSelected ? `drop-shadow(0 0 6px ${isLight ? 'rgba(160,120,60,0.3)' : 'rgba(255,160,50,0.5)'})` : 'none',
                                            transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                                        }}
                                    >
                                        {ritual.icon || '◇'}
                                    </div>

                                    {/* Title - Uppercase & Clean */}
                                    <div
                                        className="mb-1"
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '10px',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                            color: isSelected ? (isLight ? '#3D3425' : '#fff') : textColors.primary,
                                            lineHeight: 1.3,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {ritual.name.split('(')[0].trim()}
                                    </div>

                                    {/* Duration - Subordinate */}
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '8px',
                                            letterSpacing: '0.05em',
                                            color: textColors.muted,
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

            <div
                style={{
                    borderRadius: '16px',
                    padding: '14px 16px 16px',
                    background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(16,16,26,0.5)',
                    border: isLight ? '1px solid rgba(160,120,60,0.18)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isLight ? '0 10px 28px rgba(0,0,0,0.08)' : '0 10px 28px rgba(0,0,0,0.22)',
                }}
            >
                <div
                    className="mb-3 text-center"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        color: textColors.muted,
                    }}
                >
                    About this ritual
                </div>

                {selectedRitual ? (
                    <div className="flex flex-col gap-2">
                        <div
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '12px',
                                fontWeight: 600,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: textColors.primary,
                                textAlign: 'center',
                            }}
                        >
                            {selectedRitual.name.split('(')[0].trim()}
                        </div>
                        {formatDuration(selectedRitual.duration) && (
                            <div
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '9px',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: textColors.muted,
                                    textAlign: 'center',
                                }}
                            >
                                {formatDuration(selectedRitual.duration)}
                            </div>
                        )}
                        <div
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '11px',
                                lineHeight: 1.6,
                                color: textColors.secondary,
                                textAlign: 'center',
                            }}
                        >
                            {selectedDescription}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            color: textColors.muted,
                            textAlign: 'center',
                            padding: '8px 0',
                        }}
                    >
                        Select a ritual to see its description.
                    </div>
                )}
            </div>
        </div>
    );
}
