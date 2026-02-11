// src/components/CircuitEntryCard.jsx
// Phase 2/4 Updated: Display circuit journal entry in archive
// Shows overall assessment + expandable exercise breakdown + edit/delete buttons

import React, { useState } from 'react';
import { useCircuitJournalStore } from '../state/circuitJournalStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { CircuitEntryEditModal } from './CircuitEntryEditModal.jsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.jsx';

export function CircuitEntryCard({ entry }) {
    const [expandedExercises, setExpandedExercises] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { deleteEntry } = useCircuitJournalStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.95)' : 'rgba(20, 25, 35, 0.8)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 255, 255, 0.1)';

    const getAttentionColor = (quality) => {
        const colors = {
            scattered: '#ef4444',
            settling: '#f97316',
            stable: '#3b82f6',
            absorbed: '#10b981'
        };
        return colors[quality] || '#999';
    };

    const formatDate = (dateKey) => {
        if (!dateKey) return 'Unknown date';
        const d = new Date(dateKey + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleDelete = () => {
        deleteEntry(entry.id);
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <div
                data-card="true"
                data-card-id={`circuitEntry:${entry?.id ?? 'unknown'}`}
                style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    color: textColor
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            {entry.circuitName}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
                            {formatDate(entry.dateKey)} at {entry.timeOfDay}
                            {entry.editedAt && <span> (edited)</span>}
                        </p>
                    </div>

                    {/* Duration Badge */}
                    <div
                        style={{
                            padding: '8px 12px',
                            backgroundColor: `${accentColor}15`,
                            borderRadius: '6px',
                            textAlign: 'center',
                            minWidth: '60px'
                        }}
                    >
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Duration</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: accentColor }}>
                            {Math.round(entry.totalDuration)}m
                        </div>
                    </div>
                </div>

                {/* Overall Assessment */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
                        Overall Assessment
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Attention Quality */}
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: `${getAttentionColor(entry.overallAssessment.attentionQuality)}20`,
                            border: `1px solid ${getAttentionColor(entry.overallAssessment.attentionQuality)}`,
                            borderRadius: '6px',
                            textAlign: 'center',
                            minWidth: '100px'
                        }}>
                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Attention</div>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: getAttentionColor(entry.overallAssessment.attentionQuality),
                                textTransform: 'capitalize'
                            }}>
                                {entry.overallAssessment.attentionQuality || 'â€”'}
                            </div>
                        </div>

                        {/* Challenges */}
                        {entry.overallAssessment.challenges && entry.overallAssessment.challenges.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {entry.overallAssessment.challenges.map(challenge => (
                                    <span
                                        key={challenge}
                                        style={{
                                            fontSize: '11px',
                                            padding: '4px 8px',
                                            backgroundColor: `${accentColor}15`,
                                            border: `1px solid ${accentColor}`,
                                            borderRadius: '4px',
                                            color: accentColor,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {challenge}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* General Notes */}
                {entry.overallAssessment.generalNotes && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Notes
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: '1.5',
                            padding: '8px',
                            backgroundColor: `${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: '6px'
                        }}>
                            {entry.overallAssessment.generalNotes}
                        </p>
                    </div>
                )}

                {/* Exercises (Expandable) */}
                {entry.exercises && entry.exercises.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                        <button
                            onClick={() => setExpandedExercises(!expandedExercises)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '6px',
                                color: textColor,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>
                                {entry.exercises.length} Exercise{entry.exercises.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ opacity: 0.6 }}>{expandedExercises ? 'â–¼' : 'â–¶'}</span>
                        </button>

                        {expandedExercises && (
                            <div style={{ marginTop: '8px', space: '4px' }}>
                                {entry.exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: `${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`,
                                            borderRadius: '6px',
                                            marginBottom: '6px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                            {ex.exerciseName}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', opacity: 0.7 }}>
                                            <div>
                                                <span style={{ fontWeight: '600' }}>Duration:</span> {Math.round(ex.actualDuration)}m
                                            </div>
                                            {ex.attentionQuality && (
                                                <div>
                                                    <span style={{ fontWeight: '600' }}>Quality:</span>{' '}
                                                    <span style={{ color: getAttentionColor(ex.attentionQuality), textTransform: 'capitalize' }}>
                                                        {ex.attentionQuality}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {ex.notes && (
                                            <p style={{ margin: '6px 0 0 0', fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>
                                                {ex.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {(() => {
                    const isEditable = (createdAt) => {
                        const entryTime = new Date(createdAt);
                        const now = new Date();
                        const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
                        return hoursDiff < 24;
                    };

                    return (
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                            {isEditable(entry.createdAt) ? (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: `${accentColor}15`,
                                        border: `1px solid ${accentColor}`,
                                        borderRadius: '6px',
                                        color: accentColor,
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Edit
                                </button>
                            ) : (
                                <button
                                    disabled
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: borderColor,
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: '6px',
                                        color: textColor,
                                        cursor: 'not-allowed',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        opacity: 0.4
                                    }}
                                >
                                    Edit (expired)
                                </button>
                            )}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '6px',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    );
                })()}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <CircuitEntryEditModal
                    entryId={entry.id}
                    onClose={() => setShowEditModal(false)}
                    onSave={() => {}}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <DeleteConfirmationModal
                    title="Delete Entry?"
                    message={`Delete "${entry.circuitName}" from ${formatDate(entry.dateKey)}? This cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
}

export default CircuitEntryCard;
