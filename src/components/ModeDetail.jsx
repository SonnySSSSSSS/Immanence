// src/components/ModeDetail.jsx
// Four Modes detail page with training entry point
import React, { useState } from 'react';
import { FOUR_MODES_BY_ID } from '../data/fourModes.js';
import { ModeTraining } from './Application/ModeTraining.jsx';
import { PRACTICE_DEFINITIONS } from '../state/practiceConfig.js';

function Section({ title, children }) {
    return (
        <div className="space-y-3">
            <h3
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: 'var(--accent-color)' }}
            >
                {title}
            </h3>
            <div
                className="text-[14px] leading-relaxed"
                style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.8)' }}
            >
                {children}
            </div>
        </div>
    );
}

export function ModeDetail({ modeId, onBack }) {
    const [trainingOpen, setTrainingOpen] = useState(false);
    const mode = FOUR_MODES_BY_ID[modeId];
    const practice = PRACTICE_DEFINITIONS[modeId];

    if (!mode) {
        return (
            <div className="text-center py-12 text-[rgba(253,251,245,0.5)]">
                Mode not found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] transition-all hover:opacity-100"
                style={{ color: 'var(--accent-color)', opacity: 0.7 }}
            >
                <span>←</span>
                <span>Four Modes</span>
                <span style={{ color: 'rgba(253,251,245,0.4)' }}>›</span>
                <span>{mode.name}</span>
            </button>

            {/* Header */}
            <div className="text-center pb-4 border-b border-[var(--accent-10)]">
                <div
                    className="text-3xl mb-3"
                    style={{ color: 'var(--accent-color)' }}
                >
                    {mode.icon}
                </div>
                <h2
                    className="text-[18px] uppercase tracking-[0.15em] mb-2"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
                >
                    {mode.name}
                </h2>
                <p
                    className="text-[14px] italic"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.7)' }}
                >
                    "{mode.tagline}"
                </p>
            </div>

            {/* Enter Practice Button - Primary CTA */}
            <div className="flex justify-center py-4">
                <button
                    onClick={() => setTrainingOpen(true)}
                    className="px-8 py-4 rounded-xl border transition-all hover:scale-[1.02]"
                    style={{
                        background: `linear-gradient(145deg, ${practice?.accent}15, ${practice?.accent}05)`,
                        borderColor: practice?.accent || 'var(--accent-30)',
                        boxShadow: `0 4px 20px ${practice?.accent}20`,
                    }}
                >
                    <span
                        className="text-[12px] uppercase tracking-[0.15em] font-semibold"
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            color: practice?.accent || 'var(--accent-color)',
                        }}
                    >
                        Enter {mode.name} Practice
                    </span>
                </button>
            </div>

            {/* Understanding Section */}
            <div className="space-y-8">
                <Section title="About This Mode">
                    <p>{mode.description}</p>
                </Section>

                <Section title="When to Use It">
                    <p style={{ fontStyle: 'italic', color: 'rgba(253,251,245,0.6)' }}>
                        {modeId === 'mirror' && "When you need to see clearly without distortion. When reactions are running ahead of awareness."}
                        {modeId === 'resonator' && "When emotions feel overwhelming or stuck. When the body holds tension you can't name."}
                        {modeId === 'prism' && "When you're trapped in one interpretation. When the story feels fixed but doesn't serve you."}
                        {modeId === 'sword' && "When clarity exists but action doesn't follow. When hesitation has become the pattern."}
                    </p>
                </Section>

                <Section title="The Practice">
                    <p style={{ fontStyle: 'italic', color: 'rgba(253,251,245,0.6)' }}>
                        {modeId === 'mirror' && "90 seconds of stillness. Let what is be enough."}
                        {modeId === 'resonator' && "5 steps through sensation, emotion, story, need, and back to sensation. Skip what can't be named."}
                        {modeId === 'prism' && "3 frames: what happened, what else could this mean, which frame gives you a next move."}
                        {modeId === 'sword' && "3 prompts: what needs to stop, what needs to start, smallest real step today."}
                    </p>
                </Section>
            </div>

            {/* Training Modal */}
            <ModeTraining
                mode={modeId}
                isOpen={trainingOpen}
                onClose={() => setTrainingOpen(false)}
            />
        </div>
    );
}
