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
import { SessionHistoryView } from "./SessionHistoryView.jsx";
import { TrackingHub } from "./TrackingHub.jsx";
import { SideNavigation } from "./SideNavigation.jsx";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES, STAGE_THRESHOLDS } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
import { useUserModeStore } from "../state/userModeStore.js";
import { DailyPracticeCardHost } from "./DailyPracticeCardHost.jsx";
import { QuickDashboardTiles } from "./dashboard/QuickDashboardTiles.jsx";
import { CurriculumOnboarding } from "./CurriculumOnboarding.jsx";
import { CurriculumHubPortal } from "./CurriculumHubPortal.jsx";
import { HomeHubAvatarRail } from "./HomeHubAvatarRail.jsx";
import { HomeHubModeRail } from "./HomeHubModeRail.jsx";
import { ThoughtDetachmentOnboarding } from "./ThoughtDetachmentOnboarding.jsx";
import { useCurriculumStore } from "../state/curriculumStore.js";
import { useNavigationStore } from "../state/navigationStore.js";
import { useUiStore } from "../state/uiStore.js";
import { useTutorialStore } from "../state/tutorialStore.js";
import { getProgramDefinition, getProgramLauncher } from "../data/programRegistry.js";
import { ARCHIVE_TABS, REPORT_DOMAINS } from "./tracking/archiveLinkConstants.js";
import { TUTORIALS } from "../tutorials/tutorialRegistry.js";
import { ANCHORS } from "../tutorials/anchorIds.js";
import { AvatarV3 } from "./avatarV3/AvatarV3.jsx";
import { useAvatarV3State } from "../state/avatarV3Store.js";
import { usePathStore } from "../state/pathStore.js";
import { getFirstLoginAuditNow, markFirstLoginAudit, sanitizeFirstLoginAuditUserId } from "../utils/firstLoginAudit.js";
import {
  DEFAULT_CURRICULUM_ID,
  getHomeHubDashboardState,
  getOwnedNavigationScheduleSlots,
  resolveHomeHubCoordinatorState,
} from "./homeHubLogic.js";

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

const loadAvatarProbeModule = import.meta.env.DEV && import.meta.hot
  ? (() => {
      let probeModulePromise = null;
      return () => {
        probeModulePromise ??= import('../dev/avatarHmrProbes.js');
        return probeModulePromise;
      };
    })()
  : null;

function withAvatarProbe(callback) {
  if (!loadAvatarProbeModule) return;
  loadAvatarProbeModule()
    .then((module) => callback(module))
    .catch(() => {});
}

function logHomeHubHostProbe(event, detail = {}) {
  withAvatarProbe((module) => {
    module.logAvatarHmrProbe('host', 'HomeHub', event, detail);
  });
}

withAvatarProbe((module) => {
  module.logAvatarHmrProbe('host', 'HomeHub', 'module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
});

// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
markFirstLoginAudit('homehub:module-eval', {
  source: 'HomeHub',
});
// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

const sanitizeModeTileBackgroundImage = (bgUrl) => {
  const raw = typeof bgUrl === 'string' ? bgUrl.trim() : '';
  if (!raw || raw === 'none' || raw === 'url(none)' || raw === 'url("none")' || raw === "url('none')") {
    return 'none';
  }
  return `url("${raw}")`;
};

function HomeHub({ onSelectSection, activeSection = null, currentStage, previewPath, isPracticing = false, lockToHub = false, debugShadowScan = false, avatarRetreating = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, getDaysUntilNextStage, getEffectiveDays, getDaysUntilNextStageEffective, getDecayInfo } = useLunarStore();
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const userMode = useUserModeStore((s) => s.userMode);
  const accessPosture = useUserModeStore((s) => s.accessPosture);
  const setAccessPosture = useUserModeStore((s) => s.setAccessPosture);
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
  const activeTutorialStep = tutorialId ? TUTORIALS[tutorialId]?.steps?.[stepIndex] : null;
  const isDailyCardTutorialTarget = isTutorialOpen && activeTutorialStep?.id === 'home-daily-card';
  const handleSelectSection = React.useCallback((section, options = undefined) => {
    if (lockToHub) return;
    onSelectSection(section, options);
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
  // Use canonical getter to avoid stale scheduleSlots (called outside subscription to prevent infinite loops)
  const navigationScheduleSlots = getOwnedNavigationScheduleSlots({
    activeUserId,
    navigationOwnerUserId,
    getScheduleSlots: useNavigationStore.getState().getScheduleSlots,
  });
  const {
    curriculumOnboardingComplete,
    activePath,
    practiceTimeSlots,
    activeCurriculumId,
    hasPersistedCurriculumData,
  } = resolveHomeHubCoordinatorState({
    activeUserId,
    curriculumOwnerUserId,
    navigationOwnerUserId,
    rawCurriculumOnboardingComplete,
    rawCurriculumPracticeTimeSlots,
    rawActiveCurriculumId,
    rawCurriculumStartDate,
    rawDayCompletions,
    rawLegCompletions,
    rawActivePath,
    navigationScheduleSlots,
  });
  const isCurriculumComplete = useCurriculumStore(s => s.isCurriculumComplete);
  const setActiveCurriculumId = useCurriculumStore(s => s.setActiveCurriculumId);
  const [showCurriculumHub, setShowCurriculumHubState] = useState(false);
  const [showCurriculumOnboarding, setShowCurriculumOnboarding] = useState(false);
  const [curriculumSetupError, setCurriculumSetupError] = useState(null);
  const activeProgram = React.useMemo(
    () => getProgramDefinition(activeCurriculumId) || null,
    [activeCurriculumId]
  );
  const openCurriculumHub = React.useCallback(({ beginSetup = false, programId = DEFAULT_CURRICULUM_ID } = {}) => {
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
    setCurriculumSetupError(null);
    setShowCurriculumOnboarding(false);
    setShowCurriculumHubState(false);
    handleSelectSection('navigation', { forceStudentNavigation: true });
  }, [handleSelectSection]);
  const handleCurriculumSetupComplete = React.useCallback(() => {
    const result = useNavigationStore.getState().beginPathForCurriculum(activeCurriculumId || DEFAULT_CURRICULUM_ID);
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
  const [decayExpanded, setDecayExpanded] = useState(false);
  const [avatarParallax, setAvatarParallax] = useState({ x: 0, y: 0 });
  const avatarZoneRef = useRef(null);
  function handleAvatarZoneMouseMove(e) {
    const zone = avatarZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const MAX = 6;
    setAvatarParallax({
      x: ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * MAX,
      y: ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * MAX,
    });
  }
  function handleAvatarZoneMouseLeave() { setAvatarParallax({ x: 0, y: 0 }); }
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
      // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
      markFirstLoginAudit('homehub:frame-rect-measured', {
        tag,
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      });
      // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
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

  const [showHistory, setShowHistory] = useState(false);
  const [showTrackingHub, setShowTrackingHub] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState({ initialTab: 'all', initialReportDomain: null });
  const trackerLaunchContext = useUiStore(s => s.trackerLaunchContext);
  const homeHubProbeIdRef = useRef(null);
  const homeHubMountAuditRef = useRef(false);
  const homeHubDashboardAuditDurationRef = useRef(null);

  useEffect(() => {
    if (homeHubProbeIdRef.current == null) {
      homeHubProbeIdRef.current = 'host-probe-pending';
      withAvatarProbe((module) => {
        const nextId = module.incrementAvatarHmrProbeCounter('host', 'homeHubMountSeq');
        homeHubProbeIdRef.current = nextId ?? 'host-probe-disabled';
      });
    }

    logHomeHubHostProbe('mount', {
      probeId: homeHubProbeIdRef.current,
      activeSection,
      currentStage,
      previewPath,
    });

    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
    if (!homeHubMountAuditRef.current) {
      homeHubMountAuditRef.current = true;
      markFirstLoginAudit('homehub:mount', {
        activeSection,
        currentStage,
        previewPath,
        userId: sanitizeFirstLoginAuditUserId(activeUserId),
      });
    }
    // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

    return () => {
      logHomeHubHostProbe('unmount', {
        probeId: homeHubProbeIdRef.current,
        activeSection,
      });
    };
  }, [activeSection, currentStage, previewPath, activeUserId]);

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

  logHomeHubHostProbe('render-avatar-host', {
    probeId: homeHubProbeIdRef.current,
    activeSection,
    currentStage,
    avatarStage,
    effectiveStage,
    normalizedStage,
    previewPath,
    storedPath,
    avatarPath,
    colorScheme,
    userMode,
    accessPosture,
    activeUserId,
    modeWeights,
    isPracticing,
    lockToHub,
    leftRolled,
    rightRolled,
    decayExpanded,
    showCurriculumHub,
    showCurriculumOnboarding,
    hasPersistedCurriculumData,
    activePath,
    hostWrapperIdentity: 'HomeHub:avatar-surface',
    avatarKey: null,
    lastStageChange,
    lastModeChange,
    lastSessionComplete,
  });

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

  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
  const dashboardComputeStartedAt = getFirstLoginAuditNow();
  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
  const activeLauncher = launcherContext
    ? getProgramLauncher(launcherContext.programId || activeCurriculumId, launcherContext.leg?.launcherId)
    : null;

  // Compute dashboard policy for tiles
  const { hubTiles } = getHomeHubDashboardState({
    activeRunId: activePath?.runId,
    accessPosture,
  });
  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
  if (homeHubDashboardAuditDurationRef.current == null) {
    homeHubDashboardAuditDurationRef.current = Number((getFirstLoginAuditNow() - dashboardComputeStartedAt).toFixed(2));
  }

  useEffect(() => {
    if (homeHubDashboardAuditDurationRef.current == null) return;
    markFirstLoginAudit('homehub:dashboard-computed', {
      durationMs: homeHubDashboardAuditDurationRef.current,
      hasActivePath: Boolean(activePath?.runId),
      hubTileKeys: Object.keys(hubTiles || {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END

  // PROBE:HOMEHUB_SIDE_PANEL_GEOM
  const RAIL_W = SANCTUARY_MODULE_MAX_WIDTH;
  const U = `calc(${RAIL_W} / 24)`;
  const panelW = `clamp(94px, calc(${RAIL_W} * 0.185), 153px)`;
  const panelH = `clamp(112px, calc(${RAIL_W} * 0.305), 132px)`;
  const panelPad = `calc(${U} * 1.0)`;
  const panelChamfer = `calc(${U} * 0.72)`;
  const sidePanelFrameStyle = {
    width: panelW,
    height: panelH,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 0,
    boxSizing: 'border-box',
    background: 'transparent',
    backdropFilter: isLight ? 'blur(10px)' : 'blur(14px)',
    WebkitBackdropFilter: isLight ? 'blur(10px)' : 'blur(14px)',
    clipPath: `polygon(${panelChamfer} 0, calc(100% - ${panelChamfer}) 0, 100% ${panelChamfer}, 100% calc(100% - ${panelChamfer}), calc(100% - ${panelChamfer}) 100%, ${panelChamfer} 100%, 0 calc(100% - ${panelChamfer}), 0 ${panelChamfer})`,
    border: 'none',
    boxShadow: isLight
      ? '0 10px 24px rgba(18, 40, 52, 0.12)'
      : '0 14px 34px rgba(0, 0, 0, 0.38), 0 0 18px rgba(74, 214, 226, 0.12)',
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
    fontSize: '9px',
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
    justifyContent: 'center',
    gap: `calc(${U} * 0.28)`,
  };
  const sidePanelHandleLineStyle = {
    width: '100%',
    height: '2px',
    borderRadius: '999px',
    background: isLight ? 'var(--accent-60)' : 'var(--accent-50)',
  };
  const sidePanelTileContentBaseStyle = {
    width: '100%',
    flex: '1 1 auto',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
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
    fontSize: '9px',
    lineHeight: 1,
    letterSpacing: '0.06em',
  };
  const sidePanelTileSubLabelStyle = {
    ...sidePanelMetricSubLabelStyle,
    fontSize: '9px',
    lineHeight: 1,
    letterSpacing: '0.06em',
  };
  const sidePanelLeftTileStatsColStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: `calc(${U} * 0.2)`,
    flexShrink: 0,
  };
  const sidePanelLeftMetricCellStyle = {
    ...sidePanelTileMetricCellStyle,
    minHeight: `calc(${U} * 1.65)`,
    justifyContent: 'center',
  };
  const sidePanelHousingGlowColor = isLight ? 'var(--accent-10)' : 'var(--accent-20)';
  const sidePanelHousingOuterStyle = {
    position: 'absolute',
    inset: 0,
    clipPath: sidePanelFrameStyle.clipPath,
    background: isLight
      ? 'linear-gradient(180deg, rgba(230, 246, 250, 0.76) 0%, rgba(201, 228, 235, 0.56) 100%)'
      : 'linear-gradient(180deg, rgba(6, 16, 24, 0.92) 0%, rgba(3, 10, 18, 0.9) 100%)',
    border: `1px solid ${isLight ? 'var(--accent-40)' : 'var(--accent-30)'}`,
    boxShadow: isLight
      ? 'inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -10px 24px rgba(18,40,52,0.08)'
      : `inset 0 1px 0 var(--accent-10), inset 0 -16px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--accent-20), 0 0 14px ${sidePanelHousingGlowColor}`,
    pointerEvents: 'none',
  };
  const sidePanelHousingInnerStyle = {
    position: 'absolute',
    inset: `clamp(6px, calc(${U} * 0.36), 10px)`,
    clipPath: `polygon(calc(${panelChamfer} * 0.68) 0, calc(100% - calc(${panelChamfer} * 0.68)) 0, 100% calc(${panelChamfer} * 0.68), 100% calc(100% - calc(${panelChamfer} * 0.68)), calc(100% - calc(${panelChamfer} * 0.68)) 100%, calc(${panelChamfer} * 0.68) 100%, 0 calc(100% - calc(${panelChamfer} * 0.68)), 0 calc(${panelChamfer} * 0.68))`,
    background: isLight
      ? 'linear-gradient(180deg, rgba(241, 250, 252, 0.7) 0%, rgba(214, 234, 239, 0.5) 100%)'
      : 'linear-gradient(180deg, rgba(5, 12, 20, 0.88) 0%, rgba(9, 20, 29, 0.8) 48%, rgba(4, 9, 16, 0.92) 100%)',
    border: `1px solid ${isLight ? 'var(--accent-20)' : 'var(--accent-15)'}`,
    boxShadow: isLight
      ? 'inset 0 1px 0 rgba(255,255,255,0.55)'
      : 'inset 0 0 0 1px rgba(8, 39, 46, 0.65), inset 0 12px 26px rgba(0, 0, 0, 0.28)',
    pointerEvents: 'none',
  };
  const sidePanelHousingLineStyle = {
    position: 'absolute',
    left: `calc(${U} * 0.5)`,
    right: `calc(${U} * 0.5)`,
    height: '1px',
    background: isLight
      ? `linear-gradient(90deg, transparent, var(--accent-40) 16%, var(--accent-10) 84%, transparent)`
      : `linear-gradient(90deg, transparent, var(--accent-50) 18%, var(--accent-15) 84%, transparent)`,
    opacity: 0.9,
    pointerEvents: 'none',
  };
  const sidePanelHousingCornerStyle = {
    position: 'absolute',
    width: `calc(${U} * 0.72)`,
    height: `calc(${U} * 0.72)`,
    borderColor: isLight ? 'var(--accent-60)' : 'var(--accent-70)',
    pointerEvents: 'none',
  };
  const sidePanelTextShadow = isLight ? '0 1px 2px rgba(240,248,250,0.35)' : '0 1px 6px rgba(0,0,0,0.9)';
  const sidePanelAccentTextShadow = isLight ? '0 1px 2px rgba(240,248,250,0.2)' : '0 0 10px var(--accent-20)';
  const sidePanelTileExpandedMaxHeight = `calc(${panelH} - ((${panelPad}) * 0.9) - 12px)`;
  const sidePanelTileRolledMaxHeight = `calc(${U} * 1.6)`;
  const PANEL_EXPANDED_H = panelH;
  const PANEL_COLLAPSED_H = `calc(${U} * 1.35)`;
  const sidePanelTileReportButtonStyle = {
    background: `linear-gradient(135deg, var(--accent-color), var(--accent-70))`,
    color: '#fff',
    boxShadow: '0 3px 10px var(--accent-15)',
    width: '100%',
    fontSize: '9px',
    lineHeight: 1,
    letterSpacing: '0.06em',
    border: 'none',
    cursor: 'pointer',
    padding: '3px 0',
    flexShrink: 0,
  };


  return (
    <div className="hub-root w-full flex flex-col items-center relative overflow-visible">
      <style>{`
        .hub-root .hub-report-btn {
          font-size: 8px;
          letter-spacing: 0.15em;
          padding: 2px 8px;
          opacity: 0.55;
          border-color: rgba(255,255,255,0.1);
          color: var(--text-dim);
          background: transparent;
          box-shadow: none;
          transition: opacity 0.2s;
        }
        .hub-root .hub-report-btn:hover {
          opacity: 1;
          color: var(--stage-primary);
          border-color: var(--stage-30);
          background: var(--stage-10);
        }
        .hub-root .hub-penalty-label {
          font-size: 10px;
          opacity: 0.7;
          letter-spacing: 0.1em;
          color: var(--text-dim);
        }
      `}</style>
      {/* Background is handled by Background.jsx globally */}

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR & HUB INSTRUMENT - Full-Bleed Altar (Cosmic Zone)
          ────────────────────────────────────────────────────────────────────── */}
      <HomeHubAvatarRail
        avatarZoneRef={avatarZoneRef}
        onAvatarZoneMouseMove={handleAvatarZoneMouseMove}
        onAvatarZoneMouseLeave={handleAvatarZoneMouseLeave}
        railWidth={RAIL_W}
        sessionsPanelAnchor={ANCHORS.HOME_SESSIONS_PANEL}
        avatarRingAnchor={ANCHORS.HOME_AVATAR_RING}
        stagePanelAnchor={ANCHORS.HOME_STAGE_PANEL}
        leftRolled={leftRolled}
        setLeftRolled={setLeftRolled}
        rightRolled={rightRolled}
        setRightRolled={setRightRolled}
        decayExpanded={decayExpanded}
        setDecayExpanded={setDecayExpanded}
        sidePanelFramePrimaryRowStyle={sidePanelFramePrimaryRowStyle}
        sidePanelHousingOuterStyle={sidePanelHousingOuterStyle}
        sidePanelHousingInnerStyle={sidePanelHousingInnerStyle}
        sidePanelHousingLineStyle={sidePanelHousingLineStyle}
        sidePanelHousingCornerStyle={sidePanelHousingCornerStyle}
        sidePanelTileWrapStyle={sidePanelTileWrapStyle}
        sidePanelHandleLineStyle={sidePanelHandleLineStyle}
        sidePanelTileContentBaseStyle={sidePanelTileContentBaseStyle}
        sidePanelTileRolledMaxHeight={sidePanelTileRolledMaxHeight}
        sidePanelTileExpandedMaxHeight={sidePanelTileExpandedMaxHeight}
        sidePanelLeftTileStatsColStyle={sidePanelLeftTileStatsColStyle}
        sidePanelLeftMetricCellStyle={sidePanelLeftMetricCellStyle}
        sidePanelTileValueStyle={sidePanelTileValueStyle}
        sidePanelTileLabelStyle={sidePanelTileLabelStyle}
        sidePanelTileSubLabelStyle={sidePanelTileSubLabelStyle}
        sidePanelTileReportButtonStyle={sidePanelTileReportButtonStyle}
        sidePanelTextShadow={sidePanelTextShadow}
        sidePanelAccentTextShadow={sidePanelAccentTextShadow}
        panelCollapsedHeight={PANEL_COLLAPSED_H}
        panelExpandedHeight={PANEL_EXPANDED_H}
        unitScale={U}
        isLight={isLight}
        hubTiles={hubTiles}
        avatarParallax={avatarParallax}
        normalizedStage={normalizedStage}
        modeWeights={modeWeights}
        isPracticing={isPracticing}
        lastStageChange={lastStageChange}
        lastModeChange={lastModeChange}
        lastSessionComplete={lastSessionComplete}
        avatarPath={avatarPath}
        nextStageName={nextStageName}
        daysUntilNextEffective={daysUntilNextEffective}
        stageProgressPct={stageProgressPct}
        decayInfo={decayInfo}
        onOpenReport={() => openArchive(ARCHIVE_TABS.REPORTS)}
        avatarRetreating={avatarRetreating}
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

        <HomeHubModeRail
          userMode={userMode}
          activeSection={activeSection}
          lockToHub={lockToHub}
          handleSelectSection={handleSelectSection}
          modeTileBackgroundImage={modeTileBackgroundImage}
          sanctuaryRailStyle={SANCTUARY_RAIL_STYLE}
        />

        {/* PRACTICE + PROGRESS: Curriculum Card */}
        <DailyPracticeCardHost
          dailyCardAnchor={ANCHORS.HOME_DAILY_CARD}
          handleStartPractice={handleStartPractice}
          openCurriculumHub={openCurriculumHub}
          handleSelectSection={handleSelectSection}
          hasPersistedCurriculumData={hasPersistedCurriculumData}
          curriculumOnboardingComplete={curriculumOnboardingComplete}
          practiceTimeSlots={practiceTimeSlots}
          handleOpenCurriculumSetup={handleOpenCurriculumSetup}
          isDailyCardTutorialTarget={isDailyCardTutorialTarget}
          accessPosture={accessPosture}
          setAccessPosture={setAccessPosture}
          isLight={isLight}
          sanctuaryRailStyle={SANCTUARY_RAIL_STYLE}
        />

        {/* Curriculum Hub/Report Modal - Portaled to document.body */}
        <CurriculumHubPortal
          showCurriculumHub={showCurriculumHub}
          isCurriculumComplete={isCurriculumComplete}
          frameRect={frameRect}
          isLight={isLight}
          activeProgram={activeProgram}
          closeCurriculumHub={closeCurriculumHub}
          curriculumSetupError={curriculumSetupError}
          setCurriculumSetupError={setCurriculumSetupError}
          setShowCurriculumHubState={setShowCurriculumHubState}
          setShowCurriculumOnboarding={setShowCurriculumOnboarding}
          portalTarget={document.body}
        />

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

export { HomeHub };
