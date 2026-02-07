import React from 'react';
import { SigilSealingArea } from '../components/SigilSealingArea';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { ThemeProvider } from '../context/ThemeContext.jsx';

/**
 * Minimal page for quick sigil tracing.
 * Accessed via /trace route or App Shortcut.
 * Uses the working SigilSealingArea component from Navigation section.
 */
export function TracePage() {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const handleClose = () => {
        // Close the PWA window/tab
        window.close();
        // Fallback: if window.close() is blocked, navigate to about:blank
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 100);
    };

    return (
        <ThemeProvider currentStage="Flame">
            <div
                className={`min-h-screen flex flex-col items-center justify-center p-6 ${isLight ? 'light-mode' : ''}`}
                style={{
                    background: isLight
                        ? 'linear-gradient(180deg, #F5F0E6 0%, #EDE5D8 100%)'
                        : 'black'
                }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all"
                    style={{
                        background: isLight ? 'rgba(255, 250, 240, 0.9)' : 'rgba(10, 5, 15, 0.8)',
                        color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(253, 251, 245, 0.4)',
                        border: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 220, 120, 0.1)'}`,
                        fontFamily: 'var(--font-display)'
                    }}
                >
                    Close
                </button>

                {/* Sigil Sealing Area */}
                <div className="w-full max-w-lg">
                    <SigilSealingArea />
                </div>
            </div>
        </ThemeProvider>
    );
}
