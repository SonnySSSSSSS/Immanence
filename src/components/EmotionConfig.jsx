// src/components/EmotionConfig.jsx
// Configuration panel for Emotion practice mode
// Emotion mode selector and prompt style (minimal vs guided)

import React from 'react';
import { EMOTION_PRACTICES } from '../data/emotionPractices.js';

// Emotion modes in canonical order
export const EMOTION_MODES = [
  { id: 'discomfort', label: 'Discomfort' },
  { id: 'fear', label: 'Fear' },
  { id: 'pleasure', label: 'Pleasure' },
  { id: 'neutrality', label: 'Neutrality' },
  { id: 'care', label: 'Care' },
  { id: 'compassion', label: 'Compassion' },
  { id: 'notknowing', label: 'Not Knowing' },
];

// Prompt modes
export const PROMPT_MODES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'guided', label: 'Guided' },
];

export function EmotionConfig({
  mode = 'discomfort',
  setMode,
  promptMode = 'minimal',
  setPromptMode,
  isLight = false,
}) {
  // Light-mode-aware text colors
  const textColors = {
    primary: isLight ? '#3D3425' : 'rgba(253,251,245,0.7)',
    secondary: isLight ? '#5A4D3C' : 'rgba(253,251,245,0.55)',
    muted: isLight ? '#7A6D58' : 'rgba(253,251,245,0.45)',
    description: isLight ? '#6B5E4A' : 'rgba(253,251,245,0.5)',
  };

  const currentPractice = EMOTION_PRACTICES[mode];
  const frameText = currentPractice?.oneLineFrame || 'Hold space for what arises.';

  return (
    <div className="emotion-config flex flex-col gap-6">
      {/* Emotion Mode Selector */}
      <div>
        <div
          className="grid grid-cols-2 gap-2"
          style={{
            maxWidth: '100%',
          }}
        >
          {EMOTION_MODES.map((emotionMode) => {
            const isActive = mode === emotionMode.id;
            return (
              <button
                key={emotionMode.id}
                onClick={() => setMode?.(emotionMode.id)}
                className="rounded-lg px-3 py-3 transition-all duration-200 text-center"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-wide)',
                  background: isActive
                    ? isLight
                      ? 'rgba(212, 175, 55, 0.15)'
                      : 'rgba(212, 175, 55, 0.2)'
                    : isLight
                      ? 'rgba(60,50,35,0.05)'
                      : 'rgba(0,0,0,0.2)',
                  border: isActive
                    ? `1px solid ${isLight ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.6)'}`
                    : `1px solid ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? 'rgba(212, 175, 55, 1)' : textColors.secondary,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? isLight
                      ? 'inset 0 0 12px rgba(212, 175, 55, 0.1)'
                      : '0 0 20px rgba(212, 175, 55, 0.15)'
                    : 'none',
                }}
              >
                {emotionMode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Text */}
      {currentPractice && (
        <div
          className="rounded-lg p-3"
          style={{
            background: isLight ? 'rgba(60,50,35,0.05)' : 'rgba(0,0,0,0.2)',
            border: isLight ? '1px solid rgba(60,50,35,0.1)' : '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontStyle: 'italic',
            color: textColors.description,
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          "{frameText}"
        </div>
      )}

      {/* Prompt Mode Selector */}
      <div>
        <div className="flex gap-2 justify-center">
          {PROMPT_MODES.map((pMode) => {
            const isActive = promptMode === pMode.id;
            return (
              <button
                key={pMode.id}
                onClick={() => setPromptMode?.(pMode.id)}
                className="rounded-lg px-4 py-2 transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-wide)',
                  background: isActive
                    ? isLight
                      ? 'rgba(212, 175, 55, 0.15)'
                      : 'rgba(212, 175, 55, 0.2)'
                    : isLight
                      ? 'rgba(60,50,35,0.05)'
                      : 'rgba(0,0,0,0.2)',
                  border: isActive
                    ? `1px solid ${isLight ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.6)'}`
                    : `1px solid ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? 'rgba(212, 175, 55, 1)' : textColors.secondary,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? isLight
                      ? 'inset 0 0 12px rgba(212, 175, 55, 0.1)'
                      : '0 0 20px rgba(212, 175, 55, 0.15)'
                    : 'none',
                }}
              >
                {pMode.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
