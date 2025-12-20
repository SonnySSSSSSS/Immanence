// src/components/wisdom/SelfKnowledgeView.jsx
// Self-Knowledge section for Wave Function management
// Houses personality assessments and profile display

import React, { useState } from 'react';
import { useWaveStore } from '../../state/waveStore.js';
import { BigFiveAssessment } from './BigFiveAssessment.jsx';
import { PersonalityWave } from './PersonalityWave.jsx';

export function SelfKnowledgeView() {
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentType, setAssessmentType] = useState(null);
    const [draftScores, setDraftScores] = useState(null);

    const bigFive = useWaveStore(state => state.bigFive);
    const viaTopStrengths = useWaveStore(state => state.viaTopStrengths);
    const enneagram = useWaveStore(state => state.enneagram);
    const attachmentStyle = useWaveStore(state => state.attachmentStyle);
    const selfDescribedTags = useWaveStore(state => state.selfDescribedTags);
    const isMinimumViable = useWaveStore(state => state.isMinimumViable);
    const getTraitSummary = useWaveStore(state => state.getTraitSummary);
    const addSelfDescribedTag = useWaveStore(state => state.addSelfDescribedTag);
    const removeSelfDescribedTag = useWaveStore(state => state.removeSelfDescribedTag);

    const [newTag, setNewTag] = useState('');

    // If showing Big Five assessment
    if (showAssessment && assessmentType === 'bigFive') {
        return (
            <div className="space-y-6">
                {draftScores && (
                    <div className="px-2 pt-4">
                        <PersonalityWave scores={draftScores} height={100} />
                        <div className="text-[10px] text-center mt-2 opacity-40 uppercase tracking-widest">
                            Observing Draft Resonance...
                        </div>
                    </div>
                )}
                <BigFiveAssessment
                    onUpdate={(scores) => setDraftScores(scores)}
                    onComplete={() => {
                        setShowAssessment(false);
                        setAssessmentType(null);
                        setDraftScores(null);
                    }}
                    onCancel={() => {
                        setShowAssessment(false);
                        setAssessmentType(null);
                        setDraftScores(null);
                    }}
                />
            </div>
        );
    }

    const handleAddTag = () => {
        if (newTag.trim()) {
            addSelfDescribedTag(newTag);
            setNewTag('');
        }
    };

    const traits = getTraitSummary();

    return (
        <div className="space-y-6">
            {/* Header / Wave Visualization */}
            <div className="relative pt-2 pb-6">
                <div className="text-center mb-6">
                    <h2
                        className="text-[16px] uppercase tracking-[0.3em] mb-1"
                        style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--accent-color)' }}
                    >
                        Wave Function
                    </h2>
                    <p className="text-[12px] italic" style={{ color: 'rgba(253,251,245,0.5)' }}>
                        Your characteristic patterns for Four Modes guidance
                    </p>
                </div>

                {bigFive && (
                    <div className="px-2">
                        <PersonalityWave scores={bigFive.scores} height={120} />

                        {/* Harmonic Influence Legend */}
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 px-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-[#4ade80]/60">Amplitude</span>
                                <span className="text-[10px] text-white/40 italic">Sensitivity / Neuroticism</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-[#60a5fa]/60">Complexity</span>
                                <span className="text-[10px] text-white/40 italic">Curiosity / Openness</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-[#facc15]/60">Frequency</span>
                                <span className="text-[10px] text-white/40 italic">Social Velocity / Extraversion</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest text-[#f87171]/60">Regularity</span>
                                <span className="text-[10px] text-white/40 italic">Order / Conscientiousness</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status indicator */}
            <div
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit"
                style={{
                    background: isMinimumViable() ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    border: `1px solid ${isMinimumViable() ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                }}
            >
                <span style={{ color: isMinimumViable() ? '#4ade80' : '#fbbf24' }}>
                    {isMinimumViable() ? '✓' : '○'}
                </span>
                <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: isMinimumViable() ? '#4ade80' : '#fbbf24' }}
                >
                    {isMinimumViable() ? 'Profile Active' : 'Setup Required'}
                </span>
            </div>

            {/* Big Five Card */}
            <div
                className="p-5 rounded-2xl"
                style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: bigFive ? '1px solid var(--accent-20)' : '1px solid rgba(251, 191, 36, 0.3)',
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div
                            className="text-[12px] uppercase tracking-wider"
                            style={{ color: 'var(--accent-color)' }}
                        >
                            Personality (Big Five)
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(253,251,245,0.4)' }}>
                            {bigFive ? 'Required • Completed' : 'Required for Wave/Sword modes'}
                        </div>
                    </div>
                    {bigFive && (
                        <div
                            className="text-[9px] uppercase px-2 py-1 rounded-full"
                            style={{
                                background: 'var(--accent-10)',
                                color: 'var(--accent-color)',
                            }}
                        >
                            {bigFive.reliability} reliability
                        </div>
                    )}
                </div>

                {bigFive ? (
                    <>
                        {/* Score bars */}
                        <div className="space-y-2 mb-4">
                            {Object.entries(bigFive.scores).map(([dim, value]) => (
                                <div key={dim} className="flex items-center gap-3">
                                    <div
                                        className="w-24 text-[10px] uppercase tracking-wider"
                                        style={{ color: 'rgba(253,251,245,0.6)' }}
                                    >
                                        {dim.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div
                                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.1)' }}
                                    >
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${value * 100}%`,
                                                background: 'var(--accent-color)',
                                            }}
                                        />
                                    </div>
                                    <div
                                        className="w-8 text-[10px] text-right"
                                        style={{ color: 'rgba(253,251,245,0.5)' }}
                                    >
                                        {(value * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trait tags */}
                        {traits && traits.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {traits.map((trait, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-full text-[10px]"
                                        style={{
                                            background: 'var(--accent-10)',
                                            color: 'rgba(253,251,245,0.7)',
                                        }}
                                    >
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setAssessmentType('bigFive');
                                setShowAssessment(true);
                            }}
                            className="mt-3 text-[11px] uppercase tracking-wider"
                            style={{ color: 'var(--accent-60)' }}
                        >
                            Retake Assessment →
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => {
                            setAssessmentType('bigFive');
                            setShowAssessment(true);
                        }}
                        className="w-full py-3 rounded-xl text-[12px] uppercase tracking-wider transition-all"
                        style={{
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            color: '#fbbf24',
                        }}
                    >
                        Begin Assessment (~3 min)
                    </button>
                )}
            </div>

            {/* Optional assessments - coming soon */}
            <div className="space-y-3">
                <div
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: 'rgba(253,251,245,0.4)' }}
                >
                    Optional Assessments
                </div>

                {/* VIA Strengths */}
                <div
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--accent-10)',
                        opacity: 0.6,
                    }}
                >
                    <div>
                        <div className="text-[12px]" style={{ color: 'rgba(253,251,245,0.7)' }}>
                            Character Strengths (VIA)
                        </div>
                        <div className="text-[10px]" style={{ color: 'rgba(253,251,245,0.4)' }}>
                            Coming soon
                        </div>
                    </div>
                    <span style={{ color: 'rgba(253,251,245,0.3)' }}>○</span>
                </div>

                {/* Enneagram */}
                <div
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--accent-10)',
                        opacity: 0.6,
                    }}
                >
                    <div>
                        <div className="text-[12px]" style={{ color: 'rgba(253,251,245,0.7)' }}>
                            Enneagram Type
                        </div>
                        <div className="text-[10px]" style={{ color: 'rgba(253,251,245,0.4)' }}>
                            Coming soon
                        </div>
                    </div>
                    <span style={{ color: 'rgba(253,251,245,0.3)' }}>○</span>
                </div>
            </div>

            {/* Self-described tags */}
            <div
                className="p-4 rounded-xl"
                style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--accent-15)',
                }}
            >
                <div
                    className="text-[11px] uppercase tracking-wider mb-3"
                    style={{ color: 'var(--accent-color)' }}
                >
                    Self-Described Patterns
                </div>
                <div className="text-[10px] mb-3" style={{ color: 'rgba(253,251,245,0.4)' }}>
                    Add tags that describe your tendencies (e.g., "conflict-averse", "values-honesty")
                </div>

                {/* Existing tags transformed into Rune Stones */}
                {selfDescribedTags.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                        {selfDescribedTags.map((tag, i) => (
                            <div
                                key={i}
                                className="relative px-4 py-2 text-[11px] group overflow-hidden"
                                style={{
                                    // Irregular stone shape
                                    borderRadius: '12px 24px 18px 28px',
                                    background: 'linear-gradient(145deg, rgba(40,35,50,0.8), rgba(25,20,35,0.9))',
                                    border: '1px solid rgba(200,180,255,0.15)',
                                    boxShadow: 'inset 2px 2px 10px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                                    transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i % 3)}deg)`,
                                    fontFamily: 'Crimson Pro, Georgia, serif'
                                }}
                            >
                                {/* Stone texture overlay */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>

                                <div className="relative z-10 flex items-center gap-2">
                                    <span style={{ color: 'rgba(253,251,245,0.85)', letterSpacing: '0.05em' }}>
                                        {tag}
                                    </span>
                                    <button
                                        onClick={() => removeSelfDescribedTag(tag)}
                                        className="hover:text-red-400 transition-colors"
                                        style={{ color: 'rgba(253,251,245,0.3)' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new tag */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a tag..."
                        maxLength={30}
                        className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--accent-10)',
                            color: 'rgba(253,251,245,0.9)',
                        }}
                    />
                    <button
                        onClick={handleAddTag}
                        className="px-3 py-2 rounded-lg text-[12px]"
                        style={{
                            background: 'var(--accent-10)',
                            color: 'var(--accent-color)',
                            opacity: newTag.trim() ? 1 : 0.5,
                        }}
                        disabled={!newTag.trim()}
                    >
                        Add
                    </button>
                </div>
                <div className="text-[9px] mt-2 text-right" style={{ color: 'rgba(253,251,245,0.3)' }}>
                    {selfDescribedTags.length}/10 tags
                </div>
            </div>
        </div>
    );
}
