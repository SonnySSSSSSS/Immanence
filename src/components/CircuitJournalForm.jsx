// src/components/CircuitJournalForm.jsx
// Phase 2: Post-circuit journal capture with per-exercise assessment
// Replaces generic journal form when logging a completed circuit

import React, { useState } from 'react';
import { useCircuitJournalStore } from '../state/circuitJournalStore.js';
import { useCircuitManager } from '../state/circuitManager.js';
import { useDisplayModeStore } from '../state/displayModeStore.js';
import { CHALLENGE_TAXONOMY, ATTENTION_QUALITIES } from '../state/journalStore.js';

/**
 * CircuitJournalForm
 * 
 * Captures:
 * 1. Per-exercise assessments (optional - can skip if general notes sufficient)
 * 2. Overall circuit assessment (required)
 * 3. Challenge tags (optional)
 * 
 * Flow:
 * - Show all exercises in the completed circuit
 * - Allow expanding each exercise to rate it individually
 * - Require overall assessment before submission
 */
export function CircuitJournalForm({ completedCircuitLog, onClose }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const createEntry = useCircuitJournalStore(s => s.createEntry);
    const updateExerciseAssessment = useCircuitJournalStore(s => s.updateExerciseAssessment);
    const updateOverallAssessment = useCircuitJournalStore(s => s.updateOverallAssessment);
    const linkJournalEntry = useCircuitManager(s => s.linkJournalEntry);

    // Form state
    const [expandedExercise, setExpandedExercise] = useState(null);
    const [exerciseQuality, setExerciseQuality] = useState({});
    const [exerciseNotes, setExerciseNotes] = useState({});
    const [overallQuality, setOverallQuality] = useState(null);
    const [overallNotes, setOverallNotes] = useState('');
    const [selectedChallenges, setSelectedChallenges] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!overallQuality) {
            alert('Please select overall attention quality');
            return;
        }

        setSubmitting(true);

        try {
            // Create journal entry
            const entry = createEntry({
                circuitId: completedCircuitLog.circuitId,
                circuitName: completedCircuitLog.circuitName,
                completedCircuitId: completedCircuitLog.id,
                exercises: completedCircuitLog.exercises,
                sessionMode: completedCircuitLog.sessionMode,
                totalDuration: completedCircuitLog.totalActualDuration,
                timeOfDay: completedCircuitLog.metadata.timeOfDay,
                lunarPhase: completedCircuitLog.metadata.lunarPhase
            });

            // Update per-exercise assessments
            completedCircuitLog.exercises.forEach((ex, idx) => {
                if (exerciseQuality[idx] || exerciseNotes[idx]) {
                    updateExerciseAssessment(entry.id, idx, {
                        attentionQuality: exerciseQuality[idx] || null,
                        notes: exerciseNotes[idx] || null
                    });
                }
            });

            // Update overall assessment
            updateOverallAssessment(entry.id, {
                attentionQuality: overallQuality,
                generalNotes: overallNotes,
                challenges: selectedChallenges
            });

            // Link back to completed circuit
            linkJournalEntry(completedCircuitLog.id, entry.id);

            // Trigger success feedback and close
            if (onClose) {
                setTimeout(() => onClose(), 500);
            }
        } catch (err) {
            console.error('Error saving circuit journal:', err);
            alert('Failed to save journal entry');
        } finally {
            setSubmitting(false);
        }
    };

    const bgColor = isLight ? 'rgba(245, 240, 230, 0.95)' : 'rgba(10, 15, 25, 0.95)';
    const textColor = isLight ? 'rgba(35, 20, 10, 0.95)' : 'rgba(253, 251, 245, 0.95)';
    const accentColor = isLight ? 'rgba(180, 120, 40, 0.9)' : 'var(--accent-color)';

    return (
        <div style={{
            background: bgColor,
            color: textColor,
            padding: '24px',
            borderRadius: '12px',
            maxHeight: '80vh',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                {completedCircuitLog.circuitName}
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', opacity: 0.7 }}>
                Completed {completedCircuitLog.exercises.length} exercises â€¢ 
                {Math.round(completedCircuitLog.totalActualDuration)} min
            </p>

            {/* Exercise List (Expandable) */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', opacity: 0.6 }}>
                    Exercise Assessments (Optional)
                </h3>
                
                {completedCircuitLog.exercises.map((exercise, idx) => (
                    <div
                        key={exercise.exerciseId}
                        style={{
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Exercise Header (Always visible) */}
                        <button
                            onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: expandedExercise === idx
                                    ? `${accentColor}15`
                                    : 'transparent',
                                border: 'none',
                                color: textColor,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            <span>
                                {exercise.exerciseName} 
                                <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '8px' }}>
                                    {exercise.actualDuration ? `${Math.round(exercise.actualDuration)}m` : 'â€”'}
                                </span>
                            </span>
                            <span style={{ opacity: 0.6 }}>
                                {expandedExercise === idx ? 'â–¼' : 'â–¶'}
                            </span>
                        </button>

                        {/* Expanded: Assessment Form */}
                        {expandedExercise === idx && (
                            <div style={{ padding: '12px', borderTop: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.1)' : 'rgba(255, 255, 255, 0.05)'}` }}>
                                {/* Attention Quality */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>
                                        Attention Quality
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                        {ATTENTION_QUALITIES.map(quality => (
                                            <button
                                                key={quality}
                                                onClick={() => setExerciseQuality({ ...exerciseQuality, [idx]: quality })}
                                                style={{
                                                    padding: '8px 6px',
                                                    backgroundColor: exerciseQuality[idx] === quality
                                                        ? accentColor
                                                        : `${isLight ? 'rgba(180, 120, 40, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: textColor,
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: '500',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {quality}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>
                                        Notes
                                    </label>
                                    <textarea
                                        value={exerciseNotes[idx] || ''}
                                        onChange={(e) => setExerciseNotes({ ...exerciseNotes, [idx]: e.target.value })}
                                        placeholder="e.g., Felt stronger today, better breathing control..."
                                        style={{
                                            width: '100%',
                                            minHeight: '60px',
                                            padding: '8px',
                                            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            color: textColor,
                                            fontSize: '12px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Overall Assessment (Required) */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', opacity: 0.6 }}>
                    Overall Assessment <span style={{ color: 'red' }}>*</span>
                </h3>

                {/* Attention Quality */}
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>
                        Attention Quality
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {ATTENTION_QUALITIES.map(quality => (
                            <button
                                key={quality}
                                onClick={() => setOverallQuality(quality)}
                                style={{
                                    padding: '12px',
                                    backgroundColor: overallQuality === quality
                                        ? accentColor
                                        : `${isLight ? 'rgba(180, 120, 40, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
                                    border: overallQuality === quality ? `2px solid ${accentColor}` : 'none',
                                    borderRadius: '6px',
                                    color: textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                    transition: 'all 200ms'
                                }}
                            >
                                {quality}
                            </button>
                        ))}
                    </div>
                </div>

                {/* General Notes */}
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>
                        General Notes
                    </label>
                    <textarea
                        value={overallNotes}
                        onChange={(e) => setOverallNotes(e.target.value)}
                        placeholder="How did this circuit feel overall? Any patterns you noticed?"
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                            border: 'none',
                            borderRadius: '6px',
                            color: textColor,
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* Challenges */}
                <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>
                        Challenges (Optional)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {Object.entries(CHALLENGE_TAXONOMY).map(([key, category]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedChallenges(
                                        selectedChallenges.includes(key)
                                            ? selectedChallenges.filter(c => c !== key)
                                            : [...selectedChallenges, key]
                                    );
                                }}
                                style={{
                                    padding: '10px',
                                    backgroundColor: selectedChallenges.includes(key)
                                        ? accentColor
                                        : `${isLight ? 'rgba(180, 120, 40, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: textColor,
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    textAlign: 'left'
                                }}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                borderTop: `1px solid ${isLight ? 'rgba(180, 120, 40, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                paddingTop: '16px'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${accentColor}`,
                        color: accentColor,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}
                    disabled={submitting}
                >
                    Skip
                </button>
                <button
                    onClick={handleSubmit}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: accentColor,
                        color: isLight ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        opacity: submitting ? 0.6 : 1,
                        transition: 'opacity 200ms'
                    }}
                    disabled={submitting}
                >
                    {submitting ? 'Saving...' : 'Save Assessment'}
                </button>
            </div>
        </div>
    );
}
