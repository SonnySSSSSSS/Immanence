import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

void motion;

export function HardwareGuide({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
                <div className="max-w-sm w-full space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-display tracking-widest text-amber-200 uppercase">
                            Physical Bind
                        </h2>
                        <p className="text-sm text-slate-400 font-serif italic">
                            Linking the OS to your device's physical essence.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <GuideSection
                            title="iOS (Action Button)"
                            steps={[
                                "Open 'Shortcuts' app",
                                "Create new shortcut: 'Open URL'",
                                "Set URL to your Immanence /trace link",
                                "Go to Settings > Action Button > Shortcut",
                                "Select your new Trace shortcut"
                            ]}
                        />

                        <GuideSection
                            title="Android (Side Key)"
                            steps={[
                                "Go to Settings > Advanced Features",
                                "Select 'Side Key' or 'Double Press'",
                                "Set it to 'Open App'",
                                "Long-press the Immanence icon on home screen",
                                "Drag the 'Trace' shortcut to your home screen"
                            ]}
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 mt-8 border border-amber-500/20 text-amber-500/60 uppercase tracking-widest text-xs hover:text-amber-400 transition-colors"
                    >
                        I understand
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function GuideSection({ title, steps }) {
    return (
        <div className="space-y-3">
            <h3 className="text-xs font-display text-slate-500 tracking-widest uppercase">{title}</h3>
            <ul className="space-y-2">
                {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300 font-serif">
                        <span className="text-amber-500/40 tabular-nums">{i + 1}.</span>
                        <span>{step}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
