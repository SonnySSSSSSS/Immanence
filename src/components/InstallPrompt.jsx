import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

void motion;

export function InstallPrompt() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Detect if on iOS Safari in browser mode
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.navigator.standalone === true;
        const hasBeenDismissed = localStorage.getItem('immanence_install_dismissed') === 'true';

        if (isIOS && !isStandalone && !hasBeenDismissed) {
            // Delay to allow app load feel
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = (permanent = false) => {
        setIsVisible(false);
        if (permanent) {
            localStorage.setItem('immanence_install_dismissed', 'true');
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[2000] flex items-end justify-center px-4 pb-8 sm:items-center sm:pb-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop overlay */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    onClick={() => handleDismiss()}
                />

                {/* Modal Content */}
                <motion.div
                    className="relative w-full max-w-sm bg-[#0a0a12] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
                    initial={{ y: 100, scale: 0.9 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 100, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="p-6 pt-8 space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-display tracking-widest text-amber-200 uppercase">
                                Install Presence
                            </h3>
                            <p className="text-sm text-slate-400 font-serif leading-relaxed italic">
                                Enclose the OS within your home field for frictionless tracking.
                            </p>
                        </div>

                        {/* Instruction Steps */}
                        <div className="space-y-4 py-2">
                            <Step number="1" text="Tap the Share icon below">
                                <ShareIcon />
                            </Step>
                            <Step number="2" text="Select 'Add to Home Screen'">
                                <PlusIcon />
                            </Step>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => handleDismiss()}
                                className="w-full py-3 text-xs tracking-widest uppercase border border-amber-500/20 text-amber-500/60 hover:text-amber-400 hover:border-amber-500/40 transition-all rounded-lg"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={() => handleDismiss(true)}
                                className="w-full text-[10px] tracking-widest uppercase text-slate-600 hover:text-slate-400 transition-colors"
                            >
                                Don't show again
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Step({ number, text, children }) {
    return (
        <div className="flex items-center gap-4 text-slate-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-500/20 flex items-center justify-center text-xs font-mono text-amber-400/60">
                {number}
            </div>
            <div className="flex-grow text-sm font-serif">{text}</div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function ShareIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <div className="w-5 h-5 border-2 border-slate-400 rounded flex items-center justify-center text-slate-400">
            <span className="text-sm font-bold leading-none">+</span>
        </div>
    );
}
