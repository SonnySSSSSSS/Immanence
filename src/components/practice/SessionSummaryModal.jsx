// SessionSummaryModal.jsx
// Post-session summary display component

import React from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { plateauMaterial, innerGlowStyle, getCardMaterial, getInnerGlowStyle } from '../../styles/cardMaterial.js';

/**
 * Session Summary Modal - displays after practice completion
 * @param {object} props
 * @param {object} props.summary - Session summary data
 * @param {function} props.onContinue - Callback when user clicks Continue
 */
export function SessionSummaryModal({ summary, onContinue }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  if (!summary) return null;

  return (
    <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12">
      <div
        className="rounded-[32px] relative overflow-hidden"
        style={{
          width: '460px',
          ...(isLight ? getCardMaterial(true) : plateauMaterial),
          border: isLight ? '1px solid var(--light-border, rgba(60,50,35,0.15))' : '1px solid var(--accent-20)',
          boxShadow: isLight
            ? '0 4px 24px rgba(60,50,35,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={isLight ? getInnerGlowStyle(true) : innerGlowStyle} />

        <div className="relative px-8 py-10 text-center">
          {/* Decorative Icon */}
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              filter: 'drop-shadow(0 0 20px var(--accent-40))',
            }}
          >
            ⚜
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-mythic)',
              color: 'var(--text-primary)',
              marginBottom: '24px',
              textShadow: isLight ? 'none' : '0 0 10px var(--accent-30)',
            }}
          >
            SESSION COMPLETE
          </div>

          {/* Stats Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.3)',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-10)',
              marginBottom: '24px',
            }}
          >
            {/* Practice Type */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Practice
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '4px',
              }}>
                {summary.practice}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-mythic)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Duration
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '4px',
              }}>
                {summary.duration} minutes
              </div>
            </div>

            {/* Accuracy Stats (if available) */}
            {summary.tapStats && (
              <div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-mythic)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  Accuracy
                </span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: '4px',
                }}>
                  {summary.tapStats.avgErrorMs}ms avg
                </div>
              </div>
            )}

            {/* Breath Count (if available) */}
            {summary.breathCount > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-mythic)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  Breath Cycles
                </span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
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
                padding: '12px 16px',
                borderRadius: '12px',
                background: isLight ? 'rgba(60,50,35,0.03)' : 'rgba(255,255,255,0.05)',
                marginBottom: '20px',
                textAlign: 'left',
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
                Next Up
              </span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '4px',
              }}>
                {summary.nextLeg.practiceType || summary.nextLeg.label}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105"
            style={{
              background: 'var(--accent-color)',
              color: '#fff',
              boxShadow: '0 8px 20px var(--accent-30)',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

export default SessionSummaryModal;
