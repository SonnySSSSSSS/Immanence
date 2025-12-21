// src/components/Application/practices/MirrorValidationFeedback.jsx
// Displays LLM validation results for Mirror mode observations

import React from 'react';

/**
 * MirrorValidationFeedback - Displays AI validation results
 * Shows either clean confirmation or issues with suggestions
 */
export function MirrorValidationFeedback({ result, onDismiss }) {
    if (!result) return null;

    const { verdict, issues, overall_note } = result;
    const isClean = verdict === 'clean';

    return (
        <div
            className="w-full max-w-md mb-4 p-4 rounded-lg"
            style={{
                background: isClean
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(251, 191, 36, 0.1)',
                border: `1px solid ${isClean
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(251, 191, 36, 0.3)'}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="text-lg"
                    style={{ color: isClean ? 'rgba(34, 197, 94, 0.9)' : 'rgba(251, 191, 36, 0.9)' }}
                >
                    {isClean ? '✓' : '⚠'}
                </span>
                <span
                    className="text-sm font-medium"
                    style={{ color: isClean ? 'rgba(34, 197, 94, 0.9)' : 'rgba(251, 191, 36, 0.9)' }}
                >
                    {isClean ? 'Observation appears neutral' : 'Issues found'}
                </span>
            </div>

            {/* Issues list */}
            {!isClean && issues && issues.length > 0 && (
                <div className="space-y-2 mb-3">
                    {issues.map((issue, i) => (
                        <div
                            key={i}
                            className="p-2 rounded"
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <div className="text-xs text-white/50 mb-1">
                                {issue.type?.replace(/_/g, ' ')}
                            </div>
                            <div
                                className="text-sm mb-1"
                                style={{
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    color: 'rgba(255,255,255,0.8)',
                                }}
                            >
                                "{issue.quote}"
                            </div>
                            {issue.suggestion && (
                                <div className="text-xs text-white/60">
                                    → {issue.suggestion}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Overall note */}
            {overall_note && (
                <p
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                    {overall_note}
                </p>
            )}

            {/* Dismiss for issues */}
            {!isClean && onDismiss && (
                <button
                    onClick={onDismiss}
                    className="mt-3 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                    I'll revise my observation
                </button>
            )}
        </div>
    );
}

/**
 * ValidationError - Shows error state with fallback option
 */
export function MirrorValidationError({ onRetry, onSkip }) {
    return (
        <div
            className="w-full max-w-md mb-4 p-4 rounded-lg"
            style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>✕</span>
                <span className="text-sm font-medium" style={{ color: 'rgba(239, 68, 68, 0.9)' }}>
                    AI validation unavailable
                </span>
            </div>
            <p className="text-xs text-white/50 mb-3">
                The local AI service is not responding. You can still lock this entry without AI validation.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={onRetry}
                    className="px-3 py-1.5 rounded text-xs border border-white/20 text-white/60 hover:text-white/80 transition-colors"
                >
                    Retry
                </button>
                <button
                    onClick={onSkip}
                    className="px-3 py-1.5 rounded text-xs border border-white/20 text-white/60 hover:text-white/80 transition-colors"
                >
                    Lock Without AI
                </button>
            </div>
        </div>
    );
}

/**
 * ValidationLoading - Shows loading state during validation
 */
export function MirrorValidationLoading() {
    return (
        <div
            className="w-full max-w-md mb-4 p-4 rounded-lg flex items-center justify-center gap-3"
            style={{
                background: 'rgba(147, 197, 253, 0.1)',
                border: '1px solid rgba(147, 197, 253, 0.3)',
            }}
        >
            <div
                className="w-4 h-4 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin"
            />
            <span className="text-sm text-blue-300/80">
                Analyzing observation...
            </span>
        </div>
    );
}
