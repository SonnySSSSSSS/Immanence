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
  const setUserMode = useUserModeStore((s) => s.setUserMode);
  const setActiveUserModeUserId = useUserModeStore((s) => s.setActiveUserId);
  const practiceLaunchContext = useUiStore((s) => s.practiceLaunchContext);
  const onboardingComplete = useCurriculumStore((s) => s.onboardingComplete);
  const practiceTimeSlots = useCurriculumStore((s) => s.practiceTimeSlots);
  const needsSetup = !onboardingComplete && (!practiceTimeSlots || practiceTimeSlots.length === 0);
  const isLight = colorScheme === 'light';

  const outerBackground = isLight
    ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
    : '#000';
  const APP_FRAME_WIDTH = 'min(100vw, calc(100dvh * 1080 / 1920))';
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
  const [authUser, setAuthUser] = useState(null);
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

  const handleSectionSelect = useCallback((section) => {
    if (playgroundMode) {
      setActiveSection(null);
      return;
    }
    if (userMode !== 'student') {
      setActiveSection(section);
      return;
    }
    if (section === null) {
      setActiveSection(null);
      return;
    }
    if (section === 'navigation') {
      if (needsSetup) {
        setActiveSection('navigation');
      }
      return;
    }
    if (section === 'practice') {
      if (practiceLaunchContext) {
        setActiveSection('practice');
      }
      return;
    }
  }, [needsSetup, playgroundMode, practiceLaunchContext, userMode]);

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
      setActiveUserModeUserId(null);
      setAuthUser(null);
      stopUserStateSync();
      setShowSettings(false);
      setActiveSection(null);
      return;
    }

    if (event === "USER_UPDATED" && session) {
      setActiveUserModeUserId(session?.user?.id ?? null);
      setAuthUser(session?.user ?? null);
      return;
    }

    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      setActiveUserModeUserId(session?.user?.id ?? null);
      setAuthUser(session?.user ?? null);
      stopUserStateSync();
      startUserStateSync(session);
      setShowSettings(false);
      setActiveSection(null);
    }
  }, [setActiveUserModeUserId, startUserStateSync, stopUserStateSync]);
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
                        v3.27.268
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
                <div className="w-full min-h-full flex items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
                  <div
                    className="w-full max-w-4xl overflow-hidden rounded-[28px] border"
                    style={{
                      background: isLight
                        ? 'linear-gradient(180deg, rgba(248,242,233,0.96) 0%, rgba(236,228,216,0.94) 100%)'
                        : 'linear-gradient(180deg, rgba(8,12,20,0.94) 0%, rgba(6,8,15,0.98) 100%)',
                      borderColor: isLight ? 'rgba(124, 104, 78, 0.20)' : 'rgba(255,255,255,0.10)',
                      boxShadow: isLight
                        ? '0 22px 70px rgba(65, 50, 30, 0.16)'
                        : '0 28px 90px rgba(0,0,0,0.42)',
                    }}
                  >
                    <div
                      className="relative overflow-hidden px-4 pb-4 pt-4 sm:px-8 sm:pb-8 sm:pt-7"
                      style={{
                        background: isLight
                          ? 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
                      }}
                    >
                      <div
                        aria-hidden="true"
                        className="relative mb-3 overflow-hidden rounded-[18px] border sm:mb-8 sm:rounded-[22px]"
                        style={{
                          height: 'clamp(68px, 12vw, 220px)',
                          borderColor: isLight ? 'rgba(124, 104, 78, 0.16)' : 'rgba(255,255,255,0.08)',
                          background: isLight
                            ? 'linear-gradient(135deg, rgba(233,223,205,0.92) 0%, rgba(216,205,184,0.76) 42%, rgba(193,206,191,0.58) 100%)'
                            : 'linear-gradient(135deg, rgba(10,18,31,0.98) 0%, rgba(17,34,54,0.9) 45%, rgba(38,58,48,0.74) 100%)',
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            background: isLight
                              ? 'radial-gradient(circle at 50% 42%, rgba(255,247,220,0.92) 0%, rgba(255,240,196,0.34) 20%, rgba(255,255,255,0) 48%)'
                              : 'radial-gradient(circle at 50% 42%, rgba(244,219,149,0.32) 0%, rgba(122,198,255,0.14) 24%, rgba(0,0,0,0) 54%)',
                          }}
                        />
                        <div
                          className="absolute left-1/2 top-1/2 rounded-full hidden sm:block"
                          style={{
                            width: 'clamp(132px, 22vw, 188px)',
                            height: 'clamp(132px, 22vw, 188px)',
                            transform: 'translate(-50%, -50%)',
                            border: isLight
                              ? '1px solid rgba(120, 96, 62, 0.20)'
                              : '1px solid rgba(255,255,255,0.12)',
                            boxShadow: isLight
                              ? '0 0 0 14px rgba(255,255,255,0.14), inset 0 0 24px rgba(255,255,255,0.28)'
                              : '0 0 0 14px rgba(255,255,255,0.04), inset 0 0 28px rgba(255,255,255,0.08)',
                          }}
                        />
                        <div
                          className="absolute left-1/2 top-1/2 rounded-full hidden sm:block"
                          style={{
                            width: 'clamp(78px, 13vw, 116px)',
                            height: 'clamp(78px, 13vw, 116px)',
                            transform: 'translate(-50%, -50%)',
                            border: isLight
                              ? '1px solid rgba(120, 96, 62, 0.24)'
                              : '1px solid rgba(255,255,255,0.16)',
                            background: isLight
                              ? 'radial-gradient(circle, rgba(255,252,244,0.94) 0%, rgba(252,240,213,0.34) 54%, rgba(255,255,255,0) 100%)'
                              : 'radial-gradient(circle, rgba(255,240,204,0.18) 0%, rgba(255,255,255,0.06) 56%, rgba(255,255,255,0) 100%)',
                          }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 h-20"
                          style={{
                            background: isLight
                              ? 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(243,234,222,0.78) 100%)'
                              : 'linear-gradient(180deg, rgba(3,7,12,0) 0%, rgba(3,7,12,0.82) 100%)',
                          }}
                        />
                      </div>

                      <div className="mx-auto max-w-3xl text-center">
                        <div
                          className="type-label mb-1 uppercase tracking-[0.14em] sm:mb-3 sm:tracking-[0.22em]"
                          style={{ color: isLight ? 'rgba(90,77,60,0.62)' : 'rgba(255,255,255,0.54)' }}
                        >
                          IMMANENCE OS
                        </div>
                        <h1
                          className="mb-1 text-2xl font-semibold leading-[1.05] sm:mb-3 sm:text-4xl sm:leading-tight"
                          style={{ color: isLight ? '#3D3425' : 'rgba(255,255,255,0.96)' }}
                        >
                          Choose how you want to enter
                        </h1>
                        <p
                          className="mx-auto mb-3 max-w-2xl text-sm leading-[1.35] sm:mb-8 sm:text-base sm:leading-6"
                          style={{ color: isLight ? 'rgba(61,52,37,0.76)' : 'rgba(255,255,255,0.74)' }}
                        >
                          Student mode guides you through the curriculum with fewer choices. Explorer mode opens the full system from the start.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                        <section
                          className="rounded-[20px] border p-4 sm:rounded-[24px] sm:p-6"
                          style={{
                            borderColor: isLight ? 'rgba(124, 101, 66, 0.20)' : 'rgba(255,255,255,0.10)',
                            background: isLight
                              ? 'linear-gradient(180deg, rgba(255,252,247,0.92) 0%, rgba(247,240,230,0.86) 100%)'
                              : 'linear-gradient(180deg, rgba(19,24,33,0.94) 0%, rgba(13,17,25,0.96) 100%)',
                            boxShadow: isLight
                              ? 'inset 0 1px 0 rgba(255,255,255,0.56)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="mb-3 sm:mb-5">
                            <div
                              className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] sm:mb-2 sm:text-xs sm:tracking-[0.18em]"
                              style={{ color: isLight ? 'rgba(112,86,50,0.68)' : 'rgba(214,194,145,0.76)' }}
                            >
                              Guided practice
                            </div>
                            <h2
                              className="text-xl font-semibold sm:text-2xl"
                              style={{ color: isLight ? '#3D3425' : 'rgba(255,255,255,0.96)' }}
                            >
                              Student
                            </h2>
                          </div>
                          <ul
                            className="mb-4 space-y-2 text-sm leading-5 sm:mb-6 sm:space-y-3 sm:leading-6"
                            style={{ color: isLight ? 'rgba(61,52,37,0.76)' : 'rgba(255,255,255,0.76)' }}
                          >
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#8B6A3F' : '#D9B76D' }} />
                              <span>Start with curriculum flow</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#8B6A3F' : '#D9B76D' }} />
                              <span>Fewer sections until setup</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#8B6A3F' : '#D9B76D' }} />
                              <span>Best for structured progression</span>
                            </li>
                          </ul>
                          <button
                            type="button"
                            onClick={() => setUserMode('student')}
                            className="w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] sm:py-3"
                            style={{
                              background: isLight
                                ? 'linear-gradient(135deg, #8A9B8C 0%, #708C81 100%)'
                                : 'linear-gradient(135deg, rgba(128,162,146,0.96) 0%, rgba(91,124,113,0.96) 100%)',
                              color: '#F8F5EF',
                              boxShadow: isLight
                                ? '0 12px 28px rgba(112,140,129,0.24)'
                                : '0 12px 28px rgba(62,100,88,0.32)',
                            }}
                          >
                            Enter as Student
                          </button>
                        </section>

                        <section
                          className="rounded-[20px] border p-4 sm:rounded-[24px] sm:p-6"
                          style={{
                            borderColor: isLight ? 'rgba(82,109,126,0.24)' : 'rgba(122,198,255,0.18)',
                            background: isLight
                              ? 'linear-gradient(180deg, rgba(248,252,255,0.94) 0%, rgba(236,244,249,0.90) 100%)'
                              : 'linear-gradient(180deg, rgba(14,22,38,0.96) 0%, rgba(10,16,28,0.98) 100%)',
                            boxShadow: isLight
                              ? 'inset 0 1px 0 rgba(255,255,255,0.68)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                          }}
                        >
                          <div className="mb-3 sm:mb-5">
                            <div
                              className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] sm:mb-2 sm:text-xs sm:tracking-[0.18em]"
                              style={{ color: isLight ? 'rgba(72,101,125,0.72)' : 'rgba(143,204,255,0.78)' }}
                            >
                              Full access
                            </div>
                            <h2
                              className="text-xl font-semibold sm:text-2xl"
                              style={{ color: isLight ? '#243647' : 'rgba(255,255,255,0.96)' }}
                            >
                              Explorer
                            </h2>
                          </div>
                          <ul
                            className="mb-4 space-y-2 text-sm leading-5 sm:mb-6 sm:space-y-3 sm:leading-6"
                            style={{ color: isLight ? 'rgba(48,66,83,0.80)' : 'rgba(255,255,255,0.78)' }}
                          >
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#557E9A' : '#79BFFF' }} />
                              <span>Full section access immediately</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#557E9A' : '#79BFFF' }} />
                              <span>Move freely across the app</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span aria-hidden="true" className="mt-1.5 h-2 w-2 rounded-full" style={{ background: isLight ? '#557E9A' : '#79BFFF' }} />
                              <span>Best for self-directed use</span>
                            </li>
                          </ul>
                          <button
                            type="button"
                            onClick={() => setUserMode('explorer')}
                            className="w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] sm:py-3"
                            style={{
                              background: isLight
                                ? 'linear-gradient(135deg, #5D819A 0%, #3C627B 100%)'
                                : 'linear-gradient(135deg, rgba(99,156,198,0.98) 0%, rgba(58,100,133,0.98) 100%)',
                              color: '#F8FAFC',
                              boxShadow: isLight
                                ? '0 12px 28px rgba(70,110,138,0.24)'
                                : '0 12px 28px rgba(39,76,108,0.32)',
                            }}
                          >
                            Enter as Explorer
                          </button>
                        </section>
                      </div>
                    </div>
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
