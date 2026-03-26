// src/components/practice/PracticeSessionSummary.jsx
// Wrapper component for the post-session summary surface.
// Extracted from PracticeSection.jsx to give the summary a clean module boundary.
// Owns: store read (practiceTimeSlots), focus-rating handler, and callback wiring.
// Does NOT own: summary activation (queueSummaryAfterRingUnmount in PracticeSection),
//               session state, or ring lifecycle.

import React from 'react';
import { useCurriculumStore } from '../../state/curriculumStore.js';
import { SessionSummaryModal } from './SessionSummaryModal.jsx';

/**
 * @param {object} props
 * @param {object} props.summary        - Session summary payload (sessionSummary state)
 * @param {boolean} props.pendingMicroNote - Whether a journal entry is already open
 * @param {() => void} props.onDismiss  - Dismiss the summary (setShowSummary(false))
 * @param {(id: string) => void} props.onNavigateToPractice - Navigate to a practice id
 * @param {(practiceType: string) => void} props.onStartNext - Start the next practice
 */
export function PracticeSessionSummary({
  summary,
  pendingMicroNote,
  onDismiss,
  onNavigateToPractice,
  onStartNext,
}) {
  const practiceTimeSlots = useCurriculumStore((s) => s.practiceTimeSlots);

  const handleFocusRating = (rating) => {
    if (summary?.curriculumDayNumber) {
      const { logLegCompletion, getDayLegsWithStatus } = useCurriculumStore.getState();
      const completedLegs = getDayLegsWithStatus(summary.curriculumDayNumber).filter(leg => leg.completed);
      const currentLegNumber = completedLegs.length;
      logLegCompletion(summary.curriculumDayNumber, currentLegNumber, {
        duration: summary.duration,
        focusRating: rating,
        challenges: [],
        notes: '',
      });
    }
  };

  return (
    <SessionSummaryModal
      summary={summary}
      practiceTimeSlots={practiceTimeSlots}
      legNumber={summary.legNumber}
      totalLegs={summary.totalLegs}
      onContinue={() => {
        onDismiss();
        if (!pendingMicroNote) {
          onNavigateToPractice('breath');
        }
      }}
      onStartNext={onStartNext}
      onFocusRating={handleFocusRating}
    />
  );
}
