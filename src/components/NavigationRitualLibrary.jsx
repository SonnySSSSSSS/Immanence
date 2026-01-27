import React, { useState } from 'react';
import { RitualSelectionDeck } from './RitualSelectionDeck.jsx';
import RitualSession from './RitualSession.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { isRitualEmpty } from '../data/bhaktiRituals.js';

const DEFAULT_RITUAL_KEY = "immanenceOS.rituals.defaultRitualId";
const LAST_RITUAL_ID_KEY = "immanenceOS.rituals.lastRitualId";
const LAST_RITUAL_AT_KEY = "immanenceOS.rituals.lastRitualAt";

export function NavigationRitualLibrary({ onComplete, onNavigate }) {
    const [selectedRitual, setSelectedRitual] = useState(null);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const handleSelectRitual = (ritual) => {
        const isActive = ritual?.isActive !== undefined ? ritual.isActive : !isRitualEmpty(ritual);
        if (!isActive) return;
        if (ritual?.id) localStorage.setItem(DEFAULT_RITUAL_KEY, ritual.id);
        setSelectedRitual(ritual);
    };

    // Return to selection deck
    const handleReturnToDeck = () => {
        setSelectedRitual(null);
    };

    const handleRitualComplete = (ritual) => {
        if (ritual?.id) {
            localStorage.setItem(DEFAULT_RITUAL_KEY, ritual.id);
            localStorage.setItem(LAST_RITUAL_ID_KEY, ritual.id);
            localStorage.setItem(LAST_RITUAL_AT_KEY, String(Date.now()));
        }
        setSelectedRitual(null);
        onComplete?.();
        if (onNavigate) onNavigate(null);
    };

    // If ritual is selected, show RitualSession
    if (selectedRitual) {
        return (
            <RitualSession
                ritual={selectedRitual}
                onComplete={handleRitualComplete}
                onExit={handleReturnToDeck}
                isLight={isLight}
            />
        );
    }

    // Otherwise show selection deck
    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 
                    className="text-2xl mb-2"
                    style={{
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--tracking-wide)',
                        color: isLight ? 'rgba(90, 77, 60, 0.9)' : 'rgba(253,251,245,0.9)',
                    }}
                >
                    Ritual Library
                </h2>
                <p
                    className="text-sm italic"
                    style={{
                        fontFamily: 'var(--font-body)',
                        color: isLight ? 'rgba(90, 77, 60, 0.6)' : 'rgba(253,251,245,0.5)',
                    }}
                >
                    Select a ritual to begin
                </p>
            </div>

            {/* Selection Deck */}
            <RitualSelectionDeck
                onSelectRitual={handleSelectRitual}
                selectedRitualId={null}
            />

            {/* Return to Hub Button */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={onComplete}
                    className="px-6 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-wide)',
                        textTransform: 'uppercase',
                        color: isLight ? 'rgba(90, 77, 60, 0.7)' : 'rgba(253,251,245,0.6)',
                        border: isLight ? '1px solid rgba(90, 77, 60, 0.2)' : '1px solid rgba(253,251,245,0.2)',
                    }}
                >
                    Return to Hub
                </button>
            </div>
        </div>
    );
}
