import React from "react";
import PracticeSectionShell from "./PracticeSectionShell.jsx";
import PracticeHeader from "./PracticeHeader.jsx";
import { PracticeOptionsCard } from "./PracticeOptionsCard.jsx";
import { InstructionVideoPanel } from "../InstructionVideoPanel.jsx";
import { GlassIconButton } from "../GlassIconButton.jsx";
import { SUB_MODE_ICON_MAP } from "../subModeIconMap.js";

export function PracticeConfigPanel({
  showSummaryModal,
  isRunning,
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
  onDisableBenchmark,
  isLight,
}) {
  return (
    <PracticeSectionShell
      className="practice-section-container w-full flex flex-col items-center justify-start"
      style={{ paddingTop: '8px', paddingBottom: '16px', position: 'relative', display: showSummaryModal || isRunning || isStarting || pendingPathAutoStart ? 'none' : 'flex' }}
    >
      <div className="relative z-[1] w-full flex flex-col items-center justify-start">
        {/* Sub-Mode Toggle Buttons (above selector) */}
        {(() => {
          const practice = getPracticeConfig(practiceId);
          const hasSubModes = practice?.subModes && Object.keys(practice.subModes).length > 0;

          // Handle breath practice separately (uses breathSubmode instead of subModes)
          if (practiceId === 'breath') {
            const modes = [
              { id: 'breath', label: 'Breath' },
              { id: 'stillness', label: 'Focus Meditation' },
            ];

            return (
              <div
                className="flex items-center justify-center w-full"
                style={{
                  marginTop: '16px',
                  marginBottom: '16px',
                  gap: '64px',
                }}
              >
                {modes.map((mode) => (
                  <GlassIconButton
                    key={mode.id}
                    label={mode.label}
                    iconName={mode.id}
                    onClick={() => setBreathSubmode(mode.id)}
                    selected={breathSubmode === mode.id}
                    data-ui="practice-button"
                    data-practice-type={mode.id}
                    data-practice-id={`practice-submode:${mode.id}`}
                  />
                ))}
              </div>
            );
          }

          // Handle practices with subModes
          if (!hasSubModes) return null;

          const activeMode = practiceParams[practiceId]?.activeMode || practice.defaultSubMode;
          const buttonCount = Object.keys(practice.subModes).length;
          const practiceTypeForFx = practiceId === 'perception' ? 'visual' : (practiceId === 'resonance' ? 'sound' : practiceId);

          return (
            <div
              className="flex items-center justify-center w-full"
              {...(practiceId === 'awareness' ? { 'data-tutorial': 'awareness-mode-selector' } : {})}
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                gap: buttonCount === 3 ? '48px' : '64px',
              }}
            >
              {Object.entries(practice.subModes).map(([modeKey, modeConfig]) => {
                const isActive = activeMode === modeKey;
                const iconName = SUB_MODE_ICON_MAP[modeKey] || SUB_MODE_ICON_MAP[modeConfig.id] || 'cognitive';
                const utcSubmodeId = practiceId === 'awareness'
                  ? (modeKey === 'insight'
                    ? 'practice:submode:cognitive'
                    : (modeKey === 'bodyscan'
                      ? 'practice:submode:somatic'
                      : (modeKey === 'feeling' ? 'practice:submode:emotion' : null)))
                  : null;

                return (
                  <GlassIconButton
                    key={modeKey}
                    label={modeConfig.label}
                    iconName={iconName}
                    onClick={() => updateParams(practiceId, { activeMode: modeKey })}
                    selected={isActive}
                    data-ui="practice-button"
                    data-practice-type={practiceTypeForFx}
                    data-practice-id={`practice-submode:${practiceId}:${modeKey}`}
                    {...(utcSubmodeId ? {
                      'data-ui-target': 'true',
                      'data-ui-scope': 'role',
                      'data-ui-role-group': 'practice',
                      'data-ui-id': utcSubmodeId,
                    } : {})}
                  />
                );
              })}
            </div>
          );
        })()}

        <PracticeHeader
          isSanctuary={isSanctuary}
          practiceId={practiceId}
          onSelectPractice={handleSelectPractice}
          selector={practiceSelector}
        />

        {pathLaunchInstructionVideo && (
          <div className="w-full flex justify-center px-4 pb-4">
            <InstructionVideoPanel
              video={pathLaunchInstructionVideo}
              className="max-w-[720px]"
            />
          </div>
        )}

        {/* Bottom Layer: Dynamic Options Card */}
        <PracticeOptionsCard
          practiceId={practiceId}
          duration={duration}
          onDurationChange={setDuration}
          onStart={handleStart}
          onQuickStart={handleQuickStart}
          tokens={uiTokens}
          params={practiceParams}
          setters={configProps}
          hasExpandedOnce={hasExpandedOnce}
          setHasExpandedOnce={setHasExpandedOnce}
          onOpenTrajectory={openTrajectoryReport}
          isRunning={isRunning}
          tempoSyncEnabled={tempoSyncEnabled}
          tempoPhaseDuration={tempoPhaseDuration}
          tempoBeatsPerPhase={tempoBeatsPerPhase}
          onRunBenchmark={handleRunBenchmark}
          onDisableBenchmark={onDisableBenchmark}
          breathSubmode={breathSubmode}
          onBreathSubmodeChange={setBreathSubmode}
          getPracticeConfig={getPracticeConfig}
        />

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 2px; }
          @keyframes countdown-pulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </PracticeSectionShell>
  );
}
