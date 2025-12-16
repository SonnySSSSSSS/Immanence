// src/components/Application/PatternReview.jsx
// Pattern Review: Aggregate Statistics - Mechanical Reporting Only
// IE v1 Spec: Counts, frequencies, timelines, distributions - NO scores, judgments, or recommendations

import React from 'react';
import { useChainStore } from '../../state/chainStore.js';
import { ACTION_TYPES, CONTEXT_CATEGORIES } from '../../data/fourModes.js';

// Simple bar chart component
function Bar({ value, max, color }) {
    const width = max > 0 ? (value / max) * 100 : 0;
    return (
        <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
        >
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${width}%`, background: color }}
            />
        </div>
    );
}

// StatCard component
function StatCard({ label, value, sublabel, color }) {
    return (
        <div
            className="p-3 rounded-lg text-center"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div
                className="text-2xl mb-1"
                style={{ color: color || 'rgba(255,255,255,0.9)' }}
            >
                {value}
            </div>
            <div className="text-xs text-white/50">{label}</div>
            {sublabel && (
                <div className="text-[10px] text-white/30 mt-1">{sublabel}</div>
            )}
        </div>
    );
}

export function PatternReview() {
    const { getPatternStats, completedChains } = useChainStore();
    const stats = getPatternStats();

    if (!stats || stats.totalChains === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <p
                    className="text-lg mb-4"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.6)',
                    }}
                >
                    No completed chains yet.
                </p>
                <p
                    className="text-sm max-w-sm"
                    style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: 'rgba(255,255,255,0.4)',
                    }}
                >
                    Complete at least one chain to see patterns.
                </p>
            </div>
        );
    }

    // Calculate max for bar charts
    const contextMax = Math.max(...Object.values(stats.contextFrequency || {}), 1);
    const actionTypeMax = Math.max(...Object.values(stats.actionTypeDistribution || {}), 1);

    return (
        <div className="flex flex-col h-full px-4 py-4 overflow-y-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2
                    className="text-sm uppercase tracking-[0.2em] mb-1"
                    style={{ color: 'var(--accent-color)' }}
                >
                    Pattern Review
                </h2>
                <p
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    Data from {stats.totalChains} completed chain{stats.totalChains !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard
                    label="Total Chains"
                    value={stats.totalChains}
                />
                <StatCard
                    label="Completion"
                    value={`${Math.round(stats.completionRatio * 100)}%`}
                    sublabel="finished all 4 modes"
                />
                <StatCard
                    label="Avg Δ Intensity"
                    value={stats.avgIntensityDelta !== null
                        ? (stats.avgIntensityDelta > 0 ? `−${stats.avgIntensityDelta.toFixed(1)}` : `+${Math.abs(stats.avgIntensityDelta).toFixed(1)}`)
                        : '—'}
                    sublabel="Wave mode"
                    color={stats.avgIntensityDelta > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
                />
            </div>

            {/* Context Frequency */}
            <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
                    Context Frequency
                </h3>
                <div className="space-y-2">
                    {CONTEXT_CATEGORIES.map((cat) => {
                        const count = stats.contextFrequency[cat] || 0;
                        if (count === 0) return null;
                        return (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="w-20 text-xs text-white/60 capitalize">{cat}</span>
                                <div className="flex-1">
                                    <Bar value={count} max={contextMax} color="rgba(147, 197, 253, 0.6)" />
                                </div>
                                <span className="w-8 text-xs text-white/40 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Prism: Unsupported Narrative Ratio */}
            {stats.avgUnsupportedNarrativeRatio !== null && (
                <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
                        Unsupported Narrative Ratio
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <Bar
                                value={stats.avgUnsupportedNarrativeRatio * 100}
                                max={100}
                                color="rgba(239, 68, 68, 0.6)"
                            />
                        </div>
                        <span className="text-sm text-white/60">
                            {Math.round(stats.avgUnsupportedNarrativeRatio * 100)}%
                        </span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">
                        Average % of interpretations that were unsupported by Mirror evidence
                    </p>
                </div>
            )}

            {/* Wave Capacity */}
            <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
                    Wave Capacity
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    <div
                        className="p-2 rounded text-center"
                        style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                    >
                        <div className="text-lg" style={{ color: 'rgba(34, 197, 94, 0.8)' }}>
                            {stats.waveCapacity.completed}
                        </div>
                        <div className="text-[10px] text-white/40">Completed</div>
                    </div>
                    <div
                        className="p-2 rounded text-center"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                        <div className="text-lg" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>
                            {stats.waveCapacity.aborted}
                        </div>
                        <div className="text-[10px] text-white/40">Aborted</div>
                    </div>
                    <div
                        className="p-2 rounded text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {stats.waveCapacity.skipped}
                        </div>
                        <div className="text-[10px] text-white/40">Skipped</div>
                    </div>
                </div>
            </div>

            {/* Action Type Distribution */}
            <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
                    Sword: Action Types
                </h3>
                <div className="space-y-2">
                    {[
                        { id: ACTION_TYPES.ACTION, label: 'Action', color: 'rgba(248, 113, 113, 0.6)' },
                        { id: ACTION_TYPES.RESTRAINT, label: 'Restraint', color: 'rgba(251, 191, 36, 0.6)' },
                        { id: ACTION_TYPES.NON_ACTION, label: 'Conscious Non-Action', color: 'rgba(167, 139, 250, 0.6)' },
                    ].map((type) => {
                        const count = stats.actionTypeDistribution[type.id] || 0;
                        if (count === 0 && Object.keys(stats.actionTypeDistribution).length > 0) return null;
                        return (
                            <div key={type.id} className="flex items-center gap-3">
                                <span className="w-32 text-xs text-white/60">{type.label}</span>
                                <div className="flex-1">
                                    <Bar value={count} max={actionTypeMax} color={type.color} />
                                </div>
                                <span className="w-8 text-xs text-white/40 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Timeline */}
            {stats.recentChains.length > 0 && (
                <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
                        Recent Chains
                    </h3>
                    <div className="flex gap-1 flex-wrap">
                        {stats.recentChains.map((chain) => (
                            <div
                                key={chain.id}
                                className="w-3 h-3 rounded-sm"
                                style={{
                                    background: chain.completed
                                        ? 'rgba(34, 197, 94, 0.6)'
                                        : 'rgba(239, 68, 68, 0.4)',
                                }}
                                title={`${new Date(chain.date).toLocaleDateString()} - ${chain.context || 'unknown'} - ${chain.completed ? 'Complete' : 'Incomplete'}`}
                            />
                        ))}
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">
                        Green = complete, Red = incomplete
                    </p>
                </div>
            )}
        </div>
    );
}
