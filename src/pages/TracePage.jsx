import React, { useState } from 'react';
import { SigilTracker } from '../components/SigilTracker';

/**
 * Minimal page for quick sigil tracing.
 * Accessed via /trace route or App Shortcut.
 * Includes a "Close App" button for quick exit.
 */
export function TracePage() {
    const [isSealed, setIsSealed] = useState(false);

    const handleClose = () => {
        // Close the PWA window/tab
        window.close();
        // Fallback: if window.close() is blocked, navigate to about:blank
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 100);
    };

    const handleSeal = () => {
        setIsSealed(true);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {isSealed ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-6xl mb-6">✨</div>
                    <h2 className="text-xl text-amber-200 font-display tracking-widest uppercase mb-4">
                        Trace Sealed
                    </h2>
                    <p className="text-slate-500 font-serif italic mb-12">
                        Your intention has been recorded.
                    </p>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button
                            onClick={() => setIsSealed(false)}
                            className="py-4 border border-amber-500/30 text-amber-400/80 rounded-xl uppercase tracking-widest text-xs hover:bg-amber-500/10 transition-colors"
                        >
                            Trace Another
                        </button>
                        <button
                            onClick={handleClose}
                            className="py-4 border border-slate-700 text-slate-500 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors"
                        >
                            Close & Return
                        </button>
                    </div>
                </div>
            ) : (
                <SigilTracker
                    isOpen={true}
                    onClose={handleSeal}
                    stage="flame"
                />
            )}
        </div>
    );
}
