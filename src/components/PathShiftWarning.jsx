// src/components/PathShiftWarning.jsx
// Shows when user's practice is shifting toward a new path

import React from 'react';
import { usePathStore, PATH_SYMBOLS, PATH_NAMES } from '../state/pathStore';
import { useLunarStore } from '../state/lunarStore';

/**
 * PathShiftWarning — Display when path is shifting
 * 
 * Shows:
 * - Current path → Pending path
 * - Days until shift completes
 * - Progress indicator
 */
export function PathShiftWarning({ compact = false }) {
    const pathStatus = usePathStore(s => s.pathStatus);
    const getShiftInfo = usePathStore(s => s.getShiftInfo);
    const stage = useLunarStore(s => s.getCurrentStage());
    const stageLower = (stage || 'seedling').toLowerCase();

    // Only show if shifting
    if (pathStatus !== 'shifting' || stageLower === 'seedling') {
        return null;
    }

    const shiftInfo = getShiftInfo();
    if (!shiftInfo) return null;

    const {
        currentPath,
        pendingPath,
        daysUntilShift,
        progress,
        currentSymbol,
        pendingSymbol,
        pendingPathName,
    } = shiftInfo;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: compact ? '0.5rem' : '0.75rem',
                padding: compact ? '0.75rem 1rem' : '1rem 1.5rem',
                background: 'rgba(255, 200, 100, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 200, 100, 0.15)',
            }}
        >
            {/* Shift direction */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: compact ? '1rem' : '1.25rem',
                }}
            >
                <span style={{ opacity: 0.5 }}>{currentSymbol}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.875rem' }}>→</span>
                <span style={{ color: 'var(--accent-color, #fcd34d)' }}>{pendingSymbol}</span>
            </div>

            {/* Message */}
            <div
                style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    fontSize: compact ? '0.8125rem' : '0.9375rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}
            >
                Your practice is shifting toward{' '}
                <span style={{ color: 'var(--accent-color, #fcd34d)' }}>{pendingPathName}</span>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '200px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${progress * 100}%`,
                        height: '100%',
                        background: 'var(--accent-color, #fcd34d)',
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>

            {/* Days remaining */}
            <div
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-mythic)',
                    fontSize: compact ? '0.6875rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                }}
            >
                {daysUntilShift} days until complete
            </div>
        </div>
    );
}

export default PathShiftWarning;
