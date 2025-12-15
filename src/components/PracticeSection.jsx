// src/components/PracticeSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { BreathingRing } from "./BreathingRing.jsx";
import { VisualizationCanvas } from "./VisualizationCanvas.jsx";
import { CymaticsVisualization } from "./CymaticsVisualization.jsx";
import { SensorySession } from "./SensorySession.jsx";
import { VipassanaVisual } from "./vipassana/VipassanaVisual.jsx";
import { RitualPortal } from "./RitualPortal.jsx";
import { RitualSelectionDeck } from "./RitualSelectionDeck.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { VIPASSANA_THEMES } from "../data/vipassanaThemes.js";
import { SoundConfig, BINAURAL_PRESETS, ISOCHRONIC_PRESETS, SOUND_TYPES } from "./SoundConfig.jsx";
import { BreathConfig, BREATH_PRESETS } from "./BreathConfig.jsx";
import { SensoryConfig, SENSORY_TYPES } from "./SensoryConfig.jsx";
import { VisualizationConfig } from "./VisualizationConfig.jsx";
import { CymaticsConfig } from "./CymaticsConfig.jsx";
import { SOLFEGGIO_SET } from "../utils/frequencyLibrary.js";
import { useProgressStore } from "../state/progressStore.js";
import { syncFromProgressStore } from "../state/mandalaStore.js";
import { ringFXPresets, getCategories } from "../data/ringFXPresets.js";
import { useSessionInstrumentation } from "../hooks/useSessionInstrumentation.js";
import { PracticeSelectionModal } from "./PracticeSelectionModal.jsx";

// DEV GALLERY MODE - now controlled via prop from App.jsx
const DEV_FX_GALLERY_ENABLED = true; // Fallback if prop not passed

const PRACTICES = ["Breath & Stillness", "Ritual", "Vipassana", "Sensory", "Sound", "Visualization", "Cymatics"];
const DURATIONS = [3, 5, 7, 10, 12, 15, 20, 25, 30, 40, 50, 60];

// Scrolling Wheel Component
function ScrollingWheel({ value, onChange, options }) {
  const wheelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const itemHeight = 48;
  const visibleItems = 3;

  useEffect(() => {
    const index = options.indexOf(value);
    if (index !== -1) {
      setScrollOffset(index * itemHeight);
    }
  }, [value, options, itemHeight]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = startY - e.clientY;
    const newOffset = Math.max(0, Math.min(scrollOffset + deltaY, (options.length - 1) * itemHeight));
    setScrollOffset(newOffset);
    setStartY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const nearestIndex = Math.round(scrollOffset / itemHeight);
    const snappedOffset = nearestIndex * itemHeight;
    setScrollOffset(snappedOffset);
    onChange(options[nearestIndex]);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? itemHeight : -itemHeight;
    const newOffset = Math.max(0, Math.min(scrollOffset + delta, (options.length - 1) * itemHeight));
    setScrollOffset(newOffset);

    const nearestIndex = Math.round(newOffset / itemHeight);
    setScrollOffset(nearestIndex * itemHeight);
    onChange(options[nearestIndex]);
  };

  return (
    <div
      ref={wheelRef}
      className="relative overflow-hidden select-none"
      style={{
        height: `${itemHeight * visibleItems} px`,
        width: "120px",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight} px`,
          background: "linear-gradient(180deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: `${itemHeight} px`,
          background: "linear-gradient(0deg, rgba(15,15,26,1) 0%, transparent 100%)"
        }}
      />

      <div
        className="absolute left-0 right-0 pointer-events-none z-10"
        style={{
          top: `${itemHeight} px`,
          height: `${itemHeight} px`,
          border: "1px solid var(--accent-20)",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.02)"
        }}
      />

      <div
        className="absolute w-full transition-transform duration-200"
        style={{
          transform: `translateY(${itemHeight - scrollOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {options.map((option, index) => {
          const offset = Math.abs(index * itemHeight - scrollOffset);
          const opacity = Math.max(0.2, 1 - offset / (itemHeight * 2));
          const scale = Math.max(0.7, 1 - offset / (itemHeight * 3));

          return (
            <div
              key={option}
              className="flex items-center justify-center"
              style={{
                height: `${itemHeight} px`,
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                color: "rgba(253,251,245,0.9)",
                opacity,
                transform: `scale(${scale})`,
                transition: "opacity 0.2s, transform 0.2s"
              }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PracticeSection({ onPracticingChange, onBreathStateChange, avatarPath, showCore, showFxGallery = DEV_FX_GALLERY_ENABLED }) {
  // Avatar path determines particle effects (Soma, Prana, Dhyana, Drishti, Jnana, Samyoga)
  // When showCore is true, use default particles (no path-specific effects)

  // Attention path instrumentation
  const instrumentation = useSessionInstrumentation();

  const [practice, setPractice] = useState("Breath & Stillness");
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [duration, setDuration] = useState(10);
  const [preset, setPreset] = useState("Box");
  const [pattern, setPattern] = useState({
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  });

  const [sensoryType, setSensoryType] = useState(SENSORY_TYPES[0].id);
  const [soundType, setSoundType] = useState(SOUND_TYPES[0]);
  const [vipassanaTheme, setVipassanaTheme] = useState('dawnSky');

  // Sound configuration state
  const [binauralPreset, setBinauralPreset] = useState(BINAURAL_PRESETS[2]); // Alpha - default
  const [isochronicPreset, setIsochronicPreset] = useState(ISOCHRONIC_PRESETS[1]); // Relaxation
  const [mantraPreset, setMantraPreset] = useState(null);
  const [naturePreset, setNaturePreset] = useState(null);
  const [carrierFrequency, setCarrierFrequency] = useState(200);
  const [soundVolume, setSoundVolume] = useState(0.5);


  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const [tapErrors, setTapErrors] = useState([]);
  const [lastErrorMs, setLastErrorMs] = useState(null);
  const [lastSignedErrorMs, setLastSignedErrorMs] = useState(null);

  const [breathCount, setBreathCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  const [geometry, setGeometry] = useState('enso');
  const [fadeInDuration, setFadeInDuration] = useState(2.5);
  const [displayDuration, setDisplayDuration] = useState(10);
  const [fadeOutDuration, setFadeOutDuration] = useState(2.5);
  const [voidDuration, setVoidDuration] = useState(10);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [visualizationCycles, setVisualizationCycles] = useState(0);

  // Cymatics state
  const [frequencySet, setFrequencySet] = useState('solfeggio');
  const [selectedFrequency, setSelectedFrequency] = useState(SOLFEGGIO_SET[4]); // 528 Hz - Love
  const [driftEnabled, setDriftEnabled] = useState(false);

  // Ritual Mode state
  const [activeRitual, setActiveRitual] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // FX Gallery state (DEV MODE - controlled by showFxGallery prop)
  const [currentFxIndex, setCurrentFxIndex] = useState(0);
  const currentFxPreset = showFxGallery ? ringFXPresets[currentFxIndex] : null;

  const handlePrevFx = () => {
    setCurrentFxIndex(prev => (prev - 1 + ringFXPresets.length) % ringFXPresets.length);
  };
  const handleNextFx = () => {
    setCurrentFxIndex(prev => (prev + 1) % ringFXPresets.length);
  };

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isRunning]);

  useEffect(() => {
    if (preset && BREATH_PRESETS[preset]) {
      setPattern(BREATH_PRESETS[preset]);
    }
  }, [preset]);

  const handlePatternChange = (key, value) => {
    setPattern((prev) => ({
      ...prev,
      [key]: Number.parseInt(value, 10) || 0,
    }));
    setPreset(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} `;
  };

  const handleStop = () => {
    setIsRunning(false);
    onPracticingChange && onPracticingChange(false);
    onBreathStateChange && onBreathStateChange(null);

    // Determine exit type: completed if timer reached 0, abandoned otherwise
    const exitType = timeLeft <= 0 ? 'completed' : 'abandoned';

    // End instrumentation and get session data
    const instrumentationData = instrumentation.endSession(exitType);

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    const tapCount = tapErrors.length;
    let avgErrorMs = null;
    let bestErrorMs = null;

    if (tapCount > 0) {
      avgErrorMs = Math.round(
        tapErrors.reduce((sum, v) => sum + Math.abs(v), 0) / tapCount
      );
      bestErrorMs = Math.round(
        Math.min(...tapErrors.map(e => Math.abs(e)))
      );
    }

    let subType = null;
    if (practice === "Sensory") subType = sensoryType;
    if (practice === "Sound") subType = soundType;
    if (practice === "Visualization") subType = geometry;
    if (practice === "Cymatics") subType = `${selectedFrequency.hz} Hz - ${selectedFrequency.name} `;
    if (practice === "Ritual") subType = activeRitual?.id;

    const sessionPayload = {
      id,
      date: new Date().toISOString(),
      type: practice.toLowerCase(),
      subType,
      durationMinutes: duration,
      pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
      tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
    };

    try {
      // Map practice to domain for Path calculation
      let domain = 'breathwork';
      const p = practice.toLowerCase();
      if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
      else if (p === 'sensory') domain = sensoryType;
      else if (p === 'ritual') domain = 'ritual';
      else if (p === 'sound') domain = 'sound';

      // Record in progress store (single source of truth)
      useProgressStore.getState().recordSession({
        domain,
        duration: duration, // minutes
        metadata: {
          subType,
          pattern: practice === "Breath & Stillness" ? { ...pattern } : null,
          tapStats: tapCount > 0 ? { tapCount, avgErrorMs, bestErrorMs } : null,
          ritualId: activeRitual?.id,
          legacyImport: false
        },
        // Pass instrumentation data for attention path calculation
        instrumentation: instrumentationData,
      });

      // Sync mandala store
      syncFromProgressStore();
    } catch (e) {
      console.error("Failed to save session:", e);
    }

    // Reset ritual state
    setActiveRitual(null);
    setCurrentStepIndex(0);
    setTimeLeft(duration * 60);
  };

  const handleStart = () => {
    setIsRunning(true);
    onPracticingChange && onPracticingChange(true);
    setSessionStartTime(performance.now());
    setTapErrors([]);
    setLastErrorMs(null);
    setLastSignedErrorMs(null);
    setBreathCount(0);

    // Start instrumentation tracking
    const p = practice.toLowerCase();
    let domain = 'breathwork';
    if (p.includes('visual') || p.includes('cymatics')) domain = 'visualization';
    else if (p === 'sensory') domain = sensoryType;
    else if (p === 'ritual') domain = 'ritual';
    else if (p === 'sound') domain = 'sound';

    instrumentation.startSession(
      domain,
      activeRitual?.category || null,
      p === 'sensory' ? sensoryType : null
    );
  };

  // Ritual-specific handlers
  const handleSelectRitual = (ritual) => {
    setActiveRitual(ritual);
    setCurrentStepIndex(0);
    // Calculate total duration from steps
    const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
    setDuration(Math.ceil(totalSeconds / 60));
    setTimeLeft(totalSeconds);
    // Auto-start ritual
    handleStart();
  };

  const handleNextStep = () => {
    if (!activeRitual) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeRitual.steps.length) {
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleRitualComplete = () => {
    handleStop();
  };

  const handleAccuracyTap = (errorMs) => {
    if (!isRunning) return;

    // Track tap as alive signal for attention path
    instrumentation.recordAliveSignal();

    setLastErrorMs(Math.abs(errorMs));
    setLastSignedErrorMs(errorMs);

    setTapErrors(prev => {
      const updated = [...prev, errorMs];
      if (updated.length > 50) updated.shift();
      return updated;
    });
  };

  useEffect(() => {
    if (!isRunning) return;
    // Skip timer countdown for Ritual mode (handled by RitualPortal)
    if (practice === "Ritual") return;

    let interval = null;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleStop();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft, practice]);

  useEffect(() => {
    if (!onBreathStateChange) return;
    if (!isRunning || practice !== "Breath & Stillness") {
      onBreathStateChange(null);
      return;
    }
    const total = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
    if (!total) {
      onBreathStateChange(null);
      return;
    }

    const now = performance.now() / 1000;
    const cyclePos = (now % total);

    let phase = "inhale";
    let phaseProgress = 0;

    if (cyclePos < pattern.inhale) {
      phase = "inhale";
      phaseProgress = cyclePos / pattern.inhale;
    } else if (cyclePos < pattern.inhale + pattern.hold1) {
      phase = "holdTop";
      phaseProgress =
        (cyclePos - pattern.inhale) / Math.max(pattern.hold1, 0.0001);
    } else if (
      cyclePos <
      pattern.inhale + pattern.hold1 + pattern.exhale
    ) {
      phase = "exhale";
      phaseProgress =
        (cyclePos - (pattern.inhale + pattern.hold1)) /
        Math.max(pattern.exhale, 0.0001);
    } else {
      phase = "holdBottom";
      phaseProgress =
        (cyclePos -
          (pattern.inhale + pattern.hold1 + pattern.exhale)) /
        Math.max(pattern.hold2 || 1, 1);
    }

    onBreathStateChange({
      phase,
      phaseProgress,
    });
  }, [isRunning, practice, pattern, onBreathStateChange]);

  const totalDuration =
    pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2 || 1;
  const width = 100;
  const height = 40;

  const iW = (pattern.inhale / totalDuration) * width;
  const h1W = (pattern.hold1 / totalDuration) * width;
  const eW = (pattern.exhale / totalDuration) * width;

  const pathD = `
    M 0 ${height}
    L ${iW} 0
    L ${iW + h1W} 0
    L ${iW + h1W + eW} ${height}
    L ${width} ${height}
`;

  const breathingPatternForRing = {
    inhale: pattern.inhale,
    holdTop: pattern.hold1,
    exhale: pattern.exhale,
    holdBottom: pattern.hold2,
  };

  const theme = useTheme();
  const { primary, secondary, muted, glow } = theme.accent;

  // ───────────────────────────────────────────────────────────
  // RUNNING VIEW
  // ───────────────────────────────────────────────────────────
  if (isRunning) {
    // RITUAL MODE - Different running view
    if (practice === "Ritual" && activeRitual) {
      return (
        <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-visible pb-12">
          <RitualPortal
            ritual={activeRitual}
            currentStepIndex={currentStepIndex}
            onNextStep={handleNextStep}
            onComplete={handleRitualComplete}
            onStop={handleStop}
            onSwitch={instrumentation.recordSwitch}
            onPause={instrumentation.recordPause}
            onAliveSignal={instrumentation.recordAliveSignal}
          />
        </section>
      );
    }

    // VIPASSANA MODE - Thought labeling meditation
    if (practice === "Vipassana") {
      return (
        <VipassanaVisual
          themeId={vipassanaTheme}
          durationSeconds={duration * 60}
          stage={theme.stage || 'flame'}
          onComplete={handleStop}
          onExit={handleStop}
        />
      );
    }


    let buttonBg = 'linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)';
    let radialGlow = '';
    let buttonShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';

    let feedbackColor = 'var(--accent-primary)';
    let feedbackText = "";
    let feedbackShadow = "none";

    if (lastSignedErrorMs !== null && practice === "Breath & Stillness") {
      const absError = Math.round(Math.abs(lastSignedErrorMs));

      if (absError > 1000) {
        feedbackColor = '#ef4444';
        feedbackText = "OUT OF BOUNDS";
        feedbackShadow = "0 0 8px rgba(239, 68, 68, 0.5)";
        buttonBg = 'linear-gradient(180deg, rgba(100,100,100,0.3) 0%, rgba(60,60,60,0.4) 100%)';
        radialGlow = '';
      } else if (absError <= 30) {
        feedbackColor = "#f8fafc";
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 12px rgba(255,255,255,0.6)";
        buttonBg = "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
        radialGlow = '0 0 60px 15px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.7)';
      } else if (absError <= 100) {
        feedbackColor = 'var(--accent-color)';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = '0 0 10px var(--accent-50)';
        buttonBg = 'linear-gradient(180deg, var(--accent-color) 0%, var(--accent-secondary) 100%)';
        radialGlow = '0 0 50px 12px var(--accent-40), 0 0 25px var(--accent-60)';
      } else if (absError <= 300) {
        feedbackColor = '#d97706';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 8px rgba(217, 119, 6, 0.4)";
        buttonBg = 'linear-gradient(180deg, #d97706 0%, #92400e 100%)';
        radialGlow = '0 0 40px 10px rgba(217, 119, 6, 0.3), 0 0 20px rgba(217, 119, 6, 0.5)';
      } else {
        feedbackColor = '#9ca3af';
        feedbackText = `${absError}ms ${lastSignedErrorMs > 0 ? "Late" : "Early"} `;
        feedbackShadow = "0 0 6px rgba(156, 163, 175, 0.3)";
        buttonBg = 'linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)';
        radialGlow = '0 0 35px 8px rgba(156, 163, 175, 0.25), 0 0 18px rgba(156, 163, 175, 0.4)';
      }
    }

    return (
      <section className="w-full h-full min-h-[600px] flex flex-col items-center justify-center pb-12" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-center w-full mb-16" style={{ overflow: 'visible' }}>
          {practice === "Visualization" ? (
            <VisualizationCanvas
              geometry={geometry}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : practice === "Cymatics" ? (
            <CymaticsVisualization
              frequency={selectedFrequency.hz}
              n={selectedFrequency.n}
              m={selectedFrequency.m}
              fadeInDuration={fadeInDuration}
              displayDuration={displayDuration}
              fadeOutDuration={fadeOutDuration}
              voidDuration={voidDuration}
              driftEnabled={driftEnabled}
              audioEnabled={audioEnabled}
              onCycleComplete={(cycle) => setVisualizationCycles(cycle)}
            />
          ) : practice === "Breath & Stillness" ? (
            <div className="flex flex-col items-center" style={{ overflow: 'visible', padding: '40px 0' }}>
              {/* FX GALLERY SWITCHER - controlled by prop */}
              {showFxGallery && (
                <div
                  className="flex items-center gap-3 mb-4 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--accent-20)',
                  }}
                >
                  <button
                    onClick={handlePrevFx}
                    className="text-white/60 hover:text-white transition-colors px-2 py-1"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}
                  >
                    ◀
                  </button>
                  <div
                    className="text-center min-w-[200px]"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'var(--accent-color)',
                    }}
                  >
                    <div style={{ color: 'rgba(253,251,245,0.55)', fontSize: '8px', marginBottom: '2px' }}>
                      {currentFxPreset?.category}
                    </div>
                    <div>{currentFxPreset?.name}</div>
                    <div style={{ color: 'rgba(253,251,245,0.55)', fontSize: '8px', marginTop: '2px' }}>
                      {currentFxIndex + 1} / {ringFXPresets.length}
                    </div>
                  </div>
                  <button
                    onClick={handleNextFx}
                    className="text-white/60 hover:text-white transition-colors px-2 py-1"
                    style={{ fontFamily: 'Georgia, serif', fontSize: '16px' }}
                  >
                    ▶
                  </button>
                </div>
              )}
              <BreathingRing
                breathPattern={breathingPatternForRing}
                onTap={handleAccuracyTap}
                onCycleComplete={() => setBreathCount(prev => prev + 1)}
                startTime={sessionStartTime}
                pathId={showCore ? null : avatarPath}
                fxPreset={currentFxPreset}
              />
            </div>
          ) : practice === "Sensory" ? (
            <SensorySession
              sensoryType={sensoryType}
              duration={duration}
              onStop={handleStop}
              onTimeUpdate={(remaining) => setTimeLeft(remaining)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center animate-fade-in-up">
              <div
                className="text-2xl mb-4 text-center"
                style={{
                  fontFamily: "Georgia, serif",
                  color: "var(--accent-color)",
                  textShadow: "0 0 20px var(--accent-30)"
                }}
              >
                {soundType}
              </div>
              <div className="w-32 h-32 rounded-full border border-[var(--accent-20)] flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-[var(--accent-color)] blur-xl"></div>
                <div className="text-4xl opacity-80">✦</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center z-50">
          <div className="h-6 mb-3 flex items-center justify-center">
            {lastSignedErrorMs !== null && practice === "Breath & Stillness" && (
              <div
                key={lastSignedErrorMs}
                className="text-[11px] font-medium tracking-[0.15em] uppercase animate-fade-in-up"
                style={{
                  fontFamily: "Georgia, serif",
                  color: feedbackColor,
                  textShadow: feedbackShadow
                }}
              >
                {feedbackText}
              </div>
            )}
          </div>

          <button
            onClick={handleStop}
            className="rounded-full px-7 py-2.5 transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] active:scale-95"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: buttonBg,
              color: "#050508",
              boxShadow: radialGlow
                ? `${radialGlow}, ${buttonShadow} `
                : `0 0 24px var(--accent - 30), ${buttonShadow} `,
              borderRadius: "999px",
            }}
          >
            Stop
          </button>

          <div
            className="mt-5"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(253,251,245,0.6)",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {breathCount > 0 && practice === "Breath & Stillness" && (
            <div
              className="mt-2"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: 'var(--accent-50)',
              }}
            >
              Breath {breathCount}
            </div>
          )}
        </div>

        <style>{`
@keyframes fade -in -up {
  0 % { opacity: 0; transform: translateY(5px); }
  100 % { opacity: 1; transform: translateY(0); }
}
          .animate - fade -in -up {
  animation: fade -in -up 0.2s ease - out forwards;
}
`}</style>
      </section>
    );
  }

  // ───────────────────────────────────────────────────────────
  // CONFIG VIEW - OPTIMIZED LAYOUT
  // ───────────────────────────────────────────────────────────
  return (
    <section className="w-full flex flex-col items-center pt-16 pb-24">
      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,22,37,0.95) 0%, rgba(15,15,26,0.98) 100%)",
          border: '1px solid var(--accent-15)',
          boxShadow:
            "0 0 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Mandala background - dual mask for mid-radius emphasis */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          {/* Mandala image - fairly visible, slightly scaled */}
          <img
            src={`${import.meta.env.BASE_URL}bg/practice-breath-mandala.png`}
            alt="Breath mandala"
            className="object-contain w-full h-full"
            style={{
              opacity: 0.2,
              transform: 'scale(1.25) translateY(-8%)',
              transformOrigin: 'center',
            }}
          />

          {/* INNER mask: darken the very center behind the timer */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(0,0,0,0.55) 0%, transparent 42%)',
            }}
          />

          {/* OUTER mask: soften edges so lines near panel border don't compete */}
          <div
            className="absolute inset-0 rounded-[32px]"
            style={{
              background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 40% at 50% 0%, var(--accent-10) 0%, transparent 70%)',
          }}
        />

        <div
          className="absolute top-3 left-4"
          style={{ color: 'var(--accent-40)', fontSize: "6px" }}
        >
          ◆
        </div>
        <div
          className="absolute top-3 right-4"
          style={{ color: 'var(--accent-40)', fontSize: "6px" }}
        >
          ◆
        </div>

        <div className="relative px-7 py-6">
          {/* Practice selector - LEVEL 2: Primary Decision (Single Pill) */}
          <div className="mb-6" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setPracticeModalOpen(true)}
              className="px-6 py-3 rounded-full transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, var(--accent-10) 0%, transparent 100%)',
                border: '1px solid var(--accent-20)',
                fontFamily: 'Georgia, serif',
                fontSize: '13px',
                letterSpacing: '0.1em',
                color: 'var(--accent-color)',
                boxShadow: '0 0 20px var(--accent-08), inset 0 0 20px var(--accent-05)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>{practice}</span>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
            </button>
          </div>

          {/* RITUAL MODE: Show deck instead of duration/timer/start */}
          {practice === "Ritual" ? (
            <RitualSelectionDeck
              onSelectRitual={handleSelectRitual}
              selectedRitualId={activeRitual?.id}
            />
          ) : (
            <>
              {/* Duration wheel + Timer + Start button - horizontal layout */}
              <div className="flex items-center justify-between mb-6">
                {/* Duration wheel on left */}
                <div className="flex flex-col items-center">
                  <div
                    className="mb-2"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "9px",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "rgba(253,251,245,0.55)",
                    }}
                  >
                    Duration
                  </div>
                  <ScrollingWheel
                    value={duration}
                    onChange={setDuration}
                    options={DURATIONS}
                  />
                  <div
                    className="mt-1"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "8px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(253,251,245,0.45)",
                    }}
                  >
                    minutes
                  </div>
                </div>

                {/* Timer in center */}
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "40px",
                    fontWeight: 400,
                    letterSpacing: "0.2em",
                    color: "rgba(253,251,245,0.92)",
                    textShadow: '0 0 6px rgba(0,0,0,0.6), 0 0 32px var(--accent-30)',
                  }}
                >
                  {formatTime(timeLeft)}
                </div>

                {/* Start button on right */}
                <button
                  onClick={handleStart}
                  className="rounded-full px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5 bg-accent"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    background:
                      `linear - gradient(180deg, var(--accent - color) 0 %, var(--accent - color) 100 %)`,
                    color: "#050508",
                    border: "none",
                    boxShadow:
                      '0 0 24px var(--accent-30), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  Start
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div
                  style={{
                    height: "1px",
                    background:
                      'linear-gradient(90deg, transparent 0%, var(--accent-15) 20%, var(--accent-30) 50%, var(--accent-15) 80%, transparent 100%)',
                  }}
                />
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
                  style={{
                    fontSize: "8px",
                    color: 'var(--accent-70)',
                    background: "rgba(15,15,26,1)",
                  }}
                >
                  ✦
                </div>
              </div>
            </>
          )}

          {/* BREATH & STILLNESS: Config Component */}
          {practice === "Breath & Stillness" && (
            <BreathConfig
              pattern={pattern}
              setPattern={setPattern}
              preset={preset}
              setPreset={setPreset}
            />
          )}

          {/* SENSORY: Config Component */}
          {practice === "Sensory" && (
            <SensoryConfig
              sensoryType={sensoryType}
              setSensoryType={setSensoryType}
            />
          )}

          {/* VIPASSANA: Theme Selector */}
          {practice === "Vipassana" && (
            <div className="mb-6">
              <div
                className="mb-3"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "9px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(253,251,245,0.55)",
                  textAlign: "center"
                }}
              >
                Theme
              </div>
              <div
                className="flex gap-2 p-1 rounded-full flex-wrap justify-center"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--accent-10)",
                }}
              >
                {Object.values(VIPASSANA_THEMES).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setVipassanaTheme(theme.id)}
                    className="rounded-full px-3 py-1.5 transition-all duration-200"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      background:
                        vipassanaTheme === theme.id
                          ? `linear-gradient(180deg, var(--accent-color) 0%, var(--accent-color) 100%)`
                          : "transparent",
                      color:
                        vipassanaTheme === theme.id
                          ? "#050508"
                          : "rgba(253,251,245,0.55)",
                      boxShadow:
                        vipassanaTheme === theme.id
                          ? '0 0 12px var(--accent-15)'
                          : "none",
                      transform: vipassanaTheme === theme.id ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 160ms ease-out, background 200ms, color 200ms, box-shadow 200ms',
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
              <div
                className="mt-2 text-center"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  color: "rgba(253,251,245,0.45)",
                }}
              >
                {VIPASSANA_THEMES[vipassanaTheme]?.description}
              </div>
            </div>
          )}

          {/* SOUND: Full Config Panel */}
          {practice === "Sound" && (
            <SoundConfig
              soundType={soundType}
              setSoundType={setSoundType}
              binauralPreset={binauralPreset}
              setBinauralPreset={setBinauralPreset}
              isochronicPreset={isochronicPreset}
              setIsochronicPreset={setIsochronicPreset}
              mantraPreset={mantraPreset}
              setMantraPreset={setMantraPreset}
              naturePreset={naturePreset}
              setNaturePreset={setNaturePreset}
              carrierFrequency={carrierFrequency}
              setCarrierFrequency={setCarrierFrequency}
              volume={soundVolume}
              setVolume={setSoundVolume}
            />
          )}

          {/* Visualization Config */}
          {practice === "Visualization" && (
            <VisualizationConfig
              geometry={geometry}
              setGeometry={setGeometry}
              fadeInDuration={fadeInDuration}
              setFadeInDuration={setFadeInDuration}
              displayDuration={displayDuration}
              setDisplayDuration={setDisplayDuration}
              fadeOutDuration={fadeOutDuration}
              setFadeOutDuration={setFadeOutDuration}
              voidDuration={voidDuration}
              setVoidDuration={setVoidDuration}
              duration={duration}
              setDuration={setDuration}
              audioEnabled={audioEnabled}
              setAudioEnabled={setAudioEnabled}
            />
          )}

          {/* Cymatics Config */}
          {practice === "Cymatics" && (
            <CymaticsConfig
              frequencySet={frequencySet}
              setFrequencySet={setFrequencySet}
              selectedFrequency={selectedFrequency}
              setSelectedFrequency={setSelectedFrequency}
              fadeInDuration={fadeInDuration}
              setFadeInDuration={setFadeInDuration}
              displayDuration={displayDuration}
              setDisplayDuration={setDisplayDuration}
              fadeOutDuration={fadeOutDuration}
              setFadeOutDuration={setFadeOutDuration}
              voidDuration={voidDuration}
              setVoidDuration={setVoidDuration}
              driftEnabled={driftEnabled}
              setDriftEnabled={setDriftEnabled}
              audioEnabled={audioEnabled}
              setAudioEnabled={setAudioEnabled}
            />
          )}

          {/* Divider - hide for Ritual since it has no pattern preview */}
          {practice !== "Ritual" && (
            <div className="relative my-8">
              <div
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent 0%, var(--accent-15) 20%, var(--accent-40) 50%, var(--accent-15) 80%, transparent 100%)",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2"
                style={{
                  fontSize: "8px",
                  color: 'var(--accent-70)',
                  background: "rgba(15,15,26,1)",
                }}
              >
                ✦
              </div>
            </div>
          )}

          {/* Pattern preview (Only for Breath & Stillness) */}
          {practice === "Breath & Stillness" && (
            <div className="mb-2">
              <div
                className="mb-3 text-center"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "9px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(253,251,245,0.55)",
                }}
              >
                Pattern Preview
              </div>

              <div className="relative w-full h-16">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="patternGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--accent-20)"
                      />
                      <stop
                        offset="100%"
                        stopColor="transparent"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d={pathD}
                    fill="url(#patternGradient)"
                    stroke="var(--accent-primary)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className="flex justify-between w-full px-1 mt-1">
                  <span
                    style={{
                      fontSize: "6px",
                      color: "rgba(253,251,245,0.45)",
                      width: `${(pattern.inhale / totalDuration) * 100}% `,
                      textAlign: "center",
                    }}
                  >
                    IN
                  </span>
                  <span
                    style={{
                      fontSize: "6px",
                      color: "rgba(253,251,245,0.45)",
                      width: `${(pattern.hold1 / totalDuration) * 100}% `,
                      textAlign: "center",
                    }}
                  >
                    HOLD
                  </span>
                  <span
                    style={{
                      fontSize: "6px",
                      color: "rgba(253,251,245,0.45)",
                      width: `${(pattern.exhale / totalDuration) * 100}% `,
                      textAlign: "center",
                    }}
                  >
                    OUT
                  </span>
                  <span
                    style={{
                      fontSize: "6px",
                      color: "rgba(253,251,245,0.45)",
                      width: `${(pattern.hold2 / totalDuration) * 100}% `,
                      textAlign: "center",
                    }}
                  >
                    HOLD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Practice Selection Modal */}
      <PracticeSelectionModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        practices={PRACTICES}
        currentPractice={practice}
        onSelectPractice={setPractice}
      />
    </section>
  );
}
