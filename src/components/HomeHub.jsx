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
  const [avatarParallax, setAvatarParallax] = useState({ x: 0, y: 0 });
  const avatarZoneRef = useRef(null);
  const avatarParallaxRef = useRef({ x: 0, y: 0 });
  const pointerInsideZoneRef = useRef(false);
  function handleAvatarZoneMouseMove(e) {
    const zone = avatarZoneRef.current;
    if (!zone) return;
    pointerInsideZoneRef.current = true;
    const rect = zone.getBoundingClientRect();
    const MAX = 6;
    const next = {
      x: ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * MAX,
      y: ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * MAX,
    };
    avatarParallaxRef.current = next;
    setAvatarParallax(next);
  }
  function handleAvatarZoneMouseLeave() {
    pointerInsideZoneRef.current = false;
    avatarParallaxRef.current = { x: 0, y: 0 };
    setAvatarParallax({ x: 0, y: 0 });
    console.log('[PARALLAX-PROBE] mouseleave → reset to {0,0}');
  }
  // ── PROBE: drift diagnosis (position + parallax + layout) ──
  const driftBaselineRef = useRef(null);
  useEffect(() => {
    const getAvatarRect = () => {
      const el = document.querySelector('[data-tutorial="home-avatar-ring"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, w: r.width, h: r.height };
    };
    const fmt = (r) => r ? `top=${r.top.toFixed(1)} left=${r.left.toFixed(1)} ${r.w.toFixed(0)}×${r.h.toFixed(0)}` : 'null';
    const delta = (cur) => {
      if (!cur || !driftBaselineRef.current) return '';
      const b = driftBaselineRef.current;
      const dt = cur.top - b.top, dl = cur.left - b.left;
      if (Math.abs(dt) < 0.5 && Math.abs(dl) < 0.5) return ' Δ=none';
      return ` Δtop=${dt.toFixed(1)} Δleft=${dl.toFixed(1)}`;
    };
    // Capture baseline after first stable render
    requestAnimationFrame(() => {
      driftBaselineRef.current = getAvatarRect();
      console.log(`[DRIFT-PROBE] baseline: ${fmt(driftBaselineRef.current)}`);
    });
    const onVisChange = () => {
      const hidden = document.hidden;
      const p = avatarParallaxRef.current;
      const inside = pointerInsideZoneRef.current;
      const rect = getAvatarRect();
      console.log(`[DRIFT-PROBE] visibilitychange hidden=${hidden} | rect: ${fmt(rect)}${delta(rect)} | parallax={${p.x.toFixed(2)}, ${p.y.toFixed(2)}} inside=${inside}`);
      // On return, schedule a delayed check to catch post-render drift
      if (!hidden) {
        setTimeout(() => {
          const rect2 = getAvatarRect();
          const p2 = avatarParallaxRef.current;
          console.log(`[DRIFT-PROBE] +200ms settle | rect: ${fmt(rect2)}${delta(rect2)} | parallax={${p2.x.toFixed(2)}, ${p2.y.toFixed(2)}}`);
        }, 200);
        setTimeout(() => {
          const rect3 = getAvatarRect();
          const p3 = avatarParallaxRef.current;
          console.log(`[DRIFT-PROBE] +600ms settle | rect: ${fmt(rect3)}${delta(rect3)} | parallax={${p3.x.toFixed(2)}, ${p3.y.toFixed(2)}}`);
        }, 600);
      }
    };
    const onBlur = () => {
      const rect = getAvatarRect();
      const p = avatarParallaxRef.current;
      console.log(`[DRIFT-PROBE] blur | rect: ${fmt(rect)}${delta(rect)} | parallax={${p.x.toFixed(2)}, ${p.y.toFixed(2)}}`);
    };
    const onFocus = () => {
      const rect = getAvatarRect();
      const p = avatarParallaxRef.current;
      console.log(`[DRIFT-PROBE] focus | rect: ${fmt(rect)}${delta(rect)} | parallax={${p.x.toFixed(2)}, ${p.y.toFixed(2)}}`);
    };
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
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
      />

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
