import React, { useState } from "react";
import { Avatar } from "./components/Avatar.jsx";
import { PracticeSection } from "./components/PracticeSection.jsx";
import { WisdomSection } from "./components/WisdomSection.jsx";
import { ApplicationSection } from "./components/ApplicationSection.jsx";
import { NavigationSection } from "./components/NavigationSection.jsx";
import { Background } from "./components/Background.jsx";

const SECTION_LABELS = {
  practice: "Practice",
  wisdom: "Wisdom",
  application: "Application",
  navigation: "Navigation",
};

function HomeHub({ onSelectSection }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Avatar centered relative to full viewport */}
      <div className="w-full flex items-center justify-center mt-8 mb-4">
        <Avatar mode="hub" />
      </div>

      {/* Modes grid constrained to content column */}
      <div className="w-full max-w-md">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-3">
          Modes
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectSection("practice")}
            className="group rounded-3xl bg-white/7 px-4 py-4 text-left backdrop-blur-md border border-white/10 hover:bg-white/12 transition-colors"
          >
            <div className="text-xs font-semibold text-white/90 mb-1">
              Practice
            </div>
            <div className="text-[11px] text-white/60">Breath & timer</div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection("wisdom")}
            className="group rounded-3xl bg-white/7 px-4 py-4 text-left backdrop-blur-md border border-white/10 hover:bg-white/12 transition-colors"
          >
            <div className="text-xs font-semibold text-white/90 mb-1">
              Wisdom
            </div>
            <div className="text-[11px] text-white/60">Treatise & videos</div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection("application")}
            className="group rounded-3xl bg-white/7 px-4 py-4 text-left backdrop-blur-md border border-white/10 hover:bg-white/12 transition-colors"
          >
            <div className="text-xs font-semibold text-white/90 mb-1">
              Application
            </div>
            <div className="text-[11px] text-white/60">Gesture tracking</div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection("navigation")}
            className="group rounded-3xl bg-white/7 px-4 py-4 text-left backdrop-blur-md border border-white/10 hover:bg-white/12 transition-colors"
          >
            <div className="text-xs font-semibold text-white/90 mb-1">
              Navigation
            </div>
            <div className="text-[11px] text-white/60">Roadmap & goals</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionView({ section }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full flex items-center justify-center mt-6 mb-4">
        <Avatar mode={section} />
      </div>

      <div className="w-full max-w-md flex-1">
        {section === "practice" && <PracticeSection />}
        {section === "wisdom" && <WisdomSection />}
        {section === "application" && <ApplicationSection />}
        {section === "navigation" && <NavigationSection />}
      </div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState(null);
  const isHub = activeSection === null;
  const currentLabel = isHub ? "Home" : SECTION_LABELS[activeSection];

  return (
    <div className="relative min-h-screen flex flex-col items-center text-white">
      <Background />

      <div className="relative z-10 w-full max-w-5xl flex-1 flex flex-col px-4 pt-6 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
            Immanence OS
          </div>

          <div className="text-sm font-medium text-white/80">
            {currentLabel}
          </div>

          <div className="min-w-[72px] flex justify-end">
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
          <HomeHub onSelectSection={setActiveSection} />
        ) : (
          <SectionView section={activeSection} />
        )}
      </div>
    </div>
  );
}

export default App;
