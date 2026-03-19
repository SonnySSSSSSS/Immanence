/* global __DEPLOY_GIT_SHA__, __DEPLOY_BUILD_TIME__ */
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
// Test CI lane enforcement - trivial comment
import { StageTitle } from "./components/StageTitle.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { HomeHub } from "./components/HomeHub.jsx";

// Lazy load heavy sections for better initial performance
// Named exports need to be wrapped for React.lazy
const WisdomSection = lazy(() => import("./components/WisdomSection.jsx").then(m => ({ default: m.WisdomSection })));
const ApplicationSection = lazy(() => import("./components/ApplicationSection.jsx").then(m => ({ default: m.ApplicationSection })));
import { NavigationSection } from "./components/NavigationSection.jsx";
import { NavigationRitualLibrary } from "./components/NavigationRitualLibrary.jsx";
import { Background } from "./components/Background.jsx";
import { CurriculumCompletionReport } from "./components/CurriculumCompletionReport.jsx";
const DevPanel = lazy(() => import("./components/DevPanel.jsx").then(m => ({ default: m.DevPanel })));
const PracticeButtonElectricBorderOverlay = lazy(() => import("./components/dev/PracticeButtonElectricBorderOverlay.jsx").then(m => ({ default: m.PracticeButtonElectricBorderOverlay })));
const SelectedCardElectricBorderOverlay = lazy(() => import("./components/dev/SelectedCardElectricBorderOverlay.jsx").then(m => ({ default: m.SelectedCardElectricBorderOverlay })));
const SelectedControlElectricBorderOverlay = lazy(() => import("./components/dev/SelectedControlElectricBorderOverlay.jsx").then(m => ({ default: m.SelectedControlElectricBorderOverlay })));
const SelectedPlateOverlay = lazy(() => import("./components/dev/SelectedPlateOverlay.jsx").then(m => ({ default: m.SelectedPlateOverlay })));
import { DisplayModeToggle } from "./components/DisplayModeToggle.jsx";
import { useDisplayModeStore } from "./state/displayModeStore.js";
import { useUserModeStore } from "./state/userModeStore.js";
import { useUiStore } from "./state/uiStore.js";
import { useCurriculumStore } from "./state/curriculumStore.js";
import { useNavigationStore } from "./state/navigationStore.js";
import { useProgressStore } from "./state/progressStore.js";
import { useLunarStore } from "./state/lunarStore.js";
import { useApplicationStore } from "./state/applicationStore.js";
import { useWisdomStore } from "./state/wisdomStore.js";
import { useVideoStore } from "./state/videoStore.js";
import { useModeTrainingStore } from "./state/modeTrainingStore.js";
import { useChainStore } from "./state/chainStore.js";
import { useCircuitJournalStore } from "./state/circuitJournalStore.js";
import { useTempoAudioStore } from "./state/tempoAudioStore.js";
import { useDevOverrideStore } from "./dev/devOverrideStore.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { startImagePreloading } from "./utils/imagePreloader.js";
import { InstallPrompt } from "./components/InstallPrompt.jsx";
import { HardwareGuide } from "./components/HardwareGuide.jsx";
import { useWakeLock } from "./hooks/useWakeLock.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { PhoticCirclesOverlay } from "./components/PhoticCirclesOverlay.jsx";
import { SettingsPanel } from "./components/SettingsPanel.jsx";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay.jsx";
import { ShadowScanOverlay } from "./components/debug/ShadowScanOverlay.jsx";
import { getDebugFlagValue, parseDebugBool, toggleDebugFlag as toggleDebugFlagLs } from "./components/debug/debugFlags.js";
import { useTutorialStore } from "./state/tutorialStore.js";
import { TUTORIALS } from "./tutorials/tutorialRegistry.js";
import { hasDevtoolsQueryFlag, isDevtoolsUnlocked, setDevtoolsUnlocked } from "./dev/uiDevtoolsGate.js";
import { getDevPanelProdGate } from "./lib/devPanelGate.js";
// import { VerificationGallery } from "./components/avatar/VerificationGallery.jsx"; // Dev tool - not used
import "./App.css";
import AuthGate from "./components/auth/AuthGate";

const DISABLE_SELECTION = false;
const USER_STATE_SYNC_DEBUG = false;

function SectionView({ section, isPracticing, onPracticingChange, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, showFxGallery, onNavigate, onOpenHardwareGuide, onOpenPhotic, hideCards, isActiveBreathSession = false, isBreathLayoutLocked = false }) {
  // NOTE: Previously had a special vipassana branch that rendered PracticeSection without wrapper divs.
  // This caused unmount/remount when transitioning to vipassana practices because the tree structure changed.
  // REMOVED: The vipassana InsightMeditationPortal uses createPortal to render to document.body,
  // so wrapper divs don't affect its fullscreen rendering. Keeping consistent tree structure prevents
  // the unmount/remount bug that was resetting sessions.
  
  return (
    <div className="w-full flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      <div
        className={`w-full relative z-10 ${section === "practice" && isBreathLayoutLocked ? 'px-0 transition-none' : 'px-4 transition-all duration-500'}`}
        style={{ overflow: section === "practice" && isBreathLayoutLocked ? 'hidden' : 'visible' }}
      >
        {section === "practice" && !hideCards && (
          <PracticeSection 
            onPracticingChange={onPracticingChange} 
            onBreathStateChange={onBreathStateChange}
            avatarPath={previewPath} 
            showCore={previewShowCore}
            showFxGallery={showFxGallery} 
            isActiveBreathSession={isActiveBreathSession}
            onNavigate={onNavigate} 
            onOpenPhotic={onOpenPhotic}
          />
        )}

        {section === "wisdom" && !hideCards && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="type-label normal-case text-white/50">Loading Wisdom...</div>
            </div>
          }>
            <WisdomSection />
          </Suspense>
        )}

        {section === "application" && !hideCards && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="type-label normal-case text-white/50">Loading Application...</div>
            </div>
          }>
            <ApplicationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} />
          </Suspense>
        )}

        {section === "navigation" && !hideCards && <NavigationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} onOpenHardwareGuide={onOpenHardwareGuide} isPracticing={isPracticing} />}
      </div>
    </div>
  );
}


function App({ playgroundMode = false, playgroundBottomLayer = true }) {
  // Color scheme (dark/light)
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const overrideStage = useDevOverrideStore((s) => s.stage);
  const overridePath = useDevOverrideStore((s) => s.avatarPath);
  const setOverrideStage = useDevOverrideStore((s) => s.setStage);
  const setOverridePath = useDevOverrideStore((s) => s.setAvatarPath);
  const userMode = useUserModeStore((s) => s.userMode);
  const hasChosenUserMode = useUserModeStore((s) => s.hasChosenUserMode);
  const modeByUserId = useUserModeStore((s) => s.modeByUserId);
  const setUserMode = useUserModeStore((s) => s.setUserMode);
  const setActiveUserModeUserId = useUserModeStore((s) => s.setActiveUserId);
  const navigationActivePath = useNavigationStore((s) => s.activePath);
  const navigationOwnerUserId = useNavigationStore((s) => s.ownerUserId);
  const setNavigationActiveUserId = useNavigationStore((s) => s.setActiveUserId);
  const resetNavigationForIdentityBoundary = useNavigationStore((s) => s.resetForIdentityBoundary);
  const curriculumOwnerUserId = useCurriculumStore((s) => s.ownerUserId);
  const setCurriculumActiveUserId = useCurriculumStore((s) => s.setActiveUserId);
  const resetCurriculumForIdentityBoundary = useCurriculumStore((s) => s.resetForIdentityBoundary);
  const setProgressActiveUserId = useProgressStore((s) => s.setActiveUserId);
  const setLunarActiveUserId = useLunarStore((s) => s.setActiveUserId);
  const setApplicationActiveUserId = useApplicationStore((s) => s.setActiveUserId);
  const setWisdomActiveUserId = useWisdomStore((s) => s.setActiveUserId);
  const setVideoActiveUserId = useVideoStore((s) => s.setActiveUserId);
  const setModeTrainingActiveUserId = useModeTrainingStore((s) => s.setActiveUserId);
  const setChainActiveUserId = useChainStore((s) => s.setActiveUserId);
  const setCircuitJournalActiveUserId = useCircuitJournalStore((s) => s.setActiveUserId);
  const resetUiLaunchContext = useUiStore((s) => s.resetLaunchContext);
  const practiceLaunchContext = useUiStore((s) => s.practiceLaunchContext);
  const onboardingComplete = useCurriculumStore((s) => s.onboardingComplete);
  const practiceTimeSlots = useCurriculumStore((s) => s.practiceTimeSlots);
  const isLight = colorScheme === 'light';

  const outerBackground = isLight
    ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
    : '#000';
  const APP_FRAME_WIDTH = 'min(100vw, calc(100dvh * 1080 / 1920))';
  const entryHeroSrc = `${import.meta.env.BASE_URL}open meditation.webp`;
  // Single, authoritative content rail width. Individual cards can be narrower, but sections
  // should not invent their own viewport widths.
  const UI_RAIL_MAX_WIDTH = 'min(430px, 94vw)';

  // Expose layout vars globally so portals rendered into document.body can still align to the
  // same frame/rail as the rest of the app.
  useEffect(() => {
    const root = document?.documentElement;
    if (!root) return;
    root.style.setProperty('--app-frame-width', APP_FRAME_WIDTH);
    root.style.setProperty('--ui-rail-max', UI_RAIL_MAX_WIDTH);
  }, [APP_FRAME_WIDTH, UI_RAIL_MAX_WIDTH]);

  // Disable browser scroll restoration (fixes Edge loading Home scrolled down)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Curriculum completion report (manually triggered only, never auto-shown)
  const [showCurriculumReport, setShowCurriculumReport] = useState(false);

  // Load default view preference (defaulting to hub)
  const getDefaultView = () => {
    try {
      const stored = localStorage.getItem('immanenceOS.defaultView');
      return stored || 'hub'; // 'hub' or 'navigation'
    } catch {
      return 'hub';
    }
  };

  const [defaultView] = useState(getDefaultView());
  const [activeSection, setActiveSection] = useState(() => {
    if (playgroundMode) return null;
    // If default view is 'navigation', start there
    return defaultView === 'navigation' ? 'navigation' : null;
  });
  const [isPracticing, setIsPracticing] = useState(false);
  const [breathState, setBreathState] = useState({ phase: 'rest', progress: 0, isPracticing: false });
  const [avatarStage, setAvatarStage] = useState("Seedling"); // Track avatar stage name for theme
  const showFxGallery = true; // FX Gallery dev mode
  const isDev = import.meta.env.DEV;
  const devPanelGateEnabled = getDevPanelProdGate();
  const [showDevPanel, setShowDevPanel] = useState(() => (isDev ? false : devPanelGateEnabled)); // Dev Panel (🎨 button)
  const [, setDevtoolsGateTick] = useState(0);
  const [showSettings, setShowSettings] = useState(false); // Settings panel
  const [studentNavigationOverride, setStudentNavigationOverride] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const authUserId = authUser?.id ?? null;
  const navigationStateOwnedByCurrentUser = Boolean(authUserId && navigationOwnerUserId === authUserId);
  const curriculumStateOwnedByCurrentUser = Boolean(authUserId && curriculumOwnerUserId === authUserId);
  const ownedActivePath = navigationStateOwnedByCurrentUser ? navigationActivePath : null;
  const ownedPracticeTimeSlots = curriculumStateOwnedByCurrentUser ? practiceTimeSlots : [];
  const ownedOnboardingComplete = curriculumStateOwnedByCurrentUser ? onboardingComplete : false;
  const needsSetup = !ownedActivePath && !ownedOnboardingComplete && ownedPracticeTimeSlots.length === 0;
  const [hideCards, setHideCards] = useState(false); // Dev mode: hide cards to view wallpaper
  // GRAVEYARD: Top layer removed
  // const [showBackgroundTopLayer, setShowBackgroundTopLayer] = useState(true);
  const [showBackgroundBottomLayer, setShowBackgroundBottomLayer] = useState(true); // Dev: toggle bottom wallpaper layer
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isPhoticOpen, setIsPhoticOpen] = useState(false);
  const [isMinimized] = useState(false);
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
  const selectionEnabled = !DISABLE_SELECTION;
  const devtoolsTapRef = useRef({ count: 0, firstTs: 0 });

  useEffect(() => {
    if (!isDev && !devPanelGateEnabled) return undefined;
    const onKeyDown = (event) => {
      const key = String(event.key || '').toLowerCase();
      if (event.ctrlKey && event.shiftKey && key === 'd') {
        event.preventDefault();
        setShowDevPanel((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [devPanelGateEnabled, isDev]);

  useEffect(() => {
    const currentIsHub = activeSection === null;
    const decision = !hasChosenUserMode ? 'chooser' : ((currentIsHub || playgroundMode) ? 'hub' : 'section');
    const snapshot = {
      authUserId: authUser?.id ?? null,
      authUserEmail: authUser?.email ?? null,
      appAuthLoadingFlag: 'none-in-App',
      hasChosenUserMode,
      userMode,
      decision,
      activeSection,
      isHub: currentIsHub,
      playgroundMode,
      timestamp: new Date().toISOString(),
    };
    console.log('[PROBE:user-mode-resolve]', snapshot);
    if (typeof window !== 'undefined') {
      window.__IMMANENCE_USER_MODE_RESOLVE_PROBE__ = snapshot;
    }
  }, [activeSection, authUser?.email, authUser?.id, hasChosenUserMode, playgroundMode, userMode]);

  const handleClosePhotic = useCallback(() => {
    setIsPhoticOpen(false);

    // Best-effort cleanup for browsers that support it.
    try {
      if (screen?.orientation?.unlock) screen.orientation.unlock();
    } catch {
      // Ignore unlock failures.
    }

    try {
      if (document?.fullscreenElement && document?.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit failures.
    }
  }, []);

  const handleOpenPhotic = useCallback(async () => {
    // Best-effort: request fullscreen (improves chance of orientation lock working).
    try {
      if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Ignore fullscreen failures (unsupported browser, permissions, etc.).
    }

    // Best-effort: lock orientation to landscape (not supported on iOS Safari).
    try {
      if (screen?.orientation?.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch {
      // Ignore lock failures (unsupported browser, not fullscreen, permissions).
    }

    // Even if lock fails (or OS orientation is fixed), the photic overlay itself renders in a
    // landscape coordinate system (rotated in portrait viewports).
    setIsPhoticOpen(true);
  }, []);

  // Debug flags for visual investigations (dev-only; ignored in prod builds).
  const getDevFlag = useCallback((key) => {
    if (!isDev) return null;
    return getDebugFlagValue(key, { allowUrl: true });
  }, [isDev]);

  const debugDisableDailyCard = isDev && parseDebugBool(getDevFlag('disableDailyCard'));
  const [debugBuildProbe, setDebugBuildProbe] = useState(false);
  const [debugShadowScan, setDebugShadowScan] = useState(false);
  const debugDailyCardShadowOff = isDev && parseDebugBool(getDevFlag('dailyCardShadowOff'));
  const debugDailyCardBlurOff = isDev && parseDebugBool(getDevFlag('dailyCardBlurOff'));
  const debugDailyCardBorderOff = isDev && parseDebugBool(getDevFlag('dailyCardBorderOff'));
  const debugDailyCardMaskOff = isDev && parseDebugBool(getDevFlag('dailyCardMaskOff'));

  const toggleDebugFlag = useCallback((key) => {
    if (!isDev) return;
    toggleDebugFlagLs(key);
  }, [isDev]);

  const toggleShadowScan = useCallback(() => {
    if (!isDev) return;
    // Session-only: starts disabled on each page load by default.
    setDebugShadowScan(v => !v);
  }, [isDev]);

  const toggleBuildProbe = useCallback(() => {
    if (!isDev) return;
    // Session-only: starts disabled on each page load by default.
    setDebugBuildProbe(v => !v);
  }, [isDev]);

  useEffect(() => {
    if (!isDev) return undefined;

    const onProbeEvent = (e) => {
      const enabled = e?.detail?.enabled;
      if (typeof enabled === 'boolean') setDebugBuildProbe(enabled);
      else setDebugBuildProbe(v => !v);
    };

    window.addEventListener('debug:buildProbe', onProbeEvent);
    return () => window.removeEventListener('debug:buildProbe', onProbeEvent);
  }, [isDev]);
  const effectiveShowBackgroundBottomLayer = playgroundMode
    ? Boolean(playgroundBottomLayer)
    : showBackgroundBottomLayer;

  // Screen Wake Lock when in Vigilance Mode
  useWakeLock(isMinimized);

  // Scroll to top when Home is shown (initial load or navigation back to Home)
  const isHub = activeSection === null;
  useEffect(() => {
    if (isHub) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [isHub]);

  useEffect(() => {
    if (activeSection === 'practice') return;

    const audioStore = useTempoAudioStore.getState();
    audioStore.stopReset();
    if (audioStore.source) {
      audioStore.setSource(null);
    }
  }, [activeSection]);

  useEffect(() => {
    return () => {
      const audioStore = useTempoAudioStore.getState();
      audioStore.stopReset();
      if (audioStore.source) {
        audioStore.setSource(null);
      }
    };
  }, []);

  // Listen for dev panel events (hide cards for wallpaper viewing)
  useEffect(() => {
    const handleHideCards = (e) => {
      console.log('App: hideCards event received, detail:', e.detail);
      setHideCards(e.detail);
    };
    // GRAVEYARD: Top layer removed
    // const handleTopLayer = (e) => {
    //   console.log('App: background-top event received, detail:', e.detail);
    //   setShowBackgroundTopLayer(e.detail);
    // };
    const handleBottomLayer = (e) => {
      console.log('App: background-bottom event received, detail:', e.detail);
      setShowBackgroundBottomLayer(e.detail);
    };
    const handleAvatarStage = (e) => {
      if (playgroundMode) return;
      console.log('App: dev-avatar-stage event received, detail:', e.detail);
      const stageName = e.detail.stage;
      setAvatarStage(stageName);
    };
    window.addEventListener('dev-hide-cards', handleHideCards);
    // window.addEventListener('dev-background-top', handleTopLayer);
    window.addEventListener('dev-background-bottom', handleBottomLayer);
    if (!playgroundMode) {
      window.addEventListener('dev-avatar-stage', handleAvatarStage);
    }
    return () => {
      window.removeEventListener('dev-hide-cards', handleHideCards);
      // window.removeEventListener('dev-background-top', handleTopLayer);
      window.removeEventListener('dev-background-bottom', handleBottomLayer);
      if (!playgroundMode) {
        window.removeEventListener('dev-avatar-stage', handleAvatarStage);
      }
    };
  }, [playgroundMode]);

  // Preview state (lifted from AvatarPreview to persist and apply to all avatars)
  const [previewStage, setPreviewStage] = useState('Seedling');
  const [previewPath, setPreviewPath] = useState(null);
  const [previewShowCore, setPreviewShowCore] = useState(true);
  const [previewAttention, setPreviewAttention] = useState('none');

  const effectivePreviewStage = playgroundMode ? overrideStage : previewStage;
  const effectivePreviewPath = playgroundMode ? overridePath : previewPath;
  const effectiveAvatarStage = playgroundMode ? overrideStage : avatarStage;

  const handlePreviewStageChange = useCallback((nextStage) => {
    if (playgroundMode) {
      setOverrideStage(nextStage);
      return;
    }
    setPreviewStage(nextStage);
  }, [playgroundMode, setOverrideStage]);

  const handlePreviewPathChange = useCallback((nextPath) => {
    if (playgroundMode) {
      setOverridePath(nextPath);
      return;
    }
    setPreviewPath(nextPath);
  }, [playgroundMode, setOverridePath]);

  const handleAvatarStageSelection = useCallback((stageName) => {
    if (playgroundMode) {
      setOverrideStage(stageName);
      return;
    }
    setAvatarStage(stageName);
    setPreviewStage(stageName);
  }, [playgroundMode, setOverrideStage]);

  const handleSectionSelect = useCallback((section, options = {}) => {
    const forceStudentNavigation = options?.forceStudentNavigation === true;
    if (playgroundMode) {
      setStudentNavigationOverride(false);
      setActiveSection(null);
      return;
    }
    if (userMode !== 'student') {
      setStudentNavigationOverride(false);
      setActiveSection(section);
      return;
    }
    if (section === null) {
      setStudentNavigationOverride(false);
      setActiveSection(null);
      return;
    }
    if (section === 'navigation') {
      if (needsSetup || forceStudentNavigation) {
        setStudentNavigationOverride(forceStudentNavigation);
        setActiveSection('navigation');
      }
      return;
    }
    if (section === 'practice') {
      if (practiceLaunchContext || forceStudentNavigation) {
        setStudentNavigationOverride(false);
        setActiveSection('practice');
      }
      return;
    }
    setStudentNavigationOverride(false);
  }, [needsSetup, playgroundMode, practiceLaunchContext, userMode]);

  useEffect(() => {
    if (playgroundMode) return;
    if (!authUserId) return;
    if (!hasChosenUserMode) return;

    if (userMode === 'student') {
      if (!ownedActivePath) {
        if (studentNavigationOverride) {
          setStudentNavigationOverride(false);
        }
        if (activeSection !== 'navigation') {
          setActiveSection('navigation');
        }
        return;
      }

      if (activeSection === 'navigation' && !studentNavigationOverride) {
        setActiveSection(null);
      }
    }
  }, [activeSection, authUserId, hasChosenUserMode, ownedActivePath, playgroundMode, studentNavigationOverride, userMode]);

  useEffect(() => {
    if (!studentNavigationOverride) return;
    if (activeSection === 'navigation') return;
    setStudentNavigationOverride(false);
  }, [activeSection, studentNavigationOverride]);

  const handleChooseStudentMode = useCallback(() => {
    setUserMode('student');
    setActiveSection('navigation');
  }, [setUserMode]);

  const handleChooseExplorerMode = useCallback((event) => {
    if (!event?.shiftKey) return;
    if (authUserId) {
      resetNavigationForIdentityBoundary(authUserId);
      resetCurriculumForIdentityBoundary(authUserId);
    }
    setUserMode('explorer');
    setActiveSection(null);
  }, [authUserId, resetCurriculumForIdentityBoundary, resetNavigationForIdentityBoundary, setUserMode]);

  // Sync avatarStage with previewStage so theme colors update
  useEffect(() => {
    if (playgroundMode) return;
    setAvatarStage(previewStage);
  }, [playgroundMode, previewStage]);

  // Preload critical images on app start
  useEffect(() => {
    startImagePreloading(import.meta.env.BASE_URL);
  }, []);

  // Viewport width modes were removed; no resize listener needed.

  // DISABLED: Never auto-show completion report
  // User can manually access from HomeHub or CurriculumHub if needed
  // useEffect(() => {
  //   if (curriculumOnboardingComplete && isCurriculumComplete()) {
  //     setShowCurriculumReport(true);
  //   }
  // }, [curriculumOnboardingComplete, isCurriculumComplete]);


  // v3.27.279 - chore(sync): classify Supabase sync failures with transport/auth diagnostics
  // v3.27.278 - chore(tutorial): remove temporary unmount probe instrumentation
  // v3.27.277 - fix(tutorial): defer nested root unmount to avoid render-time race warning
  // v3.27.276 - feat(navigation): apply arwes housing to inner cards and stage pill
  // v3.27.275 - feat(navigation): apply arwes housing to program grid — outer chrome, inner plate, scan line, corner brackets
  // v3.27.274 - feat(navigation): stage carousel — swipeable, dot selectors, per-stage program view
  // v3.27.273 - feat(navigation): stage carousel — 5 lanes seedling→stellar, thought ritual→ember
  // v3.27.272 - fix(navigation): remove PathFinderCard, frame instruction text
  // v3.27.271 - fix(navigation): boost instruction prominence, remove Posted Notice badges
  // v3.27.270 - fix(navigation): audit-driven legibility pass — reduce card chamfer, stack footer, drop emoji/double-border, boost instruction opacity
  // v3.27.269 - fix(precision-rail): constrain legend popup to rail width with 2-column layout
  // v3.27.268 - fix(dedup): remove duplicate restart/abandon buttons from active path state component
  // v3.27.267 - fix(legibility): add dark background container with white text for path actions
  // v3.27.266 - fix(legibility): boost text contrast for path buttons and labels; add text shadows
  // v3.27.264 - fix(ui): move path lifecycle actions to panel bottom, remove probe
  // v3.27.263 - fix(wisdom): restore missing display mode store import in WisdomSection
  // v3.27.262 - fix(ui): replace corrupted triangle/arrow/middot Unicode in CircuitTrainingSelector and TrackingHub
  // v3.27.261 - fix(rituals): replace corrupted icon byte sequences with correct UTF-8 emoji
  // v3.27.260 - feat(practice): swap nav buttons above selector dropdown
  // v3.27.259 - fix(homehub): restore side panel collapse, fix image opacity, add text shadows
  // v3.27.258 - fix(homehub): side panel images now fill full container as background
  // v3.27.257 - fix(auth): re-enable supabase login for beta and align launch gating
  // v3.27.256 - docs(auth): mark supabase auth as disabled pending launch hardening
  // v3.27.255 - fix(homehub): restore initial hub render for smoke flows (ENABLE_AUTH=false)
  // v3.27.254 - fix(lint): medium-risk hook/purity remediation (PracticeSection, ShadowScanOverlay, ThoughtObservation, PolygonBreathScene)
  // v3.27.253 - fix(instrument-preset): remove white orb sphere from center
  // v3.27.252 - chore(lint): remove unused vars in avatar/practice menu (batch 6)
  // v3.27.251 - chore(lint): remove unused vars in safe chart components (batch 5)
  // v3.27.250 - chore(lint): remove unused vars in visual utilities (batch 4)
  // v3.27.249 - chore(lint): remove unused vars in practice controls (batch 3)
  // v3.27.248 - chore(lint): remove unused vars in ui micro components (batch 2)
  // v3.27.247 - chore(lint): remove unused vars in ritual micro components (batch 1)
  // v3.27.246 - refactor(PracticeSection): extract probe state and breath session state into custom hooks
  // v3.27.245 - fix(homehub): roll entire side panel container (not inner layer)
  // v3.27.244 - fix(homehub): rollable side panels with stats above images
  // v3.27.243 - fix(homehub): center right panel stack around report action
  // v3.27.242 - fix(homehub): rebalance side panel typography for new panel size
  // v3.27.241 - fix(homehub): retune side panel bounds to avatar visible ring
  // v3.27.240 - fix(homehub): align side panels to avatar ring band (geometry only)
  // v3.27.239 - ui(homehub): desaturate side-panel cover images for better visual blending
  // v3.27.238 - refactor(homehub): scope side-panel Y offset to primary row style only
  // v3.27.237 - ui(homehub): reduce side panel footprint, increase center gap, and lower panel row emphasis
  // v3.27.236 - refactor(homehub): spacing adjustments (tighten gap, add curriculum section separator)
  // v3.27.235 - refactor(homehub): typography refinements (soften text scale, lock metrics) + button text reduction
  // v3.27.234 - refactor(homehub): remove stage title and daily practice card; consolidate to avatar + side panels
  // v3.27.233 - refactor: remove display-mode residue and unify rail sizing
  // v3.27.231 - fix: remove in-session benchmark gating; student-mode shift+click warning when no benchmark
  // v3.27.230 - fix(precision-rail): restore synthetic getCurriculumDay + fix satisfied slot counting
  // v3.27.229 - ui(homehub): redesign side panels as image blind overlay with stats underneath
  // v3.27.228 - ui(homehub): replace side panel cover images with locker/elements
  // v3.27.227 - ui(homehub): make side panel covers full-bleed and stabilize roll-up collapse (HOMEHUB_SIDE_PANELS_ROLLUP_V1)
  // v3.27.226 - ui(homehub): move stats into avatar side panels; remove swipe page 2 (HOMEHUB_SIDE_PANELS_V1)
  // v3.27.225 - fix(breath): skip benchmark modal if already completed in navigation path (hasBenchmarkForRun guard)
  // v3.27.224 - fix(polygon): velocity-based rotation (no phase-transition jumps); inhale/exhale oppose on Y; holds differ in drift+sway
  // v3.27.223 - feat(atom-countdown): 3D electron orbits around digit (XZ circle in 3 planes), color-differentiated trails (HSL-shifted cool shade), fix missing trail visibility
  // v3.27.222 - feat(rainbow-prism): replace prism triangle with procedural yin-yang disk (GLSL shader, iridescent rim, slow rotation)
  // v3.27.221 - fix(rainbow-prism): separate Canvas with orthographic camera (zoom 70) for correct rendering
  // v3.27.220 - refactor(rainbow-prism): exact match reference implementation with Box objects + lighting
  // v3.27.219 - fix(rainbow-prism): add missing spotLight to illuminate rainbow
  // v3.27.218 - fix: reorder presets (orb #4, rainbow #5); add cache buster to prism.glb
  // v3.27.217 - feat(rainbow-prism): add preset #5 with animated rainbow + proper ray-prism reflection; remove rainbow from polygon
  // v3.27.216 - fix(polygon): animated rainbow with time-based shader; orbit-based rotation
  // v3.27.215 - fix(polygon): fix rainbow shader animation (use elapsed time instead of delta accumulation); smooth flow animation
  // v3.27.214 - feat(polygon): viewport-filling rainbow fan from polygon center; renderOrder=-1 for depth hierarchy
  // v3.27.213 - fix(polygon): digit rotation/position/depthTest; replace beam with subtle cues; polygon writes depth
  // v3.27.212 - fix(polygon): depthTest=false on digit plane; dielectric material; raised ambient; beam opacity
  // v3.27.211 - feat(polygon): projector beam + billboarded digit + upright reflection; stability lock preserved
  // v3.27.210 - feat(polygon): direct-light rig (PolyLightRig) + material tuning; stability lock preserved
  // v3.27.209 - fix(polygon): eliminate X4008 div0 + texSubImage warnings + disable env/shadows for stability
  // v3.27.208 - fix(instrument): reverse tick gradient + darken inactive ticks
  // v3.27.207 - feat(instrument): dark-gray inactive ticks + higher-contrast active ramp
  // v3.27.206 - feat(instrument): amplify tick gradient (strong endpoints + steeper curve)
  // v3.27.205 - feat(instrument): strengthen tick gradient via split color/intensity ramps
  // v3.27.204 - fix(instrument): apply tick gradient to segmentCore emissive
  // v3.27.203 - fix(instrument): inset tick ring radius (no tick size change)
  // v3.27.202 - feat(BreathingRing): dual always-mounted canvas arch; orb canvas as ONE STAGE PLATE child; frameloop toggle
  // v3.27.201 - fix(ParticleCountdown): switch font to helvetiker_bold (bold.blob only had glyph "4"); fix toneMapping
  // v3.27.200 - feat(ParticleCountdown): replace instrument preset with bloom+chromatic particle countdown; virtual mouse parallax
  // v3.27.198 - fix(TechInstrumentRND): remove background plate mesh (second ring visual)

  // Practice identification
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState(null);
  const [breathLayoutSticky, setBreathLayoutSticky] = useState(false);
  const [isFullscreenExperience, setIsFullscreenExperience] = useState(false);

  const handlePracticingChange = (val, pid = null, requiresFullscreen = false, selectedId = null) => {
    setIsPracticing(val);
    if (pid) setActivePracticeId(pid);
    else if (!val) setActivePracticeId(null);
    if (selectedId) setSelectedPracticeId(selectedId);
    // Set fullscreen experience based on practice metadata
    setIsFullscreenExperience(val && requiresFullscreen);
  };
  const runningPracticeId =
    typeof activePracticeId === "string" && activePracticeId.length > 0
      ? activePracticeId
      : null;
  const menuPracticeId =
    typeof selectedPracticeId === "string" && selectedPracticeId.length > 0
      ? selectedPracticeId
      : null;
  const effectivePracticeId = runningPracticeId || menuPracticeId;
  const isActiveBreathSession =
    isPracticing === true &&
    activeSection === 'practice' &&
    activePracticeId === 'breath';
  useEffect(() => {
    if (activeSection !== 'practice') {
      setBreathLayoutSticky(false);
      return;
    }

    const inBreathContext =
      activePracticeId === 'breath' ||
      runningPracticeId === 'breath' ||
      menuPracticeId === 'breath';

    if (inBreathContext) {
      setBreathLayoutSticky(true);
      return;
    }

    const switchedToOtherPractice =
      (runningPracticeId && runningPracticeId !== 'breath') ||
      (menuPracticeId && menuPracticeId !== 'breath');

    if (switchedToOtherPractice) {
      setBreathLayoutSticky(false);
    }
  }, [activeSection, activePracticeId, runningPracticeId, menuPracticeId]);

  const isBreathLayoutLocked =
    activeSection === 'practice' &&
    (isActiveBreathSession || breathLayoutSticky);
  const resolvedPracticeTutorialId = effectivePracticeId ? `practice:${effectivePracticeId}` : null;
  const practiceTutorialId =
    resolvedPracticeTutorialId && TUTORIALS[resolvedPracticeTutorialId]
      ? resolvedPracticeTutorialId
      : 'page:practice';
  const headerTutorialId = (() => {
    // Photonic (embedded or overlay) should always route to the photic beginner guide
    if (
      activeSection === 'practice' &&
      (effectivePracticeId === 'photic' || activePracticeId === 'photic')
    ) {
      return 'page:photic-beginner';
    }

    if (isPhoticOpen) return 'page:photic-beginner';

    if (!activeSection) return 'page:home';
    if (activeSection === 'practice') return practiceTutorialId;
    if (activeSection === 'wisdom') return 'page:wisdom';
    if (activeSection === 'application') return 'page:application';
    if (activeSection === 'navigation') return 'page:navigation';
    return 'page:home';
  })();

  // PROBE:OFFLINE_FIRST_USER_STATE_SYNC:START
  const userStateSyncCleanupRef = useRef(null);
  const previousAuthUserIdRef = useRef(null);

  const stopUserStateSync = useCallback(() => {
    try {
      userStateSyncCleanupRef.current?.();
    } catch {
      // ignore cleanup errors
    }
    userStateSyncCleanupRef.current = null;
  }, []);

  const startUserStateSync = useCallback(async (session) => {
    if (userStateSyncCleanupRef.current) return;
    const userId = session?.user?.id ?? null;
    if (!userId) return;

    try {
      const [{ supabase }, { initOfflineFirstUserStateSync }, { OFFLINE_FIRST_USER_STATE_KEYS }] = await Promise.all([
        import("./lib/supabaseClient.js"),
        import("./state/offlineFirstUserStateSync.js"),
        import("./state/offlineFirstUserStateKeys.js"),
      ]);

      userStateSyncCleanupRef.current = initOfflineFirstUserStateSync({
        supabase,
        keys: OFFLINE_FIRST_USER_STATE_KEYS,
        userId,
        debug: USER_STATE_SYNC_DEBUG,
      });
    } catch (e) {
      if (USER_STATE_SYNC_DEBUG) {
        console.log("[userStateSync] init failed (local-only mode continues)", e);
      }
    }
  }, []);

  useEffect(() => () => stopUserStateSync(), [stopUserStateSync]);

  const handleAuthChange = useCallback((event, session) => {
    if (event === "SIGNED_OUT") {
      setAuthUser(null);
      setActiveUserModeUserId(null);
      setNavigationActiveUserId(null);
      setCurriculumActiveUserId(null);
      setProgressActiveUserId(null);
      setLunarActiveUserId(null);
      setApplicationActiveUserId(null);
      setWisdomActiveUserId(null);
      setVideoActiveUserId(null);
      setModeTrainingActiveUserId(null);
      setChainActiveUserId(null);
      setCircuitJournalActiveUserId(null);
      stopUserStateSync();
      setShowSettings(false);
      setActiveSection(null);
      return;
    }

    if (event === "USER_UPDATED" && session) {
      setAuthUser(session?.user ?? null);
      setActiveUserModeUserId(session?.user?.id ?? null);
      setNavigationActiveUserId(session?.user?.id ?? null);
      setCurriculumActiveUserId(session?.user?.id ?? null);
      setProgressActiveUserId(session?.user?.id ?? null);
      setLunarActiveUserId(session?.user?.id ?? null);
      setApplicationActiveUserId(session?.user?.id ?? null);
      setWisdomActiveUserId(session?.user?.id ?? null);
      setVideoActiveUserId(session?.user?.id ?? null);
      setModeTrainingActiveUserId(session?.user?.id ?? null);
      setChainActiveUserId(session?.user?.id ?? null);
      setCircuitJournalActiveUserId(session?.user?.id ?? null);
      return;
    }

    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      setAuthUser(session?.user ?? null);
      setActiveUserModeUserId(session?.user?.id ?? null);
      setNavigationActiveUserId(session?.user?.id ?? null);
      setCurriculumActiveUserId(session?.user?.id ?? null);
      setProgressActiveUserId(session?.user?.id ?? null);
      setLunarActiveUserId(session?.user?.id ?? null);
      setApplicationActiveUserId(session?.user?.id ?? null);
      setWisdomActiveUserId(session?.user?.id ?? null);
      setVideoActiveUserId(session?.user?.id ?? null);
      setModeTrainingActiveUserId(session?.user?.id ?? null);
      setChainActiveUserId(session?.user?.id ?? null);
      setCircuitJournalActiveUserId(session?.user?.id ?? null);
      stopUserStateSync();
      startUserStateSync(session);
      setShowSettings(false);
      setActiveSection(null);
    }
  }, [
    setActiveUserModeUserId,
    setCurriculumActiveUserId,
    setNavigationActiveUserId,
    setProgressActiveUserId,
    setLunarActiveUserId,
    setApplicationActiveUserId,
    setWisdomActiveUserId,
    setVideoActiveUserId,
    setModeTrainingActiveUserId,
    setChainActiveUserId,
    setCircuitJournalActiveUserId,
    startUserStateSync,
    stopUserStateSync,
  ]);

  useEffect(() => {
    const previousUserId = previousAuthUserIdRef.current;
    const currentUserId = authUser?.id ?? null;
    const identityChanged = previousUserId !== currentUserId;

    setActiveUserModeUserId(currentUserId);
    setNavigationActiveUserId(currentUserId);
    setCurriculumActiveUserId(currentUserId);
    setProgressActiveUserId(currentUserId);
    setLunarActiveUserId(currentUserId);
    setApplicationActiveUserId(currentUserId);
    setWisdomActiveUserId(currentUserId);
    setVideoActiveUserId(currentUserId);
    setModeTrainingActiveUserId(currentUserId);
    setChainActiveUserId(currentUserId);
    setCircuitJournalActiveUserId(currentUserId);

    if (identityChanged) {
      resetUiLaunchContext();
      setShowSettings(false);
      setActiveSection(null);
    }

    previousAuthUserIdRef.current = currentUserId;
  }, [
    authUser?.id,
    modeByUserId,
    resetUiLaunchContext,
    setActiveUserModeUserId,
    setCurriculumActiveUserId,
    setNavigationActiveUserId,
    setProgressActiveUserId,
    setLunarActiveUserId,
    setApplicationActiveUserId,
    setWisdomActiveUserId,
    setVideoActiveUserId,
    setModeTrainingActiveUserId,
    setChainActiveUserId,
    setCircuitJournalActiveUserId,
  ]);
  // PROBE:OFFLINE_FIRST_USER_STATE_SYNC:END

  return (
    <AuthGate onAuthChange={handleAuthChange}>
    <ThemeProvider currentStage={effectiveAvatarStage}>
      {/* Curriculum Completion Report */}
      {showCurriculumReport && (
        <CurriculumCompletionReport
          onDismiss={() => setShowCurriculumReport(false)}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSignedOut={() => {
          setShowSettings(false);
          setActiveSection(null);
        }}
      />

      {/* Dev Panel (🎨 button or Ctrl+Shift+D) */}
      {devPanelGateEnabled && (
        <Suspense fallback={null}>
          <DevPanel
            isOpen={showDevPanel}
            onClose={() => setShowDevPanel(false)}
            avatarStage={effectivePreviewStage}
            setAvatarStage={handlePreviewStageChange}
            avatarPath={effectivePreviewPath}
            setAvatarPath={handlePreviewPathChange}
            showCore={previewShowCore}
            setShowCore={setPreviewShowCore}
            avatarAttention={previewAttention}
            setAvatarAttention={setPreviewAttention}
          />
        </Suspense>
      )}

      {selectionEnabled && (
        <Suspense fallback={null}>
          <PracticeButtonElectricBorderOverlay />
          <SelectedControlElectricBorderOverlay />
          <SelectedPlateOverlay />
          {import.meta.env.DEV && <SelectedCardElectricBorderOverlay />}
        </Suspense>
      )}

      {/* Outer Layout Container - Adapts to display mode */}
      <div
        className="w-full h-[100dvh] flex justify-center overflow-hidden transition-colors duration-500 relative"
        style={{
          background: outerBackground,
          '--app-frame-width': APP_FRAME_WIDTH,
        }}
      >
        {/* Side mask - left side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 left-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: 'calc((100vw - var(--app-frame-width)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Side mask - right side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 right-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: 'calc((100vw - var(--app-frame-width)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Full-viewport background: force pure black during active breath to prevent wallpaper bleed */}
        {isActiveBreathSession ? (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0"
            style={{ background: "#020207" }}
          />
        ) : (
          <Background stage={effectivePreviewStage} showBottomLayer={effectiveShowBackgroundBottomLayer} />
        )}

        <PhoticCirclesOverlay
          isOpen={isPhoticOpen}
          onClose={handleClosePhotic}
          autoStart={true}
        />
        {/* PROBE:DEPLOY_BUILD_ID_V1:START */}
        <div
          style={{
            position: 'fixed',
            right: 8,
            bottom: 8,
            fontSize: 10,
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          build: {__DEPLOY_GIT_SHA__} @ {__DEPLOY_BUILD_TIME__}
        </div>
        {/* PROBE:DEPLOY_BUILD_ID_V1:END */}

        {/* Inner App Container */}
        <div
          data-app-frame
          className={`relative w-full h-[100dvh] flex flex-col items-center overflow-hidden transition-all duration-500 ${isLight ? 'text-[#3D3425]' : 'text-white'}`}
          style={{
            width: 'var(--app-frame-width)',
            maxWidth: 'var(--app-frame-width)',
            height: '100dvh',
            maxHeight: '100dvh',
            boxShadow: 'none',
            overflowX: 'hidden',
            overflowY: 'hidden',
            zIndex: 1,
            '--ui-rail-max': UI_RAIL_MAX_WIDTH,
          }}
        >

          <div
            className="relative z-10 w-full flex flex-col overflow-hidden"
            style={{
              ...(isFirefox ? { transform: 'translateZ(0)' } : null),
              height: '100%',
              minHeight: 0,
            }}
          >
            {/* Fixed Dark Header Bar */}
            <header
              className={`sticky top-0 z-50 w-full px-6 py-3 transition-colors duration-500${isActiveBreathSession ? ' header--breath-active' : ''}`}
              style={{
                background: isFirefox
                  ? (isLight ? 'rgba(200,185,165,0.95)' : 'rgba(10,10,15,0.95)')
                  : (isLight
                    ? 'linear-gradient(180deg, rgba(200,185,165,0.1) 0%, rgba(210,195,175,0.05) 60%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)'),
                backdropFilter: isFirefox ? 'none' : 'blur(8px)',
                WebkitBackdropFilter: isFirefox ? 'none' : 'blur(8px)',
                borderBottom: isLight
                  ? '1px solid rgba(140,120,90,0.15)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between w-full h-full relative">
                {/* Left: Branding */}
                <div className="flex-1 flex items-center justify-start">
                  <div
                    className={`type-label app-header-brand ${isLight ? 'text-[#5A4D3C]/70' : 'text-white/60'}`}
                  >
                    IMMANENCE OS
                  </div>
                </div>

                {/* Right: Controls & Home Button */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <div className="flex items-center gap-3 app-header-control-cluster">
                    <DisplayModeToggle />
                    <button
                      type="button"
                      onClick={() => setShowSettings(v => !v)}
                      className="type-label text-[11px] font-medium opacity-60 hover:opacity-100 active:scale-95 transition-all max-w-[140px] truncate"
                      title="Click for account / logout"
                      style={{ color: showSettings ? 'var(--accent-color)' : undefined }}
                    >
                      {(() => {
                        const meta = authUser?.user_metadata || {};
                        const rawName = meta?.name ?? meta?.full_name ?? null;
                        const name = typeof rawName === 'string' ? rawName.trim() : '';
                        if (name) return name;
                        const email = typeof authUser?.email === 'string' ? authUser.email.trim() : '';
                        if (email) return email.split('@')[0] || email;
                        return 'Account';
                      })()}
                    </button>
                    {devPanelGateEnabled && (
                      <button
                        type="button"
                        onClick={() => setShowDevPanel(v => !v)}
                        className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                        title="Dev Panel (Ctrl+Shift+D)"
                        style={{ color: showDevPanel ? 'var(--accent-color)' : undefined }}
                      >
                        🎨
                      </button>
                    )}
                    <button
                      type="button"
                      data-tutorial="global-tutorial-button"
                      onClick={() => {
                        const tutorialStore = useTutorialStore.getState();
                        tutorialStore.openTutorial(headerTutorialId);
                      }}
                      className={`type-label font-medium px-2 py-1 rounded-lg transition-colors ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                      title="Tutorial"
                    >
                      ?
                    </button>
                    <div className={`type-caption uppercase tracking-wide app-header-version ${isLight ? 'text-[#5A4D3C]/50' : 'text-white/40'}`}>
                      <button
                        type="button"
                        className="cursor-default app-header-version-button"
                        title="Debug: Alt+Shift+Click toggles buildProbe. Alt+Ctrl+Click toggles disableDailyCard."
                        onClick={(e) => {
                          if (e.altKey && e.shiftKey) toggleBuildProbe();
                          if (e.altKey && (e.ctrlKey || e.metaKey)) toggleDebugFlag('disableDailyCard');
                          if (!hasDevtoolsQueryFlag()) return;
                          const now = Date.now();
                          const state = devtoolsTapRef.current;
                          if (!state.firstTs || (now - state.firstTs) > 3000) {
                            state.firstTs = now;
                            state.count = 0;
                          }
                          state.count += 1;
                          if (state.count >= 7) {
                            state.count = 0;
                            state.firstTs = 0;
                            if (!isDevtoolsUnlocked()) {
                              setDevtoolsUnlocked(true);
                              setDevtoolsGateTick(t => t + 1);
                              console.info('[devtools] unlocked');
                            }
                          }
                        }}
                        style={{ background: 'transparent' }}
                      >
                        v3.27.279
                      </button>
                    </div>
                  </div>

                  {!isHub && !playgroundMode && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className={`type-label font-medium px-2 py-1 rounded-lg transition-colors app-header-home ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                      Home
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Main content (single scroll container; prevents per-section width/height drift) */}
            <main
              className="w-full flex-1 min-h-0 overflow-x-hidden"
              style={{
                opacity: isMinimized ? 0 : 1,
                pointerEvents: isMinimized ? 'none' : 'auto',
                transition: 'opacity 0.7s ease',
                overflowY: isActiveBreathSession ? 'hidden' : 'auto',
              }}
              inert={isMinimized ? "" : undefined}
            >
              {!hasChosenUserMode ? (
                <div className="imm-chooser">
                  <style>{`
                    .imm-chooser {
                      --amber: #c8832a;
                      --amber-bright: #f0a840;
                      --amber-glow: rgba(200,131,42,0.4);
                      --teal: #2a8fa0;
                      --teal-bright: #40d0e8;
                      --teal-glow: rgba(42,143,160,0.4);
                      --bg-deep: #04080f;
                      --bg-card: #080e18;
                      --text-primary: #d8e8f0;
                      --text-secondary: #7a9ab0;
                      --text-dim: #3a5568;
                      background: #04080f;
                      min-height: 100%;
                      width: 100%;
                      color: var(--text-primary);
                      position: relative;
                      overflow: hidden;
                    }
                    .imm-chooser .ic-col {
                      max-width: 520px;
                      margin: 0 auto;
                      padding: 32px 20px 48px;
                      position: relative;
                      z-index: 1;
                    }
                    .imm-chooser .ic-hero {
                      position: relative;
                      border: 1px solid rgba(42,143,160,0.28);
                      border-radius: 4px;
                      overflow: hidden;
                      aspect-ratio: 21/9;
                      margin-bottom: 28px;
                      animation: immFadeUp 0.5s ease forwards, immHeroGlow 5s ease-in-out 0.6s infinite;
                    }
                    .imm-chooser .ic-hero::before {
                      content: '';
                      position: absolute;
                      top: 6px; left: 6px;
                      width: 20px; height: 20px;
                      border-top: 2px solid var(--teal-bright);
                      border-left: 2px solid var(--teal-bright);
                      box-shadow: var(--teal-glow);
                      z-index: 3;
                      pointer-events: none;
                    }
                    .imm-chooser .ic-hero::after {
                      content: '';
                      position: absolute;
                      top: 6px; right: 6px;
                      width: 20px; height: 20px;
                      border-top: 2px solid var(--teal-bright);
                      border-right: 2px solid var(--teal-bright);
                      box-shadow: var(--teal-glow);
                      z-index: 3;
                      pointer-events: none;
                    }
                    .imm-chooser .hc-bl {
                      position: absolute;
                      bottom: 6px; left: 6px;
                      width: 20px; height: 20px;
                      border-bottom: 2px solid var(--teal-bright);
                      border-left: 2px solid var(--teal-bright);
                      box-shadow: var(--teal-glow);
                      z-index: 3;
                      pointer-events: none;
                    }
                    .imm-chooser .hc-br {
                      position: absolute;
                      bottom: 6px; right: 6px;
                      width: 20px; height: 20px;
                      border-bottom: 2px solid var(--teal-bright);
                      border-right: 2px solid var(--teal-bright);
                      box-shadow: var(--teal-glow);
                      z-index: 3;
                      pointer-events: none;
                    }
                    .imm-chooser .ic-hero-veil {
                      position: absolute;
                      inset: 0;
                      background: linear-gradient(to bottom, rgba(64,208,232,0.05) 0%, transparent 25%, transparent 70%, rgba(4,8,15,0.5) 100%);
                      pointer-events: none;
                      z-index: 2;
                    }
                    .imm-chooser .ic-hero img {
                      position: absolute;
                      inset: 0;
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                      object-position: center;
                    }
                    .imm-chooser .ic-text {
                      text-align: center;
                      padding: 0 8px;
                      margin-bottom: 12px;
                      opacity: 0;
                      animation: immFadeUp 0.5s 0.15s ease forwards;
                    }
                    .imm-chooser .ic-overline {
                      font-size: 11px;
                      letter-spacing: 0.32em;
                      text-transform: uppercase;
                      color: var(--text-dim);
                      margin-bottom: 10px;
                    }
                    .imm-chooser .ic-h1 {
                      font-size: 28px;
                      font-weight: 700;
                      line-height: 1.15;
                      color: #e8f0f8;
                      text-shadow: 0 0 40px rgba(64,208,232,0.12);
                      margin-bottom: 14px;
                    }
                    .imm-chooser .ic-body {
                      font-size: 13px;
                      font-weight: 300;
                      line-height: 1.65;
                      color: var(--text-secondary);
                      margin: 0 auto 18px;
                      max-width: 420px;
                    }
                    .imm-chooser-divider {
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      margin: 0 auto 16px;
                      max-width: 320px;
                      opacity: 0.35;
                    }
                    .imm-chooser-divider-line {
                      flex: 1;
                      height: 1px;
                      background: linear-gradient(90deg, transparent, var(--teal-bright));
                    }
                    .imm-chooser-divider-line:last-of-type {
                      background: linear-gradient(90deg, var(--teal-bright), transparent);
                    }
                    .imm-chooser-divider-ticks {
                      display: flex;
                      align-items: flex-end;
                      gap: 3px;
                    }
                    .imm-chooser-divider-ticks span {
                      display: block;
                      width: 1px;
                      background: var(--teal-bright);
                    }
                    .imm-chooser-divider-ticks span:nth-child(1) { height: 4px; }
                    .imm-chooser-divider-ticks span:nth-child(2) { height: 7px; }
                    .imm-chooser-divider-ticks span:nth-child(3) { height: 10px; }
                    .imm-chooser-divider-ticks span:nth-child(4) { height: 7px; }
                    .imm-chooser-divider-ticks span:nth-child(5) { height: 4px; }
                    .imm-chooser-divider-diamond {
                      font-size: 8px;
                      color: var(--teal-bright);
                      line-height: 1;
                    }
                    .imm-chooser .ic-cta-label {
                      font-size: 13px;
                      font-weight: 600;
                      letter-spacing: 0.22em;
                      text-transform: uppercase;
                      color: var(--teal-bright);
                    }
                    .imm-chooser .ic-cards {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 12px;
                      align-items: stretch;
                      margin-bottom: 20px;
                      opacity: 0;
                      animation: immFadeUp 0.5s 0.3s ease forwards;
                    }
                    @media (max-width: 480px) {
                      .imm-chooser .ic-cards {
                        grid-template-columns: 1fr;
                      }
                    }
                    .imm-chooser .ic-card {
                      position: relative;
                      border-radius: 4px;
                      overflow: hidden;
                      display: flex;
                      flex-direction: column;
                    }
                    .imm-chooser .ic-card-student {
                      background: #0d1526;
                      border: 1px solid rgba(200,131,42,0.22);
                      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(200,131,42,0.05);
                    }
                    .imm-chooser .ic-card-student::after {
                      content: '';
                      position: absolute;
                      top: 0; left: 0; right: 0;
                      height: 1px;
                      background-image: linear-gradient(90deg, transparent, var(--amber), transparent);
                      background-size: 200% 100%;
                      opacity: 0.5;
                      z-index: 1;
                      animation: immSweepLine 7s ease-in-out 1s infinite;
                    }
                    .imm-chooser .ic-card-explorer {
                      background: #0d1526;
                      border: 1px solid rgba(42,143,160,0.25);
                      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(42,143,160,0.06);
                    }
                    .imm-chooser .ic-card-explorer::after {
                      content: '';
                      position: absolute;
                      top: 0; left: 0; right: 0;
                      height: 1px;
                      background-image: linear-gradient(90deg, transparent, var(--teal-bright), transparent);
                      background-size: 200% 100%;
                      opacity: 0.4;
                      z-index: 1;
                      animation: immSweepLine 7s ease-in-out 3.5s infinite;
                    }
                    .imm-chooser .c-tl,
                    .imm-chooser .c-tr,
                    .imm-chooser .c-bl,
                    .imm-chooser .c-br {
                      position: absolute;
                      width: 13px;
                      height: 13px;
                      pointer-events: none;
                      z-index: 2;
                    }
                    .imm-chooser .c-tl { top: 5px; left: 5px; }
                    .imm-chooser .c-tr { top: 5px; right: 5px; }
                    .imm-chooser .c-bl { bottom: 5px; left: 5px; }
                    .imm-chooser .c-br { bottom: 5px; right: 5px; }
                    .imm-chooser .ic-card-student .c-tl { border-top: 2px solid var(--amber-bright); border-left: 2px solid var(--amber-bright); box-shadow: var(--amber-glow); }
                    .imm-chooser .ic-card-student .c-tr { border-top: 2px solid var(--amber-bright); border-right: 2px solid var(--amber-bright); box-shadow: var(--amber-glow); }
                    .imm-chooser .ic-card-student .c-bl { border-bottom: 2px solid var(--amber-bright); border-left: 2px solid var(--amber-bright); box-shadow: var(--amber-glow); }
                    .imm-chooser .ic-card-student .c-br { border-bottom: 2px solid var(--amber-bright); border-right: 2px solid var(--amber-bright); box-shadow: var(--amber-glow); }
                    .imm-chooser .ic-card-explorer .c-tl { border-top: 2px solid var(--teal-bright); border-left: 2px solid var(--teal-bright); box-shadow: var(--teal-glow); }
                    .imm-chooser .ic-card-explorer .c-tr { border-top: 2px solid var(--teal-bright); border-right: 2px solid var(--teal-bright); box-shadow: var(--teal-glow); }
                    .imm-chooser .ic-card-explorer .c-bl { border-bottom: 2px solid var(--teal-bright); border-left: 2px solid var(--teal-bright); box-shadow: var(--teal-glow); }
                    .imm-chooser .ic-card-explorer .c-br { border-bottom: 2px solid var(--teal-bright); border-right: 2px solid var(--teal-bright); box-shadow: var(--teal-glow); }
                    .imm-chooser .ic-content {
                      position: relative;
                      z-index: 1;
                      padding: 16px 14px 14px;
                      display: flex;
                      flex-direction: column;
                      flex: 1;
                    }
                    .imm-chooser .ic-card-label {
                      font-size: 9px;
                      letter-spacing: 0.28em;
                      text-transform: uppercase;
                      margin-bottom: 4px;
                      font-family: monospace;
                    }
                    .imm-chooser .ic-card-title {
                      font-size: 22px;
                      font-weight: 700;
                      color: #e8f0f8;
                      margin-bottom: 12px;
                    }
                    .imm-chooser .ic-features {
                      list-style: none;
                      padding: 0;
                      margin: 0 0 16px;
                    }
                    .imm-chooser .ic-features li {
                      position: relative;
                      padding: 3px 0 3px 14px;
                      border-bottom: 1px solid rgba(255,255,255,0.025);
                      font-size: 11px;
                      font-weight: 300;
                      line-height: 1.5;
                      color: var(--text-secondary);
                    }
                    .imm-chooser .ic-features li:last-child {
                      border-bottom: none;
                    }
                    .imm-chooser .ic-bullet {
                      position: absolute;
                      left: 0;
                      top: 4px;
                      font-size: 9px;
                    }
                    .imm-chooser .ic-btn {
                      margin-top: auto;
                      width: 100%;
                      padding: 10px 8px;
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 0.16em;
                      text-transform: uppercase;
                      border-radius: 3px;
                      cursor: pointer;
                      font-family: monospace;
                      transition: background 0.15s ease, box-shadow 0.15s ease;
                    }
                    .imm-chooser .ic-btn-student {
                      background: rgba(200,131,42,0.1);
                      border: 1px solid rgba(200,131,42,0.45);
                      color: var(--amber-bright);
                      box-shadow: 0 0 10px rgba(200,131,42,0.08);
                    }
                    .imm-chooser .ic-btn-student:hover {
                      background: rgba(200,131,42,0.2);
                      box-shadow: 0 0 22px rgba(200,131,42,0.22);
                    }
                    .imm-chooser .ic-btn-explorer {
                      background: rgba(42,143,160,0.1);
                      border: 1px solid rgba(64,208,232,0.38);
                      color: var(--teal-bright);
                      box-shadow: 0 0 10px rgba(42,143,160,0.08);
                    }
                    .imm-chooser .ic-btn-explorer:hover {
                      background: rgba(42,143,160,0.2);
                      box-shadow: 0 0 22px rgba(42,143,160,0.22);
                    }
                    .imm-chooser .ic-bottom {
                      font-family: monospace;
                      font-size: 10px;
                      color: var(--text-dim);
                      text-align: center;
                      margin: 0;
                      opacity: 0;
                      animation: immFadeUp 0.5s 0.42s ease forwards;
                    }
                    .imm-chooser::before {
                      content: '';
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 1px;
                      height: 1px;
                      pointer-events: none;
                      z-index: 0;
                      box-shadow:
                        12px 87px 0 0 rgba(255,255,255,0.20),
                        67px 234px 0 0 rgba(255,255,255,0.18),
                        145px 412px 0 0 rgba(255,255,255,0.22),
                        289px 56px 0 0 rgba(255,255,255,0.17),
                        456px 178px 0 0 rgba(255,255,255,0.15),
                        601px 334px 0 0 rgba(255,255,255,0.19),
                        712px 567px 0 0 rgba(255,255,255,0.21),
                        34px 689px 0 0 rgba(255,255,255,0.16),
                        178px 812px 0 0 rgba(255,255,255,0.22),
                        523px 945px 0 0 rgba(255,255,255,0.18),
                        668px 1067px 0 0 rgba(255,255,255,0.25),
                        90px 1134px 0 0 rgba(255,255,255,0.28),
                        234px 1267px 0 0 rgba(255,255,255,0.26),
                        378px 1389px 0 0 rgba(255,255,255,0.23),
                        545px 145px 0 0 rgba(255,255,255,0.27),
                        700px 289px 0 0 rgba(255,255,255,0.24),
                        156px 523px 0 0 rgba(255,255,255,0.29),
                        412px 667px 0 0 rgba(255,255,255,0.22),
                        589px 890px 0 0 rgba(255,255,255,0.26),
                        23px 1023px 0 0 rgba(255,255,255,0.28),
                        312px 189px 0 0 rgba(255,255,255,0.35),
                        467px 345px 0 0 rgba(255,255,255,0.32),
                        78px 478px 0 0 rgba(255,255,255,0.38),
                        634px 612px 0 0 rgba(255,255,255,0.33),
                        189px 745px 0 0 rgba(255,255,255,0.36),
                        501px 868px 0 0 rgba(255,255,255,0.31),
                        267px 1000px 0 0 rgba(255,255,255,0.37),
                        712px 1112px 0 0 rgba(255,255,255,0.34),
                        45px 1234px 0 0 rgba(255,255,255,0.39),
                        400px 1367px 0 0 rgba(255,255,255,0.33),
                        123px 23px 0 0 rgba(255,255,255,0.45),
                        567px 156px 0 0 rgba(255,255,255,0.42),
                        234px 312px 0 0 rgba(255,255,255,0.47),
                        689px 445px 0 0 rgba(255,255,255,0.41),
                        345px 578px 0 0 rgba(255,255,255,0.44),
                        56px 711px 0 0 rgba(255,255,255,0.48),
                        489px 834px 0 0 rgba(255,255,255,0.43),
                        678px 978px 0 0 rgba(255,255,255,0.46),
                        156px 1089px 0 0 rgba(255,255,255,0.41),
                        423px 1212px 0 0 rgba(255,255,255,0.49),
                        89px 367px 0 0 rgba(255,255,255,0.44),
                        534px 500px 0 0 rgba(255,255,255,0.42),
                        278px 634px 0 0 rgba(255,255,255,0.46),
                        612px 756px 0 0 rgba(255,255,255,0.43),
                        167px 889px 0 0 rgba(255,255,255,0.47),
                        456px 1012px 0 0 rgba(255,255,255,0.44),
                        701px 1145px 0 0 rgba(255,255,255,0.41),
                        312px 1278px 0 0 rgba(255,255,255,0.48),
                        23px 145px 0 0 rgba(255,255,255,0.43),
                        578px 267px 0 0 rgba(255,255,255,0.46),
                        89px 412px 0 0 rgba(255,255,255,0.55),
                        434px 545px 0 0 rgba(255,255,255,0.52),
                        623px 678px 0 0 rgba(255,255,255,0.57),
                        178px 823px 0 0 rgba(255,255,255,0.54),
                        512px 956px 0 0 rgba(255,255,255,0.51),
                        267px 1089px 0 0 rgba(255,255,255,0.56),
                        689px 1222px 0 0 rgba(255,255,255,0.53),
                        34px 1345px 0 0 rgba(255,255,255,0.58),
                        345px 67px 0 0 rgba(255,255,255,0.52),
                        600px 200px 0 0 rgba(255,255,255,0.55),
                        156px 456px 0 0 rgba(255,255,255,0.57),
                        489px 589px 0 0 rgba(255,255,255,0.54),
                        712px 734px 0 0 rgba(255,255,255,0.59),
                        234px 867px 0 0 rgba(255,255,255,0.52),
                        556px 1000px 0 0 rgba(255,255,255,0.56),
                        89px 1112px 0 0 rgba(255,255,255,0.53),
                        423px 1245px 0 0 rgba(255,255,255,0.58),
                        668px 1378px 0 0 rgba(255,255,255,0.51),
                        312px 34px 0 0 rgba(255,255,255,0.55),
                        45px 289px 0 0 rgba(255,255,255,0.57),
                        234px 523px 0 0 rgba(255,255,255,0.65),
                        567px 645px 0 0 rgba(255,255,255,0.62),
                        123px 778px 0 0 rgba(255,255,255,0.68),
                        456px 912px 0 0 rgba(255,255,255,0.63),
                        700px 1045px 0 0 rgba(255,255,255,0.66),
                        278px 1167px 0 0 rgba(255,255,255,0.61),
                        612px 1300px 0 0 rgba(255,255,255,0.69),
                        67px 78px 0 0 rgba(255,255,255,0.64),
                        400px 212px 0 0 rgba(255,255,255,0.67),
                        556px 456px 0 0 rgba(255,255,255,0.62),
                        89px 623px 0 0 rgba(255,255,255,0.65),
                        434px 756px 0 0 rgba(255,255,255,0.70),
                        678px 889px 0 0 rgba(255,255,255,0.63),
                        156px 1023px 0 0 rgba(255,255,255,0.68),
                        512px 1156px 0 0 rgba(255,255,255,0.65),
                        267px 1289px 0 0 rgba(255,255,255,0.71),
                        23px 345px 0 0 rgba(255,255,255,0.64),
                        601px 478px 0 0 rgba(255,255,255,0.67),
                        312px 600px 0 0 rgba(255,255,255,0.62),
                        712px 123px 0 0 rgba(255,255,255,0.66),
                        178px 367px 0 0 rgba(255,255,255,0.38),
                        523px 501px 0 0 rgba(255,255,255,0.42),
                        345px 712px 0 0 rgba(255,255,255,0.29),
                        89px 934px 0 0 rgba(255,255,255,0.51),
                        456px 1112px 0 0 rgba(255,255,255,0.35),
                        623px 1267px 0 0 rgba(255,255,255,0.44),
                        234px 89px 0 0 rgba(255,255,255,0.33),
                        567px 78px 0 0 rgba(255,255,255,0.48),
                        112px 1389px 0 0 rgba(255,255,255,0.21),
                        689px 712px 0 0 rgba(255,255,255,0.56),
                        45px 512px 0 0 rgba(255,255,255,0.39),
                        401px 289px 0 0 rgba(255,255,255,0.26),
                        634px 1023px 0 0 rgba(255,255,255,0.47),
                        178px 167px 0 0 rgba(255,255,255,0.60),
                        512px 823px 0 0 rgba(255,255,255,0.33),
                        267px 1145px 0 0 rgba(255,255,255,0.52),
                        700px 456px 0 0 rgba(255,255,255,0.28),
                        123px 678px 0 0 rgba(255,255,255,0.64),
                        389px 934px 0 0 rgba(255,255,255,0.41),
                        567px 1189px 0 0 rgba(255,255,255,0.35),
                        345px 178px 0 0 rgba(255,255,255,0.85),
                        578px 734px 0 0 rgba(255,255,255,0.90),
                        123px 512px 0 0 rgba(255,255,255,0.80),
                        456px 1089px 0 0 rgba(255,255,255,0.88),
                        701px 267px 0 0 rgba(255,255,255,0.82),
                        89px 956px 0 0 rgba(255,255,255,0.95),
                        312px 1345px 0 0 rgba(255,255,255,0.83),
                        634px 89px 0 0 rgba(255,255,255,0.87),
                        200px 600px 0 0 rgba(255,255,255,0.91),
                        445px 400px 0 0 rgba(255,255,255,0.86);
                      animation: starfieldDrift 60s linear infinite;
                    }
                    .imm-chooser::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      pointer-events: none;
                      z-index: 0;
                      background:
                        radial-gradient(ellipse 70% 40% at 25% 60%, rgba(20,55,85,0.25) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 35% at 78% 35%, rgba(15,40,70,0.2) 0%, transparent 70%),
                        radial-gradient(ellipse 40% 30% at 55% 80%, rgba(30,20,60,0.15) 0%, transparent 70%);
                      animation: nebulaDrift 40s ease-in-out infinite;
                    }
                    .imm-chooser .ic-card-student::before,
                    .imm-chooser .ic-card-explorer::before {
                      content: '';
                      position: absolute;
                      inset: 0;
                      pointer-events: none;
                      z-index: 0;
                      opacity: 0.4;
                      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
                      background-size: 200px 200px;
                      border-radius: 4px;
                    }
                    @keyframes immFadeUp {
                      from { opacity: 0; transform: translateY(14px); }
                      to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes immHeroGlow {
                      0%,100% { box-shadow: 0 0 0 1px rgba(64,208,232,0.08), 0 0 18px rgba(42,143,160,0.1); }
                      50%     { box-shadow: 0 0 0 1px rgba(64,208,232,0.22), 0 0 40px rgba(42,143,160,0.22); }
                    }
                    @keyframes immSweepLine {
                      0%   { background-position: -200% 0; }
                      100% { background-position: 300% 0; }
                    }
                    @keyframes starfieldDrift {
                      from { transform: translateY(0); }
                      to   { transform: translateY(40px); }
                    }
                    @keyframes nebulaDrift {
                      0%   { opacity: 0.6; transform: scale(1) translateX(0); }
                      33%  { opacity: 0.8; transform: scale(1.02) translateX(8px); }
                      66%  { opacity: 0.65; transform: scale(0.98) translateX(-6px); }
                      100% { opacity: 0.6; transform: scale(1) translateX(0); }
                    }
                  `}</style>
                  <div className="ic-col">
                    <div className="ic-hero" aria-hidden="true">
                      <div className="ic-hero-veil" />
                      <div className="hc-bl" />
                      <div className="hc-br" />
                      <img src={entryHeroSrc} alt="" />
                    </div>
                    <div className="ic-text">
                      <div className="ic-overline">IMMANENCE OS</div>
                      <h1 className="ic-h1">A spiritual dojo for the serious practitioner.</h1>
                      <p className="ic-body">Traditional practices, modern frameworks — applied to living well, resilience, and self-mastery through training the mind and nervous system.</p>
                      <div className="imm-chooser-divider">
                        <div className="imm-chooser-divider-line" />
                        <div className="imm-chooser-divider-ticks">
                          <span /><span /><span /><span /><span />
                        </div>
                        <div className="imm-chooser-divider-diamond">◆</div>
                        <div className="imm-chooser-divider-ticks">
                          <span /><span /><span /><span /><span />
                        </div>
                        <div className="imm-chooser-divider-line" />
                      </div>
                      <div className="ic-cta-label">CHOOSE YOUR PATH</div>
                    </div>
                    <div className="ic-cards">
                      <div className="ic-card ic-card-student">
                        <div className="c-tl" /><div className="c-tr" /><div className="c-bl" /><div className="c-br" />
                        <div className="ic-content">
                          <div className="ic-card-label" style={{ color: 'var(--amber)' }}>GUIDED PRACTICE</div>
                          <div className="ic-card-title">Student</div>
                          <ul className="ic-features">
                            <li><span className="ic-bullet" style={{ color: 'var(--amber)' }}>▸</span>Start with curriculum flow</li>
                            <li><span className="ic-bullet" style={{ color: 'var(--amber)' }}>▸</span>Fewer sections until setup</li>
                            <li><span className="ic-bullet" style={{ color: 'var(--amber)' }}>▸</span>Best for structured progression</li>
                          </ul>
                          <button type="button" className="ic-btn ic-btn-student" onClick={handleChooseStudentMode}>
                            Enter as Student
                          </button>
                        </div>
                      </div>
                      <div className="ic-card ic-card-explorer">
                        <div className="c-tl" /><div className="c-tr" /><div className="c-bl" /><div className="c-br" />
                        <div className="ic-content">
                          <div className="ic-card-label" style={{ color: 'var(--teal-bright)' }}>FULL ACCESS</div>
                          <div className="ic-card-title">Explorer</div>
                          <ul className="ic-features">
                            <li><span className="ic-bullet" style={{ color: 'var(--teal-bright)' }}>▸</span>Full section access immediately</li>
                            <li><span className="ic-bullet" style={{ color: 'var(--teal-bright)' }}>▸</span>Move freely across the app</li>
                            <li><span className="ic-bullet" style={{ color: 'var(--teal-bright)' }}>▸</span>Best for self-directed use</li>
                          </ul>
                          <button type="button" className="ic-btn ic-btn-explorer" onClick={handleChooseExplorerMode}>
                            Enter as Explorer
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="ic-bottom">· Learn the difference ·</p>
                  </div>
                </div>
              ) : (isHub || playgroundMode) ? (
                <div key="hub" className="section-enter">
                  {(debugBuildProbe && debugShadowScan) && (
                    <div
                      className="mx-6 mt-3 mb-2 rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
                      style={{
                        border: '1px dashed rgba(255, 80, 80, 0.65)',
                        background: isLight ? 'rgba(250, 246, 238, 0.10)' : 'rgba(0,0,0,0.10)',
                        color: isLight ? 'rgba(60, 50, 35, 0.75)' : 'rgba(255,255,255,0.75)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ userSelect: 'text' }}>
                          BUILD_PROBE: App debug flags | disableDailyCard:{String(debugDisableDailyCard)} | shadowScan:{String(debugShadowScan)} | dailyCardShadowOff:{String(debugDailyCardShadowOff)} | dailyCardBlurOff:{String(debugDailyCardBlurOff)} | dailyCardBorderOff:{String(debugDailyCardBorderOff)} | dailyCardMaskOff:{String(debugDailyCardMaskOff)} | href:{typeof window !== 'undefined' ? String(window.location.href) : 'n/a'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start', maxWidth: '100%' }}>
                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('disableDailyCard')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDisableDailyCard ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle disableDailyCard (reloads)"
                          >
                            toggle disableDailyCard
                          </button>

                          <button
                            type="button"
                            onClick={toggleShadowScan}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugShadowScan ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle shadowScan overlay (session only)"
                          >
                            toggle shadowScan
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardShadowOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardShadowOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardShadowOff (reloads)"
                          >
                            toggle card shadowOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardBlurOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardBlurOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardBlurOff (reloads)"
                          >
                            toggle card blurOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardBorderOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardBorderOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardBorderOff (reloads)"
                          >
                            toggle card borderOff
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDebugFlag('dailyCardMaskOff')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugDailyCardMaskOff ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle dailyCardMaskOff (reloads)"
                          >
                            toggle card maskOff
                          </button>

                          <button
                            type="button"
                            onClick={toggleBuildProbe}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle buildProbe (session only)"
                          >
                            hide probe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {!hideCards && (
                    <HomeHub
                      onSelectSection={handleSectionSelect}
                      activeSection={activeSection}
                      onStageChange={(hsl, stageName) => handleAvatarStageSelection(stageName)}
                      isPracticing={isPracticing}
                      currentStage={effectivePreviewStage}
                      previewPath={effectivePreviewPath}
                      previewShowCore={previewShowCore}
                      previewAttention={previewAttention}
                      onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                      lockToHub={playgroundMode}
                      debugDisableDailyCard={debugDisableDailyCard}
                      debugBuildProbe={debugBuildProbe && debugShadowScan}
                      debugShadowScan={debugShadowScan}
                      debugDailyCardShadowOff={debugDailyCardShadowOff}
                      debugDailyCardBlurOff={debugDailyCardBlurOff}
                      debugDailyCardBorderOff={debugDailyCardBorderOff}
                      debugDailyCardMaskOff={debugDailyCardMaskOff}
                    />
                  )}
                </div>
              ) : (
                <SectionView
                  section={activeSection}
                  isPracticing={isPracticing}
                  currentPracticeId={activePracticeId}
                  isFullscreenExperience={isFullscreenExperience}
                  isActiveBreathSession={isActiveBreathSession}
                  isBreathLayoutLocked={isBreathLayoutLocked}
                  onPracticingChange={handlePracticingChange}
                  breathState={breathState}
                  onBreathStateChange={setBreathState}
                  onStageChange={(hsl, stageName) => handleAvatarStageSelection(stageName)}
                  currentStage={effectivePreviewStage}
                  previewPath={effectivePreviewPath}
                  previewShowCore={previewShowCore}
                  previewAttention={previewAttention}
                  showFxGallery={showFxGallery}
                  onNavigate={handleSectionSelect}
                  onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                  onRitualComplete={() => handleSectionSelect(null)}
                  onOpenPhotic={handleOpenPhotic}
                  hideCards={hideCards}
                />
              )}
            </main>
          </div>

          <HardwareGuide
            isOpen={isHardwareGuideOpen}
            onClose={() => setIsHardwareGuideOpen(false)}
          />

          <InstallPrompt />

          {/* Tutorial overlay system */}
          <TutorialOverlay />

          {/* Debug overlay: identifies the actual element owning shadows/filters/backdrop when enabled */}
          <ShadowScanOverlay enabled={isDev && debugShadowScan} />
        </div >
      </div >
    </ThemeProvider >
    </AuthGate>
  );
}

function AppWithBoundary(props) {
  return (
    <ErrorBoundary>
      <App {...props} />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
