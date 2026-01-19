import React from "react";
import { PracticeSelector } from "./PracticeSelector.jsx";
import { PracticeOptionsCard } from "./PracticeOptionsCard.jsx";

export function PracticeConfigView({
  practiceId,
  handleSelectPractice,
  uiTokens,
  PRACTICE_REGISTRY,
  PRACTICE_IDS,
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
      className="practice-section-container w-full flex flex-col items-center justify-start"
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

      {/* Practice Selector (includes circuit) */}
      <PracticeSelector 
        selectedId={practiceId}
        onSelect={handleSelectPractice}
        PRACTICE_REGISTRY={PRACTICE_REGISTRY}
        PRACTICE_IDS={PRACTICE_IDS}
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
