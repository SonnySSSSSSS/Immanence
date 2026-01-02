// src/components/CircuitEntryEditModal.jsx
// Phase 4: Edit existing circuit journal entry
// Allows reopening form to update assessments and notes

import React, { useState } from 'react';
import { useCircuitJournalStore } from '../state/circuitJournalStore';
import { useDisplayModeStore } from '../state/displayModeStore';
import { AccessibleModal } from './AccessibleModal';

const ATTENTION_QUALITIES = ['scattered', 'settling', 'stable', 'absorbed'];
const CHALLENGE_TAGS = ['physical', 'attention', 'emotional', 'consistency', 'technique'];

export function CircuitEntryEditModal({ entryId, onClose, onSave }) {
    const entry = useCircuitJournalStore(s => s.getEntry(entryId));
    const { editEntry } = useCircuitJournalStore();
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';

    const [expandedExercises, setExpandedExercises] = useState({});
    const [overallQuality, setOverallQuality] = useState(entry?.overallAssessment?.attentionQuality || '');
    const [generalNotes, setGeneralNotes] = useState(entry?.overallAssessment?.generalNotes || '');
    const [challenges, setChallenges] = useState(entry?.overallAssessment?.challenges || []);
    const [exerciseNotes, setExerciseNotes] = useState(
        entry?.exercises?.reduce((acc, ex, idx) => ({
            ...acc,
            [idx]: ex.notes || ''
        }), {}) || {}
    );

    if (!entry) return null;

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.98)' : 'rgba(10, 15, 25, 0.98)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';
    const borderColor = isLight ? 'rgba(180, 120, 40, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    const handleSave = () => {
        editEntry(entryId, {
            overallAssessment: {
                ...entry.overallAssessment,
                attentionQuality: overallQuality,
                generalNotes,
                challenges
            },
            exercises: entry.exercises.map((ex, idx) => ({
                ...ex,
                notes: exerciseNotes[idx] || ex.notes
            }))
        });
        onSave?.();
        onClose();
    };

    const toggleChallenge = (tag) => {
        setChallenges(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const getAttentionColor = (quality) => {
        const colors = {
            scattered: '#ef4444',
            settling: '#f97316',
            stable: '#3b82f6',
            absorbed: '#10b981'
        };
        return colors[quality] || '#999';
    };

    return (
        <AccessibleModal
            isOpen={true}
            onClose={onClose}
            title={`Edit Entry: ${entry.circuitName}`}
            ariaLabel="Edit circuit journal entry"
        >
            <div style={{
                backgroundColor: bgColor,
                color: textColor,
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${borderColor}`
            }}>
                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', space: '16px' }}>
                    {/* Overall Attention Quality */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                            Overall Attention Quality
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {ATTENTION_QUALITIES.map(quality => (
                                <button key={quality} onClick={() => setOverallQuality(quality)} style={{
                                    padding: '12px',
                                    backgroundColor: overallQuality === quality ? accentColor : borderColor,
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: overallQuality === quality ? (isLight ? '#000' : '#fff') : textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}>
                                    {quality}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Challenges */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                            Challenges Faced
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {CHALLENGE_TAGS.map(tag => (
                                <button key={tag} onClick={() => toggleChallenge(tag)} style={{
                                    padding: '8px 12px',
                                    backgroundColor: challenges.includes(tag) ? getAttentionColor('stable') : borderColor,
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: challenges.includes(tag) ? '#fff' : textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* General Notes */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7, textTransform: 'uppercase' }}>
                            General Notes
                        </label>
                        <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} maxLength={500} style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: `1px solid ${borderColor}`,
                            backgroundColor: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                            color: textColor,
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '80px'
                        }} placeholder="Any additional notes..." />
                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                            {generalNotes.length}/500
                        </div>
                    </div>

                    {/* Exercises */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
                            Exercise Notes
                        </h3>
                        {entry.exercises.map((ex, idx) => (
                            <div key={idx} style={{
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                border: `1px solid ${borderColor}`
                            }}>
                                <button onClick={() => setExpandedExercises(prev => ({
                                    ...prev,
                                    [idx]: !prev[idx]
                                }))} style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: textColor,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{ex.exerciseName}</span>
                                    <span style={{ opacity: 0.6 }}>{expandedExercises[idx] ? '▼' : '▶'}</span>
                                </button>
                                {expandedExercises[idx] && (
                                    <textarea value={exerciseNotes[idx] || ''} onChange={(e) => setExerciseNotes(prev => ({
                                        ...prev,
                                        [idx]: e.target.value
                                    }))} maxLength={200} style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${borderColor}`,
                                        backgroundColor: isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                                        color: textColor,
                                        fontSize: '12px',
                                        fontFamily: 'inherit',
                                        marginTop: '8px',
                                        minHeight: '60px',
                                        resize: 'vertical'
                                    }} placeholder="Notes for this exercise..." />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Edit timestamp */}
                    <div style={{ fontSize: '11px', opacity: 0.5, paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                        Created: {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                        {entry.editedAt && (
                            <div>Last edited: {new Date(entry.editedAt).toLocaleDateString()} {new Date(entry.editedAt).toLocaleTimeString()}</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 20px',
                        backgroundColor: borderColor,
                        border: 'none',
                        borderRadius: '6px',
                        color: textColor,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} style={{
                        padding: '10px 20px',
                        backgroundColor: accentColor,
                        border: 'none',
                        borderRadius: '6px',
                        color: isLight ? '#000' : '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        Save Changes
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
}

export default CircuitEntryEditModal;
