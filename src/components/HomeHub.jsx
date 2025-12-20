// Improved HomeHub component with stats overview and better visual hierarchy

import React, { useState, useEffect } from "react";
import { Avatar } from "./Avatar.jsx";
import { StageTitle, STAGE_COLORS } from "./StageTitle.jsx";
import { TrackingHub } from "./TrackingHub.jsx";
import { ExportDataButton } from "./ExportDataButton.jsx";
import { plateauMaterial, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from "../styles/cardMaterial.js";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES } from "../state/stageConfig.js";

// Available paths that match image filenames
const PATHS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];


function HomeHub({ onSelectSection, onStageChange, currentStage, previewPath, previewShowCore, previewAttention }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, progress, getDaysUntilNextStage } = useLunarStore();

  const streakInfo = getStreakInfo();
  const breathStats = getDomainStats('breathwork');
  const weeklyPattern = getWeeklyPattern();

  // Derive stats from real data
  const totalSessions = breathStats.totalSessions;
  const weeklyConsistency = weeklyPattern.filter(Boolean).length;
  const avgAccuracy = breathStats.avgAccuracy || 0;
  const currentStreak = streakInfo.current;
  const daysUntilNext = getDaysUntilNextStage() || 0;
  const lunarStage = getCurrentStage();
  const nextStage = STAGES[lunarStage]?.next || null;
  const progressToNextStage = daysUntilNext > 0
    ? (STAGES[lunarStage]?.duration - daysUntilNext) / STAGES[lunarStage]?.duration
    : 0;

  // Determine insight state for contextual colors
  const insightState =
    currentStreak >= 7 ? 'achievement' :
      avgAccuracy < 0.5 ? 'caution' :
        weeklyConsistency < 4 ? 'warning' :
          'neutral';

  const insightColors = {
    achievement: {
      border: 'rgba(255, 215, 0, 0.3)',
      glow: 'rgba(255, 215, 0, 0.2)',
      accent: 'rgba(255, 215, 0, 0.9)',
    },
    caution: {
      border: 'rgba(255, 145, 0, 0.3)',
      glow: 'rgba(255, 145, 0, 0.2)',
      accent: 'rgba(255, 145, 0, 0.9)',
    },
    warning: {
      border: 'rgba(100, 150, 255, 0.3)', // Calming blue for drop-off
      glow: 'rgba(100, 150, 255, 0.2)',
      accent: 'rgba(150, 180, 255, 0.9)',
    },
    neutral: {
      border: 'var(--accent-40)',
      glow: 'var(--accent-20)',
      accent: 'var(--accent-color)',
    }
  };

  // Format last practiced time
  const formatLastPracticed = (isoDate) => {
    if (!isoDate) return 'Never';
    const now = new Date();
    const then = new Date(isoDate);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const lastPracticed = formatLastPracticed(breathStats.lastPracticed);

  const accuracyPct = Math.round(avgAccuracy * 100);
  const progressPct = Math.round(progressToNextStage * 100);

  return (
    <div className="w-full flex flex-col items-center gap-8 py-8 overflow-visible relative">
      {/* Background is handled by Background.jsx in App.jsx - removed duplicate here to prevent ghosting */}

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR SECTION - Primary focal point
          ────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full flex items-center justify-center overflow-visible">
          {/* Bloom halo - atmospheric radial glow behind avatar */}
          <div
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, var(--accent-glow)25 15%, var(--accent-glow)08 40%, transparent 70%)',
              filter: 'blur(80px)',
              opacity: 0.15,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Avatar with cosmic focal point */}
          <div className="relative z-10">
            <Avatar mode="hub" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
          </div>
        </div>

        {/* Stage Title - Dynamic animated image based on stage and path */}
        <div
          className="relative text-center space-y-1 px-6 pt-4 pb-0 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.35) 70%, rgba(0, 0, 0, 0.21) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.06)
            `,
          }}
        >
          {/* Volcanic glass texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
                repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.015) 3px, rgba(0, 0, 0, 0.015) 6px)
              `,
              opacity: 0.7,
            }}
          />
          <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} attention={previewAttention} />
          {/* Unified bottom section - attention vector + last practiced */}
          <div
            className="relative -mx-6 -mb-4 px-6 pb-6 pt-3"
            style={{
              background: 'rgba(0, 0, 0, 0.21)',
            }}
          >
            <div className="text-[11px] text-[rgba(253,251,245,0.4)] text-center mt-2">
              Last practiced {lastPracticed}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          STATS DASHBOARD - TrackingHub with live progress data
          ────────────────────────────────────────────────────────────────────── */}
      <TrackingHub />

      {/* ──────────────────────────────────────────────────────────────────────
          MODES SECTION - Mode selection buttons
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl">
        <div
          className="relative text-[10px] uppercase tracking-[0.2em] mb-4"
          style={{
            color: 'rgba(253, 251, 245, 0.7)',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Dark backing */}
          <div
            className="absolute inset-x-0 -inset-y-2"
            style={{
              background: 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 70%)',
              filter: 'blur(10px)',
              zIndex: -1,
            }}
          />
          Explore Modes
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            title="Practice"
            description="Breathing & timing"
            subtext="Build consistency"
            image={`${import.meta.env.BASE_URL}modes/mode-practice.png`}
            colorGrade="gold"
            onClick={() => onSelectSection("practice")}
          />
          <ModeButton
            title="Wisdom"
            description="Treatise & teachings"
            subtext="Deepen understanding"
            image={`${import.meta.env.BASE_URL}modes/mode-wisdom.png`}
            colorGrade="amberViolet"
            onClick={() => onSelectSection("wisdom")}
          />
          <ModeButton
            title="Application"
            description="Track gestures"
            subtext="Embody practice"
            image={`${import.meta.env.BASE_URL}modes/mode-application.png`}
            colorGrade="indigo"
            onClick={() => onSelectSection("application")}
          />
          <ModeButton
            title="Navigation"
            description="Roadmap & goals"
            subtext="Set intentions"
            image={`${import.meta.env.BASE_URL}modes/mode-navigation.png`}
            colorGrade="goldBlue"
            onClick={() => onSelectSection("navigation")}
          />
        </div>

        {/* Export Data - below mode buttons */}
        <div className="mt-4 flex justify-center">
          <ExportDataButton variant="link" />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          QUICK INSIGHTS - Small contextual suggestions
          ────────────────────────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-2xl rounded-3xl px-5 py-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
          border: `1px solid ${insightColors[insightState].border}`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 2px 8px ${insightColors[insightState].glow},
            inset 0 1px 0 rgba(255, 255, 255, 0.08)
          `,
          transition: 'all 0.6s ease',
        }}
      >
        {/* Scan-line animation overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, 
              transparent 0%, 
              ${insightColors[insightState].glow} 50%, 
              transparent 100%
            )`,
            animation: 'scan-line 3s ease-in-out infinite',
            opacity: 0.3,
          }}
        />

        {/* Inner glow */}
        <div style={innerGlowStyle} />

        {/* Noise texture */}
        <div style={noiseOverlayStyle} />

        {/* Sheen */}
        <div style={sheenOverlayStyle} />

        <div className="relative z-10">
          <div
            className="text-[10px] mb-2 uppercase tracking-[0.15em]"
            style={{
              color: insightColors[insightState].accent,
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            ⟨ Transmission ⟩
          </div>
          <div
            className="text-[11px] leading-relaxed"
            style={{
              color: 'rgba(253, 251, 245, 0.85)',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.02em',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            }}
          >
            {currentStreak >= 7
              ? "🔥 You're building momentum. Keep the streak alive—7+ days unlocks deeper practice."
              : avgAccuracy < 0.5
                ? "Slow down. Focus on breath timing rather than speed. Accuracy compounds over time."
                : weeklyConsistency < 4
                  ? "You're inconsistent this week. One practice per day keeps the alignment alive."
                  : totalSessions > 0
                    ? "You're in rhythm. Consider exploring the Wisdom section to deepen your understanding."
                    : "Welcome. Begin your practice to see your progress reflected here."}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({ title, description, subtext, onClick, image, colorGrade = 'gold' }) {
  // Per-mode color grading for subtle identity
  const colorGrades = {
    gold: 'rgba(255, 191, 0, 0.08)', // warm gold - Practice
    amberViolet: 'rgba(180, 120, 200, 0.06)', // amber-violet - Wisdom
    indigo: 'rgba(100, 130, 220, 0.06)', // cool indigo - Application
    goldBlue: 'rgba(180, 190, 220, 0.05)', // neutral gold-blue - Navigation
  };
  const gradeOverlay = colorGrades[colorGrade] || colorGrades.gold;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-3xl text-left transition-all duration-300 flex flex-col items-start justify-end overflow-hidden"
      style={{
        minHeight: '200px',
        background: 'linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
        border: '1px solid transparent',
        backgroundImage: `
          linear-gradient(145deg, rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
          linear-gradient(135deg, var(--accent-40) 0%, rgba(138, 43, 226, 0.2) 50%, var(--accent-30) 100%)
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 2px 8px var(--accent-15),
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 -3px 12px rgba(0, 0, 0, 0.4),
          inset 0 0 40px rgba(0, 0, 0, 0.25)
        `,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `
          0 12px 40px rgba(0, 0, 0, 0.7),
          0 0 40px var(--accent-25),
          0 0 80px var(--accent-10),
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          inset 0 -3px 12px rgba(0, 0, 0, 0.4),
          inset 0 0 40px rgba(0, 0, 0, 0.25)
        `;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `
          0 8px 32px rgba(0, 0, 0, 0.6),
          0 2px 8px var(--accent-15),
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 -3px 12px rgba(0, 0, 0, 0.4),
          inset 0 0 40px rgba(0, 0, 0, 0.25)
        `;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Background Image Layer - sigil fills entire card */}
      {image && (
        <div
          className="absolute inset-0 transition-all duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.55,
          }}
        />
      )}

      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, 
              rgba(0, 0, 0, 0.1) 0%, 
              rgba(0, 0, 0, 0.4) 40%, 
              rgba(0, 0, 0, 0.8) 100%
            )
          `,
        }}
      />

      {/* Noise texture overlay - enhanced visibility */}
      <div style={{ ...noiseOverlayStyle, opacity: 0.05 }} />

      {/* Sheen overlay */}
      <div style={sheenOverlayStyle} />

      {/* Color grade overlay - per-mode identity */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: gradeOverlay }}
      />

      {/* Carved inner shadow - concavity effect */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          boxShadow: `
            inset 0 3px 8px rgba(0, 0, 0, 0.4),
            inset 0 -2px 6px rgba(255, 255, 255, 0.02)
          `,
        }}
      />

      {/* Inner glow layer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, var(--accent-glow)12 0%, transparent 60%)`,
        }}
      />

      {/* Text Content - positioned at bottom with proper z-index */}
      <div className="relative z-10 px-5 py-5 w-full">
        <div
          className="text-sm font-semibold tracking-wide transition-colors"
          style={{
            color: 'var(--accent-color)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: 'rgba(253, 251, 245, 0.92)', // Increased from 0.85
            fontSize: '0.75rem', // Increased from 0.6875rem (11px → 12px)
            marginTop: '0.25rem',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.95)', // Stronger shadow for legibility
          }}
        >
          {description}
        </div>
        <div
          style={{
            color: 'rgba(253, 251, 245, 0.65)', // Increased from 0.5
            fontSize: '0.625rem', // Increased from 0.5625rem (9px → 10px)
            marginTop: '0.5rem',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
          }}
        >
          {subtext}
        </div>
      </div>
    </button >
  );
}

export { HomeHub };
