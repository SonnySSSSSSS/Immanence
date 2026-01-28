import React, { useState, useEffect } from 'react';
import { RitualSelectionDeck } from './RitualSelectionDeck.jsx';
import RitualSession from './RitualSession.jsx';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function NavigationRitualLibrary({ onComplete, onNavigate, selectedRitual, onSelectRitual, onRitualReturn }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    // Diagnostic logging for props
    useEffect(() => {
        console.log("[RITUAL LIBRARY] Props check:");
        console.log("  selectedRitual:", selectedRitual?.id || "null");
        console.log("  onRitualReturn exists:", !!onRitualReturn);
        console.log("  onComplete exists:", !!onComplete);
    }, [selectedRitual, onRitualReturn, onComplete]);

    // Return to selection deck (ritual completed, return to menu)
    const handleReturnToDeck = () => {
        console.log("[RITUAL LIBRARY] handleReturnToDeck called");
        console.log("[RITUAL LIBRARY] Current selectedRitual:", selectedRitual?.id || "null");
        console.log("[RITUAL LIBRARY] onRitualReturn check:");
        console.log("  - exists:", !!onRitualReturn);
        console.log("  - type:", typeof onRitualReturn);
        console.log("  - isFunction:", typeof onRitualReturn === 'function');

        if (onRitualReturn && typeof onRitualReturn === 'function') {
            console.log("[RITUAL LIBRARY] ✓ Calling onRitualReturn to clear activeRitual");
            try {
                // Call the parent callback to clear activeRitual state
                onRitualReturn();
                console.log("[RITUAL LIBRARY] ✓ onRitualReturn executed");

                // Verify the state update will happen
                console.log("[RITUAL LIBRARY] Ritual selection should now be cleared");
            } catch (error) {
                console.error("[RITUAL LIBRARY] ✗ Error in onRitualReturn:", error);
                console.error("[RITUAL LIBRARY] Error details:", error.message);
                console.error("[RITUAL LIBRARY] Stack:", error.stack);
            }
        } else {
            console.error("[RITUAL LIBRARY] ✗ CRITICAL: onRitualReturn is not available!");
            console.error("[RITUAL LIBRARY] onRitualReturn value:", onRitualReturn);
            console.error("[RITUAL LIBRARY] onRitualReturn type:", typeof onRitualReturn);

            // Fallback: try calling onComplete as backup to exit ritual practice entirely
            if (onComplete && typeof onComplete === 'function') {
                console.log("[RITUAL LIBRARY] ⚠ Falling back to onComplete to exit ritual mode");
                try {
                    onComplete();
                    console.log("[RITUAL LIBRARY] ✓ onComplete fallback executed");
                } catch (error) {
                    console.error("[RITUAL LIBRARY] ✗ Fallback failed:", error);
                }
            } else {
                console.error("[RITUAL LIBRARY] ✗ No fallback available - both callbacks missing");
            }
        }
    };

    // Full completion: stop practice AND navigate to hub (user clicks "Return to Hub")
    const handleFullComplete = () => {
        onComplete(); // This cleans up the PracticeSection state
        if (onNavigate) onNavigate(null); // This returns to HomeHub
    };

    // If ritual is selected, show RitualSession
    if (selectedRitual) {
        return (
            <RitualSession
                ritual={selectedRitual}
                onComplete={handleReturnToDeck}
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
                onSelectRitual={onSelectRitual}
                selectedRitualId={selectedRitual?.id}
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
