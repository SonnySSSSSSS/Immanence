// src/components/vipassana/SessionSummary.jsx
// End-of-session passive reporting - no performance hierarchy

import React from 'react';
import { THOUGHT_CATEGORIES } from '../../data/vipassanaThemes';
import { PillButton } from '../ui/PillButton';

export function SessionSummary({
    isVisible,
    totalNotices,
    categoryCounts = {},
    onContinue,
    onClose,
}) {
    const [showBreakdown, setShowBreakdown] = React.useState(false);

    if (!isVisible) return null;

    // Filter to only show categories that were used
    const usedCategories = Object.entries(categoryCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                animation: 'summaryFadeIn 0.5s ease-out',
            }}
        >
            <div
                className="relative px-12 py-12 rounded-3xl text-center max-w-md"
                style={{
                    background: 'rgba(20, 15, 25, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Title - passive language */}
                <h2
                    className="text-lg uppercase tracking-[0.2em] mb-10"
                    style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-mythic)',
                        color: 'rgba(255, 255, 255, 0.6)',
                    }}
                >
                    Session Complete
                </h2>

                {/* Main stat - passive phrasing */}
                <div className="mb-10">
                    <div
                        className="text-sm mb-3"
                        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    >
                        Thinking was noticed
                    </div>
                    <div
                        className="text-3xl"
                        style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            color: 'rgba(255, 255, 255, 0.8)',
                        }}
                    >
                        {totalNotices}
                        <span className="text-sm ml-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            {totalNotices === 1 ? 'time' : 'times'}
                        </span>
                    </div>
                </div>

                {/* Dominant thought pattern insight */}
                {usedCategories.length > 0 && (() => {
                    const [dominantCategory] = usedCategories[0]; // Already sorted by count
                    const category = THOUGHT_CATEGORIES[dominantCategory];
                    const percentage = Math.round((categoryCounts[dominantCategory] / totalNotices) * 100);

                    return percentage > 30 ? (
                        <div className="mb-10">
                            <div
                                className="text-xs uppercase tracking-wider mb-2"
                                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                            >
                                Pattern observed
                            </div>
                            <div
                                className="text-sm px-4 py-2 rounded-full inline-block"
                                style={{
                                    background: `${category.tint}15`,
                                    border: `1px solid ${category.tint}40`,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                }}
                            >
                                Most thoughts were {category.label.toLowerCase()}-focused
                            </div>
                        </div>
                    ) : null;
                })()}

                {/* Category breakdown - hidden by default */}
                {usedCategories.length > 0 && (
                    <div className="mb-8">
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-xs uppercase tracking-wider transition-all"
                            style={{
                                color: 'rgba(255, 255, 255, 0.4)',
                            }}
                        >
                            {showBreakdown ? '▾ Hide breakdown' : '▸ Show breakdown'}
                        </button>

                        {showBreakdown && (
                            <div
                                className="mt-4 space-y-2"
                                style={{ animation: 'breakdownSlide 0.3s ease-out' }}
                            >
                                {usedCategories.map(([categoryId, count]) => {
                                    const category = THOUGHT_CATEGORIES[categoryId];
                                    if (!category) return null;

                                    return (
                                        <div
                                            key={categoryId}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span
                                                className="flex items-center gap-2"
                                                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: category.tint }}
                                                />
                                                {category.label}
                                            </span>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Continue button */}
                <PillButton
                    onClick={onContinue || onClose}
                    variant="secondary"
                    size="md"
                >
                    Continue
                </PillButton>
            </div>

            <style>{`
        @keyframes summaryFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes breakdownSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

export default SessionSummary;
