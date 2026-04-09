import React from "react";

export function SessionControls({
  isBreathPractice,
  breathingPatternText,
  showFeedback,
  lastSignedErrorMs,
  feedbackColor,
  feedbackShadow,
  feedbackText,
  onStop,
  buttonBg,
  timeLeftText,
  showBreathCount,
  breathCount,
}) {
  return (
    <div className="flex flex-col items-center z-50">
      {/* Breathing Pattern Display (above stop button) */}
      {isBreathPractice && (
        <div
          className="type-label text-[12px] mb-4"
          style={{
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 2px 12px rgba(0,0,0,0.55)",
            padding: "8px 12px",
            borderRadius: "999px",
            background: "rgba(0,0,0,0.42)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          Pattern {breathingPatternText}
        </div>
      )}

      <div className="h-5 mb-2 flex items-center justify-center">
        {showFeedback && (
          <div
            key={lastSignedErrorMs}
            className="type-label font-medium animate-fade-in-up"
            style={{
              color: feedbackColor,
              textShadow: feedbackShadow
            }}
          >
            {feedbackText}
          </div>
        )}
      </div>

      <button
        onClick={onStop}
        className="type-label font-medium tracking-[0.08em] rounded-full px-7 py-2.5 transition-all duration-200 min-w-[200px] relative"
        style={{
          background: buttonBg,
          color: "rgba(10, 12, 16, 0.92)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.16)",
          borderRadius: "999px",
          filter: "saturate(0.68) brightness(0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ position: 'relative', zIndex: 2 }}>Stop</span>
      </button>

      {timeLeftText && (
        <div
          className="type-label text-[12px] mt-3"
          style={{
            color: "rgba(245,245,245,0.78)",
            textShadow: "0 2px 8px rgba(0,0,0,0.36)",
          }}
        >
          {timeLeftText}
        </div>
      )}

      {showBreathCount && (
        <div
          className="type-label text-[9px] mt-1.5"
          style={{
            color: 'rgba(245,245,245,0.5)',
          }}
        >
          Breath {breathCount}
        </div>
      )}
    </div>
  );
}
