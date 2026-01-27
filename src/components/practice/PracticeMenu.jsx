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

// Map string names to actual components
const CONFIG_COMPONENTS = {
  CircuitConfig,
  SoundConfig,
  VisualizationConfig,
  CymaticsConfig,
  RitualSelectionDeck,
  PhoticControlPanel,
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
  startButtonLabel,
}) {
  // Handle subModes for consolidated practices
  const hasSubModes = practice?.subModes && Object.keys(practice.subModes).length > 0;
  const activeMode = hasSubModes ? (setters.activeMode || practice.defaultSubMode) : null;
  const activeSubMode = hasSubModes ? practice.subModes[activeMode] : null;
  
  // Resolve config components from string names
  const ActiveSubModeConfig = activeSubMode?.configComponent ? CONFIG_COMPONENTS[activeSubMode.configComponent] : null;
  return (
    <div 
      key={containerKey} 
      className="relative px-8 animate-in fade-in duration-300"
    >
    {/* HEADER - using shared component */}
    <PracticeMenuHeader
      title={label}
      tutorialId={`practice:${practice?.id || 'breath'}`}
      showTutorial={true}
      marginBottom={titleContainerMarginBottom}
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
          {/* Sub-mode Toggle - Title-as-tabs style */}
          <div className="flex items-center justify-center gap-2" style={{ marginTop: '20px', marginBottom: '24px' }}>
            {Object.entries(practice.subModes).map(([modeKey, modeConfig], idx) => {
              const isActive = activeMode === modeKey;
              return (
                <React.Fragment key={modeKey}>
                  <button
                    onClick={() => setters.setActiveMode?.(modeKey)}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '4px 0',
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? 'rgba(212, 175, 55, 0.95)' : 'rgba(245, 230, 211, 0.45)',
                      borderBottom: isActive ? '2px solid rgba(212, 175, 55, 0.9)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {modeConfig.label}
                  </button>
                  {idx < Object.keys(practice.subModes).length - 1 && <span style={{ color: 'rgba(245, 230, 211, 0.4)', margin: '0 6px' }}>/</span>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Render the Config for the active sub-mode */}
          {ActiveSubModeConfig ? (
            <ActiveSubModeConfig 
              {...setters}
              isLight={isLight}
              selectedRitualId={selectedRitualId}
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

    {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
    {showDuration && (
      <div style={{ marginBottom: durationMarginBottom }}>
        <div className="font-bold uppercase text-center" style={{ fontFamily: 'var(--font-display)', color: 'rgba(245, 230, 211, 0.5)', marginBottom: durationTitleMarginBottom, letterSpacing: '0.12em', fontSize: '10px', fontWeight: 600, opacity: 1 }}>
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
