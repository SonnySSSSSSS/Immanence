// src/components/StageTitle.jsx
// Shared Stage Title component for displaying current stage and path across all sections
import React from "react";

// Stage colors for glow effects and styling
export const STAGE_COLORS = {
  seedling: { gradient: ["#4ade80", "#22c55e", "#16a34a"], glow: "#22c55e" },
  ember: { gradient: ["#fb923c", "#f97316", "#ea580c"], glow: "#f97316" },
  flame: { gradient: ["#fbbf24", "#f59e0b", "#d97706"], glow: "#f59e0b" },
  beacon: { gradient: ["#60a5fa", "#3b82f6", "#2563eb"], glow: "#3b82f6" },
  stellar: { gradient: ["#c084fc", "#a855f7", "#9333ea"], glow: "#a855f7" },
};

// CSS-based Stage Title Component with horizontal layout
export function StageTitle({ stage, path, showWelcome = true }) {
  const stageLower = (stage || "flame").toLowerCase();
  const stageColors = STAGE_COLORS[stageLower] || STAGE_COLORS.flame;

  // Capitalize first letter
  const stageName = (stage || "Flame").charAt(0).toUpperCase() + (stage || "Flame").slice(1).toLowerCase();
  const pathName = path ? path.charAt(0).toUpperCase() + path.slice(1).toLowerCase() : null;

  // Check if we have a path to display
  const hasPath = path && path.trim() !== '';

  return (
    <div className="stage-title-container relative flex flex-col items-center justify-center overflow-visible">

      {/* Welcome label - optional */}
      {showWelcome && (
        <div
          className="text-[10px] uppercase tracking-[0.3em] mb-3"
          style={{
            color: 'rgba(253,251,245,0.4)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {hasPath ? 'Welcome Back · Current Path' : 'Current Stage'}
        </div>
      )}

      {/* Ambient glow */}
      <div
        className="stage-ambient-glow absolute"
        style={{
          width: '350px',
          height: '50px',
          top: showWelcome ? '60%' : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse 100% 100% at center, ${stageColors.glow}35 0%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      {/* Title container - horizontal layout for path, centered for stage-only */}
      <div
        className="stage-title-text relative flex items-center justify-center gap-2"
        style={{
          filter: `drop-shadow(0 0 30px ${stageColors.glow}30)`,
        }}
      >
        {/* Stage name - elegant gold/cream, consistent across all stages */}
        <span
          className="stage-name text-[1.75rem] font-medium uppercase tracking-[0.08em]"
          style={{
            fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
            color: '#fdfbf5',
            textShadow: `
              0 0 20px rgba(253,251,245,0.3),
              0 0 40px rgba(253,251,245,0.15)
            `,
            letterSpacing: '0.02em',
          }}
        >
          {stageName}
        </span>

        {/* Separator dot - only show if path exists */}
        {hasPath && (
          <span
            className="text-[0.9rem] opacity-30"
            style={{
              color: stageColors.gradient[1],
              textShadow: `0 0 10px ${stageColors.glow}50`,
            }}
          >
            ·
          </span>
        )}

        {/* Path name - stage-colored gradient - only show if path exists */}
        {hasPath && (
          <span
            className="stage-path text-[1.6rem] font-normal uppercase tracking-[0.1em]"
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              backgroundImage: `linear-gradient(135deg, ${stageColors.gradient[0]} 0%, ${stageColors.gradient[1]} 50%, ${stageColors.gradient[2]} 100%)`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'pathGradient 4s ease-in-out infinite',
              filter: `drop-shadow(0 0 15px ${stageColors.glow}40)`,
            }}
          >
            {pathName}
          </span>
        )}
      </div>

      {/* Subtle accent line */}
      <div
        className="stage-accent-line mt-3 h-[1px] rounded-full"
        style={{
          width: '200px',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(253,251,245,0.2) 30%,
            ${stageColors.gradient[1]}80 50%, 
            rgba(253,251,245,0.2) 70%,
            transparent 100%
          )`,
          boxShadow: `0 0 10px ${stageColors.glow}30`,
        }}
      />

      {/* CSS Animations */}
      <style>{`
        .stage-title-text {
          animation: titleFloat 6s ease-in-out infinite;
        }
        
        .stage-ambient-glow {
          animation: ambientPulse 4s ease-in-out infinite;
        }
        
        .stage-accent-line {
          animation: lineGlow 3s ease-in-out infinite;
        }
        
        .stage-name {
          animation: nameGlow 5s ease-in-out infinite;
        }
        
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes pathGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        
        @keyframes lineGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        
        @keyframes nameGlow {
          0%, 100% { 
            text-shadow: 
              0 0 20px rgba(253,251,245,0.3),
              0 0 40px rgba(253,251,245,0.15);
          }
          50% { 
            text-shadow: 
              0 0 25px rgba(253,251,245,0.4),
              0 0 50px rgba(253,251,245,0.2);
          }
        }
      `}</style>
    </div>
  );
}
