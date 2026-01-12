import React from "react";
import { PracticeSelector } from "./PracticeSelector.jsx";
import { PracticeOptionsCard } from "./PracticeOptionsCard.jsx";

export function PracticeConfigView({
  practiceId,
  handleSelectPractice,
  uiTokens,
  PRACTICE_REGISTRY,
  GRID_PRACTICE_IDS,
  PRACTICE_UI_WIDTH,
  duration,
  setDuration,
  handleStart,
  practiceParams,
  configProps,
  hasExpandedOnce,
  setHasExpandedOnce,
  isLight,
}) {
  return (
    <section 
      className="practice-section-container w-full h-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar"
      style={{ paddingTop: '8px', paddingBottom: '16px', position: 'relative' }}
    >
      {/* Radial glow backdrop emanating from center (avatar area) */}
      <div 
        className="practice-radial-glow"
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '60vh',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(233, 195, 90, 0.15) 0%, rgba(233, 195, 90, 0.08) 35%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6,
        }}
      />
      {/* Circuit Button - Full Width */}
      <div style={{ width: '100%', maxWidth: PRACTICE_UI_WIDTH.maxWidth, margin: '0 auto', paddingLeft: PRACTICE_UI_WIDTH.padding, paddingRight: PRACTICE_UI_WIDTH.padding, marginBottom: '16px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => handleSelectPractice('circuit')}
          className="group relative overflow-hidden transition-all duration-300 w-full flex flex-col items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '12px 16px',
            minHeight: '48px',
            borderRadius: '12px',
            border: practiceId === 'circuit' ? '1.5px solid var(--accent-70)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 20, 25, 0.12)',
            backdropFilter: 'blur(32px) saturate(140%)',
            WebkitBackdropFilter: 'blur(32px) saturate(140%)',
            color: practiceId === 'circuit' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.6)',
            textShadow: practiceId === 'circuit' ? '0 0 12px var(--accent-40), 0 0 24px var(--accent-20)' : 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(20, 30, 40, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (practiceId !== 'circuit') {
              e.currentTarget.style.background = 'rgba(15, 20, 25, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-color)' }}>CIRCUIT TRAINING</span>
        </button>
      </div>

      {/* Top Layer: Practice Selector */}
      <PracticeSelector 
        selectedId={practiceId}
        onSelect={handleSelectPractice}
        tokens={uiTokens}
        PRACTICE_REGISTRY={PRACTICE_REGISTRY}
        GRID_PRACTICE_IDS={GRID_PRACTICE_IDS}
        PRACTICE_UI_WIDTH={PRACTICE_UI_WIDTH}
      />

      {/* Bottom Layer: Dynamic Options Card */}
      <PracticeOptionsCard 
        practiceId={practiceId}
        duration={duration}
        onDurationChange={setDuration}
        onStart={handleStart}
        tokens={uiTokens}
        params={practiceParams}
        setters={configProps}
        hasExpandedOnce={hasExpandedOnce}
        setHasExpandedOnce={setHasExpandedOnce}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(60,50,35,0.1)' : 'rgba(255,255,255,0.1)'}; border-radius: 2px; }
      `}</style>
    </section>
  );
}
