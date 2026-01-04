// SessionSummaryModal.jsx
// Post-session summary and "What's Next" display component

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from '../../styles/cardMaterial.js';

// Quick practice suggestions based on what was just completed
const PRACTICE_SUGGESTIONS = {
  "Breath & Stillness": ["Cognitive Vipassana", "Somatic Vipassana", "Visualization"],
  "Cognitive Vipassana": ["Breath & Stillness", "Somatic Vipassana", "Sound"],
  "Somatic Vipassana": ["Breath & Stillness", "Cognitive Vipassana", "Sound"],
  "Visualization": ["Breath & Stillness", "Cymatics", "Sound"],
  "Cymatics": ["Visualization", "Sound", "Breath & Stillness"],
  "Sound": ["Breath & Stillness", "Visualization", "Somatic Vipassana"],
  "Ritual": ["Breath & Stillness", "Cognitive Vipassana"],
  "Circuit": ["Breath & Stillness", "Sound"],
};

/**
 * Session Summary Modal - displays after practice completion
 * Shows results AND prompts for what to practice next
 * @param {object} props
 * @param {object} props.summary - Session summary data
 * @param {function} props.onContinue - Callback when user clicks Continue (returns to selection)
 * @param {function} props.onStartNext - Callback to start next practice (receives practice type)
 */
export function SessionSummaryModal({ summary, onContinue, onStartNext }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  if (!summary) return null;

  const suggestions = PRACTICE_SUGGESTIONS[summary.practice] || ["Breath & Stillness", "Visualization"];

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
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-mythic)',
              color: 'var(--text-primary)',
              marginBottom: '20px',
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
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Practice
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '4px',
              }}>
                {summary.practice}
              </div>
            </div>

            {/* Duration */}
            <div>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Duration
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '4px',
              }}>
                {summary.duration}m
              </div>
            </div>

            {/* Accuracy (if available) */}
            {summary.tapStats && (
              <div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-mythic)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  Accuracy
                </span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                }}>
                  {summary.tapStats.avgErrorMs}ms
                </div>
              </div>
            )}

            {/* Breath Count (if available) */}
            {summary.breathCount > 0 && (
              <div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-mythic)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  Breaths
                </span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                }}>
                  {summary.breathCount}
                </div>
              </div>
            )}
          </div>

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
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                color: 'var(--accent-color)',
              }}>
                ✦ Next in Curriculum
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '6px',
              }}>
                {summary.nextLeg.practiceType || summary.nextLeg.label}
              </div>
              {onStartNext && (
                <button
                  onClick={() => onStartNext(summary.nextLeg.practiceType)}
                  className="mt-3 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
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

          {/* What's Next Section */}
          {!summary.nextLeg && onStartNext && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-mythic)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                }}
              >
                What's Next?
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((practice) => (
                  <button
                    key={practice}
                    onClick={() => onStartNext(practice)}
                    className="px-4 py-2 rounded-full text-[10px] font-semibold transition-all hover:scale-105"
                    style={{
                      background: isLight ? 'rgba(60,50,35,0.08)' : 'rgba(255,255,255,0.08)',
                      color: isLight ? 'var(--light-text-primary)' : 'var(--text-primary)',
                      border: isLight ? '1px solid rgba(60,50,35,0.15)' : '1px solid var(--accent-20)',
                    }}
                  >
                    {practice}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105"
            style={{
              background: summary.nextLeg || !onStartNext ? 'var(--accent-color)' : (isLight ? 'rgba(60,50,35,0.15)' : 'rgba(255,255,255,0.15)'),
              color: summary.nextLeg || !onStartNext ? '#fff' : 'var(--text-secondary)',
              boxShadow: summary.nextLeg || !onStartNext ? '0 8px 20px var(--accent-30)' : 'none',
            }}
          >
            {summary.nextLeg ? 'Continue' : (onStartNext ? 'Done for Now' : 'Continue')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default SessionSummaryModal;
