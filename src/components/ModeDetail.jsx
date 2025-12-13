// src/components/ModeDetail.jsx
// Four Modes detail page - Threshold, not button
// Temporal arc: Orientation → Engagement → Integration
import React, { useState, useEffect } from 'react';
import { FOUR_MODES_BY_ID } from '../data/fourModes.js';
import { ModeTraining } from './Application/ModeTraining.jsx';
import { PRACTICE_DEFINITIONS } from '../state/practiceConfig.js';

// Mode-specific consequence anchors (gravity without authority)
const MODE_CONSEQUENCES = {
    mirror: "What you can't see, you can't choose about.",
    resonator: "Unfelt emotion doesn't disappear. It modulates behavior.",
    prism: "The story you tell yourself becomes the world you live in.",
    sword: "Delayed action doesn't wait for you. It reshapes the field.",
};

// Responsive Beacon Component - Active field, not logo
function ModeBeacon({ modeId, practice }) {
    const [pulsePhase, setPulsePhase] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Slow phase-based modulation
    useEffect(() => {
        const interval = setInterval(() => {
            setPulsePhase(p => (p + 1) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const glowIntensity = 0.3 + Math.sin(pulsePhase * Math.PI / 180) * 0.15;
    const scale = 1 + Math.sin(pulsePhase * Math.PI / 90) * 0.02;

    return (
        <div
            className="relative w-32 h-32 mx-auto transition-all duration-300"
            style={{
                transform: `scale(${isHovered ? scale * 1.05 : scale})`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Field glow - originates from within */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${practice?.accent}${Math.round(glowIntensity * 100).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    transition: 'opacity 0.5s ease',
                    opacity: isHovered ? 1 : 0.8,
                }}
            />

            {/* Concentric rings - continuous, no terminations */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 128 128"
                style={{ opacity: isHovered ? 0.9 : 0.6 }}
            >
                {[40, 52, 64].map((r, i) => (
                    <circle
                        key={r}
                        cx="64"
                        cy="64"
                        r={r}
                        fill="none"
                        stroke={practice?.accent || 'var(--accent-color)'}
                        strokeWidth="0.5"
                        opacity={0.3 + i * 0.1}
                        style={{
                            transform: `rotate(${pulsePhase * (i % 2 === 0 ? 1 : -1) * 0.3}deg)`,
                            transformOrigin: 'center',
                        }}
                    />
                ))}
                {/* Central point - subtle, not focal */}
                <circle cx="64" cy="64" r="3" fill={practice?.accent} opacity="0.5" />
            </svg>
        </div>
    );
}

// Cyclic Section Component - stations on a loop, not list items
function CyclicStation({ title, children, accent, index }) {
    const markers = ['◇', '○', '△'];

    return (
        <div className="relative pl-8">
            {/* Glyph marker - suggests recurrence */}
            <div
                className="absolute left-0 top-1 text-[10px]"
                style={{ color: accent, opacity: 0.5 }}
            >
                {markers[index % 3]}
            </div>

            {/* Content */}
            <div className="space-y-2">
                <h3
                    className="text-[11px] uppercase tracking-[0.12em]"
                    style={{ color: accent, opacity: 0.8 }}
                >
                    {title}
                </h3>
                <div
                    className="text-[13px] leading-relaxed"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.65)' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ModeDetail({ modeId, onBack }) {
    const [trainingOpen, setTrainingOpen] = useState(false);
    const [ctaHovered, setCtaHovered] = useState(false);
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
        <div className="space-y-8">
            {/* ═══════════════════════════════════════════════════════════════
                ORIENTATION LAYER — Where am I right now?
                ═══════════════════════════════════════════════════════════════ */}

            {/* Breadcrumb - minimal */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] transition-all hover:opacity-100"
                style={{ color: practice?.accent || 'var(--accent-color)', opacity: 0.5 }}
            >
                <span>←</span>
                <span>Four Modes</span>
                <span style={{ color: 'rgba(253,251,245,0.3)' }}>›</span>
                <span>{mode.name}</span>
            </button>

            {/* Beacon - Active field, not logo */}
            <ModeBeacon modeId={modeId} practice={practice} />

            {/* Mode identity */}
            <div className="text-center space-y-2">
                <h2
                    className="text-[20px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
                >
                    {mode.name}
                </h2>
                <p
                    className="text-[13px] italic"
                    style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.6)' }}
                >
                    "{mode.tagline}"
                </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ENGAGEMENT LAYER — The threshold
                ═══════════════════════════════════════════════════════════════ */}

            {/* CTA - Entry, not navigation */}
            <div
                className="flex justify-center py-6"
                style={{
                    // Subtle visual separation - threshold zone
                    background: ctaHovered
                        ? `radial-gradient(ellipse 100% 100% at center, ${practice?.accent}10, transparent 70%)`
                        : 'transparent',
                    transition: 'background 0.5s ease',
                }}
            >
                <button
                    onClick={() => setTrainingOpen(true)}
                    onMouseEnter={() => setCtaHovered(true)}
                    onMouseLeave={() => setCtaHovered(false)}
                    className="px-10 py-5 rounded-2xl border transition-all duration-300"
                    style={{
                        background: ctaHovered
                            ? `linear-gradient(145deg, ${practice?.accent}20, ${practice?.accent}08)`
                            : 'transparent',
                        borderColor: ctaHovered
                            ? practice?.accent
                            : `${practice?.accent}40`,
                        boxShadow: ctaHovered
                            ? `0 8px 32px ${practice?.accent}25, inset 0 0 20px ${practice?.accent}10`
                            : 'none',
                        transform: ctaHovered ? 'scale(1.02)' : 'scale(1)',
                    }}
                >
                    <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{
                            fontFamily: 'Outfit, sans-serif',
                            color: practice?.accent,
                            opacity: ctaHovered ? 1 : 0.8,
                        }}
                    >
                        Enter {mode.name} Practice
                    </span>
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                INTEGRATION LAYER — What does this touch after?
                ═══════════════════════════════════════════════════════════════ */}

            {/* Cyclic sections - stations on a loop */}
            <div
                className="space-y-6 pt-4"
                style={{
                    borderTop: `1px solid ${practice?.accent}15`,
                }}
            >
                <CyclicStation title="What is active" accent={practice?.accent} index={0}>
                    <p>{mode.description}</p>
                </CyclicStation>

                <CyclicStation title="How it announces itself" accent={practice?.accent} index={1}>
                    <p style={{ fontStyle: 'italic' }}>
                        {modeId === 'mirror' && "When you need to see clearly without distortion. When reactions are running ahead of awareness."}
                        {modeId === 'resonator' && "When emotions feel overwhelming or stuck. When the body holds tension you can't name."}
                        {modeId === 'prism' && "When you're trapped in one interpretation. When the story feels fixed but doesn't serve you."}
                        {modeId === 'sword' && "When clarity exists but action doesn't follow. When hesitation has become the pattern."}
                    </p>
                </CyclicStation>

                <CyclicStation title="How to stay with it" accent={practice?.accent} index={2}>
                    <p style={{ fontStyle: 'italic' }}>
                        {modeId === 'mirror' && "90 seconds of stillness. Let what is be enough."}
                        {modeId === 'resonator' && "5 steps through sensation, emotion, story, need, and back to sensation. Stay with what can't be named."}
                        {modeId === 'prism' && "3 frames: what happened, what else could this mean, which frame gives you a next move."}
                        {modeId === 'sword' && "3 prompts: what needs to stop, what needs to start, smallest real step today."}
                    </p>
                </CyclicStation>
            </div>

            {/* Consequence anchor - gravity without authority */}
            <div
                className="text-center pt-8 pb-4"
                style={{
                    borderTop: `1px solid rgba(255,255,255,0.05)`,
                }}
            >
                <p
                    className="text-[12px] italic max-w-xs mx-auto"
                    style={{
                        fontFamily: 'Crimson Pro, serif',
                        color: practice?.accent,
                        opacity: 0.7,
                        lineHeight: 1.6,
                    }}
                >
                    {MODE_CONSEQUENCES[modeId]}
                </p>
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
