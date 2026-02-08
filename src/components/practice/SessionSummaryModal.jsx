// SessionSummaryModal.jsx
// Post-session summary and "What's Next" display component

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from '../../styles/cardMaterial.js';

// Quick practice suggestions based on what was just completed
const PRACTICE_SUGGESTIONS = {
  "Breath & Stillness": ["Insight Meditation", "Body Scan", "Visualization"],
  "Insight Meditation": ["Breath & Stillness", "Body Scan", "Sound"],
  "Body Scan": ["Breath & Stillness", "Insight Meditation", "Sound"],
  "Visualization": ["Breath & Stillness", "Cymatics", "Sound"],
  "Cymatics": ["Visualization", "Sound", "Breath & Stillness"],
  "Sound": ["Breath & Stillness", "Visualization", "Body Scan"],
  "Ritual": ["Breath & Stillness", "Insight Meditation"],
  "Circuit": ["Breath & Stillness", "Sound"],
};

/**
 * Session Summary Modal - displays after practice completion
 * Shows results AND prompts for what to practice next
 * @param {object} props
 * @param {object} props.summary - Session summary data
 * @param {function} props.onContinue - Callback when user clicks Continue (returns to selection)
 * @param {function} props.onStartNext - Callback to start next practice (receives practice type)
 * @param {function} props.onFocusRating - Callback when focus rating is selected (1-5)
 */
export function SessionSummaryModal({ summary, onContinue, onStartNext, onFocusRating, practiceTimeSlots = [], legNumber = 1, totalLegs = 2 }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';
  const [focusRating, setFocusRating] = React.useState(null);

  React.useEffect(() => {
    if (import.meta.env.DEV && summary) {
      console.log('[SessionSummaryModal] summary payload', summary);
    }
  }, [summary]);

  if (!summary) return null;

  const suggestions = PRACTICE_SUGGESTIONS[summary.practice] || ["Breath & Stillness", "Visualization"];
  const isFromCurriculum = summary.curriculumDayNumber !== null && summary.curriculumDayNumber !== undefined;
  const allLegsComplete = isFromCurriculum && !summary.nextLeg;
  const isFirstLeg = isFromCurriculum && legNumber === 1 && totalLegs > 1;
  const isLastLeg = isFromCurriculum && legNumber === totalLegs;

  const handleRatingSelect = (rating) => {
    setFocusRating(rating);
    if (onFocusRating) {
      onFocusRating(rating);
    }
  };

  return (
    <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12">
      <div
        className="rounded-[32px] relative overflow-hidden"
        style={{
          width: '480px',
          maxWidth: '95vw',
          ...(isLight ? getCardMaterial(true) : plateauMaterial),
          border: isLight ? '1px solid var(--light-border, rgba(60,50,35,0.15))' : '1px solid var(--accent-20)',
          boxShadow: isLight
            ? '0 4px 24px rgba(60,50,35,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={isLight ? getInnerGlowStyle(true) : innerGlowStyle} />

        <div className="relative px-8 py-8 text-center">
          {/* Decorative Icon */}
          <div
            style={{
              fontSize: '40px',
              marginBottom: '12px',
              filter: 'drop-shadow(0 0 20px var(--accent-40))',
            }}
          >
            ⚜
          </div>

          {/* Title */}
          <div
            className="type-label mb-5"
            style={{
              color: 'var(--text-primary)',
              textShadow: isLight ? 'none' : '0 0 10px var(--accent-30)',
            }}
          >
            SESSION COMPLETE
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: summary.tapStats ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: '12px',
              padding: '16px',
              borderRadius: '16px',
              background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.3)',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-10)',
              marginBottom: '20px',
            }}
          >
            {/* Practice Type */}
            <div>
              <span className="type-label" style={{ color: 'var(--text-muted)' }}>
                Practice
              </span>
              <div className="type-h3 mt-1" style={{ color: 'var(--text-primary)' }}>
                {summary.practice}
              </div>
            </div>

            {/* Duration */}
            <div>
              <span className="type-label" style={{ color: 'var(--text-muted)' }}>
                Duration
              </span>
              <div className="type-metric text-[12px] mt-1" style={{ color: 'var(--text-primary)' }}>
                {summary.duration}m
              </div>
            </div>

            {/* Accuracy (if available) */}
            {summary.tapStats && (
              <div>
                <span className="type-label" style={{ color: 'var(--text-muted)' }}>
                  Accuracy
                </span>
                <div className="type-metric text-[12px] mt-1" style={{ color: 'var(--text-primary)' }}>
                  {summary.tapStats.avgErrorMs}ms
                </div>
              </div>
            )}

            {/* Breath Count (if available) */}
            {summary.breathCount > 0 && (
              <div>
                <span className="type-label" style={{ color: 'var(--text-muted)' }}>
                  Breaths
                </span>
                <div className="type-metric text-[12px] mt-1" style={{ color: 'var(--text-primary)' }}>
                  {summary.breathCount}
                </div>
              </div>
            )}
          </div>

          {/* Emotion Closing Line (if emotion practice) */}
          {summary.closingLine && (
            <div
              className="type-body text-[12px] italic text-center rounded-lg p-4 mb-6"
              style={{
                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.2)',
                border: isLight ? '1px solid rgba(60,50,35,0.1)' : '1px solid rgba(255,255,255,0.1)',
                color: isLight ? 'rgba(60,50,35,0.7)' : 'rgba(253,251,245,0.7)',
              }}
            >
              "{summary.closingLine}"
            </div>
          )}

          {/* Emotion Completion Count (if emotion practice) */}
          {summary.emotionCompletionCount !== null && summary.emotionCompletionCount !== undefined && (
            <div
              className="type-label text-[11px] text-center mb-5"
              style={{
                color: isLight ? 'rgba(60,50,35,0.6)' : 'rgba(253,251,245,0.6)',
              }}
            >
              Completed {summary.emotionCompletionCount} {summary.emotionCompletionCount === 1 ? 'time' : 'times'}
            </div>
          )}

          {/* Sakshi Completion Count (if awareness/cognitive vipassana) */}
          {summary.sakshiCompletionCount !== null && summary.sakshiCompletionCount !== undefined && (
            <div
              className="type-label text-[11px] text-center mb-5"
              style={{
                color: isLight ? 'rgba(60,50,35,0.6)' : 'rgba(253,251,245,0.6)',
              }}
            >
              Sakshi completed {summary.sakshiCompletionCount} {summary.sakshiCompletionCount === 1 ? 'time' : 'times'}
            </div>
          )}

          {/* Focus Rating (if from curriculum) */}
          {isFromCurriculum && (
            <div style={{ marginBottom: '20px' }}>
              <div
                className="type-label mb-2.5 text-center"
                style={{
                  color: 'var(--text-muted)',
                }}
              >
                How was your focus?
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingSelect(rating)}
                    className="transition-all duration-200 hover:scale-110"
                    style={{
                      fontSize: '24px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: focusRating === null ? 0.4 : (focusRating >= rating ? 1 : 0.3),
                      color: focusRating >= rating ? 'var(--accent-color)' : (isLight ? 'rgba(60,50,35,0.3)' : 'rgba(255,255,255,0.2)'),
                      filter: focusRating >= rating ? 'drop-shadow(0 0 8px var(--accent-40))' : 'none',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next Leg Info (if from curriculum) */}
          {summary.nextLeg && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: isLight ? 'rgba(60,50,35,0.03)' : 'rgba(255,255,255,0.05)',
                border: isLight ? '1px solid rgba(60,50,35,0.1)' : '1px solid var(--accent-20)',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <span className="type-label" style={{ color: 'var(--accent-color)' }}>
                {isFirstLeg ? '✦ What\'s Up Next' : '✦ Next in Curriculum'}
              </span>
              <div className="type-h3 text-[13px] mt-1.5" style={{ color: 'var(--text-primary)' }}>
                {summary.nextLeg.practiceType || summary.nextLeg.label}
              </div>
              {/* Show time for first leg completion */}
              {isFirstLeg && summary.nextLeg.time && (
                <div className="type-caption text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  at {summary.nextLeg.time}
                </div>
              )}
              {onStartNext && !isFirstLeg && (
                <button
                  onClick={() => onStartNext(summary.nextLeg.practiceType)}
                  className="type-label mt-3 px-6 py-2 rounded-full font-bold transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    color: '#050508',
                    boxShadow: '0 4px 12px var(--accent-30)',
                  }}
                >
                  Start Now
                </button>
              )}
            </div>
          )}

          {/* Daily Summary for Last Leg */}
          {isLastLeg && allLegsComplete && summary.dailyStats && (
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.3)',
                border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-10)',
                marginBottom: '20px',
              }}
            >
              <div
                className="type-label mb-3 text-center"
                style={{
                  color: 'var(--accent-color)',
                }}
              >
                ✦ Today's Practice Complete
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="type-label" style={{ color: 'var(--text-muted)' }}>
                    Total Time
                  </div>
                  <div className="type-metric text-[16px] mt-1" style={{ color: 'var(--text-primary)' }}>
                    {summary.dailyStats.totalMinutes}m
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div className="type-label" style={{ color: 'var(--text-muted)' }}>
                    Precision
                  </div>
                  <div className="type-metric text-[16px] mt-1" style={{ color: 'var(--accent-color)' }}>
                    {summary.dailyStats.precisionScore || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Tomorrow's Practice Time */}
              {summary.dailyStats.nextPracticeTime && (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '12px',
                  borderTop: isLight ? '1px solid rgba(60,50,35,0.1)' : '1px solid var(--accent-10)',
                }}>
                  <div className="type-label mb-1" style={{ color: 'var(--text-muted)' }}>
                    Next Practice
                  </div>
                  <div className="type-h3 text-[12px]" style={{ color: 'var(--text-primary)' }}>
                    {summary.dailyStats.nextPracticeType}
                  </div>
                  <div className="type-caption text-[11px] mt-0.5" style={{ color: 'var(--accent-color)' }}>
                    Tomorrow at {summary.dailyStats.nextPracticeTime}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={onContinue}
            className="type-label px-8 py-3 rounded-full font-bold transition-all hover:scale-105"
            style={{
              background: summary.nextLeg || !onStartNext ? 'var(--accent-color)' : (isLight ? 'rgba(60,50,35,0.15)' : 'rgba(255,255,255,0.15)'),
              color: summary.nextLeg || !onStartNext ? '#fff' : 'var(--text-secondary)',
              boxShadow: summary.nextLeg || !onStartNext ? '0 8px 20px var(--accent-30)' : 'none',
            }}
          >
            {allLegsComplete ? 'See You Tomorrow ✦' : (summary.nextLeg ? 'Continue' : 'Completed')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default SessionSummaryModal;
