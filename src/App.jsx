import { useState, useEffect, useCallback, lazy, Suspense } from "react";
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
import { DevPanel } from "./components/DevPanel.jsx";
import { DisplayModeToggle } from "./components/DisplayModeToggle.jsx";
import { WidthToggle } from "./components/WidthToggle.jsx";
import { useDisplayModeStore } from "./state/displayModeStore.js";
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
// import { VerificationGallery } from "./components/avatar/VerificationGallery.jsx"; // Dev tool - not used
import "./App.css";
import AuthGate from "./components/auth/AuthGate";

function SectionView({ section, isPracticing, currentPracticeId, onPracticingChange, breathState, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, showFxGallery, onNavigate, onOpenHardwareGuide, onRitualComplete, onOpenPhotic, hideCards }) {
  // NOTE: Previously had a special vipassana branch that rendered PracticeSection without wrapper divs.
  // This caused unmount/remount when transitioning to vipassana practices because the tree structure changed.
  // REMOVED: The vipassana InsightMeditationPortal uses createPortal to render to document.body,
  // so wrapper divs don't affect its fullscreen rendering. Keeping consistent tree structure prevents
  // the unmount/remount bug that was resetting sessions.
  
  return (
    <div className="w-full flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      <div className="w-full relative z-10 px-4 transition-all duration-500" style={{ overflow: 'visible' }}>
        {section === "practice" && !hideCards && (
          <PracticeSection 
            onPracticingChange={onPracticingChange} 
            onBreathStateChange={onBreathStateChange}
            avatarPath={previewPath} 
            showCore={previewShowCore}
            showFxGallery={showFxGallery} 
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
  // Display mode (sanctuary/hearth) and color scheme (dark/light)
  const displayMode = useDisplayModeStore((s) => s.mode);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const overrideStage = useDevOverrideStore((s) => s.stage);
  const overridePath = useDevOverrideStore((s) => s.avatarPath);
  const setOverrideStage = useDevOverrideStore((s) => s.setStage);
  const setOverridePath = useDevOverrideStore((s) => s.setAvatarPath);
  const isLight = colorScheme === 'light';

  const outerBackground = isLight
    ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
    : '#000';

  // Disable browser scroll restoration (fixes Edge loading Home scrolled down)
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle('hearth-viewport', displayMode === 'hearth');
    return () => root.classList.remove('hearth-viewport');
  }, [displayMode]);

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
  const [showDevPanel, setShowDevPanel] = useState(false); // Dev Panel (🎨 button)
  const [showSettings, setShowSettings] = useState(false); // Settings panel
  const [hideCards, setHideCards] = useState(false); // Dev mode: hide cards to view wallpaper
  // GRAVEYARD: Top layer removed
  // const [showBackgroundTopLayer, setShowBackgroundTopLayer] = useState(true);
  const [showBackgroundBottomLayer, setShowBackgroundBottomLayer] = useState(true); // Dev: toggle bottom wallpaper layer
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isPhoticOpen, setIsPhoticOpen] = useState(false);
  const [isMinimized] = useState(false);
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
  const isDev = import.meta.env.DEV;

  // Debug flags for visual investigations (dev-only; ignored in prod builds).
  const getDevFlag = useCallback((key) => {
    if (!isDev) return null;
    return getDebugFlagValue(key, { allowUrl: true });
  }, [isDev]);

  const debugDisableDailyCard = isDev && parseDebugBool(getDevFlag('disableDailyCard'));
  const debugBuildProbe = isDev && parseDebugBool(getDevFlag('buildProbe'));
  const debugShadowScan = isDev && parseDebugBool(getDevFlag('shadowScan'));
  const debugDailyCardShadowOff = isDev && parseDebugBool(getDevFlag('dailyCardShadowOff'));
  const debugDailyCardBlurOff = isDev && parseDebugBool(getDevFlag('dailyCardBlurOff'));
  const debugDailyCardBorderOff = isDev && parseDebugBool(getDevFlag('dailyCardBorderOff'));
  const debugDailyCardMaskOff = isDev && parseDebugBool(getDevFlag('dailyCardMaskOff'));

  const toggleDebugFlag = useCallback((key) => {
    if (!isDev) return;
    toggleDebugFlagLs(key);
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
    setActiveSection(section);
  }, [playgroundMode]);

  // Sync avatarStage with previewStage so theme colors update
  useEffect(() => {
    if (playgroundMode) return;
    setAvatarStage(previewStage);
  }, [playgroundMode, previewStage]);

  // Preload critical images on app start
  useEffect(() => {
    startImagePreloading(import.meta.env.BASE_URL);
  }, []);

  // Initialize viewport resize listener
  const initViewportListener = useDisplayModeStore((s) => s.initViewportListener);
  useEffect(() => {
    initViewportListener();
  }, [initViewportListener]);

  // DISABLED: Never auto-show completion report
  // User can manually access from HomeHub or CurriculumHub if needed
  // useEffect(() => {
  //   if (curriculumOnboardingComplete && isCurriculumComplete()) {
  //     setShowCurriculumReport(true);
  //   }
  // }, [curriculumOnboardingComplete, isCurriculumComplete]);

  // Note: CSS variables now set by ThemeProvider based on avatarStage

  // Practice identification
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState(null);
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

  const handleAuthChange = useCallback((event, session) => {
    if (event === "SIGNED_OUT") {
      setShowSettings(false);
      setActiveSection(null);
      return;
    }

    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      setShowSettings(false);
      setActiveSection(null);
    }
  }, []);

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

      {/* Outer Layout Container - Adapts to display mode */}
      <div
        className="min-h-screen w-full flex justify-center overflow-visible transition-colors duration-500 relative"
        style={{
          background: outerBackground,
        }}
      >
        {/* Side mask - left side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 left-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Side mask - right side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 right-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: outerBackground,
          }}
        />

        {/* Full-viewport Background (wallpaper fills entire screen) */}
        <Background stage={effectivePreviewStage} showBottomLayer={effectiveShowBackgroundBottomLayer} />

        <PhoticCirclesOverlay
          isOpen={isPhoticOpen}
          onClose={() => setIsPhoticOpen(false)}
          autoStart={true}
        />

        {/* Inner App Container */}
        <div
          data-app-frame
          className={`relative min-h-screen flex flex-col items-center overflow-visible transition-all duration-500 ${isLight ? 'text-[#3D3425]' : 'text-white'}`}
          style={displayMode === 'sanctuary' ? {
            // Sanctuary: iPad width (820px)
            width: '100%',
            maxWidth: '820px',
            boxShadow: 'none',
            overflowX: 'hidden',
            overflowY: 'visible',
            zIndex: 1,
          } : {
            // Hearth: Phone width (430px)
            width: '100%',
            maxWidth: '430px',
            boxShadow: '0 0 100px rgba(255, 120, 40, 0.15), 0 0 200px rgba(255, 80, 20, 0.08)',
            overflowX: 'hidden',
            overflowY: 'visible',
            zIndex: 1,
          }}
        >

          <div className='relative z-10 w-full flex flex-col overflow-x-hidden overflow-y-visible' style={isFirefox ? { transform: 'translateZ(0)' } : undefined}>
            {/* Fixed Dark Header Bar */}
            <header
              className="sticky top-0 z-50 w-full px-6 py-3 transition-colors duration-500"
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
                    className={`type-label ${isLight ? 'text-[#5A4D3C]/70' : 'text-white/60'}`}
                  >
                    IMMANENCE OS
                  </div>
                </div>

                {/* Right: Controls & Home Button */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  <div className="flex items-center gap-3">
                    <WidthToggle />
                    <DisplayModeToggle />
                    <button
                      type="button"
                      onClick={() => setShowSettings(v => !v)}
                      className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                      title="Settings"
                      style={{ color: showSettings ? 'var(--accent-color)' : undefined }}
                    >
                      ⚙️
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDevPanel(v => !v)}
                      className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                      title="Dev Panel (Ctrl+Shift+D)"
                      style={{ color: showDevPanel ? 'var(--accent-color)' : undefined }}
                    >
                      🎨
                    </button>
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
                    <div
                      className={`type-caption uppercase tracking-wide ${isLight ? 'text-[#5A4D3C]/50' : 'text-white/40'}`}
                    >
                      <button
                        type="button"
                        className="cursor-default"
                        title="Debug: Alt+Shift+Click toggles buildProbe. Alt+Ctrl+Click toggles disableDailyCard."
                        onClick={(e) => {
                          if (e.altKey && e.shiftKey) toggleDebugFlag('buildProbe');
                          if (e.altKey && (e.ctrlKey || e.metaKey)) toggleDebugFlag('disableDailyCard');
                        }}
                        style={{ background: 'transparent' }}
                      >
                        v3.27.133
                      </button>
                    </div>
                  </div>

                  {!isHub && !playgroundMode && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className={`type-label font-medium px-2 py-1 rounded-lg transition-colors ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                      Home
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Main content - hide when minimized */}
            <div
              style={{
                opacity: isMinimized ? 0 : 1,
                pointerEvents: isMinimized ? 'none' : 'auto',
                transition: 'opacity 0.7s ease'
              }}
              inert={isMinimized ? "" : undefined}
            >
              {(isHub || playgroundMode) ? (
                <div key="hub" className="section-enter">
                  {debugBuildProbe && (
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
                            onClick={() => toggleDebugFlag('shadowScan')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: debugShadowScan ? 'rgba(255, 80, 80, 0.20)' : 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle shadowScan overlay (reloads)"
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
                            onClick={() => toggleDebugFlag('buildProbe')}
                            className="px-2 py-1 rounded-md"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255, 80, 80, 0.35)',
                              color: 'inherit',
                            }}
                            title="Toggle buildProbe (reloads)"
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
                      onStageChange={(hsl, stageName) => handleAvatarStageSelection(stageName)}
                      isPracticing={isPracticing}
                      currentStage={effectivePreviewStage}
                      previewPath={effectivePreviewPath}
                      previewShowCore={previewShowCore}
                      previewAttention={previewAttention}
                      onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                      lockToHub={playgroundMode}
                      debugDisableDailyCard={debugDisableDailyCard}
                      debugBuildProbe={debugBuildProbe}
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
                  onOpenPhotic={() => setIsPhoticOpen(true)}
                  hideCards={hideCards}
                />
              )}
            </div>
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
