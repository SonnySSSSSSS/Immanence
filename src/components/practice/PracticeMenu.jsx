import React from "react";
import { SacredTimeSlider } from "../SacredTimeSlider.jsx";
import { PracticeMenuHeader } from "./PracticeMenuHeader.jsx";

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

function PracticeMenu({
  containerKey,
  label,
  showRitualSubtitle,
  ritualSubtitleText,
  titleContainerMarginBottom,
  titleTextMarginBottom,
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
  durationTitleMarginBottom,
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
  return (
    <div 
      key={containerKey} 
      className="relative px-8 animate-in fade-in duration-300"
    >
    {/* HEADER - using shared component */}
    <PracticeMenuHeader
      title={undefined}
      tutorialId={`practice:${practice?.id || 'breath'}`}
      showTutorial={false}
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
    <div className="min-h-[100px]" style={{ marginBottom: configPanelMarginBottom }}>
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
        />
      ) : (
        <div className="flex items-center justify-center py-12" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.4, fontWeight: 500 }}>
          No additional configuration required
        </div>
      )}
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

    {/* Start Button - Sacred Portal with Ember Theme */}
    {showStartButton && (
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
          <span className="relative z-10">{startButtonLabel}</span>
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

          </div>
        )}
      </div>
    );
}

export default PracticeMenu;
