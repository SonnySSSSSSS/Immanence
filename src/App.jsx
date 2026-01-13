import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Avatar } from "./components/avatar";
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
import { IndrasNet } from "./components/IndrasNet.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { CurriculumCompletionReport } from "./components/CurriculumCompletionReport.jsx";
import { useCurriculumStore } from "./state/curriculumStore.js";
import { AvatarPreview } from "./components/AvatarPreview.jsx";
import { DevPanel } from "./components/DevPanel.jsx";
import { DisplayModeToggle } from "./components/DisplayModeToggle.jsx";
import { WidthToggle } from "./components/WidthToggle.jsx";
import { useDisplayModeStore } from "./state/displayModeStore.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { startImagePreloading } from "./utils/imagePreloader.js";
import { InstallPrompt } from "./components/InstallPrompt.jsx";
import { HardwareGuide } from "./components/HardwareGuide.jsx";
import { useWakeLock } from "./hooks/useWakeLock.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { PhoticCirclesOverlay } from "./components/PhoticCirclesOverlay.jsx";
// import { VerificationGallery } from "./components/avatar/VerificationGallery.jsx"; // Dev tool - not used
import "./App.css";

function SectionView({ section, isPracticing, currentPracticeId, isFullscreenExperience, onPracticingChange, breathState, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, showFxGallery, onNavigate, onOpenHardwareGuide, onRitualComplete, onOpenPhotic }) {
  // Navigation and Application sections handle their own avatars and stage titles
  // RitualLibrary also handles its own UI (no avatar needed)
  // Hide avatar during any active practice session
  const showAvatar = section !== 'navigation' && section !== 'application' && section !== 'ritualLibrary' && !isPracticing;

  // Special case: Insight Meditation renders PracticeSection directly (no avatar wrapper)
  const isInsightMeditation = isPracticing && currentPracticeId === 'cognitive_vipassana';
  if (isInsightMeditation) {
    return <PracticeSection 
      onPracticingChange={onPracticingChange} 
      section={section} 
      isPracticing={isPracticing} 
      currentPracticeId={currentPracticeId} 
      onStageChange={onStageChange} 
      currentStage={currentStage}
      previewPath={previewPath}
      previewShowCore={previewShowCore}
      previewAttention={previewAttention}
      showFxGallery={showFxGallery}
      onNavigate={onNavigate} 
      onOpenHardwareGuide={onOpenHardwareGuide}
      onRitualComplete={onRitualComplete} 
      onOpenPhotic={onOpenPhotic}
    />;
  }

  return (
    <div className="flex-1 flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      {showAvatar && (
          <div 
            className="w-full relative z-20 flex flex-col items-center"
            style={{
              marginTop: section === 'practice' ? '0.25rem' : '1.5rem',
              // Reclaim vertical space by overlapping the next section when shrunk
              marginBottom: section === 'practice' ? '-180px' : '12px',
              pointerEvents: 'none', // Avatar shouldn't block clicks
            }}
          >
            {/* Avatar with scale/fade during practice */}
            <div
              className="transition-all duration-700 ease-in-out"
              style={{
                transform: section === 'practice' ? 'scale(0.5)' : 'scale(0.5625)',
                transformOrigin: 'top center',
                opacity: 1,
                zIndex: 100,
                willChange: 'transform',
              }}
            >
            <Avatar
              mode={section}
              breathState={breathState}
              onStageChange={onStageChange}
              stage={currentStage}
              path={previewPath}
              showCore={previewShowCore}
              attention={previewAttention}
            />
          </div>
        </div>
      )}

      <div className="w-full flex-1 relative z-10 px-4 transition-all duration-500" style={{ overflow: 'visible' }}>
        {section === "practice" && <PracticeSection onPracticingChange={onPracticingChange} onBreathStateChange={onBreathStateChange} avatarPath={previewPath} showCore={previewShowCore} showFxGallery={showFxGallery} onNavigate={onNavigate} onOpenPhotic={onOpenPhotic} />}

        {section === "wisdom" && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="text-white/50 font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>Loading Wisdom...</div>
            </div>
          }>
            <WisdomSection />
          </Suspense>
        )}

        {section === "application" && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-12">
              <div className="text-white/50 font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--font-ui)' }}>Loading Application...</div>
            </div>
          }>
            <ApplicationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} />
          </Suspense>
        )}

        {section === "navigation" && <NavigationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} previewAttention={previewAttention} onNavigate={onNavigate} onOpenHardwareGuide={onOpenHardwareGuide} />}
      </div>
    </div>
  );
}


function App() {
  // Display mode (sanctuary/hearth) and color scheme (dark/light)
  const displayMode = useDisplayModeStore((s) => s.mode);
  const colorScheme = useDisplayModeStore((s) => s.colorScheme);
  const isLight = colorScheme === 'light';

  const outerBackground = isLight
    ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
    : '#000';

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle('hearth-viewport', displayMode === 'hearth');
    return () => root.classList.remove('hearth-viewport');
  }, [displayMode]);

  // Curriculum state
  const { 
    isCurriculumComplete,
    onboardingComplete: curriculumOnboardingComplete,
  } = useCurriculumStore();
  const [showCurriculumReport, setShowCurriculumReport] = useState(false);



  // Check if user has seen welcome screen
  const getHasSeenWelcome = () => {
    try {
      const stored = localStorage.getItem('immanenceOS.hasSeenWelcome');
      return stored === 'true';
    } catch {
      return false;
    }
  };

  // Load default view preference (defaulting to hub)
  const getDefaultView = () => {
    try {
      const stored = localStorage.getItem('immanenceOS.defaultView');
      return stored || 'hub'; // 'hub' or 'navigation'
    } catch {
      return 'hub';
    }
  };

  const [showWelcome, setShowWelcome] = useState(!getHasSeenWelcome());
  const [defaultView] = useState(getDefaultView());
  const [activeSection, setActiveSection] = useState(() => {
    // If default view is 'navigation', start there
    return defaultView === 'navigation' ? 'navigation' : null;
  });
  const [isPracticing, setIsPracticing] = useState(false);
  const [breathState, setBreathState] = useState({ phase: 'rest', progress: 0, isPracticing: false });
  const [avatarStage, setAvatarStage] = useState("Seedling"); // Track avatar stage name for theme
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const showFxGallery = true; // FX Gallery dev mode
  const [showDevPanel, setShowDevPanel] = useState(false); // Dev Panel (🎨 button)
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isPhoticOpen, setIsPhoticOpen] = useState(false);
  const [isMinimized] = useState(false);

  // Screen Wake Lock when in Vigilance Mode
  useWakeLock(isMinimized);

  // Preview state (lifted from AvatarPreview to persist and apply to all avatars)
  const [previewStage, setPreviewStage] = useState('Seedling');
  const [previewPath, setPreviewPath] = useState('Soma');
  const [previewShowCore, setPreviewShowCore] = useState(true);
  const [previewAttention, setPreviewAttention] = useState('none');

  // Sync avatarStage with previewStage so theme colors update
  useEffect(() => {
    setAvatarStage(previewStage);
  }, [previewStage]);

  // Keyboard shortcut: Shift+P to open Avatar Preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'P') {
        setShowAvatarPreview((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preload critical images on app start
  useEffect(() => {
    startImagePreloading(import.meta.env.BASE_URL);
  }, []);

  // Initialize viewport resize listener
  const initViewportListener = useDisplayModeStore((s) => s.initViewportListener);
  useEffect(() => {
    initViewportListener();
  }, [initViewportListener]);

  // Check curriculum state (after showWelcome is declared)
  useEffect(() => {
    // Show completion report if curriculum complete and not dismissed
    if (curriculumOnboardingComplete && isCurriculumComplete()) {
      setShowCurriculumReport(true);
    }
  }, [curriculumOnboardingComplete, isCurriculumComplete]);

  // Note: CSS variables now set by ThemeProvider based on avatarStage

  // Practice identification
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [isFullscreenExperience, setIsFullscreenExperience] = useState(false);

  const handlePracticingChange = (val, pid = null, requiresFullscreen = false) => {
    setIsPracticing(val);
    if (pid) setActivePracticeId(pid);
    else if (!val) setActivePracticeId(null);
    // Set fullscreen experience based on practice metadata
    setIsFullscreenExperience(val && requiresFullscreen);
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    try {
      localStorage.setItem('immanenceOS.hasSeenWelcome', 'true');
    } catch {
      // ignore
    }
  };

  const isHub = activeSection === null;
  return (
    <ThemeProvider currentStage={avatarStage}>

      {/* Show welcome screen on first visit */}
      {showWelcome && <WelcomeScreen onDismiss={handleDismissWelcome} />}

      {/* Curriculum Completion Report */}
      {showCurriculumReport && (
        <CurriculumCompletionReport
          onDismiss={() => setShowCurriculumReport(false)}
        />
      )}

      {/* Avatar Preview Debug Panel */}
      {showAvatarPreview && (
        <AvatarPreview
          onClose={() => setShowAvatarPreview(false)}
          stage={previewStage}
          path={previewPath}
          showCore={previewShowCore}
          onStageChange={setPreviewStage}
          onPathChange={setPreviewPath}
          onShowCoreChange={setPreviewShowCore}
        />
      )}

      {/* Dev Panel (🎨 button or Ctrl+Shift+D) */}
      <DevPanel
        isOpen={showDevPanel}
        onClose={() => setShowDevPanel(false)}
        avatarStage={previewStage}
        setAvatarStage={setPreviewStage}
        avatarPath={previewPath}
        setAvatarPath={setPreviewPath}
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
          } : {
            // Hearth: Phone width (430px)
            width: '100%',
            maxWidth: '430px',
            boxShadow: '0 0 100px rgba(255, 120, 40, 0.15), 0 0 200px rgba(255, 80, 20, 0.08)',
            height: '100dvh',
            overflow: 'hidden',
          }}
        >
          <Background stage={previewStage} />

          <div className={displayMode === 'hearth'
            ? 'relative z-10 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide'
            : 'relative z-10 w-full flex-1 flex flex-col overflow-visible'}>
            {/* Fixed Dark Header Bar */}
            <header
              className="sticky top-0 z-50 w-full px-6 py-3 transition-colors duration-500"
              style={{
                background: isLight
                  ? 'linear-gradient(180deg, rgba(200,185,165,0.1) 0%, rgba(210,195,175,0.05) 60%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderBottom: isLight
                  ? '1px solid rgba(140,120,90,0.15)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between w-full h-full relative">
                {/* Left: Branding */}
                <div className="flex-1 flex items-center justify-start">
                  <div
                    className={`text-[10px] text-suspended ${isLight ? 'text-[#5A4D3C]/70' : 'text-white/60'}`}
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.15em' }}
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
                      onClick={() => setShowDevPanel(v => !v)}
                      className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                      title="Dev Panel (Ctrl+Shift+D)"
                      style={{ color: showDevPanel ? 'var(--accent-color)' : undefined }}
                    >
                      🎨
                    </button>
                    <div
                      className={`text-[8px] uppercase tracking-[0.15em] ${isLight ? 'text-[#5A4D3C]/50' : 'text-white/40'}`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                        v3.23.55
                    </div>
                  </div>

                  {!isHub && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className={`text-[11px] uppercase tracking-[0.15em] px-2 py-1 rounded-lg transition-colors ${isLight ? 'text-[#5A4D3C]/70 hover:text-[#3D3425] hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
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
              {isHub ? (
                <div key="hub" className="section-enter">
                  <HomeHub
                    onSelectSection={setActiveSection}
                    onStageChange={(hsl, stageName) => {
                      setAvatarStage(stageName);
                      setPreviewStage(stageName);
                    }}
                    isPracticing={isPracticing}
                    currentStage={previewStage}
                    previewPath={previewPath}
                    previewShowCore={previewShowCore}
                    previewAttention={previewAttention}
                    onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                  />
                </div>
              ) : (
                <SectionView
                  key={activeSection}
                  section={activeSection}
                  isPracticing={isPracticing}
                  currentPracticeId={activePracticeId}
                  isFullscreenExperience={isFullscreenExperience}
                  onPracticingChange={handlePracticingChange}
                  breathState={breathState}
                  onBreathStateChange={setBreathState}
                  onStageChange={(hsl, stageName) => {
                    setAvatarStage(stageName);
                    setPreviewStage(stageName);
                  }}
                  currentStage={previewStage}
                  previewPath={previewPath}
                  previewShowCore={previewShowCore}
                  previewAttention={previewAttention}
                  showFxGallery={showFxGallery}
                  onNavigate={setActiveSection}
                  onOpenHardwareGuide={() => setIsHardwareGuideOpen(true)}
                  onRitualComplete={() => setActiveSection(null)}
                  onOpenPhotic={() => setIsPhoticOpen(true)}
                />
              )}
            </div>
          </div>

          <HardwareGuide
            isOpen={isHardwareGuideOpen}
            onClose={() => setIsHardwareGuideOpen(false)}
          />

          <InstallPrompt />

          {/* Indra's Net - animated web at bottom (hidden during practice sessions) */}
          <IndrasNet stage={previewStage} isPracticing={isPracticing} isLight={isLight} displayMode={displayMode} currentPracticeId={activePracticeId} />
        </div >
      </div >
    </ThemeProvider >
  );
}

function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
