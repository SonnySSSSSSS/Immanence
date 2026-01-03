// src/components/CurriculumSessionJournal.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM SESSION JOURNAL — Quick 3-question post-practice reflection
// ═══════════════════════════════════════════════════════════════════════════
//
// Simplified journal for curriculum sessions:
// 1. Focus rating (1-5 visual scale)
// 2. Challenges (multi-select)
// 3. Optional notes
//
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useCurriculumStore } from '../state/curriculumStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { CURRICULUM_CHALLENGES, FOCUS_RATINGS } from '../data/ritualFoundation14.js';
import { PillButton } from './ui/PillButton';

export function CurriculumSessionJournal({ 
    dayNumber, 
    dayTitle,
    duration, 
    journalPrompts = [],
    onComplete, 
    onSkip 
}) {
    const [focusRating, setFocusRating] = useState(null);
    const [challenges, setChallenges] = useState([]);
    const [notes, setNotes] = useState('');
    const [currentPrompt, setCurrentPrompt] = useState(0);

    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const { logDayCompletion } = useCurriculumStore();

    const toggleChallenge = (challengeId) => {
        if (challenges.includes(challengeId)) {
            setChallenges(challenges.filter(c => c !== challengeId));
        } else {
            setChallenges([...challenges, challengeId]);
        }
    };

    const handleSubmit = () => {
        logDayCompletion(dayNumber, {
            duration,
            focusRating,
            challenges,
            notes,
        });
        onComplete?.();
    };

    const handleSkip = () => {
        // Log completion without journal data
        logDayCompletion(dayNumber, { duration });
        onSkip?.();
    };

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center backdrop-blur-md"
            style={{
                background: isLight ? 'rgba(245, 240, 235, 0.9)' : 'rgba(0, 0, 0, 0.9)',
            }}
        >
            <div
                className="max-w-md w-full mx-4 p-6 rounded-2xl"
                style={{
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)'
                        : 'linear-gradient(145deg, rgba(30, 25, 32, 0.98) 0%, rgba(25, 20, 27, 0.98) 100%)',
                    border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.2)' : 'var(--accent-20)'}`,
                    boxShadow: isLight
                        ? '0 20px 60px rgba(0, 0, 0, 0.15)'
                        : '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px var(--accent-10)',
                }}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-15)' }}>
                        <span className="text-xl">✨</span>
                    </div>
                    <h2
                        className="text-lg font-semibold"
                        style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--accent-color)',
                        }}
                    >
                        Day {dayNumber} Complete
                    </h2>
                    <p
                        className="text-sm mt-1"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)' }}
                    >
                        {dayTitle} • {duration} min
                    </p>
                </div>

                {/* Focus Rating */}
                <div className="mb-6">
                    <label
                        className="block text-sm font-medium mb-3"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}
                    >
                        How focused were you?
                    </label>
                    <div className="flex justify-center gap-2">
                        {FOCUS_RATINGS.map(rating => (
                            <button
                                key={rating.value}
                                onClick={() => setFocusRating(rating.value)}
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                                style={{
                                    background: focusRating === rating.value
                                        ? 'var(--accent-color)'
                                        : isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                    color: focusRating === rating.value
                                        ? (isLight ? 'white' : '#050508')
                                        : isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)',
                                    border: focusRating === rating.value
                                        ? '2px solid var(--accent-color)'
                                        : '2px solid transparent',
                                    transform: focusRating === rating.value ? 'scale(1.1)' : 'scale(1)',
                                }}
                                title={rating.label}
                            >
                                {rating.value}
                            </button>
                        ))}
                    </div>
                    {focusRating && (
                        <p
                            className="text-xs text-center mt-2"
                            style={{ color: 'var(--accent-color)' }}
                        >
                            {FOCUS_RATINGS.find(r => r.value === focusRating)?.label}
                        </p>
                    )}
                </div>

                {/* Challenges */}
                <div className="mb-6">
                    <label
                        className="block text-sm font-medium mb-3"
                        style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}
                    >
                        Any challenges?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CURRICULUM_CHALLENGES.map(challenge => {
                            const isSelected = challenges.includes(challenge.id);
                            return (
                                <button
                                    key={challenge.id}
                                    onClick={() => toggleChallenge(challenge.id)}
                                    className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all"
                                    style={{
                                        background: isSelected
                                            ? 'var(--accent-20)'
                                            : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                                        color: isSelected
                                            ? 'var(--accent-color)'
                                            : isLight ? 'rgba(60, 50, 40, 0.7)' : 'rgba(253,251,245,0.7)',
                                        border: isSelected
                                            ? '1px solid var(--accent-40)'
                                            : '1px solid transparent',
                                    }}
                                >
                                    <span>{challenge.icon}</span>
                                    <span>{challenge.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Journal prompt (if available) */}
                {journalPrompts.length > 0 && (
                    <div className="mb-6">
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: isLight ? 'rgba(60, 50, 40, 0.8)' : 'rgba(253,251,245,0.8)' }}
                        >
                            {journalPrompts[currentPrompt]}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional reflection..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 transition-all"
                            style={{
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                color: isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253,251,245,0.9)',
                                '--tw-ring-color': 'var(--accent-40)',
                            }}
                        />
                        {journalPrompts.length > 1 && (
                            <div className="flex justify-center gap-1 mt-2">
                                {journalPrompts.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPrompt(i)}
                                        className="w-2 h-2 rounded-full transition-all"
                                        style={{
                                            background: i === currentPrompt
                                                ? 'var(--accent-color)'
                                                : isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{
                            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                            color: isLight ? 'rgba(60, 50, 40, 0.6)' : 'rgba(253,251,245,0.6)',
                        }}
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: 'var(--accent-color)',
                            color: isLight ? 'white' : '#050508',
                            boxShadow: '0 4px 12px var(--accent-25)',
                        }}
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CurriculumSessionJournal;
