import React from "react";
import { GuidanceAudioController } from "../audio/GuidanceAudioController.jsx";
import { BREATH_RING_PRESETS } from "../breathingRingPresets.js";
import { BreathBenchmark } from "../BreathBenchmark.jsx";
import { FeedbackModal } from "../FeedbackModal.jsx";
import { PracticeConfigPanel } from "./PracticeConfigPanel.jsx";

function PracticeSectionShell({ children, className, style }) {
  return (
    <section className={className} style={style}>
      {children}
    </section>
  );
}

export function PracticeSectionMainAssembly({
  guidanceStatus,
  isRunning,
  handleTogglePause,
  isSessionPaused,
  guidanceSource,
  isActiveBreathSession,
  devCompleteNowOverlay,
  handleStop,
  guidanceFallbackSubtitle,
  sessionView,
  summaryView,
  isPresetSwitcherOpen,
  isBreathPractice,
  presetSwitcherZIndex,
  currentRingPreset,
  ringPresetIndex,
  countdownValue,
  preDelayInstructionLines,
  activeCircuitId,
  circuitConfig,
  circuitExerciseIndex,
  circuitValidationError,
  setCircuitValidationError,
  showSummaryModal,
  isStarting,
  pendingPathAutoStart,
  getPracticeConfig,
  practiceId,
  practiceParams,
  updateParams,
  breathSubmode,
  setBreathSubmode,
  isSanctuary,
  handleSelectPractice,
  practiceSelector,
  pathLaunchInstructionVideo,
  duration,
  setDuration,
  handleStart,
  handleQuickStart,
  uiTokens,
  configProps,
  hasExpandedOnce,
  setHasExpandedOnce,
  openTrajectoryReport,
  tempoSyncEnabled,
  tempoPhaseDuration,
  tempoBeatsPerPhase,
  handleRunBenchmark,
  setShowBreathBenchmark,
  isLight,
  showBreathBenchmark,
  handleBenchmarkClose,
  showFeedbackModal,
  setShowFeedbackModal,
}) {
  const DevCompleteNowOverlayComponent = devCompleteNowOverlay;

  return (
    <>
      <GuidanceAudioController />
      <BreathBenchmark isOpen={showBreathBenchmark} onClose={handleBenchmarkClose} />
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 10060,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(8, 10, 18, 0.84)',
          color: 'rgba(255,255,255,0.96)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.32)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <span
          className="type-label"
          style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          GUIDANCE AUDIO: {String(guidanceStatus || 'idle').toUpperCase()}
        </span>
        {isRunning && (
          <button
            type="button"
            onClick={handleTogglePause}
            className="type-label"
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.96)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {isSessionPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
      {isRunning && (
        <div
          style={{
            position: 'fixed',
            top: 52,
            right: 10,
            zIndex: 10059,
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '8px',
            fontFamily: 'monospace',
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(8, 10, 18, 0.42)',
            maxWidth: 'min(92vw, 420px)',
            wordBreak: 'break-all',
          }}
        >
          Audio: {guidanceSource || 'NULL'}
        </div>
      )}
      {!isActiveBreathSession && (
        <DevCompleteNowOverlayComponent
          isRunning={isRunning}
          onCompleteNow={() => handleStop({ completed: true })}
        />
      )}
      {isRunning && guidanceFallbackSubtitle && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(88px, calc(env(safe-area-inset-bottom) + 72px))',
            transform: 'translateX(-50%)',
            zIndex: 10058,
            width: 'min(92vw, 460px)',
            padding: '10px 14px',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(8, 10, 18, 0.84)',
            color: 'rgba(255,255,255,0.94)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          <div className="type-caption" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {guidanceFallbackSubtitle}
          </div>
        </div>
      )}
      {sessionView}
      {summaryView}
      {isPresetSwitcherOpen && isBreathPractice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: presetSwitcherZIndex,
            minWidth: '260px',
            maxWidth: 'min(94vw, 420px)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(8, 10, 18, 0.86)',
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            boxShadow: '0 14px 50px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        >
          <div className="type-caption text-[10px]" style={{ opacity: 0.72 }}>
            Ring Presets
          </div>
          <div className="type-label mt-1" style={{ color: 'var(--accent-color)' }}>
            {currentRingPreset.label}
          </div>
          <div
            className="type-caption text-[10px] mt-2"
            style={{ opacity: 0.7, display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}
          >
            {BREATH_RING_PRESETS.map((preset, index) => (
              <span
                key={preset.id}
                style={{
                  opacity: index === ringPresetIndex ? 1 : 0.5,
                  color: index === ringPresetIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.75)',
                }}
              >
                {preset.label}
              </span>
            ))}
          </div>
          <div className="type-caption text-[10px] mt-2" style={{ opacity: 0.55 }}>
            F2 open/close | ← → change | Esc close
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdownValue !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="type-display text-[120px] font-bold"
            style={{
              color: 'var(--accent-color)',
              textShadow: '0 0 40px var(--accent-color), 0 0 80px var(--accent-color)',
              animation: 'countdown-pulse 1s ease-in-out',
            }}
          >
            {countdownValue}
          </div>
          <div
            className="type-label text-[14px] mt-8"
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Get Ready...
          </div>
          {preDelayInstructionLines && (
            <div
              className="type-body text-center mt-6"
              style={{
                width: 'min(440px, calc(100vw - 48px))',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                color: 'rgba(255, 255, 255, 0.82)',
                fontSize: 'clamp(15px, 3.8vw, 17px)',
                lineHeight: 1.45,
                textWrap: 'balance',
              }}
            >
              {preDelayInstructionLines.map((line) => (
                <div
                  key={line}
                  style={{
                    textShadow: '0 2px 12px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
          {/* Next practice info for circuit transitions */}
          {activeCircuitId && circuitConfig && circuitExerciseIndex < circuitConfig.exercises.length && (
            <div
              className="type-body text-[16px] text-center mt-6"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="type-caption text-[12px] mb-2" style={{ opacity: 0.6 }}>Next:</div>
              <div>
                {circuitConfig.exercises[circuitExerciseIndex].exercise.name}
                {' '}({circuitConfig.exercises[circuitExerciseIndex].duration}m)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Circuit Validation Error Modal */}
      {circuitValidationError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setCircuitValidationError(null)}
        >
          <div
            className="type-body"
            style={{
              background: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(200, 100, 100, 0.4)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '420px',
              color: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="type-h3 mb-4"
              style={{
                color: 'rgba(255, 100, 100, 0.9)',
              }}
            >
              Circuit Configuration Error
            </div>
            <div
              className="type-body text-[14px] mb-6"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              {circuitValidationError}
            </div>
            <button
              onClick={() => setCircuitValidationError(null)}
              className="type-body text-[14px] font-semibold"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(100, 150, 200, 0.3)',
                border: '1px solid rgba(100, 150, 200, 0.5)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(100, 150, 200, 0.5)';
                e.target.style.boxShadow = '0 0 20px rgba(100, 150, 200, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(100, 150, 200, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Back to Circuit Config
            </button>
          </div>
        </div>
      )}

      <PracticeConfigPanel
        showSummaryModal={showSummaryModal}
        isRunning={isRunning}
        isStarting={isStarting}
        pendingPathAutoStart={pendingPathAutoStart}
        getPracticeConfig={getPracticeConfig}
        practiceId={practiceId}
        practiceParams={practiceParams}
        updateParams={updateParams}
        breathSubmode={breathSubmode}
        setBreathSubmode={setBreathSubmode}
        isSanctuary={isSanctuary}
        handleSelectPractice={handleSelectPractice}
        practiceSelector={practiceSelector}
        pathLaunchInstructionVideo={pathLaunchInstructionVideo}
        duration={duration}
        setDuration={setDuration}
        handleStart={handleStart}
        handleQuickStart={handleQuickStart}
        uiTokens={uiTokens}
        configProps={configProps}
        hasExpandedOnce={hasExpandedOnce}
        setHasExpandedOnce={setHasExpandedOnce}
        openTrajectoryReport={openTrajectoryReport}
        tempoSyncEnabled={tempoSyncEnabled}
        tempoPhaseDuration={tempoPhaseDuration}
        tempoBeatsPerPhase={tempoBeatsPerPhase}
        handleRunBenchmark={handleRunBenchmark}
        onDisableBenchmark={() => setShowBreathBenchmark(false)}
        isLight={isLight}
      />

      {/* Evening Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={() => setShowFeedbackModal(false)}
      />
    </>
  );
}

export default PracticeSectionShell;
