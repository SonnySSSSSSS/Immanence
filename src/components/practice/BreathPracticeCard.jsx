import React, { useState } from "react";
import { SacredTimeSlider } from "../SacredTimeSlider.jsx";
import { TrajectoryCard } from "../TrajectoryCard.jsx";
import BreathWaveform from "../BreathWaveform.jsx";
import { TraditionalBreathRatios } from "../PracticeSection/TraditionalBreathRatios.jsx";
import { PracticeMenuHeader } from "./PracticeMenuHeader.jsx";

function BreathPracticeCard({
  practiceId,
  label,
  breathSubmode,
  onBreathSubmodeChange,
  pattern,
  onPatternChange,
  onRunBenchmark,
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
  // Sub-method for breath mode: expansion (sliders) vs traditional (presets)
  const [breathMethod, setBreathMethod] = useState("expansion");

  // Determine tutorial ID based on current submode
  const tutorialId = breathSubmode === 'stillness' ? 'practice:stillness' : 'practice:breath';

  return (
    <div className="relative px-8 animate-in fade-in duration-300">
      {/* FOUNDATION section header (above Breath & Stillness tabs) */}
      {practiceId === 'breath' && (
        <div
          style={{
            fontSize: '14px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#F5E6D3',
            marginTop: '20px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          FOUNDATION
        </div>
      )}

      {/* HEADER - using shared component */}
      <PracticeMenuHeader
        title={practiceId === 'breath' ? undefined : label}
        tutorialId={tutorialId}
        showTutorial={true}
        marginBottom={practiceId === 'breath' ? '0px' : '24px'}
      >
        {/* Top Level: Breath vs Stillness as Title-like Tabs */}
        {practiceId === 'breath' && (
          <div className="flex items-center justify-center gap-4" style={{ marginTop: '20px', marginBottom: '24px' }}>
            {[
              { id: 'breath', label: 'Breath' },
              { id: 'stillness', label: 'Stillness' }
            ].map((item, idx) => {
              const isActive = breathSubmode === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    type="button"
                    onClick={() => onBreathSubmodeChange?.(item.id)}
                    aria-selected={isActive}
                    aria-label={`${item.label} mode`}
                    className="breath-title-tab transition-all"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: isActive ? 'rgba(212, 175, 55, 0.95)' : 'rgba(245, 230, 211, 0.45)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid rgba(212, 175, 55, 0.9)' : '2px solid transparent',
                      paddingBottom: '4px',
                      cursor: 'pointer',
                      transition: 'all 300ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(212, 175, 55, 0.7)';
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(245, 230, 211, 0.45)';
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid rgba(212, 175, 55, 0.6)';
                      e.currentTarget.style.outlineOffset = '4px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    {item.label}
                  </button>
                  {idx === 0 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'rgba(212, 175, 55, 0.7)',
                        userSelect: 'none',
                      }}
                    >
                      &
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </PracticeMenuHeader>

      {/* Dynamic Config Panel */}
      <div className="min-h-[100px]" style={{ marginBottom: practiceId === 'breath' ? '16px' : '32px' }}>
        {/* Breath Mode Content */}
        {breathSubmode === 'breath' && (
          <>
            {/* Expansion vs Traditional Toggle - first after header */}
            <div className="flex items-center justify-center gap-2" style={{ marginBottom: '16px' }}>
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
                      color: isActive ? 'rgba(212, 175, 55, 0.95)' : 'rgba(245, 230, 211, 0.45)',
                      background: isActive ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: isActive ? '0 0 12px rgba(212, 175, 55, 0.2)' : 'none'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Waveform - always visible in breath mode */}
            <div
              className="breath-wave-glow"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.1) 100%)',
                backdropFilter: 'blur(32px) saturate(160%)',
                WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              }}
            >
              <BreathWaveform pattern={pattern} />
            </div>

            {/* Breath Phase Input Controls - always visible */}
            <div
              className="flex justify-center gap-8"
              style={{ marginTop: '24px', marginBottom: '16px' }}
            >
              {[
                { label: 'INHALE', key: 'inhale', min: 1 },
                { label: 'HOLD 1', key: 'hold1', min: 0 },
                { label: 'EXHALE', key: 'exhale', min: 1 },
                { label: 'HOLD 2', key: 'hold2', min: 0 }
              ].map((phase) => (
                <div key={phase.key} className="flex flex-col items-center">
                  <label
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    {phase.label}
                  </label>
                  <input
                    type="number"
                    min={phase.min}
                    max="60"
                    value={pattern?.[phase.key] ?? (phase.min === 1 ? 4 : 0)}
                    onChange={(e) => {
                      const val = Math.max(phase.min, Math.min(60, parseInt(e.target.value) || 0));
                      onPatternChange?.((prev) => ({ ...prev, [phase.key]: val }));
                    }}
                    className="breath-input"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '6px 0',
                      width: '44px',
                      color: 'var(--accent-color)',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      outline: 'none',
                      transition: 'all 200ms'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Traditional Ratios Panel - shown when traditional method selected */}
            {breathMethod === 'traditional' && (
              <div style={{ marginBottom: '16px' }}>
                <TraditionalBreathRatios
                  onSelectRatio={([inhale, hold1, exhale, hold2]) => {
                    onPatternChange?.({ inhale, hold1, exhale, hold2 });
                  }}
                />
              </div>
            )}

            {/* Benchmark Button - only for expansion method */}
            {breathMethod === 'expansion' && (
              <div className="flex justify-center" style={{ marginBottom: '16px' }}>
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
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: 'rgba(212, 175, 55, 0.9)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    boxShadow: '0 0 8px rgba(212, 175, 55, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(212, 175, 55, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(212, 175, 55, 0.1)';
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
              filter: blur(18px);
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
        {breathSubmode === 'stillness' && (
          <>
            {/* Waveform - visible in stillness mode */}
            <div
              className="breath-wave-glow"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.1) 100%)',
                backdropFilter: 'blur(32px) saturate(160%)',
                WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              }}
            >
              <BreathWaveform pattern={pattern} />
            </div>

            {/* Phase Display - read-only in stillness mode */}
            <div
              className="flex justify-center gap-8"
              style={{ marginTop: '24px', marginBottom: '16px' }}
            >
              {[
                { label: 'INHALE', key: 'inhale', min: 1 },
                { label: 'HOLD 1', key: 'hold1', min: 0 },
                { label: 'EXHALE', key: 'exhale', min: 1 },
                { label: 'HOLD 2', key: 'hold2', min: 0 }
              ].map((phase) => (
                <div key={phase.key} className="flex flex-col items-center">
                  <label
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    {phase.label}
                  </label>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '8px 0',
                      width: '44px',
                      color: 'var(--accent-color)',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {pattern?.[phase.key] ?? (phase.min === 1 ? 4 : 0)}
                  </div>
                </div>
              ))}
            </div>

            <style>{`
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
              filter: blur(18px);
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
            `}</style>
          </>
        )}
      </div>

      {/* Collapsible Tempo Sync Section (Breath Practice + Expansion Method Only) */}
      {breathSubmode === 'breath' && breathMethod === 'expansion' && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={onToggleTempoSync}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: showTempoSync ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
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
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showTempoSync ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.2)';
          }}
        >
          <span>?? Tempo Sync</span>
          <span style={{ transform: showTempoSync ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}></span>
        </button>
        
        <div
          style={{
            marginTop: '8px',
            display: showTempoSync ? 'block' : 'none',
          }}
        >
          {tempoSyncSlot}
        </div>
        
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
      {supportsDuration && practiceId !== 'circuit' && (
        <div
          style={{ marginBottom: practiceId === 'breath' ? '24px' : '40px' }}
          data-tutorial={breathSubmode === 'stillness' ? 'stillness-options' : undefined}
        >
          <div className="font-bold uppercase text-center" style={{ fontFamily: 'var(--font-display)', color: 'rgba(245, 230, 211, 0.5)', marginBottom: practiceId === 'breath' ? '16px' : '24px', letterSpacing: '0.12em', fontSize: '10px', fontWeight: 600, opacity: 1 }}>
            Sacred Duration (minutes)
          </div>
          <SacredTimeSlider
            value={duration}
            onChange={onDurationChange}
            options={durationOptions}
          />
        </div>
      )}

      {/* Start Button - Sacred Portal with Ember Theme */}
      {!(practiceId === 'ritual') && (
        <div className="flex flex-col items-center" style={{ marginTop: '32px', marginBottom: '24px' }}>
          <button
            onClick={onStart}
            className="group transition-all duration-300 relative overflow-hidden begin-button"
            style={{
              width: '100%',
              maxWidth: '400px',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '18px 52px',
              borderRadius: '60px',
              background: 'var(--ui-button-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)))',
              color: '#0a0a0a',
              textShadow: '0 0 10px var(--accent-color)',
              boxShadow: `
                0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
                inset 0 0 30px rgba(255, 255, 255, 0.25),
                0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
              `,
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = `
                0 0 100px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 1),
                inset 0 0 35px rgba(255, 255, 255, 0.35),
                0 12px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.75)
              `;
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `
                0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.8),
                inset 0 0 30px rgba(255, 255, 255, 0.25),
                0 8px 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55)
              `;
            }}
          >
            {/* Radial glow backdrop with fiery pulse */}
            <div
              className="portal-glow"
              style={{
                position: 'absolute',
                inset: '-4px',
                background: 'radial-gradient(circle at center, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.6) 0%, transparent 70%)',
                opacity: 0.7,
                filter: 'blur(15px)',
                zIndex: -1,
                animation: 'portal-pulse 3s infinite ease-in-out',
              }}
            />
            {/* Ripple effect on hover */}
            <div
              className="portal-ripple"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '60px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
                opacity: 0,
                transform: 'scale(0.5)',
                transition: 'all 0.6s ease-out',
                pointerEvents: 'none',
              }}
            />
            <span className="relative z-10">{practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice'}</span>
          </button>
          <style>{`
            @keyframes portal-pulse {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
            .begin-button:hover .portal-ripple {
              opacity: 1 !important;
              transform: scale(1.1) !important;
            }
          `}</style>

          {practiceId === 'breath' && (
            <div className="w-full" style={{ maxWidth: '430px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={onToggleTrajectory}
                className="w-full text-[9px] font-black uppercase tracking-[0.35em] transition-opacity"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'rgba(253, 251, 245, 0.85)',
                  opacity: showTrajectory ? 0.95 : 0.55,
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(10, 12, 18, 0.35)',
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
        </div>
      )}
    </div>
  );
}

export default BreathPracticeCard;
