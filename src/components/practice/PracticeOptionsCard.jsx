// src/components/practice/PracticeOptionsCard.jsx
// Extracted practice configuration card component
import React, { useState, useEffect, useRef } from 'react';
import { useDisplayModeStore } from '../../state/displayModeStore.js';
import { useTempoSyncStore } from '../../state/tempoSyncStore.js';
import { useTempoSyncSessionStore } from '../../state/tempoSyncSessionStore.js';
import { useTempoAudioStore } from '../../state/tempoAudioStore.js';
import { TempoSyncPanel } from '../TempoSyncPanel.jsx';
import BreathPracticeCard from './BreathPracticeCard.jsx';
import PracticeMenu from './PracticeMenu.jsx';
import { DURATIONS } from '../PracticeSection/constants.js';
import { CircuitConfig } from '../Cycle/CircuitConfig.jsx';
import { SoundConfig } from '../SoundConfig.jsx';
import { VisualizationConfig } from '../VisualizationConfig.jsx';
import { CymaticsConfig } from '../CymaticsConfig.jsx';
import { RitualSelectionDeck } from '../RitualSelectionDeck.jsx';
import { PhoticControlPanel } from '../PhoticControlPanel.jsx';
import { EmotionConfig } from '../EmotionConfig.jsx';

// Map string names to actual components (direct imports, not lazy)
const CONFIG_COMPONENTS = {
  CircuitConfig,
  SoundConfig,
  VisualizationConfig,
  CymaticsConfig,
  RitualSelectionDeck,
  PhoticControlPanel,
  EmotionConfig,
};

export function PracticeOptionsCard({ 
  practiceId, 
  duration, 
  onDurationChange, 
  onStart, 
  onQuickStart, 
  tokens, 
  setters, 
  hasExpandedOnce, 
  setHasExpandedOnce, 
  onOpenTrajectory, 
  isRunning, 
  tempoSyncEnabled, 
  tempoPhaseDuration, 
  tempoBeatsPerPhase, 
  onRunBenchmark, 
  onDisableBenchmark, 
  breathSubmode, 
  onBreathSubmodeChange,
  getPracticeConfig 
}) {
  const cardRef = useRef(null);
  const p = getPracticeConfig(practiceId);
  const practice = p?.label;
  const isCollapsed = !practiceId;
  const viewportMode = useDisplayModeStore(s => s.viewportMode);
  const isSanctuary = viewportMode === 'sanctuary';
  const practicePanelWallpaperUrl = `${import.meta.env.BASE_URL}bg/practice-breath-mandala.png`;
  const practicePanelWallpaper = tokens?.isLight
    ? `linear-gradient(rgba(245, 240, 230, 0.70), rgba(245, 240, 230, 0.86)), url("${practicePanelWallpaperUrl}")`
    : `linear-gradient(rgba(10, 12, 18, 0.35), rgba(10, 12, 18, 0.62)), url("${practicePanelWallpaperUrl}")`;
  const cardPadding = practiceId === 'breath'
    ? (isSanctuary ? '8px 28px 28px' : '8px 20px 20px')
    : (isSanctuary ? '24px' : '20px');

  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showTempoSync, setShowTempoSync] = useState(false);
  const label = p?.label;
  const pattern = setters?.pattern;
  const onPatternChange = setters?.setPattern;
  const durationOptions = DURATIONS;
  const supportsDuration = p?.supportsDuration;
  const onToggleTrajectory = () => setShowTrajectory(v => !v);
  const menuTitleContainerMarginBottom = practiceId === 'breath' ? '16px' : '24px';
  const menuTitleTextMarginBottom = practiceId === 'breath' ? '8px' : '0';
  const menuConfigPanelMarginBottom = practiceId === 'breath' ? '16px' : '32px';
  const menuShowRitualSubtitle = p?.id === 'ritual';
  const menuShowDuration = p?.supportsDuration && practiceId !== 'circuit';
  const menuDurationMarginBottom = practiceId === 'breath' ? '24px' : '40px';
  const menuDurationTitleMarginBottom = practiceId === 'breath' ? '16px' : '24px';
  const menuShowStartButton = practiceId !== 'ritual';
  const menuStartButtonLabel = practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice';

  useEffect(() => {
    setShowTrajectory(false);
  }, [practiceId]);

  useEffect(() => {
    if (practiceId !== 'breath' && breathSubmode !== 'breath') {
      onBreathSubmodeChange('breath');
    }
  }, [practiceId, breathSubmode, onBreathSubmodeChange]);

  useEffect(() => {
    if (practiceId !== 'breath' || breathSubmode !== 'stillness') return;
    setShowTempoSync(false);
    useTempoSyncStore.getState().setEnabled(false);
    useTempoSyncSessionStore.getState().endSession();
    useTempoAudioStore.getState().stop("stillness-submode");
    onDisableBenchmark?.();
  }, [practiceId, breathSubmode, onDisableBenchmark]);

  // Intentional Reveal Logic: Scroll into view when expanded
  useEffect(() => {
    if (practiceId && !hasExpandedOnce && cardRef.current) {
      const timer = setTimeout(() => {
        setHasExpandedOnce(true);
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 400); // Wait for CSS transition
      return () => clearTimeout(timer);
    }
  }, [practiceId, hasExpandedOnce, setHasExpandedOnce]);

  const handleBeginPractice = () => {
    const tempoEnabled = useTempoSyncStore.getState().enabled;
    const st = useTempoAudioStore.getState();

    // Only use song duration if tempo sync is enabled AND a song is loaded
    const songSec =
      tempoEnabled && st.hasSong && st.songDurationSec
        ? Math.max(5, Math.floor(st.songDurationSec - 2))
        : null;

    // Audio will be started by executeStart via window.__tempoSyncStartAudio
    onStart(songSec);
  };
  const tempoSyncSlot = <TempoSyncPanel isPracticing={isRunning} />;

  return (
    <div
      ref={cardRef}
      className={`relative w-full transition-all duration-500 ease-out ${isCollapsed ? 'opacity-40 grayscale-[0.5] overflow-hidden' : 'opacity-100 overflow-visible'}`}
      style={{
        maxWidth: isSanctuary ? '656px' : '560px',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        maxHeight: isCollapsed ? '88px' : 'none',
        zIndex: 1,
      }}
    >
      {/* Glassmorphic Main Panel */}
      <div 
        className="relative PracticePanelShell overflow-x-hidden"
        data-card="true"
        data-card-id="practiceOptions"
        style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '20px',
          padding: cardPadding,
          minHeight: isCollapsed ? '88px' : 'auto',
          border: '1px solid var(--accent-30)',
          '--practice-panel-wallpaper': practicePanelWallpaper,
          boxShadow: `
            0 12px 48px rgba(0, 0, 0, 0.6),
            0 4px 16px var(--accent-15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.8),
            inset 0 0 60px var(--accent-10)
          `,
        }}
      >
        {/* Inner decorative border line */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            border: '1px solid var(--accent-25)',
            borderRadius: '10px',
          }}
        />
        
        {/* Corner flourishes - top left */}
        <div className="absolute pointer-events-none" style={{ top: '0', left: '0', width: '40px', height: '40px' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - top right */}
        <div className="absolute pointer-events-none" style={{ top: '0', right: '0', width: '40px', height: '40px', transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom left */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', left: '0', width: '40px', height: '40px', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="var(--accent-60)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="var(--accent-40)" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        {/* Corner flourishes - bottom right */}
        <div className="absolute pointer-events-none" style={{ bottom: '0', right: '0', width: '40px', height: '40px', transform: 'scale(-1, -1)' }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0 20 Q0 0 20 0" stroke="rgba(212, 175, 55, 0.6)" strokeWidth="2" fill="none"/>
            <path d="M5 15 Q5 5 15 5" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* Top highlight line */}
        <div className="absolute top-0 left-[20%] right-[20%] h-[1px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
      
        {isCollapsed ? (
        <div className="h-[88px] flex items-center justify-center">
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '11px', 
            letterSpacing: 'var(--tracking-mythic)', 
            textTransform: 'uppercase',
            color: tokens.textMuted,
            opacity: 0.5
          }}>
            Select a practice to begin config...
          </span>
        </div>
      ) : (
        practiceId === 'breath' ? (
          <BreathPracticeCard
            practiceId={practiceId}
            label={label}
            breathSubmode={breathSubmode}
            onBreathSubmodeChange={onBreathSubmodeChange}
            pattern={pattern}
            onPatternChange={onPatternChange}
            onRunBenchmark={onRunBenchmark}
            duration={duration}
            onDurationChange={onDurationChange}
            durationOptions={durationOptions}
            supportsDuration={supportsDuration}
            showTempoSync={showTempoSync}
            onToggleTempoSync={() => setShowTempoSync(!showTempoSync)}
            tempoSyncSlot={tempoSyncSlot}
            onStart={handleBeginPractice}
            showTrajectory={showTrajectory}
            onToggleTrajectory={onToggleTrajectory}
            onOpenTrajectory={onOpenTrajectory}
          />
        ) : (
          <PracticeMenu
            containerKey={practiceId}
            label={label}
            showRitualSubtitle={menuShowRitualSubtitle}
            ritualSubtitleText="Select an invocation to begin"
            titleContainerMarginBottom={menuTitleContainerMarginBottom}
            titleTextMarginBottom={menuTitleTextMarginBottom}
            configPanelMarginBottom={menuConfigPanelMarginBottom}
            practice={p}
            ConfigComponent={p.configComponent ? CONFIG_COMPONENTS[p.configComponent] : null}
            setters={setters}
            isLight={tokens.isLight}
            selectedRitualId={setters.selectedRitualId}
            showDuration={menuShowDuration}
            duration={duration}
            onDurationChange={onDurationChange}
            durationOptions={durationOptions}
            durationMarginBottom={menuDurationMarginBottom}
            durationTitleMarginBottom={menuDurationTitleMarginBottom}
            showStartButton={menuShowStartButton}
            onStart={handleBeginPractice}
            onQuickStart={onQuickStart}
            startButtonLabel={menuStartButtonLabel}
          />
        ))}
        </div>
      </div>
  );
}
