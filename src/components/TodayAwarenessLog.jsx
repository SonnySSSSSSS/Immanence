// src/components/TodayAwarenessLog.jsx
import React, { useState } from 'react';
import { useApplicationStore } from '../state/applicationStore.js';

export function TodayAwarenessLog() {
    const { getTodayLogs, updateLog } = useApplicationStore();
    const [expandedLog, setExpandedLog] = useState(null);
    const [noteInput, setNoteInput] = useState('');
    const todayLogs = getTodayLogs();

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleToggleExpand = (logId) => {
        if (expandedLog === logId) {
            setExpandedLog(null);
            setNoteInput('');
        } else {
            const log = todayLogs.find(l => l.id === logId);
            setExpandedLog(logId);
            setNoteInput(log?.note || '');
        }
    };

    const handleSaveReflection = (logId, respondedDifferently) => {
        updateLog(logId, {
            note: noteInput || null,
            respondedDifferently
        });
        setExpandedLog(null);
        setNoteInput('');
    };

    if (todayLogs.length === 0) {
        return (
            <div className="w-full">
                <div className="bg-[#0f0f1a] border border-[var(--accent-15)] rounded-3xl p-8 text-center">
                    <p
                        className="text-sm text-[rgba(253,251,245,0.5)] italic"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                        Nothing logged yet today.<br />
                        When you notice a pattern, use the gesture pad above.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="bg-[#0f0f1a] border border-[var(--accent-15)] rounded-3xl p-6">
                {/* Header */}
                <h3
                    className="text-sm uppercase tracking-[0.2em] text-[var(--accent-70)] mb-4"
                    style={{ fontFamily: 'Cinzel, serif' }}
                >
                    TODAY
                </h3>

                {/* Log Entries */}
                <div className="space-y-3">
                    {todayLogs.map((log) => {
                        const isExpanded = expandedLog === log.id;
                        const hasResponse = log.respondedDifferently !== null;

                        return (
                            <div
                                key={log.id}
                                className="border border-[var(--accent-10)] rounded-xl overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => handleToggleExpand(log.id)}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--accent-10)] transition-colors text-left"
                                >
                                    {/* Time */}
                                    <div className="text-xs text-[var(--accent-60)] min-w-[60px]">
                                        {formatTime(log.timestamp)}
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="mt-0.5">
                                        {hasResponse ? (
                                            log.respondedDifferently ? (
                                                <span className="text-[#fcd34d]" title="Responded differently">✓</span>
                                            ) : (
                                                <span className="text-[rgba(253,251,245,0.3)]" title="Autopilot">○</span>
                                            )
                                        ) : (
                                            <span className="text-[var(--accent-40)]">●</span>
                                        )}
                                    </div>

                                    {/* Category & Note */}
                                    <div className="flex-1">
                                        <div
                                            className="text-sm text-[rgba(253,251,245,0.85)] font-semibold mb-0.5"
                                            style={{ fontFamily: 'Crimson Pro, serif' }}
                                        >
                                            {log.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </div>
                                        {log.note && (
                                            <div
                                                className="text-xs text-[rgba(253,251,245,0.5)] italic"
                                                style={{ fontFamily: 'Crimson Pro, serif' }}
                                            >
                                                "{log.note}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="text-[var(--accent-40)]">
                                        {isExpanded ? '▾' : '▸'}
                                    </div>
                                </button>

                                {/* Expanded Reflection Form */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--accent-10)]">
                                        {/* Note Input */}
                                        <div>
                                            <label className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-1 block">
                                                What happened?
                                            </label>
                                            <input
                                                type="text"
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                placeholder="Quick note..."
                                                className="w-full bg-[var(--accent-10)] border border-[var(--accent-15)] rounded-lg px-3 py-2 text-sm text-[rgba(253,251,245,0.9)] placeholder:text-[rgba(253,251,245,0.3)] focus:outline-none focus:border-[var(--accent-30)]"
                                                style={{ fontFamily: 'Crimson Pro, serif' }}
                                            />
                                        </div>

                                        {/* Response Buttons */}
                                        <div>
                                            <label className="text-xs text-[var(--accent-60)] uppercase tracking-wider mb-2 block">
                                                Did you respond differently?
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveReflection(log.id, true)}
                                                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--accent-30)] bg-[var(--ui-button-gradient)] text-[#050508] font-semibold text-sm hover:shadow-[0_0_15px_var(--accent-30)] transition-all"
                                                >
                                                    Yes ✓
                                                </button>
                                                <button
                                                    onClick={() => handleSaveReflection(log.id, false)}
                                                    className="flex-1 px-4 py-2 rounded-lg border border-[var(--accent-20)] text-[rgba(253,251,245,0.7)] text-sm hover:bg-[var(--accent-10)] transition-all"
                                                >
                                                    No
                                                </button>
                                                <button
                                                    onClick={() => handleSaveReflection(log.id, null)}
                                                    className="px-4 py-2 rounded-lg text-[rgba(253,251,245,0.5)] text-sm hover:text-[rgba(253,251,245,0.8)] transition-colors"
                                                >
                                                    Skip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-[var(--accent-10)] text-center">
                    <p
                        className="text-xs text-[rgba(253,251,245,0.5)]"
                        style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                        {todayLogs.length} moment{todayLogs.length === 1 ? '' : 's'} of awareness today
                    </p>
                </div>
            </div>
        </div>
    );
}
