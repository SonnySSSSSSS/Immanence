// src/components/HonorLogModal.jsx
// Modal for logging off-app practice (honor system)

import React, { useState } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

const DOMAINS = [
    { id: 'breathwork', label: 'Breathwork', icon: '🫁' },
    { id: 'visualization', label: 'Visualization', icon: '👁️' },
    { id: 'wisdom', label: 'Wisdom', icon: '📖' }
];

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export function HonorLogModal({ isOpen, onClose }) {
    const { logHonorPractice, getHonorStatus } = useProgressStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [domain, setDomain] = useState('breathwork');
    const [duration, setDuration] = useState(15);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(''); // Empty = today
    const [showSuccess, setShowSuccess] = useState(false);

    const honorStatus = getHonorStatus();

    const handleSubmit = () => {
        logHonorPractice({
            domain,
            duration,
            note: note.trim() || undefined,
            date: date || null
        });

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
            // Reset form
            setNote('');
            setDate('');
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: isLight ? 'rgba(60, 50, 40, 0.4)' : 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl p-6 relative"
                style={{
                    background: isLight
                        ? 'linear-gradient(180deg, #FDFBF5 0%, #F5F0E6 100%)'
                        : 'linear-gradient(180deg, rgba(22,22,37,0.98) 0%, rgba(15,15,26,0.99) 100%)',
                    border: isLight
                        ? '2px solid rgba(160, 120, 80, 0.35)'
                        : '1px solid var(--accent-25)',
                    boxShadow: isLight
                        ? '0 20px 50px rgba(120, 90, 60, 0.15)'
                        : '0 0 60px rgba(0,0,0,0.5), 0 0 30px var(--accent-10)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Success overlay */}
                {showSuccess && (
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-2xl z-20"
                        style={{
                            background: isLight ? 'rgba(253, 251, 245, 0.95)' : 'rgba(15,15,26,0.95)'
                        }}
                    >
                        <div className="text-center">
                            <div className="text-4xl mb-2">✨</div>
                            <div
                                className="text-sm font-medium"
                                style={{ color: isLight ? 'var(--light-accent)' : 'var(--accent-color)' }}
                            >
                                Practice Logged
                            </div>
                            <div className="text-[10px] mt-1" style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}>
                                Your honor is noted
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2
                            className="text-sm font-semibold"
                            style={{
                                color: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: 'var(--tracking-mythic)'
                            }}
                        >
                            Log Off-App Practice
                        </h2>
                        <div className="text-[9px] mt-0.5" style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}>
                            Honor System — Your word is your bond
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[14px] transition-colors"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.4)' : 'rgba(253,251,245,0.5)' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Honor ratio warning */}
                {honorStatus.ratio > 0.3 && (
                    <div
                        className="mb-4 px-3 py-2 rounded-lg text-[10px]"
                        style={{
                            background: honorStatus.ratio > 0.5
                                ? (isLight ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.15)')
                                : (isLight ? 'rgba(60, 45, 35, 0.03)' : 'rgba(253,251,245,0.05)'),
                            border: `1px solid ${honorStatus.ratio > 0.5
                                ? (isLight ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.3)')
                                : (isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(253,251,245,0.1)')}`,
                            color: isLight ? 'rgba(60, 45, 35, 0.6)' : 'rgba(253,251,245,0.6)'
                        }}
                    >
                        <span>
                            {honorStatus.ratio > 0.5
                                ? '⚠️ Over 50% of your practice is self-reported. Consider more in-app sessions.'
                                : `📊 ${Math.round(honorStatus.ratio * 100)}% of practice is self-reported`
                            }
                        </span>
                    </div>
                )}

                {/* Domain selector */}
                <div className="mb-4">
                    <label
                        className="text-[9px] uppercase tracking-wider mb-2 block"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}
                    >
                        Practice Type
                    </label>
                    <div className="flex gap-2">
                        {DOMAINS.map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setDomain(d.id)}
                                className="flex-1 py-2 rounded-lg transition-all text-center"
                                style={{
                                    background: domain === d.id
                                        ? (isLight ? 'rgba(180, 140, 90, 0.12)' : 'var(--accent-20)')
                                        : (isLight ? 'rgba(60, 45, 35, 0.03)' : 'rgba(253,251,245,0.05)'),
                                    border: `1px solid ${domain === d.id
                                        ? (isLight ? 'rgba(180, 140, 90, 0.3)' : 'var(--accent-40)')
                                        : (isLight ? 'rgba(180, 155, 110, 0.15)' : 'rgba(253,251,245,0.1)')}`,
                                    color: domain === d.id
                                        ? (isLight ? 'var(--light-accent)' : 'var(--accent-color)')
                                        : (isLight ? 'rgba(60, 45, 35, 0.6)' : 'rgba(253,251,245,0.6)')
                                }}
                            >
                                <div className="text-lg mb-0.5">{d.icon}</div>
                                <div className="text-[9px]">{d.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration selector */}
                <div className="mb-4">
                    <label
                        className="text-[9px] uppercase tracking-wider mb-2 block"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}
                    >
                        Duration (minutes)
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                        {DURATIONS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className="px-3 py-1.5 rounded-full transition-all text-[11px]"
                                style={{
                                    background: duration === d
                                        ? (isLight ? 'var(--light-accent)' : 'var(--accent-color)')
                                        : (isLight ? 'rgba(60, 45, 35, 0.08)' : 'rgba(253,251,245,0.08)'),
                                    color: duration === d ? (isLight ? '#FCFBF5' : '#050508') : (isLight ? 'rgba(60, 45, 35, 0.6)' : 'rgba(253,251,245,0.6)'),
                                    border: duration === d ? 'none' : `1px solid ${isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(253,251,245,0.1)'}`
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date (optional) */}
                <div className="mb-4">
                    <label
                        className="text-[9px] uppercase tracking-wider mb-2 block"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}
                    >
                        Date (optional, defaults to today)
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                        style={{
                            colorScheme: isLight ? 'light' : 'dark',
                            background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(253,251,245,0.05)',
                            border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(253,251,245,0.1)'}`,
                            color: isLight ? '#3D3425' : 'white'
                        }}
                    />
                </div>

                {/* Note (optional) */}
                <div className="mb-5">
                    <label
                        className="text-[9px] uppercase tracking-wider mb-2 block"
                        style={{ color: isLight ? 'rgba(60, 45, 35, 0.5)' : 'rgba(253,251,245,0.5)' }}
                    >
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What did you practice?"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none transition-colors"
                        style={{
                            background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(253,251,245,0.05)',
                            border: `1px solid ${isLight ? 'rgba(180, 140, 90, 0.25)' : 'rgba(253,251,245,0.1)'}`,
                            color: isLight ? '#3D3425' : 'white'
                        }}
                    />
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-full font-medium transition-all hover:-translate-y-0.5 active:scale-98"
                    style={{
                        background: isLight
                            ? 'linear-gradient(180deg, var(--light-accent) 0%, rgba(160, 120, 80, 0.9) 100%)'
                            : 'linear-gradient(180deg, var(--accent-color) 0%, var(--accent-secondary) 100%)',
                        color: isLight ? '#FCFBF5' : '#050508',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: 'var(--tracking-mythic)',
                        textTransform: 'uppercase',
                        boxShadow: isLight
                            ? '0 4px 15px rgba(160, 120, 80, 0.25)'
                            : '0 0 20px var(--accent-20)'
                    }}
                >
                    Log Practice on My Honor
                </button>

                {/* Honor stats */}
                <div
                    className="mt-4 pt-3 flex justify-between text-[9px]"
                    style={{
                        borderTop: `1px solid ${isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(253,251,245,0.1)'}`,
                        color: isLight ? 'rgba(60, 45, 35, 0.4)' : 'rgba(253,251,245,0.4)'
                    }}
                >
                    <span>Total honor logs: {honorStatus.totalCount}</span>
                    <span>This week: {honorStatus.weeklyCount}</span>
                </div>
            </div>
        </div>
    );
}
