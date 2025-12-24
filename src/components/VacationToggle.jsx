// src/components/VacationToggle.jsx
// Toggle for vacation mode (freezes streak decay)

import React, { useState } from 'react';
import { useProgressStore } from '../state/progressStore.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';

export function VacationToggle({ compact = false }) {
    const { vacation, startVacation, endVacation, getStreakInfo } = useProgressStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    const [showConfirm, setShowConfirm] = useState(false);
    const streakInfo = getStreakInfo();

    const handleToggle = () => {
        if (vacation.active) {
            // Ending vacation
            endVacation();
        } else {
            // Starting vacation - show confirmation if streak > 0
            if (streakInfo.current > 0) {
                setShowConfirm(true);
            } else {
                startVacation();
            }
        }
    };

    const confirmVacation = () => {
        startVacation();
        setShowConfirm(false);
    };

    if (compact) {
        const dividerColor = isLight ? 'rgba(180, 155, 110, 0.2)' : 'rgba(253, 251, 245, 0.1)';
        const textSecondary = isLight ? 'rgba(60, 50, 40, 0.9)' : 'rgba(253, 251, 245, 0.85)';

        return (
            <button
                onClick={handleToggle}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                style={{
                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${dividerColor}`,
                    color: textSecondary,
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                }}
                title={vacation.active ? 'End vacation mode' : 'Enable vacation mode'}
            >
                <span style={{ opacity: 0.7 }}>{vacation.active ? '❄️' : '🏖️'}</span>
                <span>{vacation.active ? 'END' : 'Vacation'}</span>
            </button>
        );
    }

    return (
        <>
            <div
                className="rounded-xl p-4"
                style={{
                    background: vacation.active
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                        : 'rgba(253,251,245,0.03)',
                    border: `1px solid ${vacation.active ? 'rgba(59,130,246,0.3)' : 'rgba(253,251,245,0.1)'}`
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{vacation.active ? '❄️' : '🏖️'}</span>
                            <span
                                className="text-sm font-medium"
                                style={{
                                    color: vacation.active ? '#3b82f6' : 'rgba(253,251,245,0.8)',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    letterSpacing: 'var(--tracking-wide)',
                                }}
                            >
                                Vacation Mode
                            </span>
                        </div>
                        <p className="text-[10px] text-[rgba(253,251,245,0.5)] max-w-[200px]">
                            {vacation.active
                                ? `Streak frozen at ${vacation.frozenStreak} day${vacation.frozenStreak !== 1 ? 's' : ''} since ${vacation.startDate}`
                                : 'Pause streak tracking during planned breaks'
                            }
                        </p>
                    </div>

                    <button
                        onClick={handleToggle}
                        className={`px-4 py-2 rounded-full text-[11px] font-medium transition-all ${vacation.active
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-[rgba(253,251,245,0.1)] text-[rgba(253,251,245,0.8)] hover:bg-[rgba(253,251,245,0.15)]'
                            }`}
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 'var(--tracking-wide)' }}
                    >
                        {vacation.active ? 'End Vacation' : 'Start Vacation'}
                    </button>
                </div>
            </div>

            {/* Confirmation modal */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowConfirm(false)}
                >
                    <div
                        className="w-full max-w-xs rounded-2xl p-5"
                        style={{
                            background: 'linear-gradient(180deg, rgba(22,22,37,0.98) 0%, rgba(15,15,26,0.99) 100%)',
                            border: '1px solid rgba(59,130,246,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div className="text-3xl mb-2">❄️</div>
                            <h3
                                className="text-base font-semibold mb-1"
                                style={{ color: '#3b82f6', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-wide)' }}
                            >
                                Freeze Your Streak?
                            </h3>
                            <p className="text-[11px] text-[rgba(253,251,245,0.6)]">
                                Your <strong className="text-white">{streakInfo.current}-day streak</strong> will be frozen until you return.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 rounded-full text-[11px] bg-[rgba(253,251,245,0.1)] text-[rgba(253,251,245,0.7)] hover:bg-[rgba(253,251,245,0.15)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmVacation}
                                className="flex-1 py-2 rounded-full text-[11px] bg-blue-500 text-white hover:bg-blue-600"
                            >
                                Start Vacation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
