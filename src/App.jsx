import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Avatar } from "./components/avatar";
import { StageTitle } from "./components/StageTitle.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { HomeHub } from "./components/HomeHub.jsx";

// Lazy load heavy sections for better initial performance
// Named exports need to be wrapped for React.lazy
const WisdomSection = lazy(() => import("./components/WisdomSection.jsx").then(m => ({ default: m.WisdomSection })));
const ApplicationSection = lazy(() => import("./components/ApplicationSection.jsx").then(m => ({ default: m.ApplicationSection })));
import { NavigationSection } from "./components/NavigationSection.jsx";
import { Background } from "./components/Background.jsx";
import { IndrasNet } from "./components/IndrasNet.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { CurriculumOnboarding } from "./components/CurriculumOnboarding.jsx";
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
import { SigilTracker } from "./components/SigilTracker.jsx";
import { HardwareGuide } from "./components/HardwareGuide.jsx";
import { useWakeLock } from "./hooks/useWakeLock.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";

const SECTION_LABELS = {
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};


function SectionView({ section, isPracticing, onPracticingChange, breathState, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, previewAttention, showFxGallery, onNavigate, onOpenHardwareGuide }) {
  // Navigation and Application sections handle their own avatars and stage titles
  const showAvatar = section !== 'navigation' && section !== 'application';

  return (
    <div className="flex-1 flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      {showAvatar && (
        <div className="w-full flex flex-col items-center mt-6 mb-4 relative z-20">
          {/* Avatar with scale/fade during practice */}
          <div
            className="transition-all duration-500"
            style={{
              transform: isPracticing ? 'scale(0.65)' : 'scale(1)',
              opacity: isPracticing ? 0.5 : 1,
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
        {section === "practice" && <PracticeSection onPracticingChange={onPracticingChange} onBreathStateChange={onBreathStateChange} avatarPath={previewPath} showCore={previewShowCore} showFxGallery={showFxGallery} />}

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

  // Curriculum state
  const { 
    shouldShowOnboarding, 
    isCurriculumComplete,
    onboardingComplete: curriculumOnboardingComplete,
  } = useCurriculumStore();
  const [showCurriculumOnboarding, setShowCurriculumOnboarding] = useState(false);
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
  const [defaultView, setDefaultView] = useState(getDefaultView());
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
  const [isSigilTrackerOpen, setIsSigilTrackerOpen] = useState(false);
  const [isHardwareGuideOpen, setIsHardwareGuideOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const lastTapRef = useRef(0);

  // Screen Wake Lock when in Vigilance Mode
  useWakeLock(isMinimized);

  const handleDoubleTap = (e) => {
    const now = Date.now();
    const delay = now - lastTapRef.current;
    if (delay < 300 && delay > 0) {
      // Double tap detected
      setIsSigilTrackerOpen(true);
    }
    lastTapRef.current = now;
  };
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

  // Check curriculum state (after showWelcome is declared)
  useEffect(() => {
    // Show onboarding if needed (after welcome screen is dismissed)
    if (!showWelcome && shouldShowOnboarding()) {
      setShowCurriculumOnboarding(true);
    }
    // Show completion report if curriculum complete and not dismissed
    if (curriculumOnboardingComplete && isCurriculumComplete()) {
      setShowCurriculumReport(true);
    }
  }, [showWelcome, curriculumOnboardingComplete]);

  // Note: CSS variables now set by ThemeProvider based on avatarStage

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    try {
      localStorage.setItem('immanenceOS.hasSeenWelcome', 'true');
    } catch {
      // ignore
    }
  };

  const isHub = activeSection === null;
  const currentLabel = isHub ? "Home" : SECTION_LABELS[activeSection];

  // Persist default view preference
  const updateDefaultView = (view) => {
    setDefaultView(view);
    try {
      localStorage.setItem('immanenceOS.defaultView', view);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeProvider currentStage={avatarStage}>

      {/* Show welcome screen on first visit */}
      {showWelcome && <WelcomeScreen onDismiss={handleDismissWelcome} />}

      {/* Curriculum Onboarding (skippable) */}
      {showCurriculumOnboarding && (
        <CurriculumOnboarding 
          onDismiss={() => setShowCurriculumOnboarding(false)}
          onComplete={() => setShowCurriculumOnboarding(false)}
        />
      )}

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
          background: isLight
            ? 'linear-gradient(135deg, #F5F0E6 0%, #EDE5D8 100%)'
            : (displayMode === 'sanctuary'
              ? 'linear-gradient(135deg, #0a0a12 0%, #050508 100%)'
              : '#000'),
        }}
      >
        {/* Side mask - left side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 left-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: '#000',
          }}
        />

        {/* Side mask - right side (dynamic based on display mode) */}
        <div
          className="fixed inset-y-0 right-0 pointer-events-none z-50 transition-all duration-500"
          style={{
            width: displayMode === 'sanctuary'
              ? 'calc((100vw - min(100vw, 820px)) / 2)'
              : 'calc((100vw - min(100vw, 430px)) / 2)',
            background: '#000',
          }}
        />

        {/* Inner App Container */}
        <div
          className={`relative min-h-screen flex flex-col items-center overflow-visible transition-all duration-500 ${isLight ? 'text-[#3D3425]' : 'text-white'}`}
          onPointerDown={handleDoubleTap}
          style={displayMode === 'sanctuary' ? {
            // Sanctuary: iPad width (820px)
            width: '100%',
            maxWidth: '820px',
            boxShadow: 'none',
          } : {
            // Hearth: Phone width (430px)
            width: '100%',
            maxWidth: '430px',
            boxShadow: '0 0 100px rgba(255, 120, 40, 0.15), 0 0 200px rgba(255, 80, 20, 0.08)',
          }}
        >
          <Background stage={previewStage} />

          {/* HAMBURGER MENU - Inside App Container, absolute positioned to stay within UI bounds */}
          {displayMode === 'hearth' && (
            <div className="absolute top-3 right-2 z-[9999]">
              <button
                type="button"
                onClick={() => setShowDevPanel(v => !v)}
                className={`p-2.5 rounded-xl transition-all shadow-lg ${showDevPanel
                  ? (isLight ? 'bg-amber-100' : 'bg-white/20')
                  : (isLight ? 'bg-white/90' : 'bg-black/70')
                  }`}
                style={{
                  backdropFilter: 'blur(12px)',
                  border: isLight
                    ? '2px solid rgba(140, 120, 90, 0.4)'
                    : '2px solid rgba(255, 255, 255, 0.2)',
                }}
                aria-label="Menu"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isLight ? 'rgba(90, 77, 60, 0.9)' : 'rgba(255, 255, 255, 0.8)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDevPanel && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    background: isLight
                      ? 'rgba(255, 252, 245, 0.98)'
                      : 'rgba(20, 18, 16, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: isLight
                      ? '2px solid rgba(140, 120, 90, 0.35)'
                      : '2px solid rgba(255, 255, 255, 0.15)',
                    minWidth: '160px'
                  }}
                >
                  <div className="flex flex-col gap-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${isLight ? 'text-[#5A4D3C]' : 'text-white/80'}`}>Width</span>
                      <WidthToggle />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${isLight ? 'text-[#5A4D3C]' : 'text-white/80'}`}>Theme</span>
                      <DisplayModeToggle />
                    </div>
                    <div
                      className="h-px w-full"
                      style={{
                        background: isLight
                          ? 'rgba(90, 77, 60, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <div className={`text-[9px] text-center ${isLight ? 'text-[#5A4D3C]/50' : 'text-white/40'}`}>v3.15.59</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative z-10 w-full flex-1 flex flex-col overflow-visible">
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
                {/* Left: Branding (Sanctuary) or Empty (Hearth) */}
                <div className="flex-1 flex items-center justify-start">
                  {displayMode === 'sanctuary' && (
                    <div
                      className={`text-[10px] text-suspended ${isLight ? 'text-[#5A4D3C]/70' : 'text-white/60'}`}
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.15em' }}
                    >
                      IMMANENCE OS
                    </div>
                  )}
                </div>

                {/* Center Element: StageTitle - Always visible, Absolutely positioned for true centering */}
                {/* We use a container to ensure hit targets or relative positioning don't bleed */}
                <div
                  className="absolute left-1/2 top-1/2 flex justify-center items-center pointer-events-none"
                  style={{
                    transform: 'translate(-50%, calc(-50% - 5px)) scaleX(0.65) scaleY(0.6)',
                    width: 'min(50vw, 400px)',
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="pointer-events-auto">
                    <StageTitle
                      stage={previewStage}
                      path={previewPath}
                      attention={previewAttention}
                      showWelcome={false}
                    />
                  </div>
                </div>

                {/* Right: Controls & Home Button */}
                <div className="flex-1 flex items-center justify-end gap-3">
                  {displayMode === 'sanctuary' && (
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
                        v3.15.59
                      </div>
                    </div>
                  )}

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
                  onPracticingChange={setIsPracticing}
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
                />
              )}
            </div>
          </div>

          <SigilTracker
            isOpen={isSigilTrackerOpen}
            onClose={() => setIsSigilTrackerOpen(false)}
            stage={previewStage}
          />

          <HardwareGuide
            isOpen={isHardwareGuideOpen}
            onClose={() => setIsHardwareGuideOpen(false)}
          />

          <InstallPrompt />

          {/* Indra's Net - animated web at bottom */}
          <IndrasNet stage={previewStage} isPracticing={isPracticing} isLight={isLight} />
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
