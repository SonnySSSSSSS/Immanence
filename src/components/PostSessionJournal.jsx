// src/components/PostSessionJournal.jsx
// Post-Session Capture Modal
// Phase 2: Routes to CircuitJournalForm for circuits, micro-note form for sessions

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useJournalStore, ATTENTION_QUALITIES, TECH_NOTE_PLACEHOLDERS, CHALLENGE_TAXONOMY } from '../state/journalStore.js';
import { useLunarStore } from '../state/lunarStore.js';
import { CircuitJournalForm } from './CircuitJournalForm.jsx';

export function PostSessionJournal({ sessionId, completedCircuitLog, onComplete }) {
    // Phase 2: Check if this is a circuit or single session
    // If completedCircuitLog is provided, it's a circuit
    const isCircuit = !!completedCircuitLog;
    
    if (isCircuit) {
        // Route to circuit-specific form
        return (
            <CircuitJournalForm
                completedCircuitLog={completedCircuitLog}
                onClose={onComplete}
            />
        );
    }
    
    // Otherwise, show single session micro-note form (Phase 1 behavior)
    return <SingleSessionJournalForm sessionId={sessionId} onComplete={onComplete} />;
}

/**
 * SingleSessionJournalForm
 * Original micro-note capture for single practice sessions (Phase 1)
 */
function SingleSessionJournalForm({ sessionId, onComplete }) {
    const { stage } = useLunarStore();
    const {
        pendingMicroNote,
        updateMicroNote,
        nextMicroNoteStep,
        completeMicroNote,
        cancelMicroNote
    } = useJournalStore();

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
        completeMicroNote();
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

                        {/* Step 4: Challenge Tag */}
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
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(CHALLENGE_TAXONOMY).map(([key, category]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                updateMicroNote('challengeTag', key);
                                                setTimeout(() => nextMicroNoteStep(), 300);
                                            }}
                                            className="px-3 py-2 rounded-lg font-medium text-xs transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: formData.challengeTag === key ? accentColor : borderColor,
                                                color: formData.challengeTag === key ? '#fff' : textMain,
                                                border: `1px solid ${borderColor}`
                                            }}
                                        >
                                            {category.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => nextMicroNoteStep()}
                                    className="w-full py-2 rounded-lg font-medium text-sm mt-2"
                                    style={{ backgroundColor: borderColor, color: textMain }}
                                >
                                    Skip Challenge Tag
                                </button>
                            </motion.div>
                        )}

                        {/* Step 5: Complete */}
                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 text-center"
                            >
                                <p className="text-lg font-bold" style={{ color: textMain }}>
                                    âœ“ Session logged
                                </p>
                                <p className="text-sm" style={{ color: textSub }}>
                                    Your practice reflects the nature of your being
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

                {/* Footer: Cancel Button */}
                {step !== 'done' && (
                    <div className="px-6 pb-6">
                        <button
                            onClick={() => cancelMicroNote()}
                            className="w-full py-2 text-sm font-medium rounded-lg"
                            style={{ backgroundColor: borderColor, color: textSub }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
