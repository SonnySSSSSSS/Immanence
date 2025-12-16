// src/components/ApplicationSection.jsx
import React, { useState } from 'react';
import { useNavigationStore } from '../state/navigationStore.js';
import { Avatar } from './Avatar.jsx';
import { StageTitle } from './StageTitle.jsx';
import { TrackingView } from './TrackingView.jsx';
import { FourModesHome } from './FourModesHome.jsx';
import { ModeDetail } from './ModeDetail.jsx';
import { ApplicationSelectionModal } from './ApplicationSelectionModal.jsx';

export function ApplicationSection({ onStageChange, currentStage, previewPath, previewShowCore, previewAttention }) {
  const { activePath } = useNavigationStore();
  const [activeSubView, setActiveSubView] = useState('tracking'); // 'tracking' | 'modes'
  const [selectedModeId, setSelectedModeId] = useState(null);
  const [appModalOpen, setAppModalOpen] = useState(false);

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
            <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} attention={previewAttention} showWelcome={false} />
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

  // Handle back or switch to another mode
  const handleBackFromMode = (nextModeId = null) => {
    if (nextModeId && typeof nextModeId === 'string') {
      // Switch to next mode directly
      setSelectedModeId(nextModeId);
    } else {
      // Just go back to mode list
      setSelectedModeId(null);
    }
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
          <StageTitle stage={currentStage} path={previewShowCore ? null : previewPath} attention={previewAttention} showWelcome={false} />
        </div>
      </div>

      {/* Application Selector - Dropdown Style (matching practice menu) */}
      <div className="mb-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Text prompt above button */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: 'rgba(253,251,245,0.5)',
            textTransform: 'uppercase',
          }}
        >
          This space reflects how you are showing up — not how well.
        </div>
        <button
          onClick={() => setAppModalOpen(true)}
          className="px-6 py-3 rounded-full"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            letterSpacing: '0.1em',
            color: 'var(--gold-100)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
            border: '1px solid var(--gold-30)',
            boxShadow: activeSubView === 'tracking'
              ? '0 0 25px rgba(251, 191, 36, 0.15), inset 0 0 20px rgba(251, 191, 36, 0.08)'
              : '0 0 25px rgba(202, 138, 4, 0.15), inset 0 0 20px rgba(202, 138, 4, 0.08)',
            transform: appModalOpen ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 300ms ease-out, background 300ms ease-out, box-shadow 300ms ease-out',
          }}
        >
          <span>{activeSubView === 'tracking' ? 'Tracking' : 'Four Modes'}</span>
          {/* Chevron */}
          <span
            style={{
              fontSize: '10px',
              transform: appModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-out',
            }}
          >
            ▼
          </span>
        </button>
      </div>

      {/* Content based on active sub-view */}
      {activeSubView === 'tracking' && <TrackingView />}

      {activeSubView === 'modes' && !selectedModeId && (
        <FourModesHome onSelectMode={handleSelectMode} />
      )}

      {activeSubView === 'modes' && selectedModeId && (
        <ModeDetail modeId={selectedModeId} onBack={handleBackFromMode} />
      )}

      {/* Application Selection Modal */}
      <ApplicationSelectionModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        currentView={activeSubView}
        onSelectView={(view) => { setActiveSubView(view); setSelectedModeId(null); }}
      />
    </div>
  );
}
