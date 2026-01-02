// src/components/PostSessionJournal.jsx
// Post-Session Micro-Note Capture Modal

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJournalStore, ATTENTION_QUALITIES, TECH_NOTE_PLACEHOLDERS, CHALLENGE_TAXONOMY } from '../state/journalStore.js';
import { useProgressStore } from '../state/progressStore.js';
import { useLunarStore } from '../state/lunarStore.js';

export function PostSessionJournal({ sessionId, onComplete }) {
    const { stage } = useLunarStore();
    const {
        pendingMicroNote,
        updateMicroNote,
        nextMicroNoteStep,
        completeMicroNote,
        cancelMicroNote
    } = useJournalStore();

    const progressStore = useProgressStore();

    const [placeholderIndex] = useState(Math.floor(Math.random() * TECH_NOTE_PLACEHOLDERS.length));

    // Auto-advance after attention selection
    const handleAttentionSelect = (quality) => {
        updateMicroNote('attentionQuality', quality);
        setTimeout(() => nextMicroNoteStep(), 300);
    };

    // Skip technical note
    const handleSkipNote = () => {
        nextMicroNoteStep();
    };

    // Auto-advance after resistance selection
    const handleResistanceSelect = (flag) => {
        updateMicroNote('resistanceFlag', flag);
        setTimeout(() => nextMicroNoteStep(), 300);
    };

    // Complete and close
    const handleComplete = () => {
        completeMicroNote(progressStore);
        onComplete?.();
    };

    if (!pendingMicroNote || pendingMicroNote.sessionId !== sessionId) {
        return null;
    }

    const { step, formData } = pendingMicroNote;
    const isLight = stage === 'flame';

    // Stage-adaptive colors
    const bgColor = isLight ? 'rgba(245, 239, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textMain = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const textSub = isLight ? 'rgba(65, 45, 25, 0.7)' : 'rgba(253, 251, 245, 0.6)';
    const borderColor = isLight ? 'rgba(160, 140, 120, 0.3)' : 'rgba(253, 251, 245, 0.15)';
    const accentColor = isLight ? 'rgba(139, 159, 136, 0.9)' : 'rgba(126, 217, 87, 0.9)';

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: bgColor }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor }}>
                    <h2 className="text-2xl font-bold text-center" style={{ color: textMain }}>
                        Session Complete
                    </h2>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Attention Quality */}
                        {step === 'attention' && (
                            <motion.div
                                key="attention"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-center text-sm font-medium" style={{ color: textSub }}>
                                    How was your attention today?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {ATTENTION_QUALITIES.map((quality) => (
                                        <button
                                            key={quality}
                                            onClick={() => handleAttentionSelect(quality)}
                                            className="px-4 py-3 rounded-lg font-medium text-sm capitalize transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: formData.attentionQuality === quality ? accentColor : borderColor,
                                                color: formData.attentionQuality === quality ? '#fff' : textMain,
                                                border: `1px solid ${borderColor}`
                                            }}
                                        >
                                            {quality}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Technical Note */}
                        {step === 'note' && (
                            <motion.div
                                key="note"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-center text-sm font-medium" style={{ color: textSub }}>
                                    Any technique observations?
                                </p>
                                <textarea
                                    value={formData.technicalNote || ''}
                                    onChange={(e) => updateMicroNote('technicalNote', e.target.value.slice(0, 140))}
                                    placeholder={TECH_NOTE_PLACEHOLDERS[placeholderIndex]}
                                    maxLength={140}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg resize-none text-sm"
                                    style={{
                                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                                        color: textMain,
                                        border: `1px solid ${borderColor}`,
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs" style={{ color: textSub }}>
                                        {(formData.technicalNote || '').length}/140
                                    </span>
                                    <button
                                        onClick={handleSkipNote}
                                        className="text-sm font-medium underline"
                                        style={{ color: textSub }}
                                    >
                                        Skip
                                    </button>
                                </div>
                                <button
                                    onClick={() => nextMicroNoteStep()}
                                    className="w-full py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                                    style={{ backgroundColor: accentColor, color: '#fff' }}
                                >
                                    Continue
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Resistance Flag */}
                        {step === 'resistance' && (
                            <motion.div
                                key="resistance"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-center text-sm font-medium" style={{ color: textSub }}>
                                    Did you experience resistance before or during practice?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleResistanceSelect(true)}
                                        className="px-6 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: formData.resistanceFlag === true ? accentColor : borderColor,
                                            color: formData.resistanceFlag === true ? '#fff' : textMain,
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => handleResistanceSelect(false)}
                                        className="px-6 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: formData.resistanceFlag === false ? accentColor : borderColor,
                                            color: formData.resistanceFlag === false ? '#fff' : textMain,
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        No
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Challenge Tag (Conditional) */}
                        {step === 'challenge' && (
                            <motion.div
                                key="challenge"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <p className="text-center text-sm font-medium" style={{ color: textSub }}>
                                    What was the main challenge?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(CHALLENGE_TAXONOMY).map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => updateMicroNote('challengeTag', tag)}
                                            className="px-4 py-3 rounded-lg font-medium text-sm capitalize transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: formData.challengeTag === tag ? accentColor : borderColor,
                                                color: formData.challengeTag === tag ? '#fff' : textMain,
                                                border: `1px solid ${borderColor}`
                                            }}
                                        >
                                            {CHALLENGE_TAXONOMY[tag].label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => nextMicroNoteStep()}
                                        className="flex-1 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: borderColor,
                                            color: textMain,
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => nextMicroNoteStep()}
                                        disabled={!formData.challengeTag}
                                        className="flex-1 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105 disabled:opacity-50"
                                        style={{ backgroundColor: accentColor, color: '#fff' }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Done */}
                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                <div className="text-4xl">✨</div>
                                <p className="text-lg font-medium" style={{ color: textMain }}>
                                    Thank you for reflecting
                                </p>
                                <button
                                    onClick={handleComplete}
                                    className="w-full py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                                    style={{ backgroundColor: accentColor, color: '#fff' }}
                                >
                                    Done
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
