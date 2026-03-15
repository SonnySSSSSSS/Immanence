// src/components/HomeHub.jsx
import { createPortal } from 'react-dom';
// Improved HomeHub component with stats overview and better visual hierarchy
// BUILD: 2025-12-31T20:46 - Removed constellation completely


import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { AnimatePresence } from "framer-motion";
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
import { STAGES, STAGE_THRESHOLDS } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useUserModeStore } from "../state/userModeStore.js";
import { calculateGradientAngle, getAvatarCenter, getDynamicGoldGradient } from "../utils/dynamicLighting.js";
import { SimpleModeButton } from "./SimpleModeButton.jsx";
import { DailyPracticeCard } from "./DailyPracticeCard.jsx";
import { QuickDashboardTiles } from "./dashboard/QuickDashboardTiles.jsx";
import { CurriculumHub } from "./CurriculumHub.jsx";
import { CurriculumOnboarding } from "./CurriculumOnboarding.jsx";
import { CurriculumCompletionReport } from "./CurriculumCompletionReport.jsx";
import { ThoughtDetachmentOnboarding } from "./ThoughtDetachmentOnboarding.jsx";
import { useCurriculumStore } from "../state/curriculumStore.js";
import { useNavigationStore } from "../state/navigationStore.js";
import { useUiStore } from "../state/uiStore.js";
import { getQuickDashboardTiles } from "../reporting/dashboardProjection.js";
import { getHomeDashboardPolicy } from "../reporting/tilePolicy.js";
import { useTutorialStore } from "../state/tutorialStore.js";
import { getProgramDefinition, getProgramLauncher } from "../data/programRegistry.js";
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

const HOME_HUB_SIDE_PANEL_ASSETS = Object.freeze({
  practiceLog: 'locker.png',
  rhythmReport: 'elements.png',
});

function resolveHomeHubAssetUrl(fileName) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}assets/${fileName}`;
}

const HOME_HUB_SIDE_PANEL_ASSET_URLS = Object.freeze({
  practiceLog: resolveHomeHubAssetUrl(HOME_HUB_SIDE_PANEL_ASSETS.practiceLog),
  rhythmReport: resolveHomeHubAssetUrl(HOME_HUB_SIDE_PANEL_ASSETS.rhythmReport),
});


function HomeHub({ onSelectSection, activeSection = null, currentStage, previewPath, isPracticing = false, lockToHub = false, debugShadowScan = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, getDaysUntilNextStage, getEffectiveDays, getDaysUntilNextStageEffective, getDecayInfo } = useLunarStore();
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const userMode = useUserModeStore((s) => s.userMode);
  const activeUserId = useUserModeStore((s) => s.activeUserId);
  const isLight = colorScheme === 'light';
  const modeTileBgUrl = 'none';
  const modeTileBackgroundImage = sanitizeModeTileBackgroundImage(modeTileBgUrl);
  void debugShadowScan;
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
  const curriculumOwnerUserId = useCurriculumStore(s => s.ownerUserId);
  const navigationOwnerUserId = useNavigationStore(s => s.ownerUserId);
  const rawCurriculumOnboardingComplete = useCurriculumStore(s => s.onboardingComplete);
  const rawCurriculumPracticeTimeSlots = useCurriculumStore(s => s.practiceTimeSlots);
  const rawActiveCurriculumId = useCurriculumStore(s => s.activeCurriculumId);
  const rawCurriculumStartDate = useCurriculumStore(s => s.curriculumStartDate);
  const rawDayCompletions = useCurriculumStore(s => s.dayCompletions);
  const rawLegCompletions = useCurriculumStore(s => s.legCompletions);
  const rawActivePath = useNavigationStore(s => s.activePath);
  const isCurriculumStateOwnedByCurrentUser = Boolean(activeUserId && curriculumOwnerUserId === activeUserId);
  const isNavigationStateOwnedByCurrentUser = Boolean(activeUserId && navigationOwnerUserId === activeUserId);
  const curriculumOnboardingComplete = isCurriculumStateOwnedByCurrentUser ? rawCurriculumOnboardingComplete : false;
  const curriculumPracticeTimeSlots = isCurriculumStateOwnedByCurrentUser ? rawCurriculumPracticeTimeSlots : [];
  // Use canonical getter to avoid stale scheduleSlots (called outside subscription to prevent infinite loops)
  const navigationScheduleSlots = (() => {
    if (!isNavigationStateOwnedByCurrentUser) return [];
    const getScheduleSlots = useNavigationStore.getState().getScheduleSlots;
    return typeof getScheduleSlots === 'function' ? getScheduleSlots() : [];
  })();
  const activePath = isNavigationStateOwnedByCurrentUser ? rawActivePath : null;
  const practiceTimeSlots = (navigationScheduleSlots && navigationScheduleSlots.length > 0)
    ? navigationScheduleSlots.map(slot => slot.time)
    : curriculumPracticeTimeSlots;
  const isCurriculumComplete = useCurriculumStore(s => s.isCurriculumComplete);
  const activeCurriculumId = isCurriculumStateOwnedByCurrentUser ? rawActiveCurriculumId : 'ritual-initiation-14-v2';
  const setActiveCurriculumId = useCurriculumStore(s => s.setActiveCurriculumId);
  const [showCurriculumHub, setShowCurriculumHubState] = useState(false);
  const [showCurriculumOnboarding, setShowCurriculumOnboarding] = useState(false);
  const [curriculumSetupError, setCurriculumSetupError] = useState(null);
  const activeProgram = React.useMemo(
    () => getProgramDefinition(activeCurriculumId) || null,
    [activeCurriculumId]
  );
  const openCurriculumHub = React.useCallback(({ beginSetup = false, programId = 'ritual-initiation-14-v2' } = {}) => {
    setActiveCurriculumId?.(programId);
    setCurriculumSetupError(null);
    setShowCurriculumOnboarding(beginSetup);
    setShowCurriculumHubState(true);
  }, [setActiveCurriculumId]);
  const closeCurriculumHub = React.useCallback(() => {
    setShowCurriculumOnboarding(false);
    setCurriculumSetupError(null);
    setShowCurriculumHubState(false);
  }, []);
  const handleOpenCurriculumSetup = React.useCallback(() => {
    setActiveCurriculumId?.('ritual-initiation-14-v2');
    setCurriculumSetupError(null);
    setShowCurriculumOnboarding(true);
  }, [setActiveCurriculumId]);
  const handleCurriculumSetupComplete = React.useCallback(() => {
    const result = useNavigationStore.getState().beginPathForCurriculum(activeCurriculumId || 'ritual-initiation-14-v2');
    if (result?.ok === false) {
      setCurriculumSetupError(result.error || 'Unable to begin the selected curriculum.');
      return;
    }
    setCurriculumSetupError(null);
    setShowCurriculumOnboarding(false);
    setShowCurriculumHubState(false);
  }, [activeCurriculumId]);
  const [launcherContext, setLauncherContext] = useState(null);
  const [frameRect, setFrameRect] = useState(null);
  const [leftRolled, setLeftRolled] = useState(false);
  const [rightRolled, setRightRolled] = useState(false);
  const hasPersistedCurriculumData = Boolean(
    isCurriculumStateOwnedByCurrentUser
    && (
      curriculumOnboardingComplete
      || practiceTimeSlots.length > 0
      || Boolean(rawCurriculumStartDate)
      || Object.keys(rawDayCompletions || {}).length > 0
      || Object.keys(rawLegCompletions || {}).length > 0
    )
  );
  const probeLabel = !activeUserId
    ? 'FRESH_USER'
    : (userMode === 'explorer'
      ? 'EXPLORER_STARTUP_REQUIRED'
      : (showCurriculumOnboarding
        ? 'STUDENT_ONBOARDING'
        : (activePath ? 'STUDENT_ACTIVE' : 'STUDENT_SETUP_REQUIRED')));

  useEffect(() => {
    setShowCurriculumHubState(false);
    setShowCurriculumOnboarding(false);
    setCurriculumSetupError(null);
    setLauncherContext(null);
  }, [activeUserId]);


  useLayoutEffect(() => {
    const update = (tag = "update") => {
      const el = document.querySelector("[data-app-frame]");
      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();

      setFrameRect(rect);
      void tag;
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
  void daysUntilNext;

  // Effective (decay-adjusted) stage counter
  const effectiveDaysTotal = getEffectiveDays();
  const effectiveStageKey = lunarStage;
  const daysUntilNextEffective = getDaysUntilNextStageEffective() ?? 0;
  const nextStageName = STAGES[effectiveStageKey]?.next
    ? (STAGES[STAGES[effectiveStageKey].next]?.displayName ?? '—')
    : 'Ceiling';
  const stageDuration = STAGES[effectiveStageKey]?.duration ?? 90;
  const stageThreshold = STAGE_THRESHOLDS[effectiveStageKey] ?? 0;
  const daysInStage = Math.max(0, effectiveDaysTotal - stageThreshold);
  const stageProgressPct = Math.min(100, Math.round((daysInStage / stageDuration) * 100));
  const decayInfo = getDecayInfo();

  void avgAccuracy;

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
  const panelW = `clamp(94px, calc(${RAIL_W} * 0.185), 153px)`;
  const panelH = `clamp(112px, calc(${RAIL_W} * 0.305), 132px)`;
  const panelPad = `calc(${U} * 1.0)`;
  const panelRadius = `calc(${U} * 1.2)`;
  const sidePanelFrameStyle = {
    width: panelW,
    height: panelH,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 0,
    boxSizing: 'border-box',
    background: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.28)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: panelRadius,
    border: `1px solid ${isLight ? 'rgba(200, 160, 100, 0.2)' : 'rgba(255, 255, 255, 0.09)'}`,
    boxShadow: isLight
      ? 'inset 0 -12px 18px rgba(60, 50, 35, 0.08)'
      : 'inset 0 -12px 18px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    position: 'relative',
  };
  const sidePanelFramePrimaryRowStyle = {
    ...sidePanelFrameStyle,
    transform: 'translateY(-18px)',
  };
  const sidePanelMetricCellStyle = {
    width: '100%',
    flex: '0 1 auto',
    minWidth: 0,
    minHeight: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '1px',
  };
  const sidePanelMetricValueBaseStyle = {
    color: isLight ? 'rgba(45, 35, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    letterSpacing: '0.01em',
    lineHeight: 0.94,
  };
  const sidePanelHeadlineValueStyle = {
    ...sidePanelMetricValueBaseStyle,
    fontSize: '18px',
  };
  const sidePanelMetricLabelStyle = {
    color: isLight ? 'rgba(100, 80, 60, 0.52)' : 'rgba(255, 255, 255, 0.40)',
    fontSize: '10px',
    lineHeight: 1.08,
    letterSpacing: '0.07em',
    fontWeight: '400',
  };
  const sidePanelMetricSubLabelStyle = {
    color: isLight ? 'rgba(100, 80, 60, 0.4)' : 'rgba(255, 255, 255, 0.30)',
    fontSize: '7px',
    lineHeight: 1,
    letterSpacing: '0.07em',
    fontWeight: '400',
  };
  const sidePanelTileWrapStyle = {
    position: 'absolute',
    inset: 0,
    padding: `calc(${panelPad} * 0.45)`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: `calc(${U} * 0.28)`,
  };
  const sidePanelHandleButtonStyle = {
    alignSelf: 'center',
    width: `clamp(24px, calc(${U} * 1.7), 36px)`,
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  };
  const sidePanelHandleLineStyle = {
    width: '100%',
    height: '2px',
    borderRadius: '999px',
    background: isLight ? 'rgba(100, 80, 60, 0.42)' : 'rgba(255, 255, 255, 0.32)',
  };
  const sidePanelTileContentBaseStyle = {
    width: '100%',
    flex: '1 1 auto',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: `calc(${U} * 0.28)`,
    transition: 'max-height 260ms ease, opacity 220ms ease',
  };
  const sidePanelTileMetricCellStyle = {
    ...sidePanelMetricCellStyle,
    minHeight: 'auto',
    gap: 0,
  };
  const sidePanelTileValueStyle = {
    ...sidePanelHeadlineValueStyle,
    fontSize: '16px',
    lineHeight: 0.9,
  };
  const sidePanelTileLabelStyle = {
    ...sidePanelMetricLabelStyle,
    fontSize: '8px',
    lineHeight: 1,
    letterSpacing: '0.06em',
  };
  const sidePanelTileSubLabelStyle = {
    ...sidePanelMetricSubLabelStyle,
    fontSize: '6px',
    lineHeight: 1,
    letterSpacing: '0.06em',
  };
  const sidePanelLeftTileStatsColStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: `calc(${U} * 0.2)`,
    flexShrink: 0,
  };
  const sidePanelLeftMetricCellStyle = {
    ...sidePanelTileMetricCellStyle,
    minHeight: `calc(${U} * 1.65)`,
    justifyContent: 'center',
  };
  const sidePanelTileExpandedMaxHeight = `calc(${panelH} - ((${panelPad}) * 0.9) - 12px)`;
  const sidePanelTileRolledMaxHeight = `calc(${U} * 1.6)`;
  const PANEL_EXPANDED_H = panelH;
  const PANEL_COLLAPSED_H = `calc(${U} * 1.35)`;
  const sidePanelTileReportButtonStyle = {
    background: `linear-gradient(135deg, var(--accent-color), var(--accent-70))`,
    color: '#fff',
    boxShadow: '0 3px 10px var(--accent-15)',
    width: '100%',
    fontSize: '6px',
    lineHeight: 1,
    letterSpacing: '0.06em',
    border: 'none',
    cursor: 'pointer',
    padding: '3px 0',
    flexShrink: 0,
  };


  return (
    <div className="w-full flex flex-col items-center relative overflow-visible">
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
            gap: '18px',
            padding: '0 4px',
            maxWidth: RAIL_W,
            margin: '0 auto 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* PROBE:HOMEHUB_SIDE_PANELS_ROLLUP_V1 */}
          {/* LEFT PANEL - Sessions + Active Days */}
          <div
            style={{
              ...sidePanelFramePrimaryRowStyle,
              height: leftRolled ? PANEL_COLLAPSED_H : PANEL_EXPANDED_H,
              transition: 'height 220ms ease',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${HOME_HUB_SIDE_PANEL_ASSET_URLS.practiceLog}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isLight ? 0.30 : 0.20,
                filter: 'saturate(0.72) contrast(0.94) brightness(0.93)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1 }}>
              <button
                type="button"
                aria-expanded={!leftRolled}
                aria-label={leftRolled ? 'Expand practice log panel' : 'Collapse practice log panel'}
                onClick={() => setLeftRolled((rolled) => !rolled)}
                style={sidePanelHandleButtonStyle}
              >
                <span aria-hidden="true" style={sidePanelHandleLineStyle} />
              </button>
              <div
                style={{
                  ...sidePanelTileContentBaseStyle,
                  maxHeight: leftRolled ? sidePanelTileRolledMaxHeight : sidePanelTileExpandedMaxHeight,
                  opacity: leftRolled ? 0.86 : 1,
                }}
              >
                <div style={sidePanelLeftTileStatsColStyle}>
                  <div style={sidePanelLeftMetricCellStyle}>
                    <div className="type-metric" style={{ ...sidePanelTileValueStyle, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                      {Math.round(hubTiles?.sessions_total ?? 0)}
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileLabelStyle, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      Sessions
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      14D
                    </div>
                  </div>
                  <div style={sidePanelLeftMetricCellStyle}>
                    <div className="type-metric" style={{ ...sidePanelTileValueStyle, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                      {Math.round(hubTiles?.days_active ?? 0)}
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileLabelStyle, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      Active
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      Days
                    </div>
                  </div>
                </div>
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
          <div
            style={{
              ...sidePanelFramePrimaryRowStyle,
              height: rightRolled ? PANEL_COLLAPSED_H : PANEL_EXPANDED_H,
              transition: 'height 220ms ease',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${HOME_HUB_SIDE_PANEL_ASSET_URLS.rhythmReport}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isLight ? 0.30 : 0.20,
                filter: 'saturate(0.72) contrast(0.94) brightness(0.93)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1 }}>
              <button
                type="button"
                aria-expanded={!rightRolled}
                aria-label={rightRolled ? 'Expand rhythm report panel' : 'Collapse rhythm report panel'}
                onClick={() => setRightRolled((rolled) => !rolled)}
                style={sidePanelHandleButtonStyle}
              >
                <span aria-hidden="true" style={sidePanelHandleLineStyle} />
              </button>
              <div
                style={{
                  ...sidePanelTileContentBaseStyle,
                  maxHeight: rightRolled ? sidePanelTileRolledMaxHeight : sidePanelTileExpandedMaxHeight,
                  opacity: rightRolled ? 0.86 : 1,
                  gap: `calc(${U} * 0.18)`,
                }}
              >
                {/* Next stage label */}
                <div className="type-label" style={{
                  ...sidePanelTileLabelStyle,
                  fontSize: '8px',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                  textAlign: 'center',
                  letterSpacing: '0.10em',
                }}>
                  → {nextStageName}
                </div>

                {/* Days remaining — large number */}
                <div style={{ textAlign: 'center', lineHeight: 1 }}>
                  <span className="type-metric" style={{
                    ...sidePanelTileValueStyle,
                    fontSize: '26px',
                    fontWeight: 700,
                    textShadow: '0 1px 8px rgba(0,0,0,0.75)',
                  }}>
                    {daysUntilNextEffective}
                  </span>
                </div>

                {/* "days remaining" label */}
                <div className="type-label" style={{
                  ...sidePanelTileLabelStyle,
                  fontSize: '8px',
                  textAlign: 'center',
                  textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                }}>
                  days remaining
                </div>

                {/* Progress bar within stage */}
                <div style={{ width: '100%', padding: '0 2px', boxSizing: 'border-box' }}>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    borderRadius: '2px',
                    background: isLight ? 'rgba(100,80,60,0.18)' : 'rgba(255,255,255,0.12)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${stageProgressPct}%`,
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, var(--accent-color), var(--accent-70))',
                      boxShadow: '0 0 4px var(--accent-30)',
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                </div>

                {/* Decay rate — hover for full info */}
                <div
                  className="type-label"
                  title={[
                    `Decay: −${decayInfo.decayPerMissedDay.toFixed(2)} effective days per missed day`,
                    `Accumulated loss: ${decayInfo.decayAccumulated} days`,
                    decayInfo.isRecovering
                      ? `Recovering: −${decayInfo.recoveryRate}/day (${decayInfo.consecutiveDays} day streak)`
                      : `Streak ${decayInfo.consecutiveDays}/7 days for recovery bonus`,
                  ].join('\n')}
                  style={{
                    textAlign: 'center',
                    fontSize: '7px',
                    lineHeight: 1,
                    letterSpacing: '0.06em',
                    color: decayInfo.isRecovering
                      ? 'rgba(76,175,80,0.85)'
                      : (isLight ? 'rgba(100,80,60,0.65)' : 'rgba(255,255,255,0.55)'),
                    cursor: 'default',
                    textShadow: '0 1px 3px rgba(0,0,0,0.75)',
                  }}
                >
                  {decayInfo.isRecovering
                    ? `+${decayInfo.recoveryRate}/day recovery`
                    : `−${decayInfo.decayPerMissedDay.toFixed(2)}/miss`}
                </div>

                {/* Report button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openArchive(ARCHIVE_TABS.REPORTS); }}
                  className="type-label rounded-full font-bold transition-all hover:scale-105"
                  style={sidePanelTileReportButtonStyle}
                >
                  REPORT
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* PROBE:HOMEHUB_SIDE_PANELS_V1:END */}

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
      <div className="w-full px-4 flex flex-col items-center gap-2 pb-4">

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

        {/* PRACTICE + PROGRESS: Curriculum Card */}
        <div className="w-full pt-2" style={{
          ...SANCTUARY_RAIL_STYLE,
          borderTop: `1px solid ${isLight ? 'rgba(100, 80, 60, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}>
          <div
            className="mb-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
            style={{
              borderColor: isLight ? 'rgba(100, 80, 60, 0.18)' : 'rgba(255,255,255,0.12)',
              background: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.05)',
              color: isLight ? 'rgba(60,50,35,0.78)' : 'rgba(253,251,245,0.72)',
            }}
          >
            {probeLabel}
          </div>
          <div className="w-full">
            <DailyPracticeCard
              onStartPractice={handleStartPractice}
              onViewCurriculum={openCurriculumHub}
              onNavigate={handleSelectSection}
              hasPersistedCurriculumData={hasPersistedCurriculumData}
              onboardingComplete={curriculumOnboardingComplete}
              practiceTimeSlots={practiceTimeSlots}
              onStartSetup={handleOpenCurriculumSetup}
              isTutorialTarget={isDailyCardTutorialTarget}
              showPerLegCompletion={false}
              showDailyCompletionNotice={true}
              showSessionMeter={false}
            />
          </div>
        </div>

        {/* Curriculum Hub/Report Modal - Portaled to document.body */}
        {showCurriculumHub && createPortal(
          (() => {
            const isComplete = isCurriculumComplete();
            
            // Calculate clamped bounds for the host
            const getHostStyle = () => {
              if (!frameRect) return { left: 0, right: 0 };
              const vw = window.innerWidth;
              const rawLeft = frameRect.left;
              const rawRight = frameRect.left + frameRect.width;
              const left = Math.max(0, rawLeft);
              const right = Math.max(0, vw - rawRight);
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
                    closeCurriculumHub();
                  }}
                />

                {/* frame-aligned modal host - ALWAYS RENDER with fail-safe clamping */}
                <div
                  className="absolute top-0 bottom-0 flex justify-center py-6"
                  style={hostStyle}
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
                  >
                    {/* Header - fixed, non-scrolling */}
                    <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between" style={{
                      background: isLight ? '#f6f1e6' : 'rgba(10, 10, 15, 1)',
                      borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                      <div className="min-w-0">
                        <h2
                          className="type-h2"
                          style={{
                            color: 'var(--accent-color)',
                          }}
                        >
                          {activeProgram?.name || 'Curriculum'}
                        </h2>
                        {activeProgram?.curriculum?.description && (
                          <div
                            className="text-sm mt-1"
                            style={{ color: isLight ? 'rgba(60, 50, 40, 0.65)' : 'rgba(253,251,245,0.65)' }}
                          >
                            {activeProgram.curriculum.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
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
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      {curriculumSetupError && (
                        <div
                          className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm"
                          style={{
                            background: isLight ? 'rgba(200, 100, 80, 0.1)' : 'rgba(200, 100, 80, 0.12)',
                            border: `1px solid ${isLight ? 'rgba(200, 100, 80, 0.22)' : 'rgba(255, 170, 140, 0.22)'}`,
                            color: isLight ? 'rgba(110, 55, 35, 0.92)' : 'rgba(255, 205, 190, 0.95)',
                          }}
                        >
                          {curriculumSetupError}
                        </div>
                      )}
                      <CurriculumHub
                        isInModal
                        onBeginSetup={() => {
                          setCurriculumSetupError(null);
                          setShowCurriculumHubState(false);
                          setShowCurriculumOnboarding(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}

        {showCurriculumOnboarding && createPortal(
          <CurriculumOnboarding
            onDismiss={() => setShowCurriculumOnboarding(false)}
            onComplete={handleCurriculumSetupComplete}
          />,
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
