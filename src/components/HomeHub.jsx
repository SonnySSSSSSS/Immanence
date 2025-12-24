// Improved HomeHub component with stats overview and better visual hierarchy


import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "./Avatar.jsx";
import { StageTitle } from "./StageTitle.jsx";
import { STAGE_COLORS } from "../constants/stageColors.js";
import { TrackingHub } from "./TrackingHub.jsx";
import { ExportDataButton } from "./ExportDataButton.jsx";
import { HubStagePanel } from "./HubStagePanel.jsx";
import { HonorLogModal } from "./HonorLogModal.jsx";
import { plateauMaterial, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from "../styles/cardMaterial.js";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from "../utils/dynamicLighting.js";

// Available paths that match image filenames
const PATHS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];


function HomeHub({ onSelectSection, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, onOpenHardwareGuide, isPracticing = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, progress, getDaysUntilNextStage } = useLunarStore();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const displayMode = useDisplayModeStore(s => s.mode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';

  // Dynamic lighting for Transmission section
  const transmissionRef = useRef(null);
  const [transmissionAngle, setTransmissionAngle] = useState(135);

  useEffect(() => {
    if (transmissionRef.current) {
      const rect = transmissionRef.current.getBoundingClientRect();
      const avatarCenter = getAvatarCenter();
      const angle = calculateGradientAngle(rect, avatarCenter);
      setTransmissionAngle(angle);
    }
  }, []);

  // Honor log modal state (moved from TrackingHub)
  const [showHonorModal, setShowHonorModal] = useState(false);

  // Dynamic max-width based on display mode: sanctuary=1024px, hearth=580px (narrower for visual balance)
  const contentMaxWidth = isSanctuary ? 'max-w-5xl' : 'max-w-[580px]';

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
      border: isLight ? 'rgba(255, 215, 0, 0.3)' : 'rgba(139, 92, 246, 0.3)',
      glow: isLight ? 'rgba(255, 215, 0, 0.2)' : 'rgba(139, 92, 246, 0.2)',
      accent: isLight ? 'rgba(255, 215, 0, 0.9)' : 'rgba(167, 139, 250, 0.9)',
    },
    caution: {
      border: isLight ? 'rgba(255, 145, 0, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      glow: isLight ? 'rgba(255, 145, 0, 0.2)' : 'rgba(244, 63, 94, 0.2)',
      accent: isLight ? 'rgba(255, 145, 0, 0.9)' : 'rgba(251, 113, 133, 0.9)',
    },
    warning: {
      border: 'rgba(100, 150, 255, 0.3)', // Calming blue for drop-off
      glow: 'rgba(100, 150, 255, 0.2)',
      accent: isLight ? 'rgba(59, 130, 246, 0.9)' : 'rgba(150, 180, 255, 0.9)',
    },
    neutral: {
      border: isLight ? 'rgba(139, 92, 246, 0.3)' : 'rgba(253, 251, 245, 0.15)',
      glow: isLight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      accent: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
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
    <div className="w-full flex flex-col items-center relative overflow-visible">
      {/* Background is handled by Background.jsx in App.jsx - removed duplicate here to prevent ghosting */}

      {/* ──────────────────────────────────────────────────────────────────────
          STAGE TITLE - Ancient Manuscript Incipit
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col items-center pt-4 pb-2">
        <StageTitle
          stage={currentStage}
          path={previewPath}
          attention={previewAttention}
          showWelcome={false}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR & HUB INSTRUMENT - Full-Bleed Altar (Cosmic Zone)
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col items-center gap-4 py-8 transition-all duration-500 overflow-visible">
        <div className="relative w-full flex items-center justify-center overflow-visible">
          {/* Bloom halo - EXPANDED in Sanctuary mode to fill space */}
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isSanctuary ? 'min(120%, 900px)' : 'min(100%, 600px)',
              height: isSanctuary ? 'min(120%, 700px)' : 'min(100%, 600px)',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, var(--accent-glow)25 15%, var(--accent-glow)08 40%, transparent 70%)',
              filter: isSanctuary ? 'blur(100px)' : 'blur(80px)',
              opacity: isSanctuary ? 0.2 : 0.15,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Diagonal Grounding Shadow - Cast by central instrument (Radial Lighting) */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '180%',
              height: '40px',
              background: isLight
                ? 'radial-gradient(ellipse at center, rgba(120, 90, 60, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, transparent 75%)',
              top: '65%',
              left: '55%',
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              filter: isLight ? 'blur(60px)' : 'blur(40px)',
              zIndex: -2,
            }}
          />

          {/* Avatar with cosmic focal point */}
          <div className="relative z-10">
            <Avatar
              mode="hub"
              onStageChange={onStageChange}
              stage={currentStage}
              path={previewPath}
              showCore={previewShowCore}
              isPracticing={isPracticing}
            />
          </div>
        </div>

        {/* STATUS & CONTROL INSTRUMENT - Agency | Continuity (No StageTitle - moved to top) */}
        <HubStagePanel
          stage={currentStage}
          path={previewPath}
          showCore={previewShowCore}
          attention={previewAttention}
          lastPracticed={lastPracticed}
          streakInfo={streakInfo}
          onOpenHardwareGuide={onOpenHardwareGuide}
          onOpenHonorLog={() => setShowHonorModal(true)}
          hideStageTitle={true}
        />
      </div>

      {/* Honor Log Modal */}
      <HonorLogModal
        isOpen={showHonorModal}
        onClose={() => setShowHonorModal(false)}
      />

      {/* ──────────────────────────────────────────────────────────────────────
          CONTENT SECTIONS - Centered container with adaptive width
          ────────────────────────────────────────────────────────────────────── */}
      <div className={`w-full mx-auto px-4 flex flex-col items-center gap-8 pb-8 ${isSanctuary ? 'max-w-[700px]' : 'max-w-[380px]'}`}>

        {/* STATS DASHBOARD - TrackingHub */}
        <div className="w-full">
          <TrackingHub />
        </div>

        {/* MODES SECTION - Explore Modes Grid */}
        <div className="w-full transition-all duration-500">
          <div
            className="relative text-[10px] uppercase tracking-[0.2em] mb-4 text-suspended"
            style={{
              color: isLight ? 'var(--light-text-secondary)' : 'rgba(253, 251, 245, 0.7)',
              textShadow: isLight ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Dark backing (dark mode only) */}
            {!isLight && (
              <div
                className="absolute inset-x-0 -inset-y-2"
                style={{
                  background: 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                  zIndex: -1,
                }}
              />
            )}
            Explore Modes
          </div>

          {/* Grid: 2x2 always */}
          <div className="grid w-full grid-cols-2 gap-4">
            <ModeButton
              title="Practice"
              description="Breathing & timing"
              subtext="Build consistency"
              image={isLight ? `${import.meta.env.BASE_URL}modes/mode-practice.png` : `${import.meta.env.BASE_URL}modes/darkmode-practice.png`}
              colorGrade="gold"
              onClick={() => onSelectSection("practice")}
            />
            <ModeButton
              title="Wisdom"
              description="Treatise & teachings"
              subtext="Deepen understanding"
              image={isLight ? `${import.meta.env.BASE_URL}modes/mode-wisdom.png` : `${import.meta.env.BASE_URL}modes/darkmode-wisdom.png`}
              colorGrade="amberViolet"
              onClick={() => onSelectSection("wisdom")}
            />
            <ModeButton
              title="Application"
              description="Track gestures"
              subtext="Embody practice"
              image={isLight ? `${import.meta.env.BASE_URL}modes/mode-application.png` : `${import.meta.env.BASE_URL}modes/darkmode-application.png`}
              colorGrade="indigo"
              onClick={() => onSelectSection("application")}
            />
            <ModeButton
              title="Navigation"
              description="Roadmap & goals"
              subtext="Set intentions"
              image={isLight ? `${import.meta.env.BASE_URL}modes/mode-navigation.png` : `${import.meta.env.BASE_URL}modes/darkmode-navigation.png`}
              colorGrade="goldBlue"
              onClick={() => onSelectSection("navigation")}
            />
          </div>

          {/* Export Data */}
          <div className="mt-4 flex justify-center">
            <ExportDataButton variant="link" />
          </div>
        </div>

        {/* TRANSMISSION - Quick Insights */}
        <div
          ref={transmissionRef}
          className="w-full rounded-3xl px-4 py-3 relative overflow-hidden transition-all duration-500"
          style={{
            // Refined Gold Border
            border: '2px solid transparent',
            backgroundImage: isLight
              ? `
                linear-gradient(145deg, var(--light-bg-surface) 0%, var(--light-bg-base) 100%),
                ${getDynamicGoldGradient(transmissionAngle, true)}
              `
              : `
                linear-gradient(145deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%),
                linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))
              `,
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',

            boxShadow: isLight
              ? `
                0 0 0 0.5px #AF8B2C,
                inset 1px 1px 0 0.5px rgba(255, 250, 235, 0.9),
                0 4px 20px var(--light-shadow-tint),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
              `
              : `
                0 0 0 0.5px rgba(255, 255, 255, 0.1),
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
                color: isLight ? 'var(--light-accent)' : insightColors[insightState].accent,
                textShadow: isLight ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.5)',
              }}
            >
              ⟨ Transmission ⟩
            </div>
            <div
              className="text-[11px] leading-relaxed"
              style={{
                color: isLight ? 'var(--light-text-primary)' : 'rgba(253, 251, 245, 0.85)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.02em',
                textShadow: isLight ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.4)',
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
    </div>
  );
}

function ModeButton({ title, description, subtext, onClick, image, colorGrade = 'gold' }) {
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const isLight = colorScheme === 'light';

  const cardRef = useRef(null);
  const [gradientAngle, setGradientAngle] = useState(135);

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const avatarCenter = getAvatarCenter();
      const angle = calculateGradientAngle(rect, avatarCenter);
      setGradientAngle(angle);
    }
  }, []);

  // Per-mode color grading for subtle identity
  // Per-mode color grading for subtle identity
  const colorGrades = {
    gold: isLight ? 'rgba(180, 140, 60, 0.03)' : 'rgba(255, 255, 255, 0.03)', // warm gold -> clean white
    amberViolet: isLight ? 'rgba(124, 92, 174, 0.03)' : 'rgba(180, 120, 200, 0.06)',
    indigo: isLight ? 'rgba(14, 116, 144, 0.03)' : 'rgba(100, 130, 220, 0.06)',
    goldBlue: isLight ? 'rgba(100, 110, 140, 0.03)' : 'rgba(180, 190, 220, 0.05)',
  };
  const gradeOverlay = colorGrades[colorGrade] || colorGrades.gold;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      className="group relative rounded-3xl text-left transition-all duration-300 flex flex-col items-start justify-end overflow-hidden"
      style={{
        minHeight: '200px',

        // Refined Gold Border - Triple stroke with gradient
        border: '2px solid transparent',
        backgroundImage: isLight
          ? `
            linear-gradient(var(--light-bg-surface), var(--light-bg-surface)),
            ${getDynamicGoldGradient(gradientAngle, true)}
          `
          : `
            linear-gradient(rgba(26, 15, 28, 0.92), rgba(21, 11, 22, 0.95)),
            linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))
          `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',

        boxShadow: isLight
          ? `
            0 0 0 0.5px #AF8B2C,
            inset 1px 1px 0 0.5px rgba(255, 250, 235, 0.9),
            0 4px 20px var(--light-shadow-tint),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `
          : `
            0 0 0 0.5px rgba(255, 255, 255, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 2px 8px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -3px 12px rgba(0, 0, 0, 0.4),
            inset 0 0 40px rgba(0, 0, 0, 0.25)
          `,
      }}
      onMouseEnter={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = `
            0 8px 30px var(--light-shadow-tint),
            0 0 10px var(--light-accent-muted),
            inset 0 1px 0 rgba(255, 255, 255, 0.9)
          `;
        } else {
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(0, 0, 0, 0.7),
            0 0 40px var(--accent-25),
            0 0 80px var(--accent-10),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -3px 12px rgba(0, 0, 0, 0.4),
            inset 0 0 40px rgba(0, 0, 0, 0.25)
          `;
        }
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = `0 4px 20px var(--light-shadow-tint), inset 0 1px 0 rgba(255, 255, 255, 0.8)`;
        } else {
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 2px 8px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -3px 12px rgba(0, 0, 0, 0.4),
            inset 0 0 40px rgba(0, 0, 0, 0.25)
          `;
        }
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
            opacity: isLight ? 0.25 : 0.55,
            mixBlendMode: isLight ? 'multiply' : 'normal',
          }}
        />
      )}

      {/* Dark gradient overlay for text legibility (dark mode only) */}
      {!isLight && (
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
      )}

      {/* Noise texture overlay - enhanced visibility */}
      <div style={{ ...noiseOverlayStyle, opacity: isLight ? 0.015 : 0.05 }} />

      {/* Sheen overlay (dark mode) / Inset shadow (light mode) */}
      {isLight ? (
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl"
          style={{ boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.03)' }}
        />
      ) : (
        <div style={sheenOverlayStyle} />
      )}

      {/* Color grade overlay - per-mode identity */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: gradeOverlay }}
      />

      {/* Text Content - positioned at bottom with proper z-index */}
      <div className="relative z-10 px-5 py-5 w-full">
        <div
          className="text-sm font-semibold tracking-wide transition-colors"
          style={{
            color: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
            textShadow: isLight ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: isLight ? 'var(--light-text-primary)' : 'rgba(253, 251, 245, 0.92)',
            fontSize: '0.75rem',
            marginTop: '0.25rem',
            textShadow: isLight ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.95)',
          }}
        >
          {description}
        </div>
        <div
          style={{
            color: isLight ? 'var(--light-text-secondary)' : 'rgba(253, 251, 245, 0.65)',
            fontSize: '0.625rem',
            marginTop: '0.5rem',
            textShadow: isLight ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.9)',
          }}
        >
          {subtext}
        </div>
      </div>
    </button >
  );
}

export { HomeHub };
