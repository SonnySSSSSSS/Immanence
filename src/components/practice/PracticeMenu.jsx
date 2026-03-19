import React from "react";
import { SacredTimeSlider } from "../SacredTimeSlider.jsx";
import { PracticeMenuHeader } from "./PracticeMenuHeader.jsx";
import { BeginPracticeButton } from "./BeginPracticeButton.jsx";

// Import config components directly to avoid circular dependencies
import { CircuitConfig } from "../Cycle/CircuitConfig.jsx";
import { SoundConfig } from "../SoundConfig.jsx";
import { VisualizationConfig } from "../VisualizationConfig.jsx";
import { CymaticsConfig } from "../CymaticsConfig.jsx";
import { RitualSelectionDeck } from "../RitualSelectionDeck.jsx";
import { PhoticControlPanel } from "../PhoticControlPanel.jsx";
import { SensoryConfig } from "../SensoryConfig.jsx";
import { BodyScanConfig } from "../BodyScanConfig.jsx";
import { EmotionConfig } from "../EmotionConfig.jsx";

// Map string names to actual components
const CONFIG_COMPONENTS = {
  CircuitConfig,
  SoundConfig,
  VisualizationConfig,
  CymaticsConfig,
  RitualSelectionDeck,
  PhoticControlPanel,
  SensoryConfig,
  BodyScanConfig,
  EmotionConfig,
};

function getTutorialAnchorId(practiceId, isConfigPhotic) {
  if (practiceId === 'circuit') return 'circuit-duration';
  if (practiceId === 'integration') return 'ritual-steps';
  if (practiceId === 'resonance') return 'resonance-config';
  if (practiceId === 'perception') return 'perception-config';
  if (practiceId === 'photic' || isConfigPhotic) return 'photic-controls';
  return null;
}

function PracticeMenu({
  containerKey,
  showRitualSubtitle,
  ritualSubtitleText,
  configPanelMarginBottom,
  practice,
  ConfigComponent,
  setters,
  isLight,
  selectedRitualId,
  showDuration,
  duration,
  onDurationChange,
  durationOptions,
  durationMarginBottom,
  showStartButton,
  onStart,
  onQuickStart,
  startButtonLabel,
}) {
  // Handle subModes for consolidated practices
  const hasSubModes = practice?.subModes && Object.keys(practice.subModes).length > 0;
  const activeMode = hasSubModes ? (setters.activeMode || practice.defaultSubMode) : null;
  const activeSubMode = hasSubModes ? practice.subModes[activeMode] : null;

  // Resolve config components from string names
  const ActiveSubModeConfig = activeSubMode?.configComponent ? CONFIG_COMPONENTS[activeSubMode.configComponent] : null;

  // Quick Start for integration practice (rituals)
  const isIntegration = practice?.id === 'integration';
  const hasDefaultRitual = localStorage.getItem('immanenceOS.rituals.defaultRitualId') !== null;
  const showQuickStart = isIntegration && hasDefaultRitual;
  const isDirectPhoticConfig = ConfigComponent === PhoticControlPanel;
  const isSubmodePhoticConfig = ActiveSubModeConfig === PhoticControlPanel;
  const tutorialAnchorId = getTutorialAnchorId(practice?.id, isDirectPhoticConfig || isSubmodePhoticConfig);
  return (
    <div 
      key={containerKey} 
      className="relative px-4 sm:px-8 animate-in fade-in duration-300"
      style={{ borderRadius: '24px', overflow: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
    {/* HEADER - using shared component */}
    <PracticeMenuHeader
      title={undefined}
      tutorialId={`practice:${practice?.id || 'breath'}`}
      showTutorial={true}
      marginBottom={showRitualSubtitle ? '8px' : '0px'}
    >
      {/* Inline subtitle for ritual */}
      {showRitualSubtitle && (
        <p className="mt-2 uppercase text-center" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.03em', fontSize: '10px', opacity: 0.5 }}>
          {ritualSubtitleText}
        </p>
      )}
    </PracticeMenuHeader>

    {/* Dynamic Config Panel */}
    <div
      className="min-h-[100px]"
      style={{ marginBottom: configPanelMarginBottom }}
      {...(tutorialAnchorId ? { 'data-tutorial': tutorialAnchorId } : {})}
    >
      {hasSubModes ? (
        <div>
          {/* Sub-mode Toggle - Now rendered as glass buttons outside card */}

          {/* Render the Config for the active sub-mode */}
          {ActiveSubModeConfig ? (
            <ActiveSubModeConfig
              {...setters}
              isLight={isLight}
              selectedRitualId={selectedRitualId}
              onStart={onStart}
              isEmbedded={isSubmodePhoticConfig}
            />
          ) : (
            <div className="flex items-center justify-center py-12" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.4, fontWeight: 500 }}>
              No additional configuration for {activeSubMode?.label}
            </div>
          )}
        </div>
      ) : ConfigComponent ? (
        <ConfigComponent 
          {...setters}
          isLight={isLight}
          selectedRitualId={selectedRitualId}
          isEmbedded={isDirectPhoticConfig}
        />
      ) : (
        <div className="flex items-center justify-center py-12" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.4, fontWeight: 500 }}>
          No additional configuration required
        </div>
      )}
      </div>
    </div>

    {/* Quick Start for Rituals (if default ritual is persisted) */}
    {showQuickStart && onQuickStart && (
      <div className="flex flex-col items-center" style={{ marginTop: '24px', marginBottom: '16px' }}>
        <button
          onClick={onQuickStart}
          className="group transition-all duration-300 relative overflow-hidden begin-button"
          style={{
            width: '100%',
            maxWidth: '400px',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '14px 40px',
            borderRadius: '60px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.6), rgba(212, 175, 55, 0.3))',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            border: '1px solid rgba(212, 175, 55, 0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 50px rgba(212, 175, 55, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.4)';
          }}
        >
          <span className="relative z-10">Quick Start</span>
        </button>
        <div style={{
          marginTop: '8px',
          fontFamily: 'var(--font-body)',
          fontSize: '8px',
          color: 'rgba(245, 230, 211, 0.4)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Continue from last ritual
        </div>
      </div>
    )}

    {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
    {showDuration && (
      <div style={{ marginBottom: durationMarginBottom }}>
        <SacredTimeSlider
          value={duration}
          onChange={onDurationChange}
          options={durationOptions}
        />
      </div>
    )}

    {/* Start Button */}
    {showStartButton && (
      <div className="flex flex-col items-center" style={{ marginTop: '32px', marginBottom: '24px' }}>
        <BeginPracticeButton
          label={startButtonLabel}
          onStart={onStart}
          data-ui-target="true"
          data-ui-scope="role"
          data-ui-role-group="practice"
          data-ui-id="practice:cta:begin"
          data-ui-fx-surface="true"
        />
      </div>
    )}
      </div>
    );
}

export default PracticeMenu;
