// src/components/Application/practices/SwordCommitment.jsx
// Sword Mode: Commitment - Define values-aligned action with acknowledged cost
// IE v1 Spec: Structured commitment fields (Value, Action, Cost, Obstacle, TimeBound)

import React, { useState, useMemo } from 'react';
import { useChainStore } from '../../../state/chainStore.js';
import { ACTION_TYPES } from '../../../data/fourModes.js';

// Vague intention patterns to reject
const VAGUE_PATTERNS = [
    'try to', 'try and', 'attempt to', 'hope to', 'want to',
    'maybe', 'might', 'probably', 'possibly', 'eventually',
    'be better', 'be nicer', 'be more', 'be less',
    'think about', 'consider', 'look into',
];

// Validate action for vagueness
function validateAction(text, actionType) {
    if (!text) return { isValid: false, reason: 'Action is required.' };

    const lowerText = text.toLowerCase();

    // Check for vague patterns
    for (const pattern of VAGUE_PATTERNS) {
        if (lowerText.includes(pattern)) {
            return {
                isValid: false,
                reason: `"${pattern}" is vague. Be specific about what you will or won't do.`,
            };
        }
    }

    // For non-action, check if it's just empty
    if (actionType === ACTION_TYPES.NON_ACTION && text.length < 10) {
        return { isValid: true, reason: null }; // Non-action has lower bar
    }

    // Check minimum specificity (rough heuristic)
    if (text.split(' ').length < 3 && actionType !== ACTION_TYPES.NON_ACTION) {
        return {
            isValid: false,
            reason: 'Action needs more specificity. What exactly will you do?',
        };
    }

    return { isValid: true, reason: null };
}

export function SwordCommitment({ onComplete }) {
    const {
        activeChain,
        updateSwordData,
        lockSword,
    } = useChainStore();

    const [phase, setPhase] = useState('value'); // value | action | cost | review
    const [commitmentConfirmed, setCommitmentConfirmed] = useState(false);

    const swordData = activeChain?.sword || {};
    const mirrorData = activeChain?.mirror || {};
    const prismData = activeChain?.prism || {};
    const waveData = activeChain?.wave || {};

    // Validate action
    const actionValidation = useMemo(() =>
        validateAction(swordData.action, swordData.actionType),
        [swordData.action, swordData.actionType]
    );

    // Check if required fields are filled
    const valueComplete = swordData.value?.length > 0;
    const actionComplete = swordData.action?.length > 0 && actionValidation.isValid;
    const costComplete = swordData.cost?.length > 0;
    const timeBoundComplete = swordData.timeBound?.length > 0;

    // Handle lock
    const handleLock = () => {
        lockSword();
        onComplete?.();
    };

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: Value at Stake
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'value') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Sword — Step 1 of 3
                </p>

                {/* Chain context (compact) */}
                <div
                    className="w-full max-w-md mb-4 p-2 rounded text-xs space-y-1"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <p style={{ color: 'rgba(147, 197, 253, 0.6)' }}>
                        Mirror: "{mirrorData.neutralSentence?.slice(0, 60)}..."
                    </p>
                    {prismData.locked && (
                        <p style={{ color: 'rgba(251, 191, 36, 0.6)' }}>
                            Prism: {prismData.unsupportedCount} unsupported / {prismData.supportedCount + prismData.unsupportedCount} total
                        </p>
                    )}
                    {waveData.locked && (
                        <p style={{ color: 'rgba(167, 139, 250, 0.6)' }}>
                            Wave: {waveData.startIntensity}/10 → {waveData.endIntensity}/10
                        </p>
                    )}
                </div>

                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What principle is at stake?
                </h2>
                <p
                    className="text-xs mb-4 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Name the value this situation touches.
                </p>

                <input
                    type="text"
                    value={swordData.value || ''}
                    onChange={(e) => updateSwordData('value', e.target.value)}
                    placeholder="E.g., Professionalism, Autonomy, Honesty, Self-respect..."
                    className="w-full max-w-sm px-3 py-2 mb-6 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400/50"
                />

                <button
                    onClick={() => setPhase('action')}
                    disabled={!valueComplete}
                    className="px-6 py-2 rounded border transition-all"
                    style={{
                        borderColor: valueComplete
                            ? 'rgba(248, 113, 113, 0.5)'
                            : 'rgba(255,255,255,0.2)',
                        color: valueComplete
                            ? 'rgba(248, 113, 113, 0.9)'
                            : 'rgba(255,255,255,0.4)',
                    }}
                >
                    NEXT
                </button>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: Action (or Non-Action)
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'action') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Sword — Step 2 of 3
                </p>

                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What will you do?
                </h2>
                <p
                    className="text-xs mb-4 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    Specific, verifiable, time-bound.
                </p>

                {/* Action type selector */}
                <div className="flex gap-2 mb-4">
                    {[
                        { id: ACTION_TYPES.ACTION, label: 'I will do', icon: '→' },
                        { id: ACTION_TYPES.RESTRAINT, label: 'I will not do', icon: '✕' },
                        { id: ACTION_TYPES.NON_ACTION, label: 'Conscious non-action', icon: '○' },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => updateSwordData('actionType', type.id)}
                            className="px-3 py-2 rounded text-xs transition-all"
                            style={{
                                background: swordData.actionType === type.id
                                    ? 'rgba(248, 113, 113, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                color: swordData.actionType === type.id
                                    ? 'rgba(248, 113, 113, 0.95)'
                                    : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${swordData.actionType === type.id ? 'rgba(248, 113, 113, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                            }}
                        >
                            {type.icon} {type.label}
                        </button>
                    ))}
                </div>

                {/* Action input */}
                <input
                    type="text"
                    value={swordData.action || ''}
                    onChange={(e) => updateSwordData('action', e.target.value)}
                    placeholder={
                        swordData.actionType === ACTION_TYPES.RESTRAINT
                            ? 'E.g., I will not send a reply email before the meeting'
                            : swordData.actionType === ACTION_TYPES.NON_ACTION
                                ? 'E.g., I will wait and observe without intervention'
                                : 'E.g., I will attend the meeting at 2:00 PM'
                    }
                    className={`w-full max-w-sm px-3 py-2 mb-2 rounded bg-white/5 border text-white text-sm placeholder-white/30 focus:outline-none ${!actionValidation.isValid && swordData.action
                            ? 'border-red-400/50 focus:border-red-400'
                            : 'border-white/10 focus:border-red-400/50'
                        }`}
                />

                {/* Validation error */}
                {!actionValidation.isValid && swordData.action && (
                    <p className="text-xs text-red-400/80 mb-4 max-w-sm text-center">
                        {actionValidation.reason}
                    </p>
                )}

                {/* Time bound */}
                <div className="w-full max-w-sm mb-4">
                    <label className="text-xs text-white/40 block mb-1">Time Bound</label>
                    <input
                        type="text"
                        value={swordData.timeBound || ''}
                        onChange={(e) => updateSwordData('timeBound', e.target.value)}
                        placeholder="E.g., Until 2:00 PM, For the next 24 hours, By Friday..."
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400/50"
                    />
                </div>

                {/* Obstacle (optional) */}
                <div className="w-full max-w-sm mb-6">
                    <label className="text-xs text-white/40 block mb-1">Primary Obstacle (optional)</label>
                    <input
                        type="text"
                        value={swordData.obstacle || ''}
                        onChange={(e) => updateSwordData('obstacle', e.target.value)}
                        placeholder="E.g., The urge to 'fix' this now, Fear of confrontation..."
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400/50"
                    />
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('value')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        BACK
                    </button>
                    <button
                        onClick={() => setPhase('cost')}
                        disabled={!actionComplete || !timeBoundComplete}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: (actionComplete && timeBoundComplete)
                                ? 'rgba(248, 113, 113, 0.5)'
                                : 'rgba(255,255,255,0.2)',
                            color: (actionComplete && timeBoundComplete)
                                ? 'rgba(248, 113, 113, 0.9)'
                                : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        NEXT
                    </button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: Cost & Review
    // ══════════════════════════════════════════════════════════════════
    if (phase === 'cost') {
        return (
            <div className="flex flex-col items-center h-full px-6 py-4 overflow-y-auto">
                <p
                    className="text-xs uppercase tracking-[0.2em] mb-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Sword — Step 3 of 3
                </p>

                <h2
                    className="text-lg mb-2 text-center"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.9)',
                    }}
                >
                    What does this cost?
                </h2>
                <p
                    className="text-xs mb-4 text-center max-w-sm"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    All actions have a cost. Denying it weakens commitment.
                </p>

                {/* Cost input */}
                <div className="w-full max-w-sm mb-6">
                    <input
                        type="text"
                        value={swordData.cost || ''}
                        onChange={(e) => updateSwordData('cost', e.target.value)}
                        placeholder="E.g., Sitting with uncertainty, Loss of 30 minutes, Potential awkwardness..."
                        className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400/50"
                    />
                    <div className="text-xs text-white/40 mt-2">
                        Examples: Time • Social discomfort • Ego • Energy • Opportunity cost
                    </div>
                </div>

                {/* Commitment summary */}
                <div
                    className="w-full max-w-md mb-4 p-4 rounded-lg"
                    style={{
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                    }}
                >
                    <p className="text-xs text-red-300/60 mb-2">Your Commitment:</p>
                    <p
                        className="text-sm mb-3"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            color: 'rgba(255,255,255,0.95)',
                        }}
                    >
                        <strong>Value:</strong> {swordData.value}
                    </p>
                    <p
                        className="text-sm mb-3"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            color: 'rgba(255,255,255,0.95)',
                        }}
                    >
                        <strong>
                            {swordData.actionType === ACTION_TYPES.RESTRAINT ? 'Restraint' :
                                swordData.actionType === ACTION_TYPES.NON_ACTION ? 'Non-Action' : 'Action'}:
                        </strong> {swordData.action}
                    </p>
                    <p
                        className="text-sm mb-3"
                        style={{
                            fontFamily: "'Crimson Pro', serif",
                            color: 'rgba(255,255,255,0.95)',
                        }}
                    >
                        <strong>Duration:</strong> {swordData.timeBound}
                    </p>
                    {swordData.cost && (
                        <p
                            className="text-sm"
                            style={{
                                fontFamily: "'Crimson Pro', serif",
                                color: 'rgba(255,255,255,0.95)',
                            }}
                        >
                            <strong>Cost:</strong> {swordData.cost}
                        </p>
                    )}
                </div>

                {/* Confirmation */}
                <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={commitmentConfirmed}
                        onChange={(e) => setCommitmentConfirmed(e.target.checked)}
                        className="w-4 h-4 accent-red-400"
                    />
                    <span className="text-sm text-white/70">
                        I acknowledge the cost and commit to this action.
                    </span>
                </label>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setPhase('action')}
                        className="px-4 py-2 rounded border border-white/20 text-white/50 hover:text-white/70 transition-all text-xs"
                    >
                        EDIT
                    </button>
                    <button
                        onClick={handleLock}
                        disabled={!costComplete || !commitmentConfirmed}
                        className="px-6 py-2 rounded border transition-all"
                        style={{
                            borderColor: (costComplete && commitmentConfirmed)
                                ? 'rgba(248, 113, 113, 0.7)'
                                : 'rgba(255,255,255,0.2)',
                            color: (costComplete && commitmentConfirmed)
                                ? 'rgba(248, 113, 113, 1)'
                                : 'rgba(255,255,255,0.4)',
                            background: (costComplete && commitmentConfirmed)
                                ? 'rgba(248, 113, 113, 0.15)'
                                : 'transparent',
                        }}
                    >
                        LOCK COMMITMENT
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
