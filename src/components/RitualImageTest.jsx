// Test page for ritual images
import React, { useState } from 'react';
import { LOWER_DAN_TIEN } from './data/rituals/grounding/lowerDanTien.js';

export function RitualImageTest() {
    const [currentStep, setCurrentStep] = useState(0);
    const ritual = LOWER_DAN_TIEN;
    const step = ritual.steps[currentStep];

    return (
        <div className="min-h-screen bg-[#050508] text-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                        {ritual.icon} {ritual.name}
                    </h1>
                    <p className="text-sm text-[rgba(253,251,245,0.7)]" style={{ fontFamily: 'Crimson Pro, serif' }}>
                        {ritual.tradition}
                    </p>
                </div>

                {/* Step Navigation */}
                <div className="flex justify-center gap-2 mb-8">
                    {ritual.steps.map((s, idx) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStep(idx)}
                            className={`px-4 py-2 rounded-lg transition-all ${idx === currentStep
                                    ? 'bg-[var(--accent-primary)] text-[#050508]'
                                    : 'bg-[#0f0f1a] text-[rgba(253,251,245,0.7)] hover:bg-[#1a1a2e]'
                                }`}
                            style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem' }}
                        >
                            Step {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Current Step Display */}
                <div className="bg-[#0f0f1a] rounded-2xl p-8 border border-[rgba(253,195,77,0.15)]">
                    {/* Step Title */}
                    <h2 className="text-2xl mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-primary)' }}>
                        {step.name}
                    </h2>
                    <p className="text-sm text-[rgba(253,251,245,0.5)] mb-6">{step.duration}s ({Math.floor(step.duration / 60)} min)</p>

                    {/* Image */}
                    <div className="mb-6 rounded-xl overflow-hidden bg-black">
                        <img
                            src={`/${step.image}`}
                            alt={step.name}
                            className="w-full h-auto"
                            onError={(e) => {
                                e.target.style.border = '2px solid red';
                                e.target.alt = `Image failed to load: /${step.image}`;
                            }}
                            onLoad={(e) => {
                                console.log(`✅ Loaded: /${step.image}`);
                            }}
                        />
                        <p className="text-xs text-center py-2 text-[rgba(253,251,245,0.4)]">
                            Path: /{step.image}
                        </p>
                    </div>

                    {/* Instruction */}
                    <div className="mb-6">
                        <h3 className="text-sm uppercase tracking-wider mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-secondary)' }}>
                            Instruction
                        </h3>
                        <p className="text-base leading-relaxed" style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.85)' }}>
                            {step.instruction}
                        </p>
                    </div>

                    {/* Sensory Cues */}
                    <div>
                        <h3 className="text-sm uppercase tracking-wider mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-secondary)' }}>
                            Sensory Cues
                        </h3>
                        <ul className="space-y-2">
                            {step.sensoryCues.map((cue, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[var(--accent-primary)] mt-1">•</span>
                                    <span className="text-sm leading-relaxed" style={{ fontFamily: 'Crimson Pro, serif', color: 'rgba(253,251,245,0.75)' }}>
                                        {cue}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Navigation Arrows */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="px-6 py-3 rounded-lg bg-[#0f0f1a] text-[rgba(253,251,245,0.7)] hover:bg-[#1a1a2e] disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={() => setCurrentStep(Math.min(ritual.steps.length - 1, currentStep + 1))}
                        disabled={currentStep === ritual.steps.length - 1}
                        className="px-6 py-3 rounded-lg bg-[#0f0f1a] text-[rgba(253,251,245,0.7)] hover:bg-[#1a1a2e] disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Next →
                    </button>
                </div>

                {/* Debug Info */}
                <div className="mt-8 p-4 bg-[#1a1a2e] rounded-lg text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div className="text-[rgba(253,251,245,0.5)] mb-2">Debug Info:</div>
                    <div className="text-[rgba(253,251,245,0.7)]">
                        <div>Ritual ID: {ritual.id}</div>
                        <div>Current Step: {currentStep + 1}/{ritual.steps.length}</div>
                        <div>Step ID: {step.id}</div>
                        <div>Image Path: /{step.image}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
