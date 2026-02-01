// src/components/dashboard/DashboardDetailModal.jsx
// Read-only detail modal showing completion and adherence breakdowns

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

/**
 * DashboardDetailModal — Read-only modal for dashboard detail view
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {Object} props.detail - Detail payload from getDashboardDetail()
 *                                Shape: { completionBreakdown, scheduleAdherence, weeklyActivity }
 */
export function DashboardDetailModal({ isOpen = false, onClose = null, detail = {} }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    if (!isOpen) {
        return null;
    }

    const { completionBreakdown = {}, scheduleAdherence = {}, weeklyActivity = [] } = detail;

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999,
                    cursor: 'pointer',
                }}
                onClick={onClose}
            />

            {/* Modal container */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    maxWidth: '90vw',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '12px',
                    background: isLight
                        ? 'rgba(255, 250, 240, 0.98)'
                        : 'rgba(20, 25, 30, 0.98)',
                    border: `1px solid ${isLight
                        ? 'rgba(200, 160, 100, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 20px 60px ${isLight
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(0, 0, 0, 0.5)'}`,
                    padding: '24px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: `1px solid ${isLight
                            ? 'rgba(200, 160, 100, 0.2)'
                            : 'rgba(255, 255, 255, 0.1)'}`,
                        paddingBottom: '12px',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: isLight
                                ? 'rgba(45, 35, 25, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                            margin: 0,
                        }}
                    >
                        Dashboard Details
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '4px 8px',
                            fontSize: '14px',
                            background: 'transparent',
                            border: 'none',
                            color: isLight
                                ? 'rgba(100, 80, 60, 0.6)'
                                : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            fontSize: '20px',
                            lineHeight: '1',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content: Two column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Completion Breakdown */}
                    <div>
                        <h3
                            style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: isLight
                                    ? 'rgba(100, 80, 60, 0.6)'
                                    : 'rgba(255, 255, 255, 0.5)',
                                marginBottom: '12px',
                                margin: 0,
                            }}
                        >
                            Completion Status
                        </h3>
                        <div
                            style={{
                                background: isLight
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isLight
                                    ? 'rgba(200, 160, 100, 0.2)'
                                    : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                padding: '12px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    fontSize: '12px',
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            color: isLight
                                                ? 'rgba(100, 80, 60, 0.5)'
                                                : 'rgba(255, 255, 255, 0.4)',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Completed
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: isLight
                                                ? 'rgba(45, 35, 25, 0.9)'
                                                : 'rgba(255, 255, 255, 0.9)',
                                        }}
                                    >
                                        {completionBreakdown.completed || 0}
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            color: isLight
                                                ? 'rgba(100, 80, 60, 0.5)'
                                                : 'rgba(255, 255, 255, 0.4)',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Abandoned
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: isLight
                                                ? 'rgba(200, 80, 60, 0.8)'
                                                : 'rgba(244, 67, 54, 0.8)',
                                        }}
                                    >
                                        {completionBreakdown.abandoned || 0}
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            color: isLight
                                                ? 'rgba(100, 80, 60, 0.5)'
                                                : 'rgba(255, 255, 255, 0.4)',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Partial
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: isLight
                                                ? 'rgba(100, 100, 60, 0.8)'
                                                : 'rgba(255, 235, 59, 0.7)',
                                        }}
                                    >
                                        {completionBreakdown.partial || 0}
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            color: isLight
                                                ? 'rgba(100, 80, 60, 0.5)'
                                                : 'rgba(255, 255, 255, 0.4)',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Rate
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: isLight
                                                ? 'rgba(100, 150, 80, 0.8)'
                                                : 'rgba(76, 175, 80, 0.8)',
                                        }}
                                    >
                                        {completionBreakdown.completionRate || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Adherence */}
                    <div>
                        <h3
                            style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: isLight
                                    ? 'rgba(100, 80, 60, 0.6)'
                                    : 'rgba(255, 255, 255, 0.5)',
                                marginBottom: '12px',
                                margin: 0,
                            }}
                        >
                            Schedule Adherence
                        </h3>
                        <div
                            style={{
                                background: isLight
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isLight
                                    ? 'rgba(200, 160, 100, 0.2)'
                                    : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '8px',
                                padding: '12px',
                            }}
                        >
                            {scheduleAdherence.totalMatched === 0 ? (
                                <div
                                    style={{
                                        color: isLight
                                            ? 'rgba(100, 80, 60, 0.5)'
                                            : 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        padding: '12px',
                                    }}
                                >
                                    No schedule adherence data yet
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                        fontSize: '12px',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                color: isLight
                                                    ? 'rgba(100, 80, 60, 0.5)'
                                                    : 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            On-Time
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: isLight
                                                    ? 'rgba(100, 150, 80, 0.8)'
                                                    : 'rgba(76, 175, 80, 0.8)',
                                            }}
                                        >
                                            {scheduleAdherence.greenCount || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                color: isLight
                                                    ? 'rgba(100, 80, 60, 0.5)'
                                                    : 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Late
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: isLight
                                                    ? 'rgba(200, 100, 80, 0.8)'
                                                    : 'rgba(244, 67, 54, 0.8)',
                                            }}
                                        >
                                            {scheduleAdherence.redCount || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                color: isLight
                                                    ? 'rgba(100, 80, 60, 0.5)'
                                                    : 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Total
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: isLight
                                                    ? 'rgba(45, 35, 25, 0.8)'
                                                    : 'rgba(255, 255, 255, 0.8)',
                                            }}
                                        >
                                            {scheduleAdherence.totalMatched || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                color: isLight
                                                    ? 'rgba(100, 80, 60, 0.5)'
                                                    : 'rgba(255, 255, 255, 0.4)',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Rate
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: isLight
                                                    ? 'rgba(100, 150, 80, 0.8)'
                                                    : 'rgba(76, 175, 80, 0.8)',
                                            }}
                                        >
                                            {scheduleAdherence.adherencePercent || 0}%
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default DashboardDetailModal;
