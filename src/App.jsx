import React, { useState, useEffect } from "react";
import { Avatar } from "./components/Avatar.jsx";
import { StageTitle } from "./components/StageTitle.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { HomeHub } from "./components/HomeHub.jsx";
import { WisdomSection } from "./components/WisdomSection.jsx";
import { ApplicationSection } from "./components/ApplicationSection.jsx";
import { NavigationSection } from "./components/NavigationSection.jsx";
import { Background } from "./components/Background.jsx";
import { IndrasNet } from "./components/IndrasNet.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { AvatarPreview } from "./components/AvatarPreview.jsx";
import { DevPanel } from "./components/DevPanel.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { startImagePreloading } from "./utils/imagePreloader.js";
import "./App.css";

const SECTION_LABELS = {
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};


function SectionView({ section, isPracticing, onPracticingChange, breathState, onBreathStateChange, onStageChange, currentStage, previewPath, previewShowCore, showFxGallery, onNavigate }) {
  // Navigation and Application sections handle their own avatars and stage titles
  const showAvatar = section !== 'navigation' && section !== 'application';

  return (
    <div className="flex-1 flex flex-col items-center section-enter" style={{ overflow: 'visible' }}>
      {showAvatar && (
        <div className="w-full flex flex-col items-center mt-6 mb-4">
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
            />
          </div>

          {/* Stage Title - fades out during practice */}
          <div
            className="transition-all duration-500 mt-4"
            style={{
              opacity: isPracticing ? 0 : 1,
              transform: isPracticing ? 'translateY(-10px)' : 'translateY(0)',
              pointerEvents: isPracticing ? 'none' : 'auto',
            }}
          >
            <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} showWelcome={false} />
          </div>
        </div>
      )}

      <div className="w-full max-w-md flex-1" style={{ overflow: 'visible' }}>
        {section === "practice" && <PracticeSection onPracticingChange={onPracticingChange} onBreathStateChange={onBreathStateChange} showFxGallery={showFxGallery} />}
        {section === "wisdom" && <WisdomSection />}
        {section === "application" && <ApplicationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} />}
        {section === "navigation" && <NavigationSection onStageChange={onStageChange} currentStage={currentStage} previewPath={previewPath} previewShowCore={previewShowCore} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}


function App() {
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
  const [avatarStage, setAvatarStage] = useState("Flame"); // Track avatar stage name for theme
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [showFxGallery, setShowFxGallery] = useState(true); // FX Gallery dev mode
  const [showDevPanel, setShowDevPanel] = useState(false); // Dev Panel (🎨 button)

  // Preview state (lifted from AvatarPreview to persist and apply to all avatars)
  const [previewStage, setPreviewStage] = useState('Flame');
  const [previewPath, setPreviewPath] = useState('Soma');
  const [previewShowCore, setPreviewShowCore] = useState(true);

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
      {console.log('🔄 App rendering with avatarStage:', avatarStage)}

      {/* Show welcome screen on first visit */}
      {showWelcome && <WelcomeScreen onDismiss={handleDismissWelcome} />}

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
      />

      {/* Outer Black Container (The "Theater") */}
      <div className="min-h-screen w-full flex justify-center bg-black overflow-visible">

        {/* Inner App Container (The "Screen") */}
        <div className="relative w-full max-w-[1024px] min-h-screen flex flex-col items-center text-white shadow-2xl overflow-visible">
          <Background stage={previewStage} />

          <div className="relative z-10 w-full flex-1 flex flex-col px-4 pt-6 pb-10 overflow-visible">
            {/* Header */}
            <header className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                Immanence OS
              </div>

              {/* Center label - only show when in a section, not on hub */}
              {!isHub && (
                <div className="text-sm font-medium text-white/80">
                  {currentLabel}
                </div>
              )}

              <div className="min-w-[120px] flex-shrink-0 flex justify-end items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDevPanel(v => !v)}
                  className="text-lg opacity-60 hover:opacity-100 active:scale-95 transition-all"
                  title="Dev Panel (Ctrl+Shift+D)"
                  style={{ color: showDevPanel ? 'var(--accent-color)' : undefined }}
                >
                  🎨
                </button>
                <div className="text-[8px] uppercase tracking-[0.15em] text-white/40">
                  v2.47.0
                </div>
                {!isHub && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(null)}
                    className="text-[11px] uppercase tracking-[0.18em] text-white/70 hover:text-white transition-colors"
                  >
                    Home
                  </button>
                )}
              </div>
            </header>

            {/* Main content */}
            {isHub ? (
              <div key="hub" className="section-enter">
                <HomeHub
                  onSelectSection={setActiveSection}
                  onStageChange={(hsl, stageName) => {
                    console.log('📱 App received stage change:', stageName);
                    setAvatarStage(stageName);
                    setPreviewStage(stageName);
                  }}
                  currentStage={previewStage}
                  previewPath={previewPath}
                  previewShowCore={previewShowCore}
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
                  console.log('📱 SectionView received stage change:', stageName);
                  setAvatarStage(stageName);
                  setPreviewStage(stageName);
                }}
                currentStage={previewStage}
                previewPath={previewPath}
                previewShowCore={previewShowCore}
                showFxGallery={showFxGallery}
                onNavigate={setActiveSection}
              />
            )}
          </div>

          {/* Indra's Net - animated web at bottom */}
          <IndrasNet stage={previewStage} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
