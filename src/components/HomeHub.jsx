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
import { SideNavigation } from "./SideNavigation.jsx";
import { noiseOverlayStyle, sheenOverlayStyle } from "../styles/cardMaterial.js";
import { useProgressStore } from "../state/progressStore.js";
import { useLunarStore } from "../state/lunarStore.js";
import { STAGES } from "../state/stageConfig.js";
import { useDisplayModeStore } from "../state/displayModeStore.js";
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
const SANCTUARY_MODULE_MAX_WIDTH = '740px';

// Unified Sanctuary rail style - ensures all three sections share identical left/right edges
const SANCTUARY_RAIL_STYLE = {
  width: '100%',
  maxWidth: '740px',
  marginLeft: 'auto',
  marginRight: 'auto',
  position: 'relative',
};


function HomeHub({ onSelectSection, activeSection = null, currentStage, previewPath, previewShowCore, previewAttention, onOpenHardwareGuide, isPracticing = false, lockToHub = false, debugDisableDailyCard = false, debugBuildProbe = false, debugShadowScan = false, debugDailyCardShadowOff = false, debugDailyCardBlurOff = false, debugDailyCardBorderOff = false, debugDailyCardMaskOff = false }) {
  // Real data from stores
  const { getStreakInfo, getDomainStats, getWeeklyPattern } = useProgressStore();
  const { getCurrentStage, getDaysUntilNextStage } = useLunarStore();
  const { stage: avatarStage, modeWeights, lastStageChange, lastModeChange, lastSessionComplete } = useAvatarV3State();
  const colorScheme = useDisplayModeStore(s => s.colorScheme);
  const displayMode = useDisplayModeStore(s => s.viewportMode);
  const isLight = colorScheme === 'light';
  const isSanctuary = displayMode === 'sanctuary';

  // Debug flags are sourced from App.jsx (URL + localStorage) and passed as props so they work in embedded shells.
  const disableDailyCard = Boolean(debugDisableDailyCard);
  const showBuildProbe = Boolean(debugBuildProbe);
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

    const onResize = () => update("resize");
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  // Honor log modal state (moved from TrackingHub)
  const [showHonorModal, setShowHonorModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState({ initialTab: 'all', initialReportDomain: null });

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

  const activeLauncher = launcherContext
    ? getProgramLauncher(launcherContext.programId || activeCurriculumId, launcherContext.leg?.launcherId)
    : null;

  // Compute dashboard policy for tiles
  const hubPolicy = getHomeDashboardPolicy({
    activeRunId: activePath?.runId,
  });

  return (
    <div className="w-full flex flex-col items-center relative overflow-visible">
      {/* Background is handled by Background.jsx globally */}

      {/* ──────────────────────────────────────────────────────────────────────
          AVATAR & HUB INSTRUMENT - Full-Bleed Altar (Cosmic Zone)
          ────────────────────────────────────────────────────────────────────── */}
      <div
        className="w-full flex flex-col items-center gap-0 pb-0 transition-all duration-500 overflow-visible"
        style={{ paddingTop: isSanctuary ? '16px' : '12px' }}
      >
        <div className="relative w-full flex items-center justify-center overflow-visible">
          {/* Cloud Background - NO LONGER HERE, moved to full-page layer */}

          {/* Bloom halo - EXPANDED in Sanctuary mode to fill space */}
          <div
            className="absolute transition-all duration-500"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isSanctuary ? 'min(105%, 750px)' : 'min(90%, 525px)',
              height: isSanctuary ? 'min(105%, 600px)' : 'min(90%, 525px)',
              background: 'radial-gradient(circle, ' +
                'var(--accent-glow) 0%, ' +
                'var(--accent-glow)40 12%, ' +
                'var(--accent-glow)18 35%, ' +
                'var(--accent-glow)05 55%, ' +
                'transparent 75%)',
              filter: isSanctuary ? 'blur(90px)' : 'blur(75px)',
              opacity: isLight
                ? (isSanctuary ? 0.08 : 0.06)
                : (isSanctuary ? 0.25 : 0.20),
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
              size={isSanctuary ? 'sanctuary' : 'hearth'}
            />
          </div>

        </div>

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
        <div
          className="w-full transition-all duration-700"
          style={isSanctuary ? SANCTUARY_RAIL_STYLE : {
            maxWidth: 'min(430px, 94vw)',
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
        </div>

        {/* PRACTICE + PROGRESS: Swipe Rail (1 card per page) */}
        <div className="w-full" style={isSanctuary ? SANCTUARY_RAIL_STYLE : {}}>
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
                      ...(isSanctuary ? {} : {
                        maxWidth: '430px',
                        margin: '0 auto',
                      }),
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

                <section
                  className="shrink-0 basis-full w-full"
                  style={{ minWidth: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                >
                <div ref={homeSwipeProgressRef} className="w-full">
                {(() => {
                  // Fetch hub variant tiles with 90d range
                  const hubTiles = getQuickDashboardTiles({
                    scope: hubPolicy.scope,
                    range: '90d',
                    includeHonor: hubPolicy.includeHonor,
                    activeRunId: hubPolicy.activeRunId,
                  });

                  return (
                    <QuickDashboardTiles
                      variant="hubCard"
                      tiles={hubTiles}
                      onOpenDetails={() => openArchive(ARCHIVE_TABS.REPORTS)}
                      isSanctuary={isSanctuary}
                      devCardActive={homeSwipePage === 1}
                      devCardCarouselId="homeHubSwipe"
                    />
                  );
                })()}
                </div>
                </section>
              </div>
            </div>

          {/* Page indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                type="button"
                aria-label={idx === 0 ? "Show Today's Practice" : 'Show Progress Overview'}
                onClick={() => scrollHomeSwipeTo(idx)}
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  background:
                    homeSwipePage === idx
                      ? 'linear-gradient(135deg, rgba(156, 236, 172, 0.95) 0%, rgba(87, 218, 204, 0.92) 100%)'
                      : 'rgba(255, 255, 255, 0.18)',
                  boxShadow: homeSwipePage === idx
                    ? '0 0 14px rgba(87, 218, 204, 0.34), 0 0 6px rgba(156, 236, 172, 0.30)'
                    : 'none',
                  border: homeSwipePage === idx
                    ? '1px solid rgba(122, 232, 188, 0.7)'
                    : '1px solid rgba(255,255,255,0.10)',
                  transform: homeSwipePage === idx ? 'scale(1.05)' : 'scale(1.0)',
                }}
              />
            ))}
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
