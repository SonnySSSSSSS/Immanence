// src/components/ModeDetail.jsx
// Four Modes detail page with placeholder sections

import React from 'react';
import { FOUR_MODES_BY_ID } from '../data/fourModes.js';

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

function PlaceholderBlock({ text = 'Content coming soon...' }) {
    return (
        <div
            className="p-4 rounded-xl border border-dashed"
            style={{
                borderColor: 'var(--accent-15)',
                background: 'rgba(0,0,0,0.2)',
                color: 'rgba(253,251,245,0.5)',
                fontStyle: 'italic',
            }}
        >
            {text}
        </div>
    );
}

function PlaceholderSteps() {
    const steps = [
        'Step 1: [Placeholder for first step]',
        'Step 2: [Placeholder for second step]',
        'Step 3: [Placeholder for third step]',
    ];

    return (
        <div className="space-y-2">
            {steps.map((step, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                    <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                        style={{ background: 'var(--accent-20)', color: 'var(--accent-color)' }}
                    >
                        {i + 1}
                    </span>
                    <span style={{ color: 'rgba(253,251,245,0.6)', fontStyle: 'italic' }}>
                        {step}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function ModeDetail({ modeId, onBack }) {
    const mode = FOUR_MODES_BY_ID[modeId];

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

            {/* Sections */}
            <div className="space-y-8">
                <Section title="Understand">
                    <PlaceholderBlock text={`TODO: Explanation of ${mode.name} mode. ${mode.description}`} />
                </Section>

                <Section title="When to Use It">
                    <PlaceholderBlock text={`TODO: Situations where ${mode.name} helps.`} />
                </Section>

                <Section title="How to Practice">
                    <PlaceholderSteps />
                </Section>

                <Section title="Reflection Prompts">
                    <PlaceholderBlock text="TODO: Questions to ask yourself in this mode." />
                </Section>

                <Section title="Integration with Tracking">
                    <PlaceholderBlock text="TODO: How this mode shows up in your practice data." />
                </Section>
            </div>
        </div>
    );
}
