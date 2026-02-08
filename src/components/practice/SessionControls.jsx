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
  radialGlow,
  buttonShadow,
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

      <div className="h-6 mb-3 flex items-center justify-center">
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
        className="type-label rounded-full px-7 py-2.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] relative overflow-hidden"
        style={{
          background: buttonBg,
          color: "#050508",
          boxShadow: radialGlow
            ? `${radialGlow}, ${buttonShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`
            : `0 0 24px var(--accent-30), ${buttonShadow}, inset 3px 4px 8px rgba(0,0,0,0.25), inset -2px -3px 6px rgba(255,255,255,0.15)`,
          borderRadius: "999px",
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ position: 'relative', zIndex: 2 }}>Stop</span>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
            mixBlendMode: 'soft-light',
            zIndex: 1,
          }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.06,
            mixBlendMode: 'overlay',
            zIndex: 1,
          }}
        />
      </button>

      {timeLeftText && (
        <div
          className="type-label text-[12px] mt-5"
          style={{
            color: "var(--text-primary)",
          }}
        >
          {timeLeftText}
        </div>
      )}

      {showBreathCount && (
        <div
          className="type-label text-[9px] mt-2"
          style={{
            color: 'var(--accent-50)',
          }}
        >
          Breath {breathCount}
        </div>
      )}
    </div>
  );
}
