import React from "react";
import { BreathingRing } from "../BreathingRing.jsx";
import { VisualizationCanvas } from "../VisualizationCanvas.jsx";
import { CymaticsVisualization } from "../CymaticsVisualization.jsx";
import { EigengrauField } from "./EigengrauField.jsx";
import { SessionControls } from "./SessionControls.jsx";
import { StillnessRingSession } from "./StillnessRingSession.jsx";
import { InstructionVideoPanel } from "../InstructionVideoPanel.jsx";
import { TempoSyncSessionPanel } from "../TempoSyncSessionPanel.jsx";

export function PracticeVisualizationHost({
  isBreathRunningSession,
  breathViewportRootRef,
  breathViewportHeightPx,
  breathViewportReady,
  activeCircuitId,
  circuitConfig,
  isLight,
  circuitExerciseIndex,
  pathLaunchInstructionVideo,
  actualRunningPracticeId,
  geometry,
  fadeInDuration,
  displayDuration,
  fadeOutDuration,
  voidDuration,
  audioEnabled,
  setVisualizationCycles,
  selectedFrequency,
  driftEnabled,
  breathSubmode,
  isRunning,
  isSessionPaused,
  sessionStartTime,
  duration,
  stillnessConfig,
  currentRingPreset,
  pendingNaturalFinishMode,
  handleStillnessBoundaryComplete,
  shouldRenderRingCanvas,
  breathingPatternForRing,
  handleAccuracyTap,
  handleBreathCycleComplete,
  handleBreathingRingUnmount,
  isGuidanceAudioActive,
  tempoSessionActive,
  pendingCycleFinish,
  breathingPatternText,
  showFeedback,
  lastSignedErrorMs,
  feedbackColor,
  feedbackShadow,
  feedbackText,
  handleStop,
  buttonBg,
  radialGlow,
  buttonShadow,
  timeLeftText,
  showBreathCountUi,
  breathCount,
  soundType,
  soundVolume,
  setSoundVolume,
  eigengrauSessionType,
  eigengrauCalibrationStage,
  eigengrauVisibilityAssist,
  eigengrauPracticeMarkerEnabled,
}) {
  const isEigengrauSession = actualRunningPracticeId === "eigengrau";

  return (
    <section
      ref={isBreathRunningSession ? breathViewportRootRef : null}
      className={`w-full h-full min-h-[600px] flex flex-col items-center ${isBreathRunningSession || isEigengrauSession ? "" : "justify-center"}`}
      style={{
        position: isEigengrauSession ? "fixed" : "relative",
        inset: isEigengrauSession ? 0 : undefined,
        zIndex: isEigengrauSession ? 120 : undefined,
        width: "100%",
        minHeight: isBreathRunningSession || isEigengrauSession ? 0 : undefined,
        height: isBreathRunningSession || isEigengrauSession
          ? (breathViewportHeightPx && isBreathRunningSession ? `${breathViewportHeightPx}px` : "100dvh")
          : undefined,
        maxHeight: isBreathRunningSession || isEigengrauSession
          ? (breathViewportHeightPx && isBreathRunningSession ? `${breathViewportHeightPx}px` : "100dvh")
          : undefined,
        overflow: isBreathRunningSession || isEigengrauSession ? "hidden" : undefined,
        paddingBottom: isBreathRunningSession || isEigengrauSession ? 0 : "3rem",
        justifyContent: isBreathRunningSession || isEigengrauSession ? "flex-start" : undefined,
        background: isEigengrauSession ? "#06070b" : undefined,
      }}
    >
      {(isBreathRunningSession || isEigengrauSession) && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: isEigengrauSession ? "#06070b" : "#020207",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          minHeight: 0,
          height: isBreathRunningSession || isEigengrauSession ? "100%" : undefined,
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          overflow: isBreathRunningSession || isEigengrauSession ? "hidden" : undefined,
          visibility: breathViewportReady ? "visible" : "hidden",
        }}
      >
        {activeCircuitId && circuitConfig && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: isLight ? 'var(--light-bg-surface)' : 'rgba(0,0,0,0.7)',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-30)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="type-label" style={{ color: 'var(--text-secondary)' }}>
              Circuit
            </span>
            <div className="flex gap-1">
              {circuitConfig.exercises.map((_, idx) => (
                <div
                  key={idx}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: idx < circuitExerciseIndex ? 'var(--accent-color)'
                      : idx === circuitExerciseIndex ? (isLight ? 'var(--text-primary)' : '#fff')
                        : (isLight ? 'rgba(60,50,35,0.2)' : 'rgba(253,251,245,0.2)'),
                    boxShadow: idx === circuitExerciseIndex ? (isLight ? '0 2px 8px rgba(60,50,35,0.2)' : '0 0 8px rgba(255,255,255,0.6)') : 'none',
                  }}
                />
              ))}
            </div>
            <span className="type-caption text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {circuitExerciseIndex + 1}/{circuitConfig.exercises.length}
            </span>
          </div>
        )}

        {pathLaunchInstructionVideo && !isEigengrauSession && (
          <div
            style={{
              flex: "0 0 auto",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: isBreathRunningSession ? "max(12px, env(safe-area-inset-top)) 16px 0" : "0 16px 16px",
            }}
          >
            <InstructionVideoPanel
              video={pathLaunchInstructionVideo}
              className="w-full max-w-[560px]"
            />
          </div>
        )}

        <div
          className="flex-1 flex items-center justify-center w-full"
          style={{ minHeight: 0, alignItems: isEigengrauSession ? "stretch" : "center" }}
        >
          {actualRunningPracticeId === "visualization" ? (
            <VisualizationCanvas
              geometry={geometry}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : actualRunningPracticeId === "cymatics" ? (
            <CymaticsVisualization
              frequency={selectedFrequency.hz}
              n={selectedFrequency.n}
              m={selectedFrequency.m}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              driftEnabled={driftEnabled}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : actualRunningPracticeId === "eigengrau" ? (
            <EigengrauField
              sessionType={eigengrauSessionType}
              calibrationStage={eigengrauCalibrationStage}
              visibilityAssist={eigengrauVisibilityAssist}
              practiceMarkerEnabled={eigengrauPracticeMarkerEnabled}
            />
          ) : actualRunningPracticeId === "breath" ? (
            <div
              className="w-full h-full flex flex-col"
              style={{
                overflow: isBreathRunningSession ? "hidden" : "visible",
                minHeight: 0,
                flex: "1 1 auto",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  flex: "0 0 auto",
                  minHeight: 0,
                  paddingTop: "env(safe-area-inset-top)",
                }}
              />

              <div
                style={{
                  flex: "1 1 auto",
                  minHeight: 0,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {breathSubmode === 'stillness' ? (
                  <StillnessRingSession
                    isRunning={isRunning}
                    isPaused={isSessionPaused}
                    sessionStartTime={sessionStartTime}
                    totalDurationSec={duration * 60}
                    config={stillnessConfig}
                    ringMode={currentRingPreset.id}
                    pendingFinish={pendingNaturalFinishMode === 'stillness'}
                    onPendingBoundaryComplete={handleStillnessBoundaryComplete}
                  />
                ) : shouldRenderRingCanvas ? (
                  <BreathingRing
                    breathPattern={breathingPatternForRing}
                    onTap={handleAccuracyTap}
                    onCycleComplete={handleBreathCycleComplete}
                    startTime={sessionStartTime}
                    practiceActive={isRunning}
                    onUnmount={handleBreathingRingUnmount}
                    ringMode={currentRingPreset.id}
                    totalSessionDurationSec={duration}
                    guidanceAudioActive={isGuidanceAudioActive}
                  />
                ) : null}
              </div>

              <div
                style={{
                  flex: "0 0 auto",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                  paddingBottom: "env(safe-area-inset-bottom)",
                }}
              >
                {tempoSessionActive && breathSubmode !== 'stillness' && (
                  <div style={{ width: '100%', maxWidth: '320px' }}>
                    <TempoSyncSessionPanel />
                  </div>
                )}
                {pendingCycleFinish && (
                  <div
                    className="type-caption text-center"
                    style={{ color: 'var(--text-muted)', maxWidth: '320px' }}
                  >
                    Finishing the current breath cycle...
                  </div>
                )}
                <SessionControls
                  // Breath pattern + timer are rendered inside the BreathingRing plates.
                  isBreathPractice={false}
                  breathingPatternText={breathingPatternText}
                  showFeedback={showFeedback}
                  lastSignedErrorMs={lastSignedErrorMs}
                  feedbackColor={feedbackColor}
                  feedbackShadow={feedbackShadow}
                  feedbackText={feedbackText}
                  onStop={handleStop}
                  buttonBg={buttonBg}
                  radialGlow={radialGlow}
                  buttonShadow={buttonShadow}
                  timeLeftText={timeLeftText}
                  showBreathCount={showBreathCountUi}
                  breathCount={breathCount}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center animate-fade-in-up">
              <div
                className="type-h2 mb-4 text-center"
                style={{
                  color: "var(--accent-color)",
                  textShadow: "0 0 20px var(--accent-30)",
                }}
              >
                {soundType}
              </div>
              <div className="w-32 h-32 rounded-full border border-[var(--accent-20)] flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-[var(--accent-color)] blur-xl"></div>
                <div className="text-4xl opacity-80">✦</div>
              </div>

              <div className="mt-6 w-64">
                <div
                  className="type-label text-[8px] mb-2 flex items-center justify-between"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  <span>Volume</span>
                  <span style={{ color: 'var(--accent-color)' }}>{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full sound-volume-slider"
                />
              </div>
            </div>
          )}
        </div>

        {!isBreathRunningSession && (
          <SessionControls
            // Breath pattern + timer are rendered inside the BreathingRing plates.
            isBreathPractice={false}
            breathingPatternText={breathingPatternText}
            showFeedback={showFeedback}
            lastSignedErrorMs={lastSignedErrorMs}
            feedbackColor={feedbackColor}
            feedbackShadow={feedbackShadow}
            feedbackText={feedbackText}
            onStop={handleStop}
            buttonBg={buttonBg}
            radialGlow={radialGlow}
            buttonShadow={buttonShadow}
            timeLeftText={timeLeftText}
            showBreathCount={showBreathCountUi}
            breathCount={breathCount}
          />
        )}

        <style>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.2s ease-out forwards;
          }
          .sound-volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--accent-color);
            cursor: pointer;
            box-shadow: 0 0 8px var(--accent-50);
          }
          .sound-volume-slider::-webkit-slider-runnable-track {
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.2);
          }
          .sound-volume-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--accent-color);
            cursor: pointer;
            border: none;
            box-shadow: 0 0 8px var(--accent-50);
          }
          .sound-volume-slider::-moz-range-track {
            background: transparent;
            border: none;
          }
        `}</style>
      </div>
    </section>
  );
}
