import React from "react";
import { SessionSummaryModal as BaseSessionSummaryModal } from "../practice/SessionSummaryModal.jsx";

export function SessionSummaryModal({
  summary,
  practiceTimeSlots,
  legNumber,
  totalLegs,
  onContinue,
  onStartNext,
  onFocusRating,
}) {
  return (
    <BaseSessionSummaryModal
      summary={summary}
      practiceTimeSlots={practiceTimeSlots}
      legNumber={legNumber}
      totalLegs={totalLegs}
      onContinue={onContinue}
      onStartNext={onStartNext}
      onFocusRating={onFocusRating}
    />
  );
}
