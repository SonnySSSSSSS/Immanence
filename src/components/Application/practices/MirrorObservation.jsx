// src/components/Application/practices/MirrorObservation.jsx
// Mirror Mode: Observation - Establish a neutral, immutable anchor
// IE v1 Spec: Form-based input with E-Prime validation (hard reject structural violations)

import React, { useState, useMemo, useEffect } from 'react';
import { useChainStore } from '../../../state/chainStore.js';
import { validateMirrorEntry } from '../../../services/llmService.js';
import {
    MirrorValidationFeedback,
    MirrorValidationError,
    MirrorValidationLoading
} from './MirrorValidationFeedback.jsx';
import {
    E_PRIME_VIOLATIONS,
    SUBJECTIVE_MODIFIERS,
    INTENT_WORDS,
    CONTEXT_CATEGORIES
} from '../../../data/fourModes.js';

// Validation result types
const VALIDATION_RESULT = {
    VALID: 'valid',
    HARD_REJECT: 'hard_reject',
    SOFT_WARNING: 'soft_warning',
};

// Validate text for E-Prime violations (hard reject)
function validateEPrime(text, fieldName) {
    const words = text.toLowerCase().split(/\s+/);
    const violations = [];

    for (const word of words) {
        // Check E-Prime violations (forms of "to be")
        if (E_PRIME_VIOLATIONS.includes(word)) {
            // Only hard reject in action field (the core observation)
            if (fieldName === 'action') {
                violations.push({ word, type: 'e_prime', severity: 'hard' });
            } else {
                violations.push({ word, type: 'e_prime', severity: 'soft' });
            }
        }

        // Check intent words (hard reject in action field)
        if (INTENT_WORDS.includes(word)) {
            if (fieldName === 'action') {
                violations.push({ word, type: 'intent', severity: 'hard' });
            } else {
                violations.push({ word, type: 'intent', severity: 'soft' });
            }
        }

        // Check subjective modifiers (soft warning)
        if (SUBJECTIVE_MODIFIERS.includes(word)) {
            violations.push({ word, type: 'subjective', severity: 'soft' });
        }
    }

    return violations;
}

// Build neutral sentence from components
function buildNeutralSentence(context, actor, action, recipient) {
    const parts = [];

    if (context.time) parts.push(`At ${context.time}`);
    if (context.date) parts.push(`on ${context.date}`);
    if (context.location) parts.push(`at ${context.location}`);

    const contextStr = parts.join(', ');
    const actorStr = actor || '[Actor]';
    const actionStr = action || '[Action]';
    const recipientStr = recipient ? ` ${recipient}` : '';

    if (contextStr) {
        return `${contextStr}, ${actorStr} ${actionStr}${recipientStr}.`;
    }
    return `${actorStr} ${actionStr}${recipientStr}.`;
}

export function MirrorObservation({ onComplete }) {
    const {
        activeChain,
        startNewChain,
        updateMirrorData,
        updateMirrorContext,
        lockMirror,
        setMirrorLLMValidation,
    } = useChainStore();

    const [phase, setPhase] = useState('context'); // context | components | review | confirm
    const [neutralSentenceConfirmed, setNeutralSentenceConfirmed] = useState(false);

    // Auto-start chain if none exists
    useEffect(() => {
        if (!activeChain) {
            startNewChain();
        }
    }, [activeChain, startNewChain]);

    const mirrorData = activeChain?.mirror || {};
    const context = mirrorData.context || {};

    // Validate all fields
    const validation = useMemo(() => {
        const actorViolations = validateEPrime(mirrorData.actor || '', 'actor');
        const actionViolations = validateEPrime(mirrorData.action || '', 'action');
        const recipientViolations = validateEPrime(mirrorData.recipient || '', 'recipient');

        const allViolations = [...actorViolations, ...actionViolations, ...recipientViolations];
        const hasHardReject = allViolations.some(v => v.severity === 'hard');
        const hasSoftWarning = allViolations.some(v => v.severity === 'soft');

        return {
            actorViolations,
            actionViolations,
            recipientViolations,
            allViolations,
            hasHardReject,
            hasSoftWarning,
            result: hasHardReject ? VALIDATION_RESULT.HARD_REJECT
                : hasSoftWarning ? VALIDATION_RESULT.SOFT_WARNING
                    : VALIDATION_RESULT.VALID,
        };
    }, [mirrorData.actor, mirrorData.action, mirrorData.recipient]);

    // Build the neutral sentence
    const neutralSentence = useMemo(() =>
        buildNeutralSentence(context, mirrorData.actor, mirrorData.action, mirrorData.recipient),
        [context, mirrorData.actor, mirrorData.action, mirrorData.recipient]
    );

    // Check if required fields are filled
    const contextComplete = context.date || context.time || context.location;
    const componentsComplete = mirrorData.actor && mirrorData.action;

    // LLM validation state
    const llmValidation = mirrorData.llmValidation || { status: 'idle', result: null };

    // Handle LLM validation
    const handleValidateLLM = async () => {
        setMirrorLLMValidation('validating');

        try {
            const result = await validateMirrorEntry({
                context: {
                    date: context.date || '',
                    time: context.time || '',
                    location: context.location || '',
                },
                actor: mirrorData.actor || '',
                action: mirrorData.action || '',
                recipient: mirrorData.recipient || '',
            });

            if (result.success && result.data) {
                setMirrorLLMValidation('success', result.data);
            } else {
                setMirrorLLMValidation('error', { message: result.error || 'Validation failed' });
            }
        } catch (error) {
            setMirrorLLMValidation('error', { message: error.message });
        }
    };

    // Handle lock (with or without LLM validation)
    const handleLock = (skipLLM = false) => {
        if (skipLLM) {
            setMirrorLLMValidation('skipped');
        }

        const warnings = validation.allViolations
            .filter(v => v.severity === 'soft')
            .map(v => `${v.word} (${v.type})`);

        lockMirror(neutralSentence, warnings);
        onComplete?.();
    };

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: Context
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'context') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Mirror — Step 1 of 3
                </p>
                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    When and where did this happen?
                </h2>
                <p
                    className="text-xs mb-6 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Ground the observation in time and space.
                </p>

                {/* Date input */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">Date</label>
                    <input
                        type="date"
                        value={context.date || ''}
                        onChange={(e) => updateMirrorContext('date', e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50"
                    />
                </div>

                {/* Time input */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">Time</label>
                    <input
                        type="time"
                        value={context.time || ''}
                        onChange={(e) => updateMirrorContext('time', e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50"
                    />
                </div>

                {/* Location input */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">Location</label>
                    <input
                        type="text"
                        value={context.location || ''}
                        onChange={(e) => updateMirrorContext('location', e.target.value)}
                        placeholder="E.g., Office, Home, Coffee shop..."
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-400/50"
                    />
                </div>

                {/* Context category */}
                <div className="w-full max-w-sm mb-6">
                    <label className="text-xs text-white/40 block mb-1">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                        {CONTEXT_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => updateMirrorContext('category', cat)}
                                className="px-2 py-1.5 rounded text-xs capitalize transition-all"
                                style={{
                                    background: context.category === cat
                                        ? 'rgba(147, 197, 253, 0.3)'
                                        : 'rgba(255,255,255,0.05)',
                                    color: context.category === cat
                                        ? 'rgba(255,255,255,0.95)'
                                        : 'rgba(255,255,255,0.6)',
                                    border: `1px solid ${context.category === cat ? 'rgba(147, 197, 253, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Next */}
                <button
                    onClick={() => setPhase('components')}
                    className="px-6 py-2 rounded border transition-all"
                    style={{
                        borderColor: 'rgba(147, 197, 253, 0.5)',
                        color: 'rgba(147, 197, 253, 0.9)',
                    }}
                >
                    NEXT
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: Components (Actor, Action, Recipient)
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'components') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Mirror — Step 2 of 3
                </p>
                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What physically happened?
                </h2>
                <p
                    className="text-xs mb-6 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Would a video camera capture this?
                </p>

                {/* Actor */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">
                        Actor <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={mirrorData.actor || ''}
                        onChange={(e) => updateMirrorData('actor', e.target.value)}
                        placeholder="Who took the action? (Use names, not labels)"
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-400/50"
                    />
                    {validation.actorViolations.length > 0 && (
                        <p className="text-xs mt-1 text-yellow-400/80">
                            ⚠ {validation.actorViolations.map(v => v.word).join(', ')} — consider simplifying
                        </p>
                    )}
                </div>

                {/* Action */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">
                        Action <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={mirrorData.action || ''}
                        onChange={(e) => updateMirrorData('action', e.target.value)}
                        placeholder="What did they do? (Said, Walked, Sent...)"
                        className={`w-full px-3 py-2 rounded bg-white/5 border text-white text-sm placeholder-white/30 focus:outline-none ${validation.actionViolations.some(v => v.severity === 'hard')
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/10 focus:border-blue-400/50'
                            }`}
                    />
                    {validation.actionViolations.filter(v => v.severity === 'hard').length > 0 && (
                        <p className="text-xs mt-1 text-red-400">
                            ✕ Rejected: "{validation.actionViolations.filter(v => v.severity === 'hard').map(v => v.word).join(', ')}" implies judgment or intent. Use observable verbs.
                        </p>
                    )}
                    {validation.actionViolations.filter(v => v.severity === 'soft').length > 0 &&
                        validation.actionViolations.filter(v => v.severity === 'hard').length === 0 && (
                            <p className="text-xs mt-1 text-yellow-400/80">
                                ⚠ This appears interpretive. Consider simplifying.
                            </p>
                        )}
                </div>

                {/* Recipient */}
                <div className="w-full max-w-sm mb-6">
                    <label className="text-xs text-white/40 block mb-1">Recipient (optional)</label>
                    <input
                        type="text"
                        value={mirrorData.recipient || ''}
                        onChange={(e) => updateMirrorData('recipient', e.target.value)}
                        placeholder="Who or what received the action?"
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-400/50"
                    />
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('context')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        BACK
                    </button>
                    <button
                        onClick={() => setPhase('review')}
                        disabled={!componentsComplete || validation.hasHardReject}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: (!componentsComplete || validation.hasHardReject)
                                ? 'rgba(255,255,255,0.2)'
                                : 'rgba(147, 197, 253, 0.5)',
                            color: (!componentsComplete || validation.hasHardReject)
                                ? 'rgba(255,255,255,0.4)'
                                : 'rgba(147, 197, 253, 0.9)',
                            opacity: (!componentsComplete || validation.hasHardReject) ? 0.5 : 1,
                        }}
                    >
                        NEXT
                    </button>
                </div>

                {validation.hasHardReject && (
                    <p className="text-xs mt-4 text-red-400/80 text-center max-w-sm">
                        Cannot proceed until structural violations are resolved.
                    </p>
                )}
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: Review & Confirm
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'review') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-8 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Mirror — Step 3 of 3
                </p>
                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    The Neutral Sentence
                </h2>
                <p
                    className="text-xs mb-6 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    This will become the immutable anchor for this chain.
                </p>

                {/* The neutral sentence */}
                <div
                    className="w-full max-w-md mb-6 p-4 rounded-lg"
                    style={{
                        background: 'rgba(147, 197, 253, 0.1)',
                        border: '1px solid rgba(147, 197, 253, 0.3)',
                    }}
                >
                    <p
                        className="text-center"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.95)',
                            lineHeight: 1.6,
                        }}
                    >
                        "{neutralSentence}"
                    </p>
                </div>

                {/* Warnings (if any) */}
                {validation.hasSoftWarning && (
                    <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                        <p className="text-xs text-yellow-400/90 text-center">
                            ⚠ Word-list warnings: {validation.allViolations
                                .filter(v => v.severity === 'soft')
                                .map(v => v.word)
                                .join(', ')}
                        </p>
                        <p className="text-xs text-white/50 text-center mt-1">
                            You may proceed, but consider whether these are observable facts.
                        </p>
                    </div>
                )}

                {/* LLM Validation Section */}
                <div className="w-full max-w-md mb-4">
                    {/* Validate button - show when idle or success with clean result */}
                    {llmValidation.status === 'idle' && (
                        <button
                            onClick={handleValidateLLM}
                            className="w-full px-4 py-2.5 rounded border transition-all text-sm"
                            style={{
                                borderColor: 'rgba(147, 197, 253, 0.4)',
                                color: 'rgba(147, 197, 253, 0.9)',
                                background: 'rgba(147, 197, 253, 0.08)',
                            }}
                        >
                            ✨ Validate with AI
                        </button>
                    )}

                    {/* Loading state */}
                    {llmValidation.status === 'validating' && (
                        <MirrorValidationLoading />
                    )}

                    {/* Success - show feedback */}
                    {llmValidation.status === 'success' && llmValidation.result && (
                        <MirrorValidationFeedback
                            result={llmValidation.result}
                            onDismiss={() => setMirrorLLMValidation('idle')}
                        />
                    )}

                    {/* Error state */}
                    {llmValidation.status === 'error' && (
                        <MirrorValidationError
                            onRetry={handleValidateLLM}
                            onSkip={() => handleLock(true)}
                        />
                    )}

                    {/* Skipped indicator */}
                    {llmValidation.status === 'skipped' && (
                        <div className="text-xs text-white/40 text-center">
                            AI validation skipped
                        </div>
                    )}
                </div>

                {/* Confirmation checkbox - show after validation or if skipped */}
                {(llmValidation.status === 'success' || llmValidation.status === 'skipped' || llmValidation.status === 'idle') && (
                    <label className="flex items-center gap-3 mb-6 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={neutralSentenceConfirmed}
                            onChange={(e) => setNeutralSentenceConfirmed(e.target.checked)}
                            className="w-4 h-4 accent-blue-400"
                        />
                        <span className="text-sm text-white/70">
                            I confirm this describes what happened, not what I think about it.
                        </span>
                    </label>
                )}

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('components')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        EDIT
                    </button>

                    {/* Lock button - enabled when confirmed AND (validated clean OR validation skipped/idle) */}
                    {(llmValidation.status !== 'validating') && (
                        <button
                            onClick={() => handleLock(false)}
                            disabled={!neutralSentenceConfirmed}
                            className="px-6 py-2 rounded border transition-all"
                            style={{
                                borderColor: neutralSentenceConfirmed
                                    ? 'rgba(147, 197, 253, 0.7)'
                                    : 'rgba(255,255,255,0.2)',
                                color: neutralSentenceConfirmed
                                    ? 'rgba(147, 197, 253, 1)'
                                    : 'rgba(255,255,255,0.4)',
                                background: neutralSentenceConfirmed
                                    ? 'rgba(147, 197, 253, 0.15)'
                                    : 'transparent',
                            }}
                        >
                            LOCK MIRROR
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
