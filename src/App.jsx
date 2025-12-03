import React, { useState, useEffect } from "react";
import { Avatar } from "./components/Avatar.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { HomeHub } from "./components/HomeHub.jsx";
import { WisdomSection } from "./components/WisdomSection.jsx";
import { ApplicationSection } from "./components/ApplicationSection.jsx";
import { NavigationSection } from "./components/NavigationSection.jsx";
import { Background } from "./components/Background.jsx";
import { IndrasNet } from "./components/IndrasNet.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./App.css";

const SECTION_LABELS = {
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};


function SectionView({ section, isPracticing, onPracticingChange, breathState, onBreathStateChange, onStageChange }) {
  // Navigation and Application sections handle their own avatars
  const showAvatar = section !== 'navigation' && section !== 'application';

  return (
    <div className="flex-1 flex flex-col items-center section-enter">
      {showAvatar && (
        <div
          className="w-full flex items-center justify-center mt-6 mb-4 transition-all duration-500"
          style={{
            transform: isPracticing ? 'scale(0.65)' : 'scale(1)',
            opacity: isPracticing ? 0.5 : 1,
          }}
        >
          <Avatar mode={section} breathState={breathState} onStageChange={onStageChange} />
        </div>
      )}

      <div className="w-full max-w-md flex-1">
        {section === "practice" && <PracticeSection onPracticingChange={onPracticingChange} onBreathStateChange={onBreathStateChange} />}
        {section === "wisdom" && <WisdomSection />}
        {section === "application" && <ApplicationSection />}
        {section === "navigation" && <NavigationSection />}
      </div>
    </div>
  );
}


function App() {
  // Load default view preference (defaulting to hub)
  const getDefaultView = () => {
    try {
      const stored = localStorage.getItem('immanenceOS.defaultView');
      return stored || 'hub'; // 'hub' or 'navigation'
    } catch {
      return 'hub';
    }
  };

  const [defaultView, setDefaultView] = useState(getDefaultView());
  const [activeSection, setActiveSection] = useState(() => {
    // If default view is 'navigation', start there
    return defaultView === 'navigation' ? 'navigation' : null;
  });
  const [isPracticing, setIsPracticing] = useState(false);
  const [breathState, setBreathState] = useState({ phase: 'rest', progress: 0, isPracticing: false });
  const [avatarStage, setAvatarStage] = useState("Flame"); // Track avatar stage name for theme

  // Note: CSS variables now set by ThemeProvider based on avatarStage

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
      <div className="relative min-h-screen flex flex-col items-center text-white">
        <Background />

        <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col px-4 pt-6 pb-10 overflow-visible">
          {/* Header */}
          <header className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
              Immanence OS
            </div>

            <div className="text-sm font-medium text-white/80">
              {currentLabel}
            </div>

            <div className="min-w-[120px] flex-shrink-0 flex justify-end items-center gap-3">
              <div className="text-[8px] uppercase tracking-[0.15em] text-white/40">
                v1.4.46
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
              <HomeHub onSelectSection={setActiveSection} onStageChange={(hsl, stageName) => {
                console.log('📱 App received stage change:', stageName);
                console.log('📱 Setting avatarStage to:', stageName);
                setAvatarStage(stageName); // Update theme based on avatar stage
                console.log('📱 avatarStage state should now be:', stageName);
              }} />
            </div>
          ) : (
            <SectionView key={activeSection} section={activeSection} isPracticing={isPracticing} onPracticingChange={setIsPracticing} breathState={breathState} onBreathStateChange={setBreathState} onStageChange={(hsl, stageName) => {
              console.log('📱 SectionView received stage change:', stageName);
              setAvatarStage(stageName);
            }} />
          )}
        </div>

        {/* Indra's Net - animated web at bottom */}
        <IndrasNet />
      </div>
    </ThemeProvider>
  );
}

export default App;
