import React, { useMemo } from 'react';
import { computeCalibrationStats } from '../services/eigengrau/calibration.js';

const ASSIST_OPTIONS = [
  { id: 'softer', label: 'Softer' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'slightly-clearer', label: 'Slightly Clearer' },
];

function clampStage(stage) {
  const n = Number(stage);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(3, Math.round(n)));
}

function surfaceButtonStyle(selected) {
  return {
    fontFamily: 'var(--font-display)',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderRadius: '999px',
    padding: '6px 12px',
    border: selected ? '1px solid var(--accent-color)' : '1px solid var(--accent-20)',
    color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
    background: selected ? 'var(--accent-10)' : 'transparent',
  };
}

export function EigengrauConfig({
  eigengrauSessionType = 'calibration',
  setEigengrauSessionType,
  eigengrauCalibrationStage = 1,
  setEigengrauCalibrationStage,
  eigengrauVisibilityAssist = 'balanced',
  setEigengrauVisibilityAssist,
  eigengrauAssistLockedUntilMs = 0,
  setEigengrauAssistLockedUntilMs,
  eigengrauPracticeMarkerEnabled = true,
  setEigengrauPracticeMarkerEnabled,
}) {
  const stage = clampStage(eigengrauCalibrationStage);
  const assistLocked = Number(eigengrauAssistLockedUntilMs) > 0;

  const stats = useMemo(() => computeCalibrationStats({ stage, days: 14 }), [stage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="type-caption" style={{ color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
        Threshold-awareness training in a restrained eigengrau field.
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => setEigengrauSessionType?.('calibration')}
          style={{ ...surfaceButtonStyle(eigengrauSessionType === 'calibration'), flex: '1', textAlign: 'center' }}
        >
          Calibration
        </button>
        <button
          type="button"
          onClick={() => setEigengrauSessionType?.('practice')}
          style={{ ...surfaceButtonStyle(eigengrauSessionType === 'practice'), flex: '1', textAlign: 'center' }}
        >
          Practice
        </button>
      </div>

      {eigengrauSessionType === 'calibration' && (
        <>
          <div>
            <div className="type-label" style={{ fontSize: '9px', marginBottom: '8px', color: 'var(--text-muted)' }}>
              Calibration Stage
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEigengrauCalibrationStage?.(s)}
                  style={surfaceButtonStyle(stage === s)}
                >
                  Stage {s}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--accent-20)',
              borderRadius: '12px',
              padding: '10px 12px',
              background: 'rgba(0,0,0,0.14)',
            }}
          >
            <div className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
              14-day reliability window (stage {stage})
            </div>
            <div className="type-caption" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Reliability: {Math.round(stats.reliability * 100)}% | False positives: {Math.round(stats.falsePositiveRate * 100)}% | Trials: {stats.totalTrials}/{stats.thresholds.minTrials}
            </div>
            <div className="type-caption" style={{ color: stats.pass ? 'var(--accent-color)' : 'var(--text-muted)', marginTop: '6px' }}>
              {stats.pass
                ? 'Perception stabilizing. Ready for the next threshold when you choose.'
                : 'Continue stabilization; this is signal training, not failure.'}
            </div>
            {stats.pass && stage < 3 && (
              <button
                type="button"
                onClick={() => setEigengrauCalibrationStage?.(stage + 1)}
                style={{
                  marginTop: '8px',
                  ...surfaceButtonStyle(false),
                  border: '1px solid var(--accent-color)',
                  color: 'var(--text-primary)',
                }}
              >
                Advance To Stage {stage + 1}
              </button>
            )}
          </div>
        </>
      )}

      <div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {ASSIST_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={assistLocked && option.id !== eigengrauVisibilityAssist}
              onClick={() => {
                if (assistLocked && option.id !== eigengrauVisibilityAssist) return;
                setEigengrauVisibilityAssist?.(option.id);
                setEigengrauAssistLockedUntilMs?.(1);
              }}
              style={{
                ...surfaceButtonStyle(eigengrauVisibilityAssist === option.id),
                opacity: assistLocked && option.id !== eigengrauVisibilityAssist ? 0.5 : 1,
                cursor: assistLocked && option.id !== eigengrauVisibilityAssist ? 'not-allowed' : 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="type-caption" style={{ color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5, textAlign: 'center' }}>
          Visibility assist — adjusts threshold visibility to your display conditions, not opacity.
          {assistLocked ? ' Assist locked for this calibration block.' : ''}
        </div>
        {assistLocked && (
          <button
            type="button"
            onClick={() => setEigengrauAssistLockedUntilMs?.(0)}
            style={{ ...surfaceButtonStyle(false), marginTop: '8px' }}
          >
            Start New Block (Unlock Assist)
          </button>
        )}
      </div>

      {eigengrauSessionType === 'practice' && (
        <label className="type-caption" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={Boolean(eigengrauPracticeMarkerEnabled)}
            onChange={(e) => setEigengrauPracticeMarkerEnabled?.(Boolean(e.target.checked))}
          />
          Enable optional “I noticed a shift” marker
        </label>
      )}
    </div>
  );
}

export default EigengrauConfig;
