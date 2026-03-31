import { createPortal } from 'react-dom';
import { NavigationRitualLibrary } from '../NavigationRitualLibrary.jsx';
import { InsightMeditationPortal } from '../vipassana/InsightMeditationPortal.jsx';
import { SensorySession } from '../SensorySession.jsx';
import { PracticeVisualizationHost } from './PracticeVisualizationHost.jsx';
import { SessionControls } from './SessionControls.jsx';
import ParallaxForest from '../ParallaxForest.jsx';
import { SakshiVisual } from '../SakshiVisual.jsx';

function PracticeActiveSessionView({
  isRunning,
  renderPractice,
  renderPracticeId,
  onNavigate,
  activeRitual,
  onSelectRitual,
  onRitualReturn,
  breathingPatternText,
  lastSignedErrorMs,
  onStop,
  timeLeftText,
  breathCount,
  activeCircuitId,
  onCircuitComplete,
  sensoryType,
  sakshiVersion,
  isLight,
  duration,
  onTimeUpdate,
  pendingNaturalFinishMode,
  onStepBoundaryComplete,
  scanType,
  onScanTypeChange,
  emotionMode,
  emotionPromptMode,
  actualRunningPracticeId,
  isBreathRunningSession,
  breathViewportRootRef,
  breathViewportHeightPx,
  breathViewportReady,
  circuitConfig,
  circuitExerciseIndex,
  pathLaunchInstructionVideo,
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
  isSessionPaused,
  sessionStartTime,
  stillnessConfig,
  currentRingPreset,
  onStillnessBoundaryComplete,
  shouldRenderRingCanvas,
  breathingPatternForRing,
  onAccuracyTap,
  onBreathCycleComplete,
  onBreathingRingUnmount,
  isGuidanceAudioActive,
  tempoSessionActive,
  pendingCycleFinish,
  showFeedback,
  feedbackColor,
  feedbackShadow,
  feedbackText,
  buttonBg,
  radialGlow,
  buttonShadow,
  showBreathCountUi,
  soundType,
  soundVolume,
  setSoundVolume,
  eigengrauSessionType,
  eigengrauCalibrationStage,
  eigengrauVisibilityAssist,
  eigengrauPracticeMarkerEnabled,
}) {
  if (!isRunning) return null;

  if (renderPractice === "Rituals") {
    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
        <NavigationRitualLibrary
          onComplete={onStop}
          onNavigate={onNavigate}
          selectedRitual={activeRitual}
          onSelectRitual={onSelectRitual}
          onRitualReturn={onRitualReturn}
        />
      </section>
    );
  }

  if (renderPracticeId === "cognitive_vipassana") {
    if (sensoryType === "sakshi") {
      const sakshiButtonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
      const sakshiButtonShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';
      const sakshiTitle = sakshiVersion === 1 ? 'Sakshi (Forest)' : 'Sakshi (Reflection)';

      return (
        <section className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-10">
          <div
            className="relative"
            style={{
              width: 'min(92vw, 420px)',
              aspectRatio: '3 / 4',
              borderRadius: '20px',
              overflow: 'hidden',
              border: isLight ? '1px solid var(--light-border)' : '1px solid var(--accent-20)',
              background: isLight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.25)',
              boxShadow: isLight ? '0 12px 36px rgba(0,0,0,0.12)' : '0 20px 60px rgba(0,0,0,0.65)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none z-0">
              {sakshiVersion === 1 ? <ParallaxForest /> : <SakshiVisual />}
            </div>
            <div className="relative z-[1] flex items-start justify-center w-full pt-3">
              <div
                className="type-label tracking-[0.18em]"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                }}
              >
                {sakshiTitle}
              </div>
            </div>
          </div>

          <div className="relative z-[2] mt-8">
            <SessionControls
              isBreathPractice={false}
              breathingPatternText={breathingPatternText}
              showFeedback={false}
              lastSignedErrorMs={lastSignedErrorMs}
              feedbackColor="var(--accent-primary)"
              feedbackShadow="none"
              feedbackText=""
              onStop={onStop}
              buttonBg={sakshiButtonBg}
              radialGlow=""
              buttonShadow={sakshiButtonShadow}
              timeLeftText={timeLeftText}
              showBreathCount={false}
              breathCount={breathCount}
            />
          </div>
        </section>
      );
    }

    return createPortal(
      <InsightMeditationPortal onExit={activeCircuitId ? onCircuitComplete : onStop} />,
      document.body
    );
  }

  if (renderPracticeId === "somatic_vipassana") {
    return (
      <section className="w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-visible pb-8">
        <SensorySession
          sensoryType={sensoryType}
          duration={duration}
          onStop={activeCircuitId ? onCircuitComplete : onStop}
          onTimeUpdate={(remaining) => onTimeUpdate(remaining)}
          pendingFinish={pendingNaturalFinishMode === 'step'}
          onPendingBoundaryComplete={onStepBoundaryComplete}
          scanType={scanType}
          onScanTypeChange={onScanTypeChange}
          isLight={isLight}
        />
      </section>
    );
  }

  if (renderPracticeId === "feeling") {
    return (
      <section className="w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-visible pb-8">
        <SensorySession
          sensoryType="emotion"
          duration={duration}
          onStop={activeCircuitId ? onCircuitComplete : onStop}
          onTimeUpdate={(remaining) => onTimeUpdate(remaining)}
          pendingFinish={pendingNaturalFinishMode === 'step'}
          onPendingBoundaryComplete={onStepBoundaryComplete}
          emotionMode={emotionMode}
          emotionPromptMode={emotionPromptMode}
          isLight={isLight}
        />
      </section>
    );
  }

  return (
    <PracticeVisualizationHost
      isBreathRunningSession={isBreathRunningSession}
      breathViewportRootRef={breathViewportRootRef}
      breathViewportHeightPx={breathViewportHeightPx}
      breathViewportReady={breathViewportReady}
      activeCircuitId={activeCircuitId}
      circuitConfig={circuitConfig}
      isLight={isLight}
      circuitExerciseIndex={circuitExerciseIndex}
      pathLaunchInstructionVideo={pathLaunchInstructionVideo}
      actualRunningPracticeId={actualRunningPracticeId}
      geometry={geometry}
      fadeInDuration={fadeInDuration}
      displayDuration={displayDuration}
      fadeOutDuration={fadeOutDuration}
      voidDuration={voidDuration}
      audioEnabled={audioEnabled}
      setVisualizationCycles={setVisualizationCycles}
      selectedFrequency={selectedFrequency}
      driftEnabled={driftEnabled}
      breathSubmode={breathSubmode}
      isRunning={isRunning}
      isSessionPaused={isSessionPaused}
      sessionStartTime={sessionStartTime}
      duration={duration}
      stillnessConfig={stillnessConfig}
      currentRingPreset={currentRingPreset}
      handleStillnessBoundaryComplete={onStillnessBoundaryComplete}
      shouldRenderRingCanvas={shouldRenderRingCanvas}
      breathingPatternForRing={breathingPatternForRing}
      handleAccuracyTap={onAccuracyTap}
      handleBreathCycleComplete={onBreathCycleComplete}
      handleBreathingRingUnmount={onBreathingRingUnmount}
      isGuidanceAudioActive={isGuidanceAudioActive}
      tempoSessionActive={tempoSessionActive}
      pendingCycleFinish={pendingCycleFinish}
      breathingPatternText={breathingPatternText}
      showFeedback={showFeedback}
      lastSignedErrorMs={lastSignedErrorMs}
      feedbackColor={feedbackColor}
      feedbackShadow={feedbackShadow}
      feedbackText={feedbackText}
      handleStop={onStop}
      buttonBg={buttonBg}
      radialGlow={radialGlow}
      buttonShadow={buttonShadow}
      timeLeftText={timeLeftText}
      showBreathCountUi={showBreathCountUi}
      breathCount={breathCount}
      soundType={soundType}
      soundVolume={soundVolume}
      setSoundVolume={setSoundVolume}
      eigengrauSessionType={eigengrauSessionType}
      eigengrauCalibrationStage={eigengrauCalibrationStage}
      eigengrauVisibilityAssist={eigengrauVisibilityAssist}
      eigengrauPracticeMarkerEnabled={eigengrauPracticeMarkerEnabled}
    />
  );
}

export { PracticeActiveSessionView };
