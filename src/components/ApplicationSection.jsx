// src/components/ApplicationSection.jsx
import React, { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { Avatar } from './Avatar.jsx';
import { StageTitle } from './StageTitle.jsx';
import { TrackingView } from './TrackingView.jsx';
import { FourModesHome } from './FourModesHome.jsx';
import { ModeDetail } from './ModeDetail.jsx';

export function ApplicationSection({ onStageChange, currentStage, previewPath, previewShowCore }) {
  const { activePath } = useNavigationStore();
  const [activeSubView, setActiveSubView] = useState('tracking'); // 'tracking' | 'modes'
  const [selectedModeId, setSelectedModeId] = useState(null);

  // No active path - show empty state
  if (!activePath) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
        {/* Avatar */}
        <div className="flex flex-col items-center pt-8">
          <div style={{ transform: 'scale(0.75)' }}>
            <Avatar mode="application" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
          </div>
          {/* Stage Title */}
          <div className="mt-4">
            <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} showWelcome={false} />
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-[#0f0f1a] border rounded-3xl p-12 text-center border-[var(--accent-15)]">
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--accent-color)' }}
          >
            Application
          </h2>
          <p
            className="text-base text-[rgba(253,251,245,0.7)] mb-2 leading-relaxed"
            style={{ fontFamily: 'Crimson Pro, serif' }}
          >
            This is where practice meets life.
          </p>
          <p
            className="text-sm text-[rgba(253,251,245,0.6)] mb-6 leading-relaxed italic"
            style={{ fontFamily: 'Crimson Pro, serif' }}
          >
            You'll track moments of awareness—when you catch yourself in old patterns.
          </p>
          <button
            onClick={() => {
              window.location.hash = 'navigation';
            }}
            className="px-6 py-3 rounded-full text-[#050508] font-semibold text-sm"
            style={{ fontFamily: 'Cinzel, serif', background: 'var(--ui-button-gradient)' }}
          >
            GO TO NAVIGATION
          </button>
        </div>
      </div>
    );
  }

  // Handle mode detail view
  const handleSelectMode = (modeId) => {
    setSelectedModeId(modeId);
  };

  const handleBackFromMode = () => {
    setSelectedModeId(null);
  };

  // Active path - show tracking / modes interface
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Avatar - smaller */}
      <div className="flex flex-col items-center pt-8">
        <div style={{ transform: 'scale(0.65)' }}>
          <Avatar mode="application" onStageChange={onStageChange} stage={currentStage} path={previewPath} showCore={previewShowCore} />
        </div>
        {/* Stage Title */}
        <div className="mt-4">
          <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} showWelcome={false} />
        </div>
      </div>

      {/* Sub-Toggle: Tracking | Four Modes */}
      <section
        className="flex gap-1 rounded-full bg-black/30 p-1 border border-[var(--accent-10)]"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeSubView === 'tracking'}
          className="flex-1 px-4 py-2 rounded-full text-xs transition-all"
          style={{
            background: activeSubView === 'tracking' ? 'var(--gold-30)' : 'transparent',
            color: activeSubView === 'tracking' ? 'var(--gold-100)' : 'rgba(253,251,245,0.6)',
            fontWeight: activeSubView === 'tracking' ? 700 : 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transform: activeSubView === 'tracking' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 140ms ease-out',
          }}
          onClick={() => { setActiveSubView('tracking'); setSelectedModeId(null); }}
        >
          Tracking
        </button>
        <button
          role="tab"
          aria-selected={activeSubView === 'modes'}
          className="flex-1 px-4 py-2 rounded-full text-xs transition-all"
          style={{
            background: activeSubView === 'modes' ? 'var(--gold-30)' : 'transparent',
            color: activeSubView === 'modes' ? 'var(--gold-100)' : 'rgba(253,251,245,0.6)',
            fontWeight: activeSubView === 'modes' ? 700 : 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transform: activeSubView === 'modes' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 140ms ease-out',
          }}
          onClick={() => setActiveSubView('modes')}
        >
          Four Modes
        </button>
      </section>

      {/* Content based on active sub-view */}
      {activeSubView === 'tracking' && <TrackingView />}

      {activeSubView === 'modes' && !selectedModeId && (
        <FourModesHome onSelectMode={handleSelectMode} />
      )}

      {activeSubView === 'modes' && selectedModeId && (
        <ModeDetail modeId={selectedModeId} onBack={handleBackFromMode} />
      )}
    </div>
  );
}
