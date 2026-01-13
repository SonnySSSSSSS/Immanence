// src/components/ApplicationSection.jsx
import { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { Avatar } from './avatar';
import { StageTitle } from './StageTitle.jsx';
import { SigilSealingArea } from './SigilSealingArea.jsx';
import { FourModesHome } from './FourModesHome.jsx';
import { ModeDetail } from './ModeDetail.jsx';
import { ApplicationTrackingCard } from './ApplicationTrackingCard.jsx';

export function ApplicationSection({ onStageChange, currentStage, previewPath, previewShowCore, onNavigate }) {
  const { activePath } = useNavigationStore();
  const [selectedModeId, setSelectedModeId] = useState(null);
  const [showFourModes, setShowFourModes] = useState(false);

  const handleOpenArchive = (tab) => {
    const detail = { tab, reportDomain: null };
    try {
      window.__immanence_pending_archive = detail;
    } catch {
      // ignore
    }
    onNavigate?.(null);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('immanence-open-archive', { detail }));
    }, 50);
  };

  // No active path - show empty state
  if (!activePath) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col items-center pt-8">
          <div style={{ transform: 'scale(0.75)' }}>
            <Avatar mode="application" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-[#0f0f1a] border rounded-3xl p-12 text-center border-[var(--accent-15)]">
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 'var(--tracking-mythic)', color: 'var(--accent-color)' }}
          >
            Application
          </h2>
          <p
            className="text-base text-[rgba(253,251,245,0.7)] mb-2 leading-relaxed"
            style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}
          >
            This is where practice meets life.
          </p>
          <p
            className="text-sm text-[rgba(253,251,245,0.6)] mb-6 leading-relaxed italic"
            style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}
          >
            You'll track moments of awareness—when you catch yourself in old patterns.
          </p>
          <button
            onClick={() => {
              console.log('🔥 Go to Navigation clicked, onNavigate:', typeof onNavigate);
              if (onNavigate) {
                onNavigate('navigation');
              } else {
                console.error('❌ onNavigate is undefined!');
              }
            }}
            className="px-6 py-3 rounded-full text-[#050508] font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-mythic)', background: 'var(--ui-button-gradient)' }}
          >
            GO TO NAVIGATION
          </button>
        </div>
      </div>
    );
  }

  const [autoOpenTraining, setAutoOpenTraining] = useState(false);

  // Handle mode detail view
  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId);
    setAutoOpenTraining(false);
  };

  // Handle back or switch to another mode
  const handleBackFromMode = (nextModeId = null) => {
    if (nextModeId && typeof nextModeId === 'string') {
      // Switch to next mode directly
      setSelectedModeId(nextModeId);
      setAutoOpenTraining(true);
    } else {
      // Just go back to mode list
      setSelectedModeId(null);
      setAutoOpenTraining(false);
    }
  };

  // Active path - show permanent sigil sealing area
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Avatar & Navigation Toggle */}
      <div className="flex flex-col items-center pt-8 gap-6">
        <div style={{ transform: 'scale(0.65)' }}>
          <Avatar mode="application" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
        </div>

        {/* Four Modes Toggle Button - Moved below Avatar */}
        {!selectedModeId && (
          <button
            onClick={() => setShowFourModes(!showFourModes)}
            className="px-6 py-3 rounded-full transition-all duration-300"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: 'var(--tracking-mythic)',
              color: showFourModes ? 'rgba(180, 120, 40, 1)' : 'rgba(100, 80, 60, 0.85)',
              background: showFourModes
                ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
              border: '1px solid rgba(180, 140, 90, 0.3)',
              boxShadow: showFourModes
                ? '0 0 30px rgba(251, 191, 36, 0.2), inset 0 0 25px rgba(251, 191, 36, 0.1)'
                : '0 0 25px rgba(251, 191, 36, 0.15), inset 0 0 20px rgba(251, 191, 36, 0.08)',
            }}
          >
            {showFourModes ? 'Switch to Four Modes' : 'Explore Four Modes'}
          </button>
        )}
      </div>

      {/* Permanent Sigil Sealing Area */}
      {!showFourModes && !selectedModeId && (
        <SigilSealingArea />
      )}

      {/* Awareness Tracking (moved from Home Hub) */}
      {!showFourModes && !selectedModeId && (
        <div className="w-full flex justify-center">
          <ApplicationTrackingCard onOpenArchive={handleOpenArchive} />
        </div>
      )}

      {/* Content based on active view */}
      {showFourModes && !selectedModeId && (
        <FourModesHome onSelectMode={handleSelectMode} onClose={() => setShowFourModes(false)} />
      )}

      {selectedModeId && (
        <ModeDetail
          key={selectedModeId}
          modeId={selectedModeId}
          onBack={handleBackFromMode}
          autoStartTraining={autoOpenTraining}
        />
      )}
    </div>
  );
}
