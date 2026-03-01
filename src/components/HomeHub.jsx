// src/components/HomeHub.jsx
import { createPortal } from 'react-dom';
// Improved HomeHub component with stats overview and better visual hierarchy
// BUILD: 2025-12-31T20:46 - Removed constellation completely


import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Collapse } from 'react-collapse';
import { StageTitle } from "./StageTitle.jsx";
import { HubCardSwiper } from "./HubCardSwiper.jsx";
import { CompactStatsCard } from "./CompactStatsCard.jsx";
import { ExportDataButton } from "./ExportDataButton.jsx";
import { HubStagePanel } from "./HubStagePanel.jsx";
import { HonorLogModal } from "./HonorLogModal.jsx";
import { SessionHistoryView } from "./SessionHistoryView.jsx";
import { TrackingHub } from "./TrackingHub.jsx";
import { SideNavigation } from "./SideNavigation.jsx";
import { noiseOverlayStyle, sheenOverlayStyle } from "../styles/cardMaterial.js";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useUserModeStore } from "../state/userModeStore.js";
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from "../utils/dynamicLighting.js";
import { SimpleModeButton } from "./SimpleModeButton.jsx";
import { DailyPracticeCard } from "./DailyPracticeCard.jsx";
import { QuickDashboardTiles } from "./dashboard/QuickDashboardTiles.jsx";
import { CurriculumHub } from "./CurriculumHub.jsx";
import { CurriculumCompletionReport } from "./CurriculumCompletionReport.jsx";
import { ThoughtDetachmentOnboarding } from "./ThoughtDetachmentOnboarding.jsx";
import { useCurriculumStore } from "../state/curriculumStore.js";
import { useNavigationStore } from "../state/navigationStore.js";
import { useUiStore } from "../state/uiStore.js";
import { getQuickDashboardTiles } from "../reporting/dashboardProjection.js";
import { getHomeDashboardPolicy } from "../reporting/tilePolicy.js";
import { useTutorialStore } from "../state/tutorialStore.js";
import { getProgramLauncher } from "../data/programRegistry.js";
import { ARCHIVE_TABS, REPORT_DOMAINS } from "./tracking/archiveLinkConstants.js";
import { TUTORIALS } from "../tutorials/tutorialRegistry.js";
import { AvatarV3 } from "./avatarV3/AvatarV3.jsx";
import { useAvatarV3State } from "../state/avatarV3Store.js";
import { usePathStore } from "../state/pathStore.js";

// Available paths that match image filenames
const PATHS = ['Yantra', 'Kaya', 'Chitra', 'Nada'];

// Sanctuary mode unified width rail (leaves margin within 820px app container)
const SANCTUARY_MODULE_MAX_WIDTH = 'var(--ui-rail-max, min(430px, 94vw))';

// Unified Sanctuary rail style - ensures all three sections share identical left/right edges
const SANCTUARY_RAIL_STYLE = {
  width: '100%',
  maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
  marginLeft: 'auto',
  marginRight: 'auto',
  position: 'relative',
};

const sanitizeModeTileBackgroundImage = (bgUrl) => {
  const raw = typeof bgUrl === 'string' ? bgUrl.trim() : '';
  if (!raw || raw === 'none' || raw === 'url(none)' || raw === 'url("none")' || raw === "url('none')") {
    return 'none';
  }
  return `url("${raw}")`;
};


function HomeHub({ onSelectSection, activeSection = null, currentStage, previewPath, previewShowCore, previewAttention, onOpenHardwareGuide, isPracticing = false, lockToHub = false, debugDisableDailyCard = false, debugBuildProbe = false, debugShadowScan = false, debugDailyCardShadowOff = false, debugDailyCardBlurOff = false, debugDailyCardBorderOff = false, debugDailyCardMaskOff = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, getDaysUntilNextStage } = useLunarStore();
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const userMode = useUserModeStore((s) => s.userMode);
  const isLight = colorScheme === 'light';
  // Single-rail app framing: remove hearth/sanctuary width modes to prevent aspect drift.
  const isSanctuary = false;

  // Debug flags are sourced from App.jsx (URL + localStorage) and passed as props so they work in embedded shells.
  const disableDailyCard = Boolean(debugDisableDailyCard);
  const showBuildProbe = Boolean(debugBuildProbe);
  const modeTileBgUrl = 'none';
  const modeTileBackgroundImage = sanitizeModeTileBackgroundImage(modeTileBgUrl);
  void debugShadowScan;
  const dailyCardShadowOff = Boolean(debugDailyCardShadowOff);
  const dailyCardBlurOff = Boolean(debugDailyCardBlurOff);
  const dailyCardBorderOff = Boolean(debugDailyCardBorderOff);
  const dailyCardMaskOff = Boolean(debugDailyCardMaskOff);
  // Prefer the stage coming from the main app/dev controls (`currentStage`), then fall back to avatar store stage.
  // This prevents "two stage sources" where the avatar/popup drift from the stage shown elsewhere.
  const effectiveStage = currentStage || avatarStage;
  const normalizedStage = String(effectiveStage || 'seedling').toLowerCase();
  const getDisplayPath = usePathStore(s => s.getDisplayPath);
  const storedPath = getDisplayPath ? getDisplayPath(effectiveStage) : null;
  const avatarPath = previewPath ?? storedPath;

  const { isOpen: isTutorialOpen, tutorialId, stepIndex } = useTutorialStore();
  const activeTutorialTarget = tutorialId ? TUTORIALS[tutorialId]?.steps?.[stepIndex]?.target : null;
  const isDailyCardTutorialTarget = isTutorialOpen && activeTutorialTarget?.includes('home-daily-card');
  const handleSelectSection = React.useCallback((section) => {
    if (lockToHub) return;
    onSelectSection(section);
  }, [lockToHub, onSelectSection]);

  // Cloud background test state
  // Curriculum state
  const curriculumOnboardingComplete = useCurriculumStore(s => s.onboardingComplete);
  const curriculumPracticeTimeSlots = useCurriculumStore(s => s.practiceTimeSlots);
  // Use canonical getter to avoid stale scheduleSlots (called outside subscription to prevent infinite loops)
  const navigationScheduleSlots = React.useMemo(() => {
    const getScheduleSlots = useNavigationStore.getState().getScheduleSlots;
    return typeof getScheduleSlots === 'function' ? getScheduleSlots() : [];
  }, [curriculumPracticeTimeSlots]); // Depend on curriculum state to stay in sync
  const activePath = useNavigationStore(s => s.activePath);
  const practiceTimeSlots = (navigationScheduleSlots && navigationScheduleSlots.length > 0)
    ? navigationScheduleSlots.map(slot => slot.time)
    : curriculumPracticeTimeSlots;
  const isCurriculumComplete = useCurriculumStore(s => s.isCurriculumComplete);
  const activeCurriculumId = useCurriculumStore(s => s.activeCurriculumId);
  const [showCurriculumHub, setShowCurriculumHubState] = useState(false);
  const openCurriculumHub = React.useCallback(() => {
    console.log('[HomeHub] openCurriculumHub -> true');
    console.trace('[HomeHub] openCurriculumHub stack');
    setShowCurriculumHubState(true);
  }, []);
  const closeCurriculumHub = React.useCallback(() => {
    console.log('[HomeHub] closeCurriculumHub -> false');
    console.trace('[HomeHub] closeCurriculumHub stack');
    setShowCurriculumHubState(false);
  }, []);
  const [launcherContext, setLauncherContext] = useState(null);
  const [hasPersistedCurriculumData, setHasPersistedCurriculumData] = useState(null);
  const [frameRect, setFrameRect] = useState(null);
  const homeSwipeRailRef = useRef(null);
  const [homeSwipePage, setHomeSwipePage] = useState(0);
  const homeSwipePracticeRef = useRef(null);
  const homeSwipeProgressRef = useRef(null);
  const [homeSwipeHeight, setHomeSwipeHeight] = useState(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  void homeSwipeHeight;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('dev:card-carousel-change', { detail: { carouselId: 'homeHubSwipe', page: homeSwipePage } }));
  }, [homeSwipePage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('immanenceOS.curriculum');
      setHasPersistedCurriculumData(raw !== null);
    } catch {
      setHasPersistedCurriculumData(true);
    }
  }, []);

  useEffect(() => {
    const el = homeSwipeRailRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;

    const getPageWidth = () => {
      const cs = window.getComputedStyle(el);
      const pl = Number.parseFloat(cs.paddingLeft) || 0;
      const pr = Number.parseFloat(cs.paddingRight) || 0;
      return Math.max(1, el.clientWidth - pl - pr);
    };

    const updateMetrics = () => {
      const w = getPageWidth();
      const idx = Math.max(0, Math.min(1, Math.round(el.scrollLeft / w)));
      setHomeSwipePage(idx);

      const activeNode = idx === 0 ? homeSwipePracticeRef.current : homeSwipeProgressRef.current;
      if (activeNode) {
        const h = Math.round(activeNode.getBoundingClientRect().height);
        if (Number.isFinite(h) && h > 0) setHomeSwipeHeight(h);
      }
    };

    const ro = new ResizeObserver(() => updateMetrics());

    if (homeSwipePracticeRef.current) ro.observe(homeSwipePracticeRef.current);
    if (homeSwipeProgressRef.current) ro.observe(homeSwipeProgressRef.current);

    updateMetrics();
    el.addEventListener('scroll', updateMetrics, { passive: true });
    window.addEventListener('resize', updateMetrics);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, []);

  const scrollHomeSwipeTo = (index) => {
    const el = homeSwipeRailRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const pl = Number.parseFloat(cs.paddingLeft) || 0;
    const pr = Number.parseFloat(cs.paddingRight) || 0;
    const w = Math.max(1, el.clientWidth - pl - pr);
    el.scrollTo({ left: index * w, behavior: 'smooth' });
  };

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

    // PROBE:DISABLE_CURRICULUM_RESIZE_V1:START
    // Legacy [CurriculumModal] window resize handler removed (Heart Mode removed).
    // PROBE:DISABLE_CURRICULUM_RESIZE_V1:END

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Honor log modal state (moved from TrackingHub)
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackingHub, setShowTrackingHub] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState({ initialTab: 'all', initialReportDomain: null });
  const trackerLaunchContext = useUiStore(s => s.trackerLaunchContext);

  // Dynamic max-width based on display mode: sanctuary=1024px, hearth=580px (narrower for visual balance)
  const streakInfo = getStreakInfo();
  const breathStats = getDomainStats('breathwork');
  void getWeeklyPattern;

  // Derive stats from real data
  const avgAccuracy = breathStats.avgAccuracy || 0;
  const daysUntilNext = getDaysUntilNextStage() || 0;
  const lunarStage = getCurrentStage();
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

  void avgAccuracy;
  void progressToNextStage;

  const handleStartPractice = (leg, context = {}) => {
    if (lockToHub) return;
    // Handle curriculum launcher (leg with launcherId)
    if (leg?.launcherId) {
      setLauncherContext({
        leg,
        programId: context.programId || activeCurriculumId,
        dayNumber: context.dayNumber,
      });
      return;
    }
    
    // Handle path-based practice start (leg is object with practiceId and pathContext)
    if (leg?.practiceId) {
      console.log("[HomeHub] Starting path-based practice", { practiceId: leg.practiceId, pathContext: leg.pathContext });
      // Store practice launch context in zustand store (transient, not persisted)
      useUiStore.getState().setPracticeLaunchContext({
        source: "dailySchedule",
        practiceId: leg.practiceId,
        durationMin: Number.isFinite(Number(leg.durationMin)) ? Number(leg.durationMin) : undefined,
        practiceParamsPatch: leg.practiceParamsPatch || undefined,
        overrides: leg.overrides || undefined,
        locks: leg.locks || undefined,
        practiceConfig: leg.practiceConfig || undefined,
        pathContext: {
          runId: leg.pathContext?.runId ?? activePath?.runId ?? null,
          activePathId: leg.pathContext?.activePathId ?? activePath?.activePathId ?? null,
          slotTime: leg.pathContext?.slotTime,
          slotIndex: leg.pathContext?.slotIndex,
          dayIndex: leg.pathContext?.dayIndex,
          weekIndex: leg.pathContext?.weekIndex,
        },
        persistPreferences: false,
      });
      handleSelectSection('practice');
      return;
    }
    
    // Default: open practice section
    handleSelectSection('practice');
  };

  const handleCloseLauncher = () => {
    setLauncherContext(null);
    handleSelectSection(null);
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

  useEffect(() => {
    if (trackerLaunchContext?.target === 'applicationHeatmap') {
      setShowTrackingHub(true);
    }
  }, [trackerLaunchContext]);

  const activeLauncher = launcherContext
    ? getProgramLauncher(launcherContext.programId || activeCurriculumId, launcherContext.leg?.launcherId)
    : null;

  // Compute dashboard policy for tiles
  const hubPolicy = getHomeDashboardPolicy({
    activeRunId: activePath?.runId,
    userMode,
  });

  // Compute hub tiles for side panels (moved from swipe rail page 2)
  const hubTiles = getQuickDashboardTiles({
    scope: hubPolicy.scope,
    range: hubPolicy.range,
    includeHonor: hubPolicy.includeHonor,
    activeRunId: hubPolicy.activeRunId,
  });

  // PROBE:HOMEHUB_SIDE_PANEL_GEOM
  const RAIL_W = SANCTUARY_MODULE_MAX_WIDTH;
  const U = `calc(${RAIL_W} / 24)`;
  const panelW = `clamp(110px, calc(${RAIL_W} * 0.22), 180px)`;
  const panelH = `clamp(180px, calc(${RAIL_W} * 0.55), 260px)`;
  const panelPad = `calc(${U} * 1.0)`;
  const panelRadius = `calc(${U} * 1.2)`;
  const coverH = `calc((${panelH}) - ((${panelPad}) * 2) - ((${U}) * 3.0))`;
  const panelFooterH = `calc((${panelH}) - ((${panelPad}) * 2) - (${coverH}))`;
  const sidePanelFrameStyle = {
    width: panelW,
    height: panelH,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: panelPad,
    boxSizing: 'border-box',
    background: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.28)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: panelRadius,
    border: `1px solid ${isLight ? 'rgba(200, 160, 100, 0.2)' : 'rgba(255, 255, 255, 0.09)'}`,
    boxShadow: isLight
      ? 'inset 0 -12px 18px rgba(60, 50, 35, 0.08)'
      : 'inset 0 -12px 18px rgba(0,0,0,0.18)',
  };
  const sidePanelCoverRectStyle = {
    width: '100%',
    height: coverH,
    flexShrink: 0,
    borderRadius: `calc((${panelRadius}) * 0.85)`,
    border: `1px solid ${isLight ? 'rgba(160, 120, 60, 0.12)' : 'rgba(255, 255, 255, 0.08)'}`,
    background: isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.14))'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
    boxShadow: isLight
      ? 'inset 0 1px 0 rgba(255,255,255,0.4)'
      : 'inset 0 1px 0 rgba(255,255,255,0.06)',
    overflow: 'hidden',
  };
  const sidePanelCoverContentStyle = {
    width: '100%',
    height: '100%',
    padding: `calc(${U} * 0.6)`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'center',
    gap: `calc(${U} * 0.4)`,
  };
  const sidePanelMetricCellStyle = {
    width: '100%',
    flex: '1 1 0',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  };
  const sidePanelFooterStyle = {
    width: '100%',
    height: panelFooterH,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    textAlign: 'center',
  };
  const sidePanelRollZoneStyle = {
    width: '100%',
    height: coverH,
    cursor: 'pointer',
  };
  const sidePanelCollapseSlotStyle = {
    width: '100%',
    height: coverH,
  };
  const sidePanelCoverMediaStyle = {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };
  const sidePanelCoverLabelStyle = {
    width: '100%',
    padding: `calc(${U} * 0.65)`,
    boxSizing: 'border-box',
    background: isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 248, 236, 0.78))'
      : 'linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.62))',
    color: isLight ? 'rgba(65, 48, 28, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    letterSpacing: '0.08em',
    textAlign: 'center',
  };

  // Render helper: donut ring for rate metrics (completion/on-time)
  const renderRateRing = (value, isLight, options = {}) => {
    const size = options.size ?? 48;
    const strokeWidth = options.strokeWidth ?? 3.5;
    const darkTrackAlpha = options.darkTrackAlpha ?? 0.16;
    const lightTrackAlpha = options.lightTrackAlpha ?? 0.26;
    const darkFillAlpha = options.darkFillAlpha ?? 0.9;
    const lightFillAlpha = options.lightFillAlpha ?? 0.88;
    const r = 14;
    const circumference = 2 * Math.PI * r;
    const progress = value === null ? 0 : Math.max(0, Math.min(value / 100, 1));
    const dashLength = progress * circumference;

    const ringColor = isLight
      ? `rgba(100, 80, 60, ${lightTrackAlpha})`
      : `rgba(255, 255, 255, ${darkTrackAlpha})`;
    const fillColor = isLight
      ? (value === null ? ringColor : `rgba(100, 80, 60, ${lightFillAlpha})`)
      : (value === null ? ringColor : `rgba(76, 175, 80, ${darkFillAlpha})`);
    const displayValue = value === null || value === undefined ? '—' : `${Math.round(value)}%`;
    const valueColor = isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)';

    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 44 44" style={{ overflow: 'visible', display: 'block' }}>
          <circle cx="22" cy="22" r={r} fill="none" stroke={ringColor} strokeWidth={strokeWidth} />
          {value !== null && (
            <circle
              cx="22" cy="22" r={r}
              fill="none"
              stroke={fillColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: valueColor,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1,
            transform: 'translateY(1px)',
            textShadow: '-1px 0 0 rgba(0,0,0,0.22), 1px 0 0 rgba(0,0,0,0.22), 0 -1px 0 rgba(0,0,0,0.18), 0 1px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.24)',
          }}
        >
          {displayValue}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center relative overflow-visible">
      <style>{`.ReactCollapse--collapse { transition: height 260ms ease; overflow: hidden; }`}</style>
      {/* Background is handled by Background.jsx globally */}

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR & HUB INSTRUMENT - Full-Bleed Altar (Cosmic Zone)
          ────────────────────────────────────────────────────────────────────── */}
      <div
        className="w-full flex flex-col items-center gap-0 pb-0 transition-all duration-500 overflow-visible"
        style={{ paddingTop: '12px' }}
      >
        {/* PROBE:HOMEHUB_SIDE_PANELS_V1:START */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '12px',
            padding: '0 4px',
            maxWidth: RAIL_W,
            margin: '0 auto 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* PROBE:HOMEHUB_SIDE_PANELS_ROLLUP_V1 */}
          {/* LEFT PANEL - Sessions + Active Days */}
          <div style={sidePanelFrameStyle}>
            <div
              style={sidePanelRollZoneStyle}
              onClick={() => setLeftOpen((open) => !open)}
            >
              <Collapse isOpened={!leftOpen}>
                <div style={sidePanelCollapseSlotStyle}>
                  <div
                    style={{
                      ...sidePanelCoverRectStyle,
                      ...sidePanelCoverMediaStyle,
                      height: coverH,
                      backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.18)), url("/assets/homeSnow_hearth_stylized_frame.webp")`,
                    }}
                  >
                    <div className="type-label text-[9px]" style={sidePanelCoverLabelStyle}>
                      PRACTICE LOG
                    </div>
                  </div>
                </div>
              </Collapse>
              <Collapse isOpened={leftOpen}>
                <div style={sidePanelCollapseSlotStyle}>
                  <div style={sidePanelCoverContentStyle}>
                    <div style={sidePanelMetricCellStyle}>
                      <div className="type-metric text-[20px]" style={{ color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                        {Math.round(hubTiles?.sessions_total ?? 0)}
                      </div>
                      <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.08em' }}>
                        SESSIONS
                      </div>
                    </div>
                    <div style={sidePanelMetricCellStyle}>
                      <div className="type-metric text-[20px]" style={{ color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                        {Math.round(hubTiles?.days_active ?? 0)}
                      </div>
                      <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.08em' }}>
                        ACTIVE DAYS
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>
            <div style={{ ...sidePanelFooterStyle, flexDirection: 'column' }}>
              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  width: '70%',
                  margin: '10px auto 10px',
                  background: isLight ? 'rgba(100, 80, 60, 0.10)' : 'rgba(255, 255, 255, 0.10)',
                  flexShrink: 0,
                }}
              />
              <div
                className="type-label text-[9px]"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  color: isLight ? 'rgba(100, 80, 60, 0.48)' : 'rgba(255, 255, 255, 0.34)',
                  letterSpacing: '0.08em',
                }}
              >
                14D WINDOW
              </div>
            </div>
          </div>

          {/* CENTER - Bloom Halo + Avatar */}
          <div className="relative flex items-center justify-center overflow-visible" style={{ flex: '1 1 auto', minWidth: 0 }}>
            {/* Bloom halo - EXPANDED in Sanctuary mode to fill space */}
            <div
              className="absolute transition-all duration-500"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(90%, 525px)',
                height: 'min(90%, 525px)',
                background: 'radial-gradient(circle, ' +
                  'var(--accent-glow) 0%, ' +
                  'var(--accent-glow)40 12%, ' +
                  'var(--accent-glow)18 35%, ' +
                  'var(--accent-glow)05 55%, ' +
                  'transparent 75%)',
                filter: 'blur(75px)',
                opacity: isLight
                  ? 0.06
                  : 0.20,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div className="relative z-10 flex items-center justify-center">
              <AvatarV3
                stage={normalizedStage}
                modeWeights={modeWeights}
                isPracticing={isPracticing}
                lastStageChange={lastStageChange}
                lastModeChange={lastModeChange}
                lastSessionComplete={lastSessionComplete}
                path={avatarPath}
                size="hearth"
              />
            </div>
          </div>

          {/* RIGHT PANEL - Completion + On-Time + View Report */}
          <div style={sidePanelFrameStyle}>
            <div
              style={sidePanelRollZoneStyle}
              onClick={() => setRightOpen((open) => !open)}
            >
              <Collapse isOpened={!rightOpen}>
                <div style={sidePanelCollapseSlotStyle}>
                  <div
                    style={{
                      ...sidePanelCoverRectStyle,
                      ...sidePanelCoverMediaStyle,
                      height: coverH,
                      backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.24)), url("/assets/card_bg_cosmic_1.webp")`,
                    }}
                  >
                    <div className="type-label text-[9px]" style={sidePanelCoverLabelStyle}>
                      RHYTHM REPORT
                    </div>
                  </div>
                </div>
              </Collapse>
              <Collapse isOpened={rightOpen}>
                <div style={sidePanelCollapseSlotStyle}>
                  <div
                    style={{
                      ...sidePanelCoverContentStyle,
                      width: '100%',
                      height: coverH,
                      justifyContent: 'space-evenly',
                      paddingTop: '4px',
                      paddingBottom: '8px',
                      rowGap: '6px',
                    }}
                  >
                    <div style={{ ...sidePanelMetricCellStyle, flex: '0 0 auto', gap: '4px' }}>
                      {renderRateRing(hubTiles?.completion_rate, isLight, {
                        size: 48,
                        strokeWidth: 3.5,
                        darkTrackAlpha: 0.16,
                        lightTrackAlpha: 0.26,
                        darkFillAlpha: 0.9,
                        lightFillAlpha: 0.88,
                      })}
                      <div className="type-label text-[9px]" style={{ color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.08em' }}>
                        COMPLETION
                      </div>
                    </div>
                    <div style={{ ...sidePanelMetricCellStyle, flex: '0 0 auto', gap: '4px' }}>
                      {renderRateRing(hubTiles?.on_time_rate, isLight, {
                        size: 48,
                        strokeWidth: 3.5,
                        darkTrackAlpha: 0.16,
                        lightTrackAlpha: 0.26,
                        darkFillAlpha: 0.9,
                        lightFillAlpha: 0.88,
                      })}
                      <div
                        className="type-label text-[9px]"
                        style={{
                          color: isLight ? 'rgba(100, 80, 60, 0.6)' : 'rgba(255, 255, 255, 0.45)',
                          letterSpacing: '0.06em',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        ON‑TIME
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>
            <div style={{ ...sidePanelFooterStyle, height: `calc(${U} * 3.0)` }}>
              <button
                onClick={() => openArchive(ARCHIVE_TABS.REPORTS)}
                className="type-label px-3 py-2 rounded-full font-bold transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, var(--accent-color), var(--accent-70))`,
                  color: '#fff',
                  boxShadow: '0 3px 10px var(--accent-30)',
                  width: '100%',
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                VIEW REPORT
              </button>
            </div>
          </div>
        </div>
        {/* PROBE:HOMEHUB_SIDE_PANELS_V1:END */}

        {/* STATUS & CONTROL INSTRUMENT - Agency | Continuity (No StageTitle - moved to top) */}
        <HubStagePanel
          stage={effectiveStage}
          path={previewPath}
          showCore={previewShowCore}
          attention={previewAttention}
          lastPracticed={lastPracticed}
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
      <div className="w-full px-4 flex flex-col items-center gap-3 pb-4">

        {/* EXPLORE MODES - Navigation Buttons */}
        {userMode !== 'student' && (
          <div
            className="w-full transition-all duration-700"
            style={{
              ...SANCTUARY_RAIL_STYLE,
              maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
              margin: '0 auto',
            }}
          >

            {/* Horizontal Row - Simple circular buttons - DISTRIBUTES ACROSS RAIL */}
            <div
              className="flex flex-row items-center w-full"
              style={{
                justifyContent: 'space-between',
                gap: '0',
              }}
            >
              <div className="relative flex flex-col items-center justify-start">
                <SimpleModeButton
                  title="Practice"
                  onClick={() => handleSelectSection("practice")}
                  disabled={lockToHub}
                  icon="practice"
                  isActive={activeSection === 'practice'}
                  className="im-nav-pill"
                  data-nav-pill-id="home:practice"
                  data-ui-target="true"
                  data-ui-scope="role"
                  data-ui-role-group="homeHub"
                  data-ui-id="homeHub:mode:practice"
                />
              </div>
              <SimpleModeButton
                title="Wisdom"
                onClick={() => handleSelectSection("wisdom")}
                disabled={lockToHub}
                icon="wisdom"
                isActive={activeSection === 'wisdom'}
                className="im-nav-pill"
                data-nav-pill-id="home:wisdom"
                data-ui-target="true"
                data-ui-scope="role"
                data-ui-role-group="homeHub"
                data-ui-id="homeHub:mode:wisdom"
              />
              <SimpleModeButton
                title="Application"
                onClick={() => handleSelectSection("application")}
                disabled={lockToHub}
                icon="application"
                isActive={activeSection === 'application'}
                className="im-nav-pill"
                data-nav-pill-id="home:application"
                data-ui-target="true"
                data-ui-scope="role"
                data-ui-role-group="homeHub"
                data-ui-id="homeHub:mode:application"
              />
              <SimpleModeButton
                title="Navigation"
                onClick={() => handleSelectSection("navigation")}
                disabled={lockToHub}
                icon="navigation"
                isActive={activeSection === 'navigation'}
                className="im-nav-pill"
                data-nav-pill-id="home:navigation"
                data-ui-target="true"
                data-ui-scope="role"
                data-ui-role-group="homeHub"
                data-ui-id="homeHub:mode:navigation"
              />
            </div>
            <style>{`
              [data-ui-id^="homeHub:mode:"] {
                background-image: ${modeTileBackgroundImage} !important;
              }
            `}</style>
          </div>
        )}

        {/* PRACTICE + PROGRESS: Swipe Rail (1 card per page) */}
        <div className="w-full" style={SANCTUARY_RAIL_STYLE}>
          <div
            className="w-full overflow-x-hidden overflow-y-visible"
            style={{
              minHeight: '200px',
              transition: 'height 280ms ease',
              willChange: 'height',
              paddingBottom: '12px',
            }}
          >
              <div
                ref={homeSwipeRailRef}
                data-card-carousel-root="homeHubSwipe"
                className="flex w-full items-start gap-0 overflow-x-auto no-scrollbar"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  overflowY: 'visible',
                  overscrollBehaviorX: 'contain',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <section
                  className="shrink-0 basis-full w-full"
                  style={{ minWidth: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                >
                <div ref={homeSwipePracticeRef} className="w-full">
                {disableDailyCard ? (
                  <div
                    className="w-full relative"
                    style={{
                      maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
                      margin: '0 auto',
                      borderRadius: '24px',
                      // Intentionally no shadow, no blur, no filter. If jagged corners persist, it is not this card.
                      boxShadow: 'none',
                      filter: 'none',
                      transform: 'none',
                      background: isLight ? 'rgba(250, 246, 238, 0.10)' : 'rgba(0, 0, 0, 0.10)',
                      border: '1px dashed rgba(255, 80, 80, 0.65)',
                      minHeight: '520px',
                    }}
                    >
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 12,
                        fontSize: 12,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        opacity: 0.85,
                        color: isLight ? 'rgba(60, 50, 35, 0.75)' : 'rgba(255,255,255,0.75)',
                      }}
                    >
                      BUILD_PROBE: DailyPracticeCard disabled
                    </div>
                  </div>
                ) : (
                  <DailyPracticeCard
                    onStartPractice={handleStartPractice}
                    onViewCurriculum={openCurriculumHub}
                    onNavigate={handleSelectSection}
                    devCardActive={homeSwipePage === 0}
                    devCardCarouselId="homeHubSwipe"
                    hasPersistedCurriculumData={hasPersistedCurriculumData}
                    onboardingComplete={curriculumOnboardingComplete}
                    practiceTimeSlots={practiceTimeSlots}
                    onStartSetup={() => handleSelectSection('navigation')}
                    isTutorialTarget={isDailyCardTutorialTarget}
                    showPerLegCompletion={false}
                    showDailyCompletionNotice={true}
                    showSessionMeter={false}
                    debugShadowOff={dailyCardShadowOff}
                    debugBlurOff={dailyCardBlurOff}
                    debugBorderOff={dailyCardBorderOff}
                    debugMaskOff={dailyCardMaskOff}
                  />
                )}

                {showBuildProbe && (
                  <div
                    className="mt-2 text-[11px] uppercase tracking-[0.12em]"
                    style={{
                      opacity: 0.8,
                      color: isLight ? 'rgba(60, 50, 35, 0.65)' : 'rgba(255,255,255,0.65)',
                      userSelect: 'text',
                    }}
                  >
                    BUILD_PROBE: HomeHub flags | disableDailyCard:{String(disableDailyCard)}
                  </div>
                )}
                </div>
                </section>
              </div>
            </div>
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
                onDismiss={closeCurriculumHub}
              />
            ) : (
              // Show curriculum hub - PORTAL with frame wrapper
              <div className="fixed inset-0 z-[9999] isolate">
                {/* backdrop */}
                <div 
                  className="absolute inset-0 bg-black/40 backdrop-blur-xl"
                  onClick={() => {
                    console.log('[HomeHub] Backdrop clicked');
                    closeCurriculumHub();
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
                    data-card="true"
                    data-card-id="modal:curriculumHub"
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
                        className="type-h2"
                        style={{
                          color: 'var(--accent-color)',
                        }}
                      >
                        Ritual Foundation
                      </h2>
                      <button
                        onClick={() => {
                          console.log('[HomeHub] Close button clicked');
                          closeCurriculumHub();
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
                      <CurriculumHub onClose={closeCurriculumHub} isInModal />
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}

      </div>
      {/* Session History Overlay - Placed at root for visibility */}
      {showHistory && (
        <SessionHistoryView
          onClose={() => setShowHistory(false)}
          initialTab={archiveOptions.initialTab}
          initialReportDomain={archiveOptions.initialReportDomain}
        />
      )}
      {showTrackingHub && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowTrackingHub(false)}
        >
          <div
            className="relative w-full"
            style={{
              maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '28px',
              background: isLight ? 'rgba(246, 241, 230, 0.98)' : 'rgba(10, 10, 15, 0.98)',
              border: isLight ? '1px solid rgba(180, 140, 90, 0.25)' : '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTrackingHub(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                color: isLight ? 'rgba(60,52,37,0.9)' : 'rgba(253,251,245,0.9)',
              }}
              aria-label="Close tracker hub"
            >
              ×
            </button>
            <div className="p-4 pt-10">
              <TrackingHub streakInfo={streakInfo} />
            </div>
          </div>
        </div>,
        document.body
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
          className="type-label text-[7px] font-bold"
          style={{
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
          className="type-label text-sm font-bold transition-colors relative"
          style={{
            color: isLight ? 'var(--light-accent)' : 'var(--accent-color)',
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
