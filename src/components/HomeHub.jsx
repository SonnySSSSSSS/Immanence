// src/components/HomeHub.jsx
import { createPortal } from 'react-dom';
// Improved HomeHub component with stats overview and better visual hierarchy
// BUILD: 2025-12-31T20:46 - Removed constellation completely


import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Avatar } from "./avatar";
import { StageTitle } from "./StageTitle.jsx";
import { STAGE_COLORS } from "../constants/stageColors.js";
import { HubCardSwiper } from "./HubCardSwiper.jsx";
import { CompactStatsCard } from "./CompactStatsCard.jsx";
import { ExportDataButton } from "./ExportDataButton.jsx";
import { HubStagePanel } from "./HubStagePanel.jsx";
import { HonorLogModal } from "./HonorLogModal.jsx";
import { SessionHistoryView } from "./SessionHistoryView.jsx";
import { SideNavigation } from "./SideNavigation.jsx";
import { plateauMaterial, noiseOverlayStyle, sheenOverlayStyle, innerGlowStyle } from "../styles/cardMaterial.js";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from "../utils/dynamicLighting.js";
import { SimpleModeButton } from "./SimpleModeButton.jsx";
import { DailyPracticeCard } from "./DailyPracticeCard.jsx";
import { CurriculumHub } from "./CurriculumHub.jsx";
import { CurriculumCompletionReport } from "./CurriculumCompletionReport.jsx";
import { ThoughtDetachmentOnboarding } from "./ThoughtDetachmentOnboarding.jsx";
import { useCurriculumStore } from "../state/curriculumStore.js";
import { getProgramLauncher } from "../data/programRegistry.js";
import { ARCHIVE_TABS, REPORT_DOMAINS } from "./tracking/archiveLinkConstants.js";

// Available paths that match image filenames
const PATHS = ['Soma', 'Prana', 'Dhyana', 'Drishti', 'Jnana', 'Samyoga'];


function HomeHub({ onSelectSection, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, onOpenHardwareGuide, isPracticing = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, progress, getDaysUntilNextStage } = useLunarStore();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const displayMode = useDisplayModeStore(s => s.viewportMode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';

  // Cloud background test state
  const [cloudBackground, setCloudBackground] = useState('cloudier'); // 'light_clouds', 'cloudier', 'cloudiest', or 'none'
  
  // Curriculum state
  const curriculumActive = useCurriculumStore(s => s.onboardingComplete);
  const isCurriculumComplete = useCurriculumStore(s => s.isCurriculumComplete);
  const activeCurriculumId = useCurriculumStore(s => s.activeCurriculumId);
  const [showCurriculumHub, setShowCurriculumHub] = useState(false);
  const [launcherContext, setLauncherContext] = useState(null);
  const [frameRect, setFrameRect] = useState(null);

  useLayoutEffect(() => {
    const update = (tag = "update") => {
      const el = document.querySelector("[data-app-frame]");

      console.groupCollapsed(`[CurriculumModal] ${tag}`);

      if (!el) {
        console.warn("No frame element found. Tried [data-app-frame].");
        console.groupEnd();
        return;
      }

      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);

      console.log("frame element:", el);
      console.table({
        rect_left: rect.left,
        rect_right: rect.right,
        rect_width: rect.width,
        rect_top: rect.top,
        rect_bottom: rect.bottom,
        rect_height: rect.height,
        vw: window.innerWidth,
        vh: window.innerHeight,
        dpr: window.devicePixelRatio,
        maxWidth: cs.maxWidth,
        width: cs.width,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
        marginLeft: cs.marginLeft,
        marginRight: cs.marginRight,
        position: cs.position,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        transform: cs.transform,
        filter: cs.filter,
        contain: cs.contain,
      });

      setFrameRect(rect);
      console.groupEnd();
    };

    update("initial");
    // Multi-stage stabilization
    requestAnimationFrame(() => update("rAF"));
    const timer = setTimeout(() => update("timeout-150"), 150);

    window.addEventListener("resize", () => update("resize"));

    return () => {
      window.removeEventListener("resize", () => update("resize"));
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Listen for DevPanel cloud background changes
    const handleCloudChange = (e) => setCloudBackground(e.detail);
    window.addEventListener('dev-cloud-change', handleCloudChange);
    return () => window.removeEventListener('dev-cloud-change', handleCloudChange);
  }, []);

  // Honor log modal state (moved from TrackingHub)
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState({ initialTab: 'all', initialReportDomain: null });

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

  // Listen for DevPanel cloud background changes
  useEffect(() => {
    const handleCloudChange = (e) => setCloudBackground(e.detail);
    window.addEventListener('dev-cloud-change', handleCloudChange);
    return () => window.removeEventListener('dev-cloud-change', handleCloudChange);
  }, []);

  const handleStartPractice = (leg, context = {}) => {
    if (leg?.launcherId) {
      setLauncherContext({
        leg,
        programId: context.programId || activeCurriculumId,
        dayNumber: context.dayNumber,
      });
      return;
    }
    onSelectSection('practice');
  };

  const handleCloseLauncher = () => {
    setLauncherContext(null);
    onSelectSection(null);
  };

  const openArchive = (initialTab = ARCHIVE_TABS.ALL, initialReportDomain = null) => {
    setArchiveOptions({ initialTab, initialReportDomain });
    setShowHistory(true);
  };

  // Allow other sections to request opening the Hub archive modal.
  useEffect(() => {
    const pending = window.__immanence_pending_archive;
    if (pending?.tab) {
      openArchive(pending.tab, pending.reportDomain ?? null);
      try {
        delete window.__immanence_pending_archive;
      } catch {
        // ignore
      }
    }

    const handler = (e) => {
      const detail = e?.detail || {};
      if (!detail?.tab) return;
      openArchive(detail.tab, detail.reportDomain ?? null);
    };

    window.addEventListener('immanence-open-archive', handler);
    return () => window.removeEventListener('immanence-open-archive', handler);
  }, []);

  const activeLauncher = launcherContext
    ? getProgramLauncher(launcherContext.programId || activeCurriculumId, launcherContext.leg?.launcherId)
    : null;

  return (
    <div className="w-full flex flex-col items-center relative overflow-visible">
      {/* Background is handled by Background.jsx globally */}

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR & HUB INSTRUMENT - Full-Bleed Altar (Cosmic Zone)
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col items-center gap-0 py-1 transition-all duration-500 overflow-visible">
        <div className="relative w-full flex items-center justify-center overflow-visible">
          {/* Cloud Background - NO LONGER HERE, moved to full-page layer */}

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

          {/* Avatar with multi-layered shadows for depth */}
          <div
            className="relative z-10 transition-all duration-500"
            style={{
              filter: isLight
                ? `drop-shadow(0 4px 12px ${STAGE_COLORS[currentStage]?.shadow || 'rgba(120, 90, 60, 0.4)'})
                   drop-shadow(0 12px 32px ${STAGE_COLORS[currentStage]?.shadow || 'rgba(120, 90, 60, 0.25)'})
                   drop-shadow(0 20px 60px rgba(0, 0, 0, 0.12))
                   drop-shadow(0 6px 20px ${STAGE_COLORS[currentStage]?.shadowDeep || 'rgba(100, 75, 50, 0.5)'})
                   drop-shadow(0 0 40px ${STAGE_COLORS[currentStage]?.shadow || 'rgba(120, 90, 60, 0.15)'})`
                : `drop-shadow(0 8px 20px ${STAGE_COLORS[currentStage]?.shadowDark || 'rgba(0, 0, 0, 0.7)'})
                   drop-shadow(0 16px 48px ${STAGE_COLORS[currentStage]?.shadowDark || 'rgba(0, 0, 0, 0.6)'})
                   drop-shadow(0 10px 30px ${STAGE_COLORS[currentStage]?.shadowDeep || 'rgba(0, 0, 0, 0.8)'})
                   drop-shadow(0 0 60px ${STAGE_COLORS[currentStage]?.shadowDark || 'rgba(0, 0, 0, 0.4)'})`,
              transform: isSanctuary ? 'scale(1.35)' : 'scale(1)',
            }}
          >
            {/* Avatar without side navigation */}
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

      {activeLauncher?.id === 'thought-detachment-onboarding' && launcherContext && (
        <ThoughtDetachmentOnboarding
          isOpen
          dayNumber={launcherContext.dayNumber}
          legNumber={launcherContext.leg?.legNumber}
          onClose={handleCloseLauncher}
          onExit={handleCloseLauncher}
          onComplete={handleCloseLauncher}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          CONTENT SECTIONS - Full width, controlled by parent container
          ────────────────────────────────────────────────────────────────────── */}
      <div className="w-full px-4 flex flex-col items-center gap-1 pb-4">

{/* DAILY PRACTICE CARD (Curriculum) */}
{curriculumActive && (
  <div className="w-full">
    <DailyPracticeCard
      onStartPractice={handleStartPractice}
      onViewCurriculum={() => setShowCurriculumHub(true)}
      onNavigate={onSelectSection}
    />
  </div>
)}

        {/* TRACKING HUB - Swipeable Stats Cards */}
        <div className="w-full">
          <HubCardSwiper cards={[
            <CompactStatsCard
              key="breathwork"
              domain="breathwork"
              streakInfo={streakInfo}
              onOpenArchive={() => openArchive(ARCHIVE_TABS.ALL)}
              onOpenReports={(domain) => openArchive(ARCHIVE_TABS.REPORTS, domain)}
            />,
          ]} />
        </div>


        {/* MODES SELECTION - Container with consistent width */}
        
        {/* Curriculum Hub/Report Modal - Portaled to document.body */}
        {showCurriculumHub && createPortal(
          (() => {
            console.log('[HomeHub] Rendering curriculum modal, showCurriculumHub:', showCurriculumHub, 'isComplete:', isCurriculumComplete());
            const isComplete = isCurriculumComplete();
            
            // Calculate clamped bounds for the host
            const getHostStyle = () => {
              if (!frameRect) return { left: 0, right: 0 };
              const vw = window.innerWidth;
              const rawLeft = frameRect.left;
              const rawRight = frameRect.left + frameRect.width;
              const left = Math.max(0, rawLeft);
              const right = Math.max(0, vw - rawRight);

              console.log("[CurriculumModal] bounds", {
                vw,
                rawLeft,
                rawRight,
                frameWidth: frameRect.width,
                clampedLeft: left,
                clampedRight: right,
                clampedWidth: vw - left - right,
              });
              return { left, right };
            };

            const hostStyle = getHostStyle();

            return isComplete ? (
              // Show completion report if curriculum is done
              <CurriculumCompletionReport
                onDismiss={() => setShowCurriculumHub(false)}
              />
            ) : (
              // Show curriculum hub - PORTAL with frame wrapper
              <div className="fixed inset-0 z-[9999] isolate">
                {/* backdrop */}
                <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-xl"
                  onClick={() => {
                    console.log('[HomeHub] Backdrop clicked');
                    setShowCurriculumHub(false);
                  }}
                />

                {/* frame-aligned modal host - ALWAYS RENDER with fail-safe clamping */}
                <div
                  className="absolute top-0 bottom-0 flex justify-center py-6"
                  style={hostStyle}
                  ref={(node) => {
                    if (!node) return;
                    const s = node.style;
                    console.log("[CurriculumModal] host style", {
                      left: s.left,
                      width: s.width,
                      right: s.right,
                      top: s.top,
                      bottom: s.bottom,
                    });
                  }}
                >
                  {/* PANEL - now always mounts to avoid "ghosted app" state */}
                  <div 
                    className="w-full max-w-5xl px-4 overflow-hidden rounded-[28px] flex flex-col shadow-2xl"
                    style={{
                      background: isLight ? '#f6f1e6' : 'rgba(10, 10, 15, 1)',
                      maxHeight: 'calc(100vh - 48px)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    ref={(node) => {
                      if (!node) return;
                      const cs = getComputedStyle(node);
                      console.log("[CurriculumModal] panel computed", {
                        width: cs.width,
                        maxWidth: cs.maxWidth,
                      });
                    }}
                  >
                    {/* Header - fixed, non-scrolling */}
                    <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between" style={{
                      background: isLight ? '#f6f1e6' : 'rgba(10, 10, 15, 1)',
                      borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      <h2
                        className="text-xl font-semibold"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: 'var(--accent-color)',
                        }}
                      >
                        Ritual Foundation
                      </h2>
                      <button
                        onClick={() => {
                          console.log('[HomeHub] Close button clicked');
                          setShowCurriculumHub(false);
                        }}
                        className="p-2 rounded-full transition-colors"
                        style={{
                          background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Body - THE ONLY SCROLL CONTAINER */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar\">
                      <CurriculumHub onClose={() => setShowCurriculumHub(false)} isInModal />
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}
        <div
          className="w-full mt-2 transition-all duration-700 flex flex-col items-center"
          style={{
            maxWidth: isSanctuary ? '100%' : 'min(430px, 94vw)',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          <div
            className="text-[11px] font-black uppercase tracking-[0.3em] text-center mb-5 opacity-40 transition-colors duration-500"
            style={{
              color: isLight ? 'var(--light-text-secondary)' : 'var(--text-accent-muted)',
              textShadow: isLight ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            Explore Modes
          </div>

          {/* Horizontal Row - Simple circular buttons - MATCHES CARD WIDTH + CENTERED */}
          <div
            className="flex flex-row justify-center items-center w-full"
            style={{
              maxWidth: isSanctuary ? '100%' : 'min(430px, 94vw)',
              marginLeft: 'auto',
              marginRight: 'auto',
              gap: isSanctuary ? '24px' : '10px',
            }}
          >
            <SimpleModeButton
              title="Practice"
              onClick={() => onSelectSection("practice")}
              icon="practice"
            />
            <SimpleModeButton
              title="Wisdom"
              onClick={() => onSelectSection("wisdom")}
              gradient="linear-gradient(135deg, #B4E6D4 0%, #7FD4B8 100%)"
              icon="wisdom"
            />
            <SimpleModeButton
              title="Application"
              onClick={() => onSelectSection("application")}
              gradient="linear-gradient(135deg, #FFD97D 0%, #FFB85C 100%)"
              icon="application"
            />
            <SimpleModeButton
              title="Navigation"
              onClick={() => onSelectSection("navigation")}
              gradient="linear-gradient(135deg, #E5C4FF 0%, #B88FD9 100%)"
              icon="navigation"
            />
          </div>
        </div>


      </div>
      {/* Session History Overlay - Placed at root for visibility */}
      {showHistory && (
        <SessionHistoryView
          onClose={() => setShowHistory(false)}
          initialTab={archiveOptions.initialTab}
          initialReportDomain={archiveOptions.initialReportDomain}
        />
      )}
    </div>
  );
}

// Arc Mode Button - Circular button with AAA-quality layered shadows for bioluminescent glow
function ArcModeButton({ title, onClick, image, isLight }) {
  const buttonSize = 80; // Diameter in px

  // AAA-quality layered glow (GPU-accelerated)
  const getGlowShadow = (isHovered = false) => {
    const baseColor = isLight ? 'var(--accent-r), var(--accent-g), var(--accent-b)' : 'var(--accent-r), var(--accent-g), var(--accent-b)';
    const intensity = isHovered ? 1.5 : 1;

    return `
      0 0 ${2 * intensity}px rgba(${baseColor}, ${0.8 * intensity}),
      0 0 ${15 * intensity}px rgba(${baseColor}, ${0.4 * intensity}),
      0 0 ${45 * intensity}px rgba(${baseColor}, ${0.1 * intensity})
      `;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden"
      style={{
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        border: isLight
          ? '2px solid var(--light-accent-muted)'
          : '2px solid rgba(255, 255, 255, 0.2)',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 250, 235, 0.95) 0%, rgba(253, 248, 230, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(26, 15, 28, 0.92) 0%, rgba(21, 11, 22, 0.95) 100%)',
        boxShadow: getGlowShadow(false),
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = getGlowShadow(true);
        e.currentTarget.style.borderColor = isLight
          ? 'var(--light-accent)'
          : 'var(--accent-60)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = getGlowShadow(false);
        e.currentTarget.style.borderColor = isLight
          ? 'var(--light-accent-muted)'
          : 'rgba(255, 255, 255, 0.2)';
      }}
      aria-label={title}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '50%',
          opacity: 1.0,
          mixBlendMode: 'normal',
        }}
      />

      {/* Specular Shimmer Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)',
            transform: 'translateX(-100%) rotate(45deg)',
            animation: 'shimmer 10s infinite linear',
          }}
        />
      </div>

      {/* Label overlay */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-1"
        style={{
          background: isLight
            ? 'linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 70%, transparent 100%)'
            : 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)',
          borderBottomLeftRadius: '50%',
          borderBottomRightRadius: '50%',
        }}
      >
        <span
          style={{
            fontSize: '7px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isLight ? 'var(--light-accent)' : 'rgba(253, 251, 245, 0.95)',
            textShadow: isLight
              ? '0 1px 2px rgba(255, 255, 255, 0.8)'
              : '0 1px 3px rgba(0, 0, 0, 0.9)',
            userSelect: 'none',
          }}
        >
          {title}
        </span>
      </div>
    </button>
  );
}

function ModeButton({ title, onClick, image, colorGrade = 'gold' }) {
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
  const colorGrades = {
    gold: isLight ? 'rgba(180, 140, 60, 0.03)' : 'rgba(255, 255, 255, 0.03)',
    amberViolet: isLight ? 'rgba(124, 92, 174, 0.03)' : 'rgba(180, 120, 200, 0.06)',
    indigo: isLight ? 'rgba(14, 116, 144, 0.03)' : 'rgba(100, 130, 220, 0.06)',
    goldBlue: isLight ? 'rgba(100, 110, 140, 0.03)' : 'rgba(180, 190, 220, 0.05)',
  };
  const gradeOverlay = colorGrades[colorGrade] || colorGrades.gold;

  const circleSize = 150; // Circle diameter in px

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden transition-all duration-300"
      style={{
        width: `${circleSize}px`,
        height: `${circleSize}px`,
        borderRadius: '50%',

        // Refined Gold Border - circular
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
            0 0 20px var(--light-accent-muted),
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
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = `
            0 0 0 0.5px #AF8B2C,
            inset 1px 1px 0 0.5px rgba(255, 250, 235, 0.9),
            0 4px 20px var(--light-shadow-tint),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `;
        } else {
          e.currentTarget.style.boxShadow = `
            0 0 0 0.5px rgba(255, 255, 255, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 2px 8px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -3px 12px rgba(0, 0, 0, 0.4),
            inset 0 0 40px rgba(0, 0, 0, 0.25)
          `;
        }
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Background Image Layer - masked to circle */}
      {image && (
        <div
          className="absolute inset-0 transition-all duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1.0,
            mixBlendMode: isLight ? 'multiply' : 'normal',
            borderRadius: '50%',
          }}
        />
      )}

      {/* Radial gradient overlay - darker center to lighter edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.1) 100%)',
          opacity: 0.5,
          borderRadius: '50%',
        }}
      />

      {/* Dark gradient overlay for text legibility (dark mode only) */}
      {!isLight && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at center, 
                rgba(0, 0, 0, 0.1) 0%, 
                rgba(0, 0, 0, 0.4) 50%, 
                rgba(0, 0, 0, 0.8) 100%
              )
            `,
            borderRadius: '50%',
          }}
        />
      )}

      {/* Noise texture overlay */}
      <div
        style={{
          ...noiseOverlayStyle,
          opacity: isLight ? 0.015 : 0.05,
          borderRadius: '50%',
        }}
      />

      {/* Sheen overlay (dark mode) / Inset shadow (light mode) */}
      {isLight ? (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.03)',
            borderRadius: '50%',
          }}
        />
      ) : (
        <div style={{ ...sheenOverlayStyle, borderRadius: '50%' }} />
      )}

      {/* Color grade overlay - per-mode identity */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: gradeOverlay,
          borderRadius: '50%',
        }}
      />

      {/* Text Content - positioned at bottom */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4 z-10">
        {/* Light mode: Add a semi-transparent backdrop for text legibility */}
        {isLight && (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 70%, transparent 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
            }}
          />
        )}
        <div
          className="text-sm font-bold tracking-wide transition-colors relative"
          style={{
            color: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: isLight
              ? '0 1px 2px rgba(255, 255, 255, 1), 0 2px 12px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.7), 1px 1px 0 rgba(0, 0, 0, 0.25), -1px -1px 0 rgba(0, 0, 0, 0.15)'
              : '0 2px 12px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.7)',
          }}
        >
          {title}
        </div>
      </div>
    </button>
  );
}



export { HomeHub };
