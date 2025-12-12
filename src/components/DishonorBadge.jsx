// src/components/DishonorBadge.jsx
// "The Unwitnessed Path" - Shows when honor ratio exceeds 50%
// This is a mirror, not a punishment

import React from 'react';
import { useProgressStore } from '../state/progressStore.js';

export function DishonorBadge({ showAlways = false }) {
    const { getHonorStatus, sessions, honorLogs } = useProgressStore();
    const honorStatus = getHonorStatus();

    const totalPractices = sessions.length + honorLogs.length;
    const { ratio, hasDishonorBadge } = honorStatus;

    // Only show if: enough data (≥10 practices) AND ratio > 50%
    // OR if showAlways is true (for settings/debug)
    if (!showAlways && !hasDishonorBadge) {
        return null;
    }

    // Calculate percentage for display
    const honorPercent = Math.round(ratio * 100);

    return (
        <div
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(120,53,15,0.15) 0%, rgba(146,64,14,0.08) 100%)',
                border: '1px solid rgba(217,119,6,0.25)'
            }}
        >
            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(217,119,6,0.3) 10px,
            rgba(217,119,6,0.3) 11px
          )`
                }}
            />

            <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                        background: 'rgba(217,119,6,0.15)',
                        border: '1px solid rgba(217,119,6,0.3)'
                    }}
                >
                    <span className="text-lg opacity-80">👁️‍🗨️</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3
                            className="text-sm font-medium"
                            style={{
                                color: '#d97706',
                                fontFamily: 'Georgia, serif',
                                letterSpacing: '0.02em'
                            }}
                        >
                            The Unwitnessed Path
                        </h3>
                    </div>

                    <p className="text-[10px] text-[rgba(253,251,245,0.55)] leading-relaxed mb-2">
                        {honorPercent}% of your practice is self-reported.
                        This badge reflects your current balance, not judgment.
                    </p>

                    {/* Progress bar showing ratio */}
                    <div className="flex items-center gap-2">
                        <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(253,251,245,0.1)' }}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${honorPercent}%`,
                                    background: 'linear-gradient(90deg, #d97706 0%, #92400e 100%)'
                                }}
                            />
                        </div>
                        <span className="text-[9px] text-[rgba(217,119,6,0.8)] font-medium">
                            {honorPercent}%
                        </span>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-2 flex gap-4 text-[9px] text-[rgba(253,251,245,0.4)]">
                        <span>📱 In-app: {sessions.length}</span>
                        <span>🙏 Honor: {honorLogs.length}</span>
                    </div>
                </div>
            </div>

            {/* Wisdom quote */}
            <div
                className="mt-3 pt-3 border-t border-[rgba(253,251,245,0.08)] text-[9px] italic text-[rgba(253,251,245,0.4)] text-center"
                style={{ fontFamily: 'Georgia, serif' }}
            >
                "The path walked in silence still leads somewhere."
            </div>
        </div>
    );
}

/**
 * Compact version for inline display
 */
export function DishonorBadgeCompact() {
    const { getHonorStatus } = useProgressStore();
    const { hasDishonorBadge, ratio } = getHonorStatus();

    if (!hasDishonorBadge) return null;

    return (
        <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px]"
            style={{
                background: 'rgba(217,119,6,0.15)',
                border: '1px solid rgba(217,119,6,0.25)',
                color: '#d97706'
            }}
            title={`${Math.round(ratio * 100)}% of practice is self-reported`}
        >
            <span>👁️‍🗨️</span>
            <span>Unwitnessed</span>
        </div>
    );
}
