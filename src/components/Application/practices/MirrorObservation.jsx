// src/components/Application/practices/MirrorObservation.jsx
// Mirror Mode: Observation - Establish a neutral, immutable anchor
// Redesigned: Full-screen immersive "Tunnel of Truth" experience
// Uses sentence builders instead of form fields

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChainStore } from '../../../state/chainStore.js';
import { SentenceBuilder, ActorActionBuilder } from '../SentenceBuilder.jsx';
import { MirrorSeal } from '../MirrorSeal.jsx';

void motion;

// Build neutral sentence from components
function buildNeutralSentence(context, actor, action, recipient) {
    const parts = [];

    if (context.time) parts.push(`At ${context.time}`);
    if (context.date) parts.push(`on ${context.date}`);
    if (context.location) parts.push(`at ${context.location}`);

    const contextStr = parts.join(', ');
    const actorStr = actor || '[Someone]';
    const actionStr = action || '[did something]';
    const recipientStr = recipient ? ` to ${recipient}` : '';

    if (contextStr) {
        return `${contextStr}, ${actorStr} ${actionStr}${recipientStr}.`;
    }
    return `${actorStr} ${actionStr}${recipientStr}.`;
}

// Build the "original" sentence with more narrative (for transformation effect)
function buildOriginalSentence(context, actor, action, recipient) {
    const parts = [];

    if (context.date) parts.push(context.date);
    if (context.time) parts.push(`around ${context.time}`);
    if (context.location) parts.push(`in ${context.location}`);

    const when = parts.length > 0 ? parts.join(', ') + ' — ' : '';
    const who = actor || 'Someone';
    const what = action || 'did something';
    const toWhom = recipient ? ` to ${recipient}` : '';

    return `${when}${who} ${what}${toWhom}.`;
}

// Phase indicator
function PhaseIndicator({ current, total }) {
    return (
        <div className="flex justify-center gap-2 items-center mb-4">
            {Array.from({ length: total }, (_, i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    animate={{
                        scale: i === current ? 1.3 : 1,
                        background: i < current
                            ? 'var(--accent-color)'
                            : i === current
                                ? 'rgba(255,220,120,0.7)'
                                : 'rgba(255,255,255,0.2)',
                    }}
                />
            ))}
        </div>
    );
}

export function MirrorObservation({ onComplete }) {
    const {
        activeChain,
        startNewChain,
        updateMirrorData,
        updateMirrorContext,
        lockMirror,
    } = useChainStore();

    const [phase, setPhase] = useState(0); // 0: context, 1: action, 2: seal

    // Auto-start chain if none exists
    useEffect(() => {
        if (!activeChain) {
            startNewChain();
        }
    }, [activeChain, startNewChain]);

    const mirrorData = activeChain?.mirror || {};
    const context = mirrorData.context || {};

    // Build sentences
    const neutralSentence = useMemo(() =>
        buildNeutralSentence(context, mirrorData.actor, mirrorData.action, mirrorData.recipient),
        [context, mirrorData.actor, mirrorData.action, mirrorData.recipient]
    );

    const originalSentence = useMemo(() =>
        buildOriginalSentence(context, mirrorData.actor, mirrorData.action, mirrorData.recipient),
        [context, mirrorData.actor, mirrorData.action, mirrorData.recipient]
    );

    // Check if phases are complete
    const contextComplete = context.date || context.time || context.location;
    const actionComplete = mirrorData.actor && mirrorData.action;

    // Handle context update from SentenceBuilder
    const handleContextChange = (field, value) => {
        updateMirrorContext(field, value);
    };

    // Handle actor/action update
    const handleActionChange = (field, value) => {
        updateMirrorData(field, value);
    };

    // Handle lock
    const handleLock = () => {
        lockMirror(neutralSentence, []);
        onComplete?.();
    };

    // Navigation
    const canProceed = phase === 0 ? contextComplete : actionComplete;

    const goNext = () => {
        if (phase < 2) setPhase(phase + 1);
    };

    const goBack = () => {
        if (phase > 0) setPhase(phase - 1);
    };

    return (
        <motion.div
            className="h-full flex flex-col overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header - Minimal */}
            <div className="text-center pt-6 pb-4">
                <motion.div
                    className="text-[10px] uppercase tracking-[0.25em] mb-1"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Mirror · Observation
                </motion.div>
                <PhaseIndicator current={phase} total={3} />
            </div>

            {/* Content Area - Full height */}
            <div className="flex-1 flex flex-col justify-center px-4">
                <AnimatePresence mode="wait">
                    {/* Phase 0: Context - When/Where */}
                    {phase === 0 && (
                        <motion.div
                            key="context"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-center"
                        >
                            <h2
                                className="text-xl mb-2"
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    color: 'rgba(255,255,255,0.9)',
                                }}
                            >
                                Ground the moment
                            </h2>
                            <p
                                className="text-[12px] mb-6"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                                Place this observation in time and space.
                            </p>

                            <SentenceBuilder
                                values={context}
                                onChange={handleContextChange}
                            />
                        </motion.div>
                    )}

                    {/* Phase 1: Actor/Action */}
                    {phase === 1 && (
                        <motion.div
                            key="action"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="text-center"
                        >
                            <h2
                                className="text-xl mb-2"
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    color: 'rgba(255,255,255,0.9)',
                                }}
                            >
                                What happened?
                            </h2>
                            <p
                                className="text-[12px] mb-4"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                                Describe only what a camera would capture.
                            </p>

                            <ActorActionBuilder
                                values={{
                                    actor: mirrorData.actor,
                                    action: mirrorData.action,
                                    recipient: mirrorData.recipient,
                                }}
                                onChange={handleActionChange}
                            />
                        </motion.div>
                    )}

                    {/* Phase 2: Seal */}
                    {phase === 2 && (
                        <motion.div
                            key="seal"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <MirrorSeal
                                originalSentence={originalSentence}
                                neutralSentence={neutralSentence}
                                onLock={handleLock}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Footer */}
            <div className="py-6 px-4">
                <div className="flex justify-center gap-4 items-center">
                    {/* Back button */}
                    {phase > 0 && phase < 2 && (
                        <motion.button
                            onClick={goBack}
                            className="px-5 py-2 rounded-full text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.5)',
                            }}
                        >
                            ← Back
                        </motion.button>
                    )}

                    {/* Next button */}
                    {phase < 2 && (
                        <motion.button
                            onClick={goNext}
                            disabled={!canProceed}
                            className="px-6 py-2.5 rounded-full text-sm"
                            whileHover={canProceed ? { scale: 1.05 } : {}}
                            whileTap={canProceed ? { scale: 0.95 } : {}}
                            style={{
                                background: canProceed
                                    ? 'linear-gradient(135deg, rgba(255,220,120,0.2) 0%, rgba(255,220,120,0.1) 100%)'
                                    : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${canProceed ? 'var(--accent-40)' : 'rgba(255,255,255,0.1)'}`,
                                color: canProceed ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)',
                                cursor: canProceed ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {phase === 1 ? 'Review →' : 'Continue →'}
                        </motion.button>
                    )}
                </div>

                {/* Skip option for context phase */}
                {phase === 0 && !contextComplete && (
                    <div className="text-center mt-3">
                        <button
                            onClick={goNext}
                            className="text-[10px] italic"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                            Skip context →
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
