import React, { useEffect, useRef, useState } from "react";
import { SacredTimeSlider } from "../SacredTimeSlider.jsx";
import BreathWaveform from "../BreathWaveform.jsx";
import { PRACTICE_REGISTRY, DURATIONS, PRACTICE_UI_WIDTH, resolvePracticeId, OLD_TO_NEW_PRACTICE_MAP } from "./constants.js";

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
import { TraditionalBreathRatios } from "./TraditionalBreathRatios.jsx";

// v3.25.22-breath-modes
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

export function PracticeOptionsCard({ practiceId, duration, onDurationChange, onStart, tokens, setters, hasExpandedOnce, setHasExpandedOnce }) {
  const cardRef = useRef(null);
  // Breath sub-mode state: expansion vs traditional ratios
  const [breathMode, setBreathMode] = useState("expansion"); // "expansion" | "traditional"
  console.log('[PracticeOptionsCard] practiceId:', practiceId, 'breathMode:', breathMode);
  const resolvedId = resolvePracticeId(practiceId);
  const p = PRACTICE_REGISTRY[resolvedId];
  const isCollapsed = !practiceId;

  // Determine active sub-mode for practices with subModes
  const hasSubModes = p?.subModes && Object.keys(p.subModes).length > 0;
  const activeMode = hasSubModes ? (setters.activeMode || p.defaultSubMode) : null;
  const activeSubMode = hasSubModes ? p.subModes[activeMode] : null;
  
  // Resolve config components from string names
  const ConfigComponent = p?.configComponent ? CONFIG_COMPONENTS[p.configComponent] : null;
  const ActiveSubModeConfig = activeSubMode?.configComponent ? CONFIG_COMPONENTS[activeSubMode.configComponent] : null;

  // Intentional Reveal Logic: Scroll into view when expanded
  useEffect(() => {
    if (practiceId && !hasExpandedOnce && cardRef.current) {
      const timer = setTimeout(() => {
        setHasExpandedOnce(true);
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 400); // Wait for CSS transition
      return () => clearTimeout(timer);
    }
  }, [practiceId, hasExpandedOnce]);

  return (
    <div
      ref={cardRef}
      className={`relative w-full transition-all duration-500 ease-out ${isCollapsed ? 'opacity-40 grayscale-[0.5] overflow-hidden' : 'opacity-100 overflow-visible'}`}
      style={{
        maxWidth: PRACTICE_UI_WIDTH.maxWidth,
        margin: '0 auto',
        paddingLeft: PRACTICE_UI_WIDTH.padding,
        paddingRight: PRACTICE_UI_WIDTH.padding,
        maxHeight: isCollapsed ? '88px' : 'none',
        zIndex: 1,
      }}
    >
      {/* Glassmorphic Main Panel */}
      <div 
        className="relative"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.55) 0%, rgba(10, 12, 18, 0.65) 50%, rgba(8, 10, 15, 0.75) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '20px',
          padding: '24px',
          minHeight: isCollapsed ? '88px' : 'auto',
          border: '1px solid var(--accent-30)',
          boxShadow: `
            0 12px 48px rgba(0, 0, 0, 0.6),
            0 4px 16px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.8),
            inset 0 0 60px var(--accent-10)
          `,
        }}
      >
        {/* Inner decorative border line */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '1px solid var(--accent-25)',
            borderRadius: '10px',
          }}
        />
        
        {/* Corner flourishes - top left */}
        <div className="absolute pointer-events-none" style={{ top: '0', left: '0', width: '40px', height: '40px' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - top right */}
        <div className="absolute pointer-events-none" style={{ top: '0', right: '0', width: '40px', height: '40px', transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom left */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', left: '0', width: '40px', height: '40px', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom right */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', right: '0', width: '40px', height: '40px', transform: 'scale(-1, -1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="rgba(212, 175, 55, 0.6)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Top highlight line */}
        <div className="absolute top-0 left-[20%] right-[20%] h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
      
        {isCollapsed ? (
        <div className="h-[88px] flex items-center justify-center">
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '11px', 
            letterSpacing: 'var(--tracking-mythic)', 
            textTransform: 'uppercase',
            color: tokens.textMuted,
            opacity: 0.5
          }}>
            Select a practice to begin config...
          </span>
        </div>
      ) : (
        <div
          key={practiceId}
          className="relative px-8 animate-in fade-in duration-300"
        >
          {/* Parent section header for Breath & Stillness */}
          {practiceId === 'breath' && (
            <div
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(245, 230, 211, 0.5)',
                marginTop: '20px',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              FOUNDATION
            </div>
          )}

          {/* Practice Title & Icon - or Title-Tabs for subMode practices */}
          {hasSubModes ? (
            // Title-tabs for practices with subModes (Awareness, Perception, Resonance)
            <div className="flex items-center justify-center gap-2" style={{ marginTop: '20px', marginBottom: '24px', flexWrap: 'nowrap', overflow: 'hidden' }}>
              {Object.entries(p.subModes).map(([modeKey, modeConfig], idx) => {
                const isActive = activeMode === modeKey;
                return (
                  <React.Fragment key={modeKey}>
                    <button
                      type="button"
                      onClick={() => setters.setActiveMode?.(modeKey)}
                      aria-selected={isActive}
                      aria-label={`${modeConfig.label} mode`}
                      className="practice-title-tab transition-all"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: isActive ? 'rgba(212, 175, 55, 0.95)' : 'rgba(245, 230, 211, 0.45)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isActive ? '2px solid rgba(212, 175, 55, 0.9)' : '2px solid transparent',
                        paddingBottom: '3px',
                        paddingLeft: '2px',
                        paddingRight: '2px',
                        cursor: 'pointer',
                        transition: 'all 300ms ease',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto',
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
                      {modeConfig.label}
                    </button>
                    {idx < Object.keys(p.subModes).length - 1 && (
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'rgba(212, 175, 55, 0.6)',
                          userSelect: 'none',
                          margin: '0 2px',
                        }}
                      >
                        /
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            // Standard title header for practices without subModes
            <div className="flex flex-col items-center text-center" style={{ marginTop: '20px', marginBottom: '24px' }}>
              {/* Small decorative star */}
              <div
                style={{
                  fontSize: '18px',
                  color: '#D4AF37',
                  textShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
                  marginBottom: '16px'
                }}
              >
                ✦
              </div>

              {/* Title with proper typography */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#F5E6D3',
                marginBottom: '0'
              }}>
                {p.label}
              </h2>

              {/* Inline subtitle for ritual practices */}
              {p.id === 'ritual' && (
                <p className="mt-2 uppercase" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.03em', fontSize: '10px', opacity: 0.5 }}>
                  Select an invocation to begin
                </p>
              )}
            </div>
          )}

          {/* Dynamic Config Panel */}
          <div className="min-h-[100px]" style={{ marginBottom: practiceId === 'breath' ? '16px' : '32px' }}>
             {practiceId === 'breath' ? (
               <>
                 {/* Breath Mode Selector */}
                 <div style={{ marginBottom: '20px' }}>
                   <div className="flex gap-2 justify-center flex-wrap">
                     <button
                       onClick={() => setBreathMode("expansion")}
                       style={{
                         fontFamily: 'var(--font-display)',
                         fontSize: '10px',
                         fontWeight: 600,
                         letterSpacing: '0.12em',
                         textTransform: 'uppercase',
                         padding: '10px 16px',
                         borderRadius: '8px',
                         border: breathMode === "expansion"
                           ? '1.5px solid var(--accent-color)'
                           : '1px solid rgba(255,255,255,0.2)',
                         background: breathMode === "expansion"
                           ? 'rgba(212, 175, 55, 0.15)'
                           : 'rgba(255,255,255,0.03)',
                         color: breathMode === "expansion"
                           ? 'var(--accent-color)'
                           : 'rgba(255,255,255,0.6)',
                         cursor: 'pointer',
                         transition: 'all 200ms',
                         boxShadow: breathMode === "expansion"
                           ? '0 0 16px rgba(212, 175, 55, 0.3)'
                           : 'none',
                       }}
                       onMouseEnter={(e) => {
                         if (breathMode !== "expansion") {
                           e.target.style.background = 'rgba(255,255,255,0.08)';
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (breathMode !== "expansion") {
                           e.target.style.background = 'rgba(255,255,255,0.03)';
                         }
                       }}
                     >
                       Breath Expansion
                     </button>
                     <button
                       onClick={() => setBreathMode("traditional")}
                       style={{
                         fontFamily: 'var(--font-display)',
                         fontSize: '10px',
                         fontWeight: 600,
                         letterSpacing: '0.12em',
                         textTransform: 'uppercase',
                         padding: '10px 16px',
                         borderRadius: '8px',
                         border: breathMode === "traditional"
                           ? '1.5px solid var(--accent-color)'
                           : '1px solid rgba(255,255,255,0.2)',
                         background: breathMode === "traditional"
                           ? 'rgba(212, 175, 55, 0.15)'
                           : 'rgba(255,255,255,0.03)',
                         color: breathMode === "traditional"
                           ? 'var(--accent-color)'
                           : 'rgba(255,255,255,0.6)',
                         cursor: 'pointer',
                         transition: 'all 200ms',
                         boxShadow: breathMode === "traditional"
                           ? '0 0 16px rgba(212, 175, 55, 0.3)'
                           : 'none',
                       }}
                       onMouseEnter={(e) => {
                         if (breathMode !== "traditional") {
                           e.target.style.background = 'rgba(255,255,255,0.08)';
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (breathMode !== "traditional") {
                           e.target.style.background = 'rgba(255,255,255,0.03)';
                         }
                       }}
                     >
                       Traditional Ratios
                     </button>
                   </div>
                 </div>

                 {/* Breath Expansion Panel */}
                 {breathMode === "expansion" && (
                   <>
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
                       <BreathWaveform pattern={setters.pattern} />
                     </div>

                     {/* Breath Phase Input Controls */}
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
                             value={setters.pattern?.[phase.key] ?? (phase.min === 1 ? 4 : 0)}
                             onChange={(e) => {
                               const val = Math.max(phase.min, Math.min(60, parseInt(e.target.value) || 0));
                               setters.setPattern?.((prev) => ({ ...prev, [phase.key]: val }));
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

                 {/* Traditional Ratios Panel */}
                 {breathMode === "traditional" && (
                   <TraditionalBreathRatios
                     onSelectRatio={(ratio) => setters.applyBreathRatio?.(ratio)}
                   />
                 )}
               </>
             ) : hasSubModes ? (
               <div>
                 {/* Render the Config for the active sub-mode */}
                 {ActiveSubModeConfig ? (
                   <ActiveSubModeConfig 
                     {...setters}
                     isLight={tokens.isLight}
                     selectedRitualId={setters.selectedRitualId}
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
                 isLight={tokens.isLight}
                 selectedRitualId={setters.selectedRitualId}
               />
             ) : (
               <div className="flex items-center justify-center py-12" style={{ fontFamily: 'Inter, Outfit, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: 0.4, fontWeight: 500 }}>
                 No additional configuration required
               </div>
             )}
          </div>

          {/* Shared Duration Slider - Hidden for Circuit as it manages its own total duration */}
          {p.supportsDuration && practiceId !== 'circuit' && (
            <div style={{ marginBottom: practiceId === 'breath' ? '24px' : '40px' }}>
              <SacredTimeSlider 
                value={duration} 
                onChange={onDurationChange} 
                options={DURATIONS} 
              />
            </div>
          )}

          {/* Start Button - Sacred Portal with Ember Theme */}
          {!(practiceId === 'ritual') && (
            <div className="flex justify-center" style={{ marginTop: '32px', marginBottom: '24px' }}>
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
                   background: `linear-gradient(135deg, #ff4500, #ff8c00)`,
                   color: '#000',
                   textShadow: `0 0 10px rgba(255, 140, 0, 0.6)`,
                   boxShadow: `
                     0 0 60px rgba(255, 69, 0, 0.8),
                     inset 0 0 30px rgba(255, 255, 255, 0.25),
                     0 8px 20px rgba(255, 69, 0, 0.5)
                   `,
                   transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                   position: 'relative',
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = `
                    0 0 100px rgba(255, 69, 0, 1),
                    inset 0 0 35px rgba(255, 255, 255, 0.35),
                    0 12px 30px rgba(255, 69, 0, 0.7)
                  `;
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `
                    0 0 60px rgba(255, 69, 0, 0.8),
                    inset 0 0 30px rgba(255, 255, 255, 0.25),
                    0 8px 20px rgba(255, 69, 0, 0.5)
                  `;
                }}
              >
                {/* Radial glow backdrop with fiery pulse */}
                <div
                  className="portal-glow"
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    background: `radial-gradient(circle at center, rgba(255, 69, 0, 0.6) 0%, transparent 70%)`,
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
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

