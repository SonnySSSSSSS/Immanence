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

// PROBE:avatar-hmr-host:START
const HOME_HUB_HMR_HOST_PROBE_ENABLED = import.meta.env.DEV && Boolean(import.meta.hot);

function getHomeHubHmrHostProbeContext() {
  if (!HOME_HUB_HMR_HOST_PROBE_ENABLED || typeof window === 'undefined') return null;
  const probe = window.__avatarHmrHostProbe__ ?? {
    eventSeq: 0,
    appMountSeq: 0,
    sectionViewMountSeq: 0,
    homeHubMountSeq: 0,
    avatarV3MountSeq: 0,
  };
  probe.homeHubMountSeq = probe.homeHubMountSeq ?? 0;
  probe.avatarV3MountSeq = probe.avatarV3MountSeq ?? 0;
  window.__avatarHmrHostProbe__ = probe;
  return probe;
}

function logHomeHubHmrHostProbe(event, detail = {}) {
  const probe = getHomeHubHmrHostProbeContext();
  if (!probe) return;
  probe.eventSeq += 1;
  console.info('[PROBE:avatar-hmr-host]', {
    seq: probe.eventSeq,
    source: 'HomeHub',
    event,
    timestamp: new Date().toISOString(),
    detail,
  });
}

if (HOME_HUB_HMR_HOST_PROBE_ENABLED) {
  logHomeHubHmrHostProbe('module-eval', {
    hasHotData: Boolean(import.meta.hot?.data),
  });
}

// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:START
markFirstLoginAudit('homehub:module-eval', {
  source: 'HomeHub',
});
// PROBE:FIRST_LOGIN_HOMEHUB_AUDIT:END
// PROBE:avatar-hmr-host:END

const sanitizeModeTileBackgroundImage = (bgUrl) => {
  const raw = typeof bgUrl === 'string' ? bgUrl.trim() : '';
  if (!raw || raw === 'none' || raw === 'url(none)' || raw === 'url("none")' || raw === "url('none')") {
    return 'none';
  }
  return `url("${raw}")`;
};

function HomeHub({ onSelectSection, activeSection = null, currentStage, previewPath, isPracticing = false, lockToHub = false, debugShadowScan = false }) {
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

  // Honor log modal state (moved from TrackingHub)
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackingHub, setShowTrackingHub] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState({ initialTab: 'all', initialReportDomain: null });
  const trackerLaunchContext = useUiStore(s => s.trackerLaunchContext);
  const homeHubProbeIdRef = useRef(null);
  const homeHubMountAuditRef = useRef(false);
  const homeHubDashboardAuditDurationRef = useRef(null);

  useEffect(() => {
    if (homeHubProbeIdRef.current == null) {
      if (HOME_HUB_HMR_HOST_PROBE_ENABLED) {
        const probe = getHomeHubHmrHostProbeContext();
        probe.homeHubMountSeq += 1;
        homeHubProbeIdRef.current = probe.homeHubMountSeq;
      } else {
        homeHubProbeIdRef.current = 'host-probe-disabled';
      }
    }

    logHomeHubHmrHostProbe('mount', {
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
      logHomeHubHmrHostProbe('unmount', {
        probeId: homeHubProbeIdRef.current,
        activeSection,
      });
    };
  }, [activeSection, currentStage, previewPath]);

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

  logHomeHubHmrHostProbe('render-avatar-host', {
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
      <div
        className="w-full flex flex-col items-center gap-0 pb-0 transition-all duration-500 overflow-visible"
        style={{ paddingTop: '12px' }}
      >
        {/* PROBE:flank-housing:START */}
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
            data-tutorial={ANCHORS.HOME_SESSIONS_PANEL}
            role="button"
            tabIndex={0}
            aria-expanded={!leftRolled}
            aria-label={leftRolled ? 'Expand practice log panel' : 'Collapse practice log panel'}
            onClick={() => setLeftRolled((rolled) => !rolled)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLeftRolled((r) => !r); }}
            style={{
              ...sidePanelFramePrimaryRowStyle,
              height: leftRolled ? PANEL_COLLAPSED_H : PANEL_EXPANDED_H,
              transition: 'height 220ms ease',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={sidePanelHousingOuterStyle} />
            <div style={sidePanelHousingInnerStyle} />
            <div style={{ ...sidePanelHousingLineStyle, bottom: `calc(${U} * 0.82)` }} />
            <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${U} * 0.3)`, left: `calc(${U} * 0.34)`, borderTopWidth: '1px', borderLeftWidth: '1px', borderTopStyle: 'solid', borderLeftStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${U} * 0.3)`, right: `calc(${U} * 0.34)`, borderTopWidth: '1px', borderRightWidth: '1px', borderTopStyle: 'solid', borderRightStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${U} * 0.38)`, left: `calc(${U} * 0.34)`, borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomStyle: 'solid', borderLeftStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${U} * 0.38)`, right: `calc(${U} * 0.34)`, borderBottomWidth: '1px', borderRightWidth: '1px', borderBottomStyle: 'solid', borderRightStyle: 'solid' }} />
            <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1, height: '100%' }}>
              {/* Dash indicator — absolutely positioned, no layout impact */}
              <span
                aria-hidden="true"
                style={{
                  ...sidePanelHandleLineStyle,
                  position: 'absolute',
                  top: `calc(${U} * 0.45)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `clamp(24px, calc(${U} * 1.7), 36px)`,
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  ...sidePanelTileContentBaseStyle,
                  maxHeight: leftRolled ? sidePanelTileRolledMaxHeight : sidePanelTileExpandedMaxHeight,
                  opacity: leftRolled ? 0.86 : 1,
                }}
              >
                <div style={sidePanelLeftTileStatsColStyle}>
                  <div style={sidePanelLeftMetricCellStyle}>
                    <div className="type-metric" style={{ ...sidePanelTileValueStyle, color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)', textShadow: sidePanelAccentTextShadow }}>
                      {Math.round(hubTiles?.sessions_total ?? 0)}
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.82)', textShadow: sidePanelTextShadow }}>
                      Sessions
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.56)' : 'rgba(170, 230, 236, 0.54)', textShadow: sidePanelTextShadow }}>
                      14D
                    </div>
                  </div>
                  <div style={sidePanelLeftMetricCellStyle}>
                    <div className="type-metric" style={{ ...sidePanelTileValueStyle, color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)', textShadow: sidePanelAccentTextShadow }}>
                      {Math.round(hubTiles?.days_active ?? 0)}
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.82)', textShadow: sidePanelTextShadow }}>
                      Active
                    </div>
                    <div className="type-label" style={{ ...sidePanelTileSubLabelStyle, color: isLight ? 'rgba(31, 97, 108, 0.56)' : 'rgba(170, 230, 236, 0.54)', textShadow: sidePanelTextShadow }}>
                      Days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER - Bloom Halo + Avatar */}
          <div
            data-tutorial={ANCHORS.HOME_AVATAR_RING}
            className="relative flex items-center justify-center overflow-visible"
            style={{ flex: '1 1 auto', minWidth: 0 }}
          >
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
            data-tutorial={ANCHORS.HOME_STAGE_PANEL}
            role="button"
            tabIndex={0}
            aria-expanded={!rightRolled}
            aria-label={rightRolled ? 'Expand rhythm report panel' : 'Collapse rhythm report panel'}
            onClick={() => setRightRolled((rolled) => !rolled)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRightRolled((r) => !r); }}
            style={{
              ...sidePanelFramePrimaryRowStyle,
              height: rightRolled ? PANEL_COLLAPSED_H : PANEL_EXPANDED_H,
              transition: 'height 220ms ease',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={sidePanelHousingOuterStyle} />
            <div style={sidePanelHousingInnerStyle} />
            <div style={{ ...sidePanelHousingLineStyle, bottom: `calc(${U} * 0.82)` }} />
            <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${U} * 0.3)`, left: `calc(${U} * 0.34)`, borderTopWidth: '1px', borderLeftWidth: '1px', borderTopStyle: 'solid', borderLeftStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, top: `calc(${U} * 0.3)`, right: `calc(${U} * 0.34)`, borderTopWidth: '1px', borderRightWidth: '1px', borderTopStyle: 'solid', borderRightStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${U} * 0.38)`, left: `calc(${U} * 0.34)`, borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomStyle: 'solid', borderLeftStyle: 'solid' }} />
            <div style={{ ...sidePanelHousingCornerStyle, bottom: `calc(${U} * 0.38)`, right: `calc(${U} * 0.34)`, borderBottomWidth: '1px', borderRightWidth: '1px', borderBottomStyle: 'solid', borderRightStyle: 'solid' }} />
            <div style={{ ...sidePanelTileWrapStyle, position: 'relative', zIndex: 1, height: '100%' }}>
              {/* Dash indicator — absolutely positioned, no layout impact */}
              <span
                aria-hidden="true"
                style={{
                  ...sidePanelHandleLineStyle,
                  position: 'absolute',
                  top: `calc(${U} * 0.45)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `clamp(24px, calc(${U} * 1.7), 36px)`,
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
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
                  fontSize: '9px',
                  whiteSpace: 'nowrap',
                  color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.84)',
                  textShadow: sidePanelTextShadow,
                  textAlign: 'center',
                  letterSpacing: '0.10em',
                }}>
                  {nextStageName}
                </div>

                {/* Days remaining — large number */}
                <div style={{ textAlign: 'center', lineHeight: 1 }}>
                  <span className="type-metric" style={{
                    ...sidePanelTileValueStyle,
                    fontSize: '26px',
                    fontWeight: 700,
                    color: isLight ? 'rgba(18, 68, 78, 0.96)' : 'rgba(233, 252, 255, 0.96)',
                    textShadow: sidePanelAccentTextShadow,
                  }}>
                    {daysUntilNextEffective}
                  </span>
                </div>

                {/* "days remaining" label */}
                <div className="type-label" style={{
                  ...sidePanelTileLabelStyle,
                  fontSize: '9px',
                  textAlign: 'center',
                  color: isLight ? 'rgba(31, 97, 108, 0.82)' : 'rgba(170, 230, 236, 0.84)',
                  textShadow: sidePanelTextShadow,
                }}>
                  days remaining
                </div>

                {/* Progress bar within stage */}
                <div style={{ width: '100%', padding: '0 2px', boxSizing: 'border-box' }}>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    borderRadius: '2px',
                    background: isLight ? 'var(--accent-15)' : 'var(--accent-10)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${stageProgressPct}%`,
                      borderRadius: '2px',
                      background: isLight
                        ? `linear-gradient(90deg, var(--accent-70), var(--accent-40))`
                        : `linear-gradient(90deg, var(--accent-80), var(--accent-50))`,
                      boxShadow: isLight ? '0 0 4px var(--accent-20)' : '0 0 6px var(--accent-30)',
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                </div>

                {/* Decay rate — tap to expand details */}
                <div
                  className="hub-penalty-label type-label"
                  onClick={() => setDecayExpanded(v => !v)}
                  style={{
                    textAlign: 'center',
                    fontSize: '9px',
                    lineHeight: 1,
                    letterSpacing: '0.06em',
                    color: decayInfo.isRecovering
                      ? 'rgba(76,175,80,0.85)'
                      : (isLight ? 'rgba(31, 97, 108, 0.65)' : 'rgba(170, 230, 236, 0.58)'),
                    cursor: 'pointer',
                    textShadow: sidePanelTextShadow,
                  }}
                >
                  {decayInfo.isRecovering
                    ? `+${decayInfo.recoveryRate}/day recovery`
                    : `−${decayInfo.decayPerMissedDay.toFixed(2)}/miss`}
                </div>

                {decayExpanded && (
                  <div style={{
                    fontSize: '9px',
                    color: isLight ? 'rgba(31,97,108,0.7)' : 'rgba(170,230,236,0.65)',
                    lineHeight: 1.45,
                    textAlign: 'center',
                    paddingTop: '4px',
                  }}>
                    <div>−{decayInfo.decayPerMissedDay.toFixed(2)} per missed day</div>
                    <div>Accumulated: {decayInfo.decayAccumulated}d</div>
                    <div>
                      {decayInfo.isRecovering
                        ? `Recovering −${decayInfo.recoveryRate}/day · ${decayInfo.consecutiveDays}d streak`
                        : `${decayInfo.consecutiveDays}/7 days to recovery bonus`}
                    </div>
                  </div>
                )}

                {/* Report button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openArchive(ARCHIVE_TABS.REPORTS); }}
                  className="hub-report-btn type-label rounded-full font-bold transition-all hover:scale-105"
                  style={{
                    ...sidePanelTileReportButtonStyle,
                    background: isLight
                      ? 'linear-gradient(135deg, rgba(54, 175, 190, 0.72), rgba(124, 227, 235, 0.52))'
                      : 'linear-gradient(135deg, rgba(41, 182, 198, 0.62), rgba(96, 238, 247, 0.34))',
                    boxShadow: isLight
                      ? '0 3px 10px rgba(44, 172, 189, 0.14)'
                      : '0 0 10px rgba(72, 208, 220, 0.2)',
                  }}
                >
                  REPORT
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* PROBE:flank-housing:END */}

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
        <style>{`
          .im-nav-pill {
            background-image: ${modeTileBackgroundImage} !important;
          }
        `}</style>
        {userMode !== 'student' ? (
          <div
            className="w-full transition-all duration-700"
            style={{
              ...SANCTUARY_RAIL_STYLE,
              maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
              margin: '0 auto',
            }}
          >
            <div
              className="flex flex-row items-center w-full"
              style={{ justifyContent: 'space-between', gap: '0' }}
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
                data-tutorial="home-curriculum-card"
                data-nav-pill-id="home:navigation"
                data-ui-target="true"
                data-ui-scope="role"
                data-ui-role-group="homeHub"
                data-ui-id="homeHub:mode:navigation"
              />
            </div>
          </div>
        ) : (
          <div
            className="w-full transition-all duration-700"
            style={{
              ...SANCTUARY_RAIL_STYLE,
              maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
              margin: '0 auto',
            }}
          >
            <div
              className="flex flex-row items-center w-full"
              style={{ justifyContent: 'center', gap: '48px' }}
            >
              <SimpleModeButton
                title="Practice"
                onClick={() => handleSelectSection("practice", { forceStudentNavigation: true })}
                disabled={lockToHub}
                icon="practice"
                isActive={activeSection === 'practice'}
                className="im-nav-pill"
                data-nav-pill-id="home:practice"
              />
              <SimpleModeButton
                title="Navigation"
                onClick={() => handleSelectSection("navigation", { forceStudentNavigation: true })}
                disabled={lockToHub}
                icon="navigation"
                isActive={activeSection === 'navigation'}
                className="im-nav-pill"
                data-tutorial="home-curriculum-card"
                data-nav-pill-id="home:navigation"
              />
            </div>
          </div>
        )}

        {/* PRACTICE + PROGRESS: Curriculum Card */}
        <div className="w-full pt-2" style={{
          ...SANCTUARY_RAIL_STYLE,
          borderTop: `1px solid ${isLight ? 'rgba(100, 80, 60, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
        }}>
          <div className="w-full" style={{ position: 'relative' }}>
            <div data-tutorial={ANCHORS.HOME_DAILY_CARD}>
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
          {/* Guided / Full Access pill toggle — docked to card bottom-right */}
          <button
            type="button"
            role="switch"
            aria-checked={accessPosture === 'full'}
            data-testid="posture-pill-toggle"
            onClick={() => setAccessPosture(accessPosture === 'guided' ? 'full' : 'guided')}
            className="inline-flex items-center rounded-full border select-none"
            style={{
              position: 'absolute',
              bottom: '-22px',
              right: '28px',
              zIndex: 10,
              height: '22px',
              padding: '2px',
              gap: 0,
              borderColor: isLight ? 'var(--accent-30)' : 'var(--accent-30)',
              background: isLight ? 'rgba(236,246,248,0.72)' : 'rgba(7,14,20,0.78)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'border-color 200ms',
            }}
          >
            {/* Sliding indicator */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                borderRadius: '999px',
                width: '50%',
                left: accessPosture === 'guided' ? '2px' : 'calc(50% - 2px)',
                transition: 'left 200ms cubic-bezier(0.4,0,0.2,1)',
                background: isLight ? 'var(--accent-40)' : 'var(--accent-50)',
                boxShadow: '0 1px 4px var(--accent-20)',
              }}
            />
            {/* GUIDED label */}
            <span
              className="relative z-10 font-black uppercase tracking-[0.14em]"
              style={{
                fontSize: '9px',
                padding: '0 8px',
                color: accessPosture === 'guided'
                  ? (isLight ? 'var(--accent-color)' : 'var(--accent-90)')
                  : (isLight ? 'rgba(80,80,80,0.45)' : 'rgba(200,200,200,0.38)'),
                transition: 'color 200ms',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              GUIDED
            </span>
            {/* FULL label */}
            <span
              className="relative z-10 font-black uppercase tracking-[0.14em]"
              style={{
                fontSize: '9px',
                padding: '0 8px',
                color: accessPosture === 'full'
                  ? (isLight ? 'var(--accent-color)' : 'var(--accent-90)')
                  : (isLight ? 'rgba(80,80,80,0.45)' : 'rgba(200,200,200,0.38)'),
                transition: 'color 200ms',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              FULL
            </span>
          </button>
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
