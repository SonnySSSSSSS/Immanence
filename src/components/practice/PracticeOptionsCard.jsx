// src/components/practice/PracticeOptionsCard.jsx
// Extracted practice configuration card component
import React, { useState, useEffect, useRef } from 'react';
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
import { getPracticeHousingStyles, PracticeHousingChrome } from './practiceHousing.jsx';

const PRACTICE_CARD_GRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.08"/></feComponentTransfer></filter><rect width="240" height="240" filter="url(#n)"/></svg>`;
const PRACTICE_CARD_GRAIN_DATA_URI = `data:image/svg+xml,${encodeURIComponent(PRACTICE_CARD_GRAIN_SVG)}`;

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
  onRunBenchmark, 
  onDisableBenchmark, 
  breathSubmode, 
  onBreathSubmodeChange,
  getPracticeConfig 
}) {
  const cardRef = useRef(null);
  const p = getPracticeConfig(practiceId);
  const isCollapsed = !practiceId;
  const isSanctuary = false;
  const cardPadding = practiceId === 'breath'
    ? (isSanctuary ? '8px 28px 28px' : '8px 20px 20px')
    : (isSanctuary ? '24px' : '20px');
  const housing = getPracticeHousingStyles({ isLight: Boolean(tokens?.isLight), radius: 20, quiet: true });

  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showTempoSync, setShowTempoSync] = useState(false);
  const label = p?.label;
  const pattern = setters?.pattern;
  const onPatternChange = setters?.setPattern;
  const stillnessConfig = setters?.stillness;
  const onStillnessConfigChange = setters?.setStillness;
  const isStillnessLocked = Boolean(setters?.isStillnessLocked);
  const breathPreDelaySec = setters?.preDelaySec;
  const onBreathPreDelayChange = setters?.setPreDelaySec;
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
  const menuShowStartButton = true;
  const menuStartButtonLabel = practiceId === 'photic' ? 'Enter Photic Circles' : 'Begin Practice';

  useEffect(() => {
    queueMicrotask(() => setShowTrajectory(false));
  }, [practiceId]);

  useEffect(() => {
    if (practiceId !== 'breath' && breathSubmode !== 'breath') {
      onBreathSubmodeChange('breath');
    }
  }, [practiceId, breathSubmode, onBreathSubmodeChange]);

  useEffect(() => {
    if (practiceId !== 'breath' || breathSubmode !== 'stillness') return;
    queueMicrotask(() => setShowTempoSync(false));
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
        // Hard rule: do not invent per-screen viewport widths; follow the global rail.
        maxWidth: 'var(--ui-rail-max, min(430px, 94vw))',
        margin: '0 auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        maxHeight: isCollapsed ? '88px' : 'none',
        zIndex: 1,
      }}
    >
      {/* PROBE:practice-card-housing:START */}
      <div 
        className="relative PracticePanelShell overflow-x-hidden im-card"
        data-card="true"
        data-card-id="practice-options"
        style={{
          ...housing.panel,
          padding: cardPadding,
          minHeight: isCollapsed ? '88px' : 'auto',
          ...housing.shell,
        }}
      >
        <PracticeHousingChrome isLight={Boolean(tokens?.isLight)} quiet radius={20} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            ...housing.background,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background: tokens?.isLight
              ? 'linear-gradient(180deg, rgba(246, 251, 252, 0.08) 0%, rgba(225, 239, 242, 0.16) 100%)'
              : 'linear-gradient(180deg, rgba(8, 18, 27, 0.06) 0%, rgba(4, 9, 16, 0.12) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          data-ui="practice-card-grain"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            opacity: tokens?.isLight ? 0.065 : 0.045,
            backgroundImage: `url("${PRACTICE_CARD_GRAIN_DATA_URI}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '240px 240px',
          }}
        />
       
      {isCollapsed ? (
        <div className="h-[88px] flex items-center justify-center" style={housing.content}>
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '11px', 
            letterSpacing: 'var(--tracking-mythic)', 
            textTransform: 'uppercase',
            color: tokens.textMuted,
            opacity: 0.78
          }}>
            Select a practice to begin config...
          </span>
        </div>
      ) : (
        practiceId === 'breath' ? (
          <div style={housing.content}>
            <BreathPracticeCard
            practiceId={practiceId}
            label={label}
            breathSubmode={breathSubmode}
            onBreathSubmodeChange={onBreathSubmodeChange}
            pattern={pattern}
            onPatternChange={onPatternChange}
            onRunBenchmark={onRunBenchmark}
            stillnessConfig={stillnessConfig}
            onStillnessConfigChange={onStillnessConfigChange}
            isStillnessLocked={isStillnessLocked}
            breathPreDelaySec={breathPreDelaySec}
            onBreathPreDelayChange={onBreathPreDelayChange}
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
          </div>
        ) : (
          <div style={housing.content}>
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
          </div>
        ))}
        </div>
      {/* PROBE:practice-card-housing:END */}
      </div>
  );
}
