import React, { useState, useRef, useCallback } from "react";
import { useDisplayModeStore } from "../../state/displayModeStore.js";
import { SacredTimeSlider } from "../SacredTimeSlider.jsx";
import { TrajectoryCard } from "../TrajectoryCard.jsx";
import BreathWaveform from "../BreathWaveform.jsx";
import { TraditionalBreathRatios } from "../PracticeSection/TraditionalBreathRatios.jsx";
import { PracticeMenuHeader } from "./PracticeMenuHeader.jsx";
import { STILLNESS_INTENSITY_META } from "../../data/stillnessIntensityMeta.js";
import { ANCHORS } from "../../tutorials/anchorIds.js";
import { BeginPracticeButton } from "./BeginPracticeButton.jsx";

function CollapsedSummaryCard({
  surfaceBg, surfaceBorder, labelColor, valueColor, breathSubmode, breathMethod,
  focusSec, restSec, pattern, duration, stillnessIntensityLabel, stillnessPreDelaySec,
  isLight, editButtonRef, handleEditClick, isStillnessLocked,
  amberBg, amberBgHover, amberBorder, amberBorderHover, amberColor,
}) {
  return (
    <div style={{
      background: surfaceBg,
      border: `1px solid ${surfaceBorder}`,
      borderRadius: '12px',
      padding: '12px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '9px', color: labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Method</div>
          <div style={{ fontSize: '12px', color: valueColor, fontWeight: 500 }}>
            {breathSubmode === 'stillness' ? 'Stillness' : (breathMethod === 'expansion' ? 'Expansion' : 'Traditional')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {breathSubmode === 'stillness' ? 'Focus/Rest' : 'Cycle'}
          </div>
          <div style={{ fontSize: '12px', color: valueColor, fontWeight: 500 }}>
            {breathSubmode === 'stillness'
              ? `${focusSec}s / ${restSec}s`
              : `${pattern?.inhale ?? 4}–${pattern?.hold1 ?? 0}–${pattern?.exhale ?? 4}–${pattern?.hold2 ?? 0}`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: labelColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {breathSubmode === 'stillness' ? 'Intensity' : 'Duration'}
          </div>
          <div style={{ fontSize: '12px', color: valueColor, fontWeight: 500 }}>
            {breathSubmode === 'stillness' ? stillnessIntensityLabel : `${duration} min`}
          </div>
        </div>
      </div>
      {breathSubmode === 'stillness' && (
        <div style={{
          fontSize: '11px',
          color: isLight ? 'rgba(30,20,0,0.65)' : 'rgba(255,255,255,0.68)',
          marginBottom: '10px',
        }}>
          Pre-delay {stillnessPreDelaySec}s
        </div>
      )}
      {/* Edit Button — 2B: onClick + onPointerDown stop */}
      <button
        ref={editButtonRef}
        type="button"
        onClick={handleEditClick}
        onPointerDown={(e) => e.stopPropagation()}
        data-tutorial={ANCHORS.FOUNDATIONS_EDIT}
        disabled={breathSubmode === 'stillness' && isStillnessLocked}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          background: amberBg,
          border: `1px solid ${amberBorder}`,
          borderRadius: '8px',
          color: amberColor,
          cursor: breathSubmode === 'stillness' && isStillnessLocked ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-display)',
          transition: 'all 200ms',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
          opacity: breathSubmode === 'stillness' && isStillnessLocked ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = amberBgHover;
          e.currentTarget.style.borderColor = amberBorderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = amberBg;
          e.currentTarget.style.borderColor = amberBorder;
        }}
      >
        Edit
      </button>
    </div>
  );
}

function BreathPracticeCard({
  practiceId,
  label,
  breathSubmode,
  pattern,
  onPatternChange,
  onRunBenchmark,
  stillnessConfig,
  onStillnessConfigChange,
  isStillnessLocked,
  breathPreDelaySec,
  onBreathPreDelayChange,
  duration,
  onDurationChange,
  durationOptions,
  supportsDuration,
  showTempoSync,
  onToggleTempoSync,
  tempoSyncSlot,
  onStart,
  showTrajectory,
  onToggleTrajectory,
  onOpenTrajectory,
}) {
  const [breathMethod, setBreathMethod] = useState("expansion");
  const [mode, setMode] = useState("focus");
  const isFocusMode = mode === "focus";
  const editButtonRef = useRef(null);
  const focusSec = Number(stillnessConfig?.focusSec) || 45;
  const restSec = Number(stillnessConfig?.restSec) || 15;
  const stillnessPreDelaySec = Number(stillnessConfig?.preDelaySec) || 0;
  const stillnessIntensity = String(stillnessConfig?.focusIntensity || "medium").toLowerCase();
  const stillnessIntensityMeta = STILLNESS_INTENSITY_META[stillnessIntensity] || STILLNESS_INTENSITY_META.medium;
  const stillnessIntensityLabel = stillnessIntensityMeta.label;
  const stillnessPrompt = stillnessIntensityMeta.prompt;

  // Light/dark mode awareness (2A)
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  // Derived color tokens (2A)
  const surfaceBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
  const surfaceBorder = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.1)';
  const labelColor = isLight ? 'rgba(60,40,0,0.50)' : 'rgba(255,255,255,0.4)';
  const valueColor = isLight ? 'rgba(30,20,0,0.85)' : 'rgba(255,255,255,0.9)';
  const amberBg = isLight ? 'rgba(140,100,0,0.12)' : 'rgba(212,175,55,0.12)';
  const amberBgHover = isLight ? 'rgba(140,100,0,0.20)' : 'rgba(212,175,55,0.20)';
  const amberBorder = isLight ? 'rgba(140,100,0,0.30)' : 'rgba(212,175,55,0.3)';
  const amberBorderHover = isLight ? 'rgba(140,100,0,0.50)' : 'rgba(212,175,55,0.5)';
  const amberColor = isLight ? 'rgba(100,65,0,0.90)' : 'rgba(212,175,55,0.9)';
  const amberInputColor = isLight ? 'rgba(100,65,0,0.85)' : 'rgba(212,175,55,0.8)';
  const amberActiveBg = isLight ? 'rgba(140,100,0,0.18)' : 'rgba(212,175,55,0.18)';
  const amberActiveBorder = isLight ? 'rgba(140,100,0,0.50)' : 'rgba(212,175,55,0.5)';
  const amberActiveColor = isLight ? 'rgba(100,65,0,0.95)' : 'rgba(212,175,55,0.95)';
  const inactiveBorder = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)';
  const inactiveColor = isLight ? 'rgba(60,40,0,0.70)' : 'rgba(255,255,255,0.65)';
  const inactiveBg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
  const promptColor = isLight ? 'rgba(30,20,0,0.75)' : 'rgba(255,255,255,0.78)';
  const lockedColor = isLight ? 'rgba(60,40,0,0.60)' : 'rgba(255,255,255,0.6)';
  const stepperDisabledColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';

  const tutorialId = breathSubmode === 'stillness' ? 'practice:stillness' : 'practice:breath';

  const handleStart = () => {
    setMode("focus");
    onStart?.();
  };

  // 2B: onClick instead of onMouseDown, with pointer stop propagation
  const handleEditClick = useCallback(() => {
    setMode("explore");
  }, []);

  return (
    <div className="relative px-4 sm:px-8 animate-in fade-in duration-300" data-tutorial={ANCHORS.FOUNDATIONS_ROOT}>
      <PracticeMenuHeader
        title={practiceId === 'breath' ? undefined : label}
        tutorialId={tutorialId}
        showTutorial={true}
        marginBottom={practiceId === 'breath' ? '0px' : '24px'}
      >
      </PracticeMenuHeader>

      <div className="min-h-[100px]" style={{ marginBottom: practiceId === 'breath' ? '20px' : '32px' }}>
        {/* Focus Mode: Collapsed Summary */}
        {isFocusMode && practiceId === 'breath' && (
          <div className="relative z-20" style={{ marginBottom: '20px', pointerEvents: "auto" }}>
            <CollapsedSummaryCard
              surfaceBg={surfaceBg} surfaceBorder={surfaceBorder} labelColor={labelColor} valueColor={valueColor}
              breathSubmode={breathSubmode} breathMethod={breathMethod} focusSec={focusSec} restSec={restSec}
              pattern={pattern} duration={duration} stillnessIntensityLabel={stillnessIntensityLabel}
              stillnessPreDelaySec={stillnessPreDelaySec} isLight={isLight} editButtonRef={editButtonRef}
              handleEditClick={handleEditClick} isStillnessLocked={isStillnessLocked}
              amberBg={amberBg} amberBgHover={amberBgHover} amberBorder={amberBorder}
              amberBorderHover={amberBorderHover} amberColor={amberColor}
            />
          </div>
        )}

        {/* Explore Mode: Collapse button */}
        {!isFocusMode && practiceId === 'breath' && (
          <div style={{ marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setMode("focus")}
              data-tutorial={ANCHORS.FOUNDATIONS_COLLAPSE}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: isLight ? 'rgba(140,100,0,0.10)' : 'rgba(212,175,55,0.1)',
                border: `1px solid ${isLight ? 'rgba(140,100,0,0.25)' : 'rgba(212,175,55,0.25)'}`,
                borderRadius: '8px',
                color: isLight ? 'rgba(100,65,0,0.85)' : 'rgba(212,175,55,0.85)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                transition: 'all 200ms',
                marginBottom: '16px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = amberBgHover;
                e.currentTarget.style.borderColor = amberBorderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLight ? 'rgba(140,100,0,0.10)' : 'rgba(212,175,55,0.1)';
                e.currentTarget.style.borderColor = isLight ? 'rgba(140,100,0,0.25)' : 'rgba(212,175,55,0.25)';
              }}
            >
              <svg aria-hidden="true" width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }}>
                <path d="M9 5L5 1L1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Collapse
            </button>
          </div>
        )}

        {/* Breath Mode Content */}
        {breathSubmode === 'breath' && !isFocusMode && (
          <>
            {/* Expansion vs Traditional Toggle */}
            <div
              data-tutorial={ANCHORS.FOUNDATIONS_BREATH_METHOD}
              className="flex items-center justify-center gap-2"
              style={{ marginBottom: '18px' }}
            >
              {[
                { id: 'expansion', label: 'Expansion' },
                { id: 'traditional', label: 'Traditional' }
              ].map((item) => {
                const isActive = breathMethod === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBreathMethod(item.id)}
                    className="px-3 py-1 rounded-full transition-all"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: isActive ? amberActiveColor : inactiveColor,
                      background: isActive ? amberActiveBg : inactiveBg,
                      border: isActive ? `1px solid ${amberActiveBorder}` : `1px solid ${inactiveBorder}`,
                      boxShadow: isActive ? `0 0 12px ${isLight ? 'rgba(140,100,0,0.20)' : 'rgba(212,175,55,0.2)'}` : 'none',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Waveform */}
            <div
              data-tutorial={ANCHORS.FOUNDATIONS_BREATH_WAVEFORM}
              className="breath-wave-glow"
              style={{
                background: isLight
                  ? 'linear-gradient(135deg, rgba(140,100,0,0.06) 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.1) 100%)',
                backdropFilter: 'blur(32px) saturate(160%)',
                WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                borderRadius: '16px',
                padding: '16px',
                border: `1px solid ${isLight ? 'rgba(140,100,0,0.12)' : 'rgba(212,175,55,0.15)'}`,
                boxShadow: isLight
                  ? '0 8px 32px rgba(0,0,0,0.08), 0 2px 12px rgba(140,100,0,0.10)'
                  : '0 8px 32px rgba(0,0,0,0.4), 0 2px 12px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              <BreathWaveform pattern={pattern} />
            </div>

            {/* Breath Cycle — 2G: stepper inputs */}
            <div data-tutorial={ANCHORS.FOUNDATIONS_BREATH_CYCLE} style={{ marginTop: '24px', marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: labelColor,
                marginBottom: '10px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                Breath Cycle (seconds)
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: '8px 10px' }}>
                {[
                  { label: 'Inhale', key: 'inhale', min: 1, max: 60 },
                  { label: 'Hold 1', key: 'hold1', min: 0, max: 60 },
                  { label: 'Exhale', key: 'exhale', min: 1, max: 60 },
                  { label: 'Hold 2', key: 'hold2', min: 0, max: 60 },
                ].map((phase) => {
                  const val = pattern?.[phase.key] ?? (phase.min === 1 ? 4 : 0);
                  return (
                    <div key={phase.key} className="flex flex-col items-center">
                      <label style={{
                        fontSize: '9px',
                        color: labelColor,
                        marginBottom: '4px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                        {phase.label}
                      </label>
                      <div className="flex flex-row items-center">
                        <button
                          type="button"
                          disabled={val <= phase.min}
                          onClick={() => onPatternChange?.((prev) => ({ ...prev, [phase.key]: Math.max(phase.min, val - 1) }))}
                          style={{
                            width: '28px', height: '44px',
                            border: `1px solid ${surfaceBorder}`,
                            borderRadius: '6px 0 0 6px',
                            background: surfaceBg,
                            color: val <= phase.min ? stepperDisabledColor : amberInputColor,
                            cursor: val <= phase.min ? 'not-allowed' : 'pointer',
                            fontSize: '16px', fontWeight: 700,
                            opacity: val <= phase.min ? 0.35 : 1,
                          }}
                        >−</button>
                        <input
                          type="number"
                          min={phase.min}
                          max={phase.max}
                          value={val}
                          onChange={(e) => {
                            onPatternChange?.((prev) => ({ ...prev, [phase.key]: parseInt(e.target.value, 10) || phase.min }));
                          }}
                          onBlur={(e) => {
                            const clamped = Math.max(phase.min, Math.min(phase.max, parseInt(e.target.value, 10) || phase.min));
                            onPatternChange?.((prev) => ({ ...prev, [phase.key]: clamped }));
                          }}
                          className="breath-input"
                          style={{
                            background: surfaceBg,
                            border: `1px solid ${surfaceBorder}`,
                            borderLeft: 'none', borderRight: 'none',
                            borderRadius: 0,
                            padding: '6px 0',
                            width: '36px',
                            height: '44px',
                            color: amberInputColor,
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-display)',
                            outline: 'none',
                            transition: 'all 200ms',
                          }}
                        />
                        <button
                          type="button"
                          disabled={val >= phase.max}
                          onClick={() => onPatternChange?.((prev) => ({ ...prev, [phase.key]: Math.min(phase.max, val + 1) }))}
                          style={{
                            width: '28px', height: '44px',
                            border: `1px solid ${surfaceBorder}`,
                            borderRadius: '0 6px 6px 0',
                            background: surfaceBg,
                            color: val >= phase.max ? stepperDisabledColor : amberInputColor,
                            cursor: val >= phase.max ? 'not-allowed' : 'pointer',
                            fontSize: '16px', fontWeight: 700,
                            opacity: val >= phase.max ? 0.35 : 1,
                          }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2F: Pre-delay section divider */}
            <div style={{
              height: '1px',
              background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              margin: '12px 0 16px',
            }} />

            {/* Pre-Delay — 2G: stepper input */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: labelColor,
                marginBottom: '8px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                Pre-Delay (seconds)
              </div>
              <div className="flex justify-center">
                <div className="flex flex-row items-center">
                  <button
                    type="button"
                    disabled={Number(breathPreDelaySec) <= 0}
                    onClick={() => onBreathPreDelayChange?.(Math.max(0, Number(breathPreDelaySec) - 1))}
                    style={{
                      width: '44px', height: '44px',
                      border: `1px solid ${surfaceBorder}`,
                      borderRadius: '6px 0 0 6px',
                      background: surfaceBg,
                      color: Number(breathPreDelaySec) <= 0 ? stepperDisabledColor : amberInputColor,
                      cursor: Number(breathPreDelaySec) <= 0 ? 'not-allowed' : 'pointer',
                      fontSize: '18px', fontWeight: 700,
                      opacity: Number(breathPreDelaySec) <= 0 ? 0.35 : 1,
                    }}
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={Number.isFinite(Number(breathPreDelaySec)) ? Number(breathPreDelaySec) : 0}
                    onChange={(e) => {
                      onBreathPreDelayChange?.(parseInt(e.target.value, 10) || 0);
                    }}
                    onBlur={(e) => {
                      const val = Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0));
                      onBreathPreDelayChange?.(val);
                    }}
                    className="breath-input"
                    style={{
                      background: surfaceBg,
                      border: `1px solid ${surfaceBorder}`,
                      borderLeft: 'none', borderRight: 'none',
                      borderRadius: 0,
                      padding: '6px 0',
                      width: '56px',
                      height: '44px',
                      color: amberInputColor,
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={Number(breathPreDelaySec) >= 20}
                    onClick={() => onBreathPreDelayChange?.(Math.min(20, Number(breathPreDelaySec) + 1))}
                    style={{
                      width: '44px', height: '44px',
                      border: `1px solid ${surfaceBorder}`,
                      borderRadius: '0 6px 6px 0',
                      background: surfaceBg,
                      color: Number(breathPreDelaySec) >= 20 ? stepperDisabledColor : amberInputColor,
                      cursor: Number(breathPreDelaySec) >= 20 ? 'not-allowed' : 'pointer',
                      fontSize: '18px', fontWeight: 700,
                      opacity: Number(breathPreDelaySec) >= 20 ? 0.35 : 1,
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Traditional Ratios Panel */}
            {breathMethod === 'traditional' && (
              <div style={{ marginBottom: '28px' }}>
                <TraditionalBreathRatios
                  onSelectRatio={([inhale, hold1, exhale, hold2]) => {
                    onPatternChange?.({ inhale, hold1, exhale, hold2 });
                  }}
                />
              </div>
            )}

            {/* Benchmark Button */}
            {breathMethod === 'expansion' && (
              <div className="flex justify-center" style={{ marginBottom: '20px' }}>
                <button
                  onClick={onRunBenchmark}
                  className="benchmark-button"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(140,100,0,0.06)' : 'rgba(212,175,55,0.06)',
                    border: `1px solid ${isLight ? 'rgba(140,100,0,0.25)' : 'rgba(212,175,55,0.25)'}`,
                    color: isLight ? 'rgba(100,65,0,0.85)' : 'rgba(212,175,55,0.85)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    boxShadow: `0 0 8px ${isLight ? 'rgba(140,100,0,0.08)' : 'rgba(212,175,55,0.1)'}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isLight ? 'rgba(140,100,0,0.15)' : 'rgba(212,175,55,0.15)';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(140,100,0,0.50)' : 'rgba(212,175,55,0.5)';
                    e.currentTarget.style.boxShadow = `0 0 16px ${isLight ? 'rgba(140,100,0,0.18)' : 'rgba(212,175,55,0.2)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isLight ? 'rgba(140,100,0,0.06)' : 'rgba(212,175,55,0.08)';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(140,100,0,0.25)' : 'rgba(212,175,55,0.3)';
                    e.currentTarget.style.boxShadow = `0 0 8px ${isLight ? 'rgba(140,100,0,0.08)' : 'rgba(212,175,55,0.1)'}`;
                  }}
                >
                  ✦ Measure Capacity
                </button>
              </div>
            )}

            <style>{`
            .breath-input::-webkit-inner-spin-button,
            .breath-input::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .breath-input { -moz-appearance: textfield; }
            .breath-input:focus {
              border-color: rgba(212, 175, 55, 0.5);
              background: rgba(212, 175, 55, 0.05);
              box-shadow: 0 0 12px rgba(212, 175, 55, 0.1);
            }
            .breath-wave-glow {
              position: relative;
            }
            .breath-wave-glow::before {
              content: "";
              position: absolute;
              inset: -12px;
              background: radial-gradient(
                ellipse at center,
                rgba(233,195,90,0.25),
                rgba(233,195,90,0.12) 40%,
                rgba(233,195,90,0.04) 60%,
                transparent 70%
              );
              filter: blur(12px);
              pointer-events: none;
              z-index: 0;
              animation: breath-pulse-glow 8s infinite ease-in-out;
            }
            .breath-wave-glow > * {
              position: relative;
              z-index: 1;
            }
            @keyframes breath-pulse-glow {
              0%, 100% { opacity: 0.7; }
              50%      { opacity: 1; }
            }
            .practice-tab::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: 16px;
              background: radial-gradient(circle at 50% 50%, rgba(233,195,90,0.3) 0%, transparent 70%);
              opacity: 0;
              transition: opacity 0.4s;
              pointer-events: none;
            }
            .practice-tab:hover::before {
              opacity: 0.6;
            }
          `}</style>
          </>
        )}

        {/* Stillness Mode Content */}
        {breathSubmode === 'stillness' && !isFocusMode && (
          <>
            {isStillnessLocked && (
              <div
                className="type-caption text-center"
                style={{
                  marginBottom: '16px',
                  color: lockedColor,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Student mode: timing from navigation path
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <div
                data-tutorial={ANCHORS.FOUNDATIONS_STILLNESS_INTENSITY}
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  color: labelColor,
                  marginBottom: '10px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Focus Intensity
              </div>
              <div className="flex items-center justify-center gap-8">
                {['light', 'medium', 'heavy'].map((level) => {
                  const active = stillnessIntensity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={isStillnessLocked}
                      onClick={() => onStillnessConfigChange?.({ focusIntensity: level })}
                      style={{
                        minWidth: '88px',
                        padding: '8px 10px',
                        borderRadius: '999px',
                        border: active ? `1px solid ${amberActiveBorder}` : `1px solid ${inactiveBorder}`,
                        background: active ? amberActiveBg : inactiveBg,
                        color: active ? amberActiveColor : inactiveColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: '10px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        cursor: isStillnessLocked ? 'not-allowed' : 'pointer',
                        opacity: isStillnessLocked ? 0.6 : 1,
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              {/* 2F: Guidance heading above stillness prompt */}
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.10em',
                color: labelColor,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '10px',
                marginBottom: '4px',
              }}>
                Guidance
              </div>
              <div
                className="type-body text-center"
                style={{
                  color: promptColor,
                  fontSize: '13px',
                }}
              >
                {stillnessPrompt}
              </div>
            </div>

            {/* Stillness timing — 2G: stepper inputs */}
            <div
              data-tutorial={ANCHORS.FOUNDATIONS_STILLNESS_TIMING}
              className="flex flex-wrap justify-center"
              style={{ gap: '8px 12px', marginBottom: '18px' }}
            >
              {[
                { label: 'Focus', key: 'focusSec', value: focusSec, min: 5, max: 300 },
                { label: 'Rest', key: 'restSec', value: restSec, min: 3, max: 180 },
                { label: 'Pre-Delay', key: 'preDelaySec', value: stillnessPreDelaySec, min: 0, max: 20 },
              ].map((field) => (
                <div key={field.key} className="flex flex-col items-center">
                  <label style={{
                    fontSize: '9px',
                    letterSpacing: '0.12em',
                    color: labelColor,
                    marginBottom: '4px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {field.label}
                  </label>
                  <div className="flex flex-row items-center">
                    <button
                      type="button"
                      disabled={isStillnessLocked || field.value <= field.min}
                      onClick={() => onStillnessConfigChange?.({ [field.key]: Math.max(field.min, field.value - 1) })}
                      style={{
                        width: '36px', height: '44px',
                        border: `1px solid ${surfaceBorder}`,
                        borderRadius: '6px 0 0 6px',
                        background: surfaceBg,
                        color: (isStillnessLocked || field.value <= field.min) ? stepperDisabledColor : 'var(--accent-color)',
                        cursor: (isStillnessLocked || field.value <= field.min) ? 'not-allowed' : 'pointer',
                        fontSize: '16px', fontWeight: 700,
                        opacity: (isStillnessLocked || field.value <= field.min) ? 0.35 : 1,
                      }}
                    >−</button>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      disabled={isStillnessLocked}
                      value={field.value}
                      onChange={(e) => {
                        onStillnessConfigChange?.({ [field.key]: parseInt(e.target.value, 10) || field.min });
                      }}
                      onBlur={(e) => {
                        const val = Math.max(field.min, Math.min(field.max, parseInt(e.target.value, 10) || field.min));
                        onStillnessConfigChange?.({ [field.key]: val });
                      }}
                      className="breath-input"
                      style={{
                        background: surfaceBg,
                        border: `1px solid ${surfaceBorder}`,
                        borderLeft: 'none', borderRight: 'none',
                        borderRadius: 0,
                        padding: '8px 0',
                        width: '48px',
                        height: '44px',
                        color: 'var(--accent-color)',
                        textAlign: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        opacity: isStillnessLocked ? 0.6 : 1,
                      }}
                    />
                    <button
                      type="button"
                      disabled={isStillnessLocked || field.value >= field.max}
                      onClick={() => onStillnessConfigChange?.({ [field.key]: Math.min(field.max, field.value + 1) })}
                      style={{
                        width: '36px', height: '44px',
                        border: `1px solid ${surfaceBorder}`,
                        borderRadius: '0 6px 6px 0',
                        background: surfaceBg,
                        color: (isStillnessLocked || field.value >= field.max) ? stepperDisabledColor : 'var(--accent-color)',
                        cursor: (isStillnessLocked || field.value >= field.max) ? 'not-allowed' : 'pointer',
                        fontSize: '16px', fontWeight: 700,
                        opacity: (isStillnessLocked || field.value >= field.max) ? 0.35 : 1,
                      }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Collapsible Tempo Sync — 2C: minHeight 44px */}
      {breathSubmode === 'breath' && breathMethod === 'expansion' && !isFocusMode && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={onToggleTempoSync}
            data-tutorial={ANCHORS.FOUNDATIONS_BREATH_TEMPO_TOGGLE}
            style={{
              width: '100%',
              padding: '12px 16px',
              minHeight: '44px',
              backgroundColor: showTempoSync ? 'rgba(74, 222, 128, 0.06)' : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(74, 222, 128, 0.18)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showTempoSync ? 'rgba(74, 222, 128, 0.06)' : 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.18)';
            }}
          >
            <span>Tempo Sync</span>
            <span style={{ transform: showTempoSync ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}></span>
          </button>

          <div style={{ marginTop: '8px', display: showTempoSync ? 'block' : 'none' }}>
            {tempoSyncSlot}
          </div>

          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Shared Duration Slider */}
      {supportsDuration && practiceId !== 'circuit' && !(practiceId === 'breath' && isFocusMode) && (
        <div
          style={{ marginBottom: practiceId === 'breath' ? '24px' : '32px' }}
          data-tutorial={breathSubmode === 'stillness' ? ANCHORS.FOUNDATIONS_STILLNESS_DURATION : ANCHORS.FOUNDATIONS_BREATH_DURATION}
        >
          <SacredTimeSlider
            value={duration}
            onChange={onDurationChange}
            options={durationOptions}
          />
        </div>
      )}

      {/* Start Button — trajectory above, then begin */}
      {!(practiceId === 'ritual') && (
        <div className="flex flex-col items-center" style={{ marginTop: '24px', marginBottom: '14px' }}>
          {/* 3D: Trajectory toggle moved above Begin button */}
          {practiceId === 'breath' && (
            <div className="w-full" style={{ maxWidth: 'var(--ui-rail-max, min(430px, 94vw))', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={onToggleTrajectory}
                data-tutorial={ANCHORS.FOUNDATIONS_TRAJECTORY_TOGGLE}
                className="w-full text-[10px] font-black uppercase tracking-[0.32em] transition-opacity"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: isLight ? 'rgba(30,20,0,0.80)' : 'rgba(253,251,245,0.85)',
                  opacity: showTrajectory ? 0.95 : 0.7,
                  padding: '12px 12px',
                  minHeight: '44px',
                  borderRadius: '14px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'}`,
                  background: isLight ? 'rgba(255,255,255,0.50)' : 'rgba(10,12,18,0.35)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                }}
              >
                {showTrajectory ? 'Hide Trajectory' : 'Show Trajectory'}
              </button>
              {showTrajectory && (
                <div style={{ marginTop: '12px' }}>
                  <TrajectoryCard onTap={() => onOpenTrajectory?.()} />
                </div>
              )}
            </div>
          )}
          <BeginPracticeButton
            label={practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice'}
            onStart={handleStart}
            data-tutorial={ANCHORS.FOUNDATIONS_BEGIN}
          />
        </div>
      )}
    </div>
  );
}

export default BreathPracticeCard;
