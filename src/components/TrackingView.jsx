// src/components/TrackingView.jsx
// Tracking as Mirror of Momentum — not a dashboard, but a living trace
// Flow: Gesture → Trace → Pattern → Direction

import React from 'react';
import { AwarenessCompass } from './AwarenessCompass.jsx';
import { TodayAwarenessLog } from './TodayAwarenessLog.jsx';
import { WeeklyReview } from './WeeklyReview.jsx';
import { PathJourneyLog } from './PathJourneyLog.jsx';

// Flow Section wrapper - implied temporal progression through spacing and opacity
function FlowSection({ label, sublabel, children, isGesture = false }) {
    return (
        <div className={`relative ${isGesture ? 'py-8' : 'py-4'}`}>
            {/* Flow label - very subtle, positioned as annotation */}
            {label && (
                <div className="text-center mb-4">
                    <span
                        className="text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: 'var(--accent-40)', opacity: 0.6 }}
                    >
                        {label}
                    </span>
                    {sublabel && (
                        <span
                            className="text-[9px] ml-2 italic"
                            style={{
                                fontFamily: 'Crimson Pro, serif',
                                color: 'rgba(253,251,245,0.35)',
                            }}
                        >
                            — {sublabel}
                        </span>
                    )}
                </div>
            )}

            {children}

            {/* Flowing connector - vertical throughline */}
            {!isGesture && (
                <div
                    className="absolute left-1/2 -bottom-4 w-px h-8"
                    style={{
                        background: 'linear-gradient(180deg, var(--accent-20) 0%, transparent 100%)',
                    }}
                />
            )}
        </div>
    );
}

export function TrackingView() {
    return (
        <div className="space-y-2">
            {/* 1. GESTURE — A small act (Awareness Compass)
                "You touch the field. The field responds."
                ═══════════════════════════════════════════════════════════════ */}
            <FlowSection label="Gesture" sublabel="a small act" isGesture>
                <div className="relative">
                    {/* Sacred glow behind compass */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, var(--accent-10), transparent 70%)',
                            filter: 'blur(30px)',
                        }}
                    />
                    <AwarenessCompass />
                </div>
            </FlowSection>

            {/* ═══════════════════════════════════════════════════════════════
                2. TRACE — Immediate echo (Today's Log)
                ═══════════════════════════════════════════════════════════════ */}
            <FlowSection label="Trace" sublabel="immediate echo">
                <TodayAwarenessLog />
            </FlowSection>

            {/* ═══════════════════════════════════════════════════════════════
                3. PATTERN — Trend emerging (Weekly Review)
                ═══════════════════════════════════════════════════════════════ */}
            <FlowSection label="Pattern" sublabel="what's forming">
                <WeeklyReview />
            </FlowSection>

            {/* ═══════════════════════════════════════════════════════════════
                4. DIRECTION — Quiet horizon (Path Journey)
                The story slowly forming — more breathing room
                ═══════════════════════════════════════════════════════════════ */}
            <div className="pt-8 pb-4">
                {/* Separator - transition to horizon */}
                <div
                    className="w-24 h-px mx-auto mb-8"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, var(--accent-30) 50%, transparent 100%)',
                    }}
                />

                <div className="text-center mb-6">
                    <span
                        className="text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: 'var(--accent-40)', opacity: 0.6 }}
                    >
                        Direction
                    </span>
                    <span
                        className="text-[9px] ml-2 italic"
                        style={{
                            fontFamily: 'Crimson Pro, serif',
                            color: 'rgba(253,251,245,0.35)',
                        }}
                    >
                        — the story forming
                    </span>
                </div>

                <PathJourneyLog />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CLOSING ANCHOR — What this adds up to
                ═══════════════════════════════════════════════════════════════ */}
            <div className="text-center pt-6 pb-8">
                <p
                    className="text-[10px] italic max-w-xs mx-auto"
                    style={{
                        fontFamily: 'Crimson Pro, serif',
                        color: 'var(--accent-40)',
                        opacity: 0.6,
                        lineHeight: 1.6,
                    }}
                >
                    Small gestures count. You're not stuck — you're forming a direction.
                </p>
            </div>
        </div>
    );
}
