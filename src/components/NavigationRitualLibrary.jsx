import React, { useState } from 'react';
import { RitualSelectionDeck } from './RitualSelectionDeck.jsx';
import RitualSession from './RitualSession.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function NavigationRitualLibrary({ onComplete, onNavigate }) {
    const [selectedRitual, setSelectedRitual] = useState(null);
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    // Return to selection deck
    const handleReturnToDeck = () => {
        setSelectedRitual(null);
    };

    // Full completion: stop practice AND navigate to hub
    const handleFullComplete = () => {
        onComplete(); // This cleans up the PracticeSection state
        if (onNavigate) onNavigate(null); // This returns to HomeHub
    };

    // If ritual is selected, show RitualSession
    if (selectedRitual) {
        return (
            <RitualSession
                ritual={selectedRitual}
                onComplete={handleFullComplete}
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
                onSelectRitual={setSelectedRitual}
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
