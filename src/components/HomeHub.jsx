// Improved HomeHub component with stats overview and better visual hierarchy

import React, { useState, useEffect } from "react";
import { Avatar } from "./Avatar.jsx";
import { StageTitle, STAGE_COLORS } from "./StageTitle.jsx";
import { TrackingHub } from "./TrackingHub.jsx";
import { ExportDataButton } from "./ExportDataButton.jsx";
import { plateauMaterial, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from "../styles/cardMaterial.js";

// Available paths that match image filenames
const PATHS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];


function HomeHub({ onSelectSection, onStageChange, currentStage, previewPath, previewShowCore, previewAttention }) {
  // Placeholder stats - wire to real data later
  const [stats, setStats] = useState({
    totalSessions: 24,
    weeklyConsistency: 5, // days this week
    avgAccuracy: 0.78,
    currentStreak: 4, // consecutive days
    lastPracticed: "2 hours ago",
    nextStage: "Beacon",
    progressToNextStage: 0.62, // 62% toward Beacon
  });

  const accuracyPct = Math.round(stats.avgAccuracy * 100);
  const progressPct = Math.round(stats.progressToNextStage * 100);

  // Calculate stage score formula: (min(sessions, 150) / 150 × 0.35) + (accuracy × 0.65)
  const sessionScore = (Math.min(stats.totalSessions, 150) / 150) * 0.35;
  const accuracyScore = stats.avgAccuracy * 0.65;
  const stageScore = sessionScore + accuracyScore;

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
          className="relative text-center space-y-1 px-6 py-4 rounded-3xl"
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
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
          <div className="text-[11px] text-[rgba(253,251,245,0.4)] mt-2">
            Last practiced {stats.lastPracticed}
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
        className="w-full max-w-2xl rounded-3xl px-5 py-4 relative"
        style={{
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
            inset 0 -3px 12px rgba(0, 0, 0, 0.4)
          `,
        }}
      >
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
              color: 'var(--accent-color)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            Quick Insight
          </div>
          <div
            className="text-[11px] leading-relaxed"
            style={{
              color: 'rgba(253, 251, 245, 0.85)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            }}
          >
            {stats.currentStreak >= 7
              ? "🔥 You're building momentum. Keep the streak alive—7+ days unlocks deeper practice."
              : stats.avgAccuracy < 0.5
                ? "Slow down. Focus on breath timing rather than speed. Accuracy compounds over time."
                : stats.weeklyConsistency < 4
                  ? "You're inconsistent this week. One practice per day keeps the alignment alive."
                  : "You're in rhythm. Consider exploring the Wisdom section to deepen your understanding."}
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
          className="text-[11px] mt-1"
          style={{
            color: 'rgba(253, 251, 245, 0.85)',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6)',
          }}
        >
          {description}
        </div>
        <div
          className="text-[9px] mt-2 group-hover:text-[rgba(253,251,245,0.7)] transition-colors"
          style={{
            color: 'rgba(253, 251, 245, 0.5)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          {subtext}
        </div>
      </div>
    </button >
  );
}

export { HomeHub };
