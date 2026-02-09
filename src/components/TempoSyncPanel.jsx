import { useEffect, useRef, useState } from 'react';
import { useTempoSyncStore } from '../state/tempoSyncStore.js';
import { useBreathBenchmarkStore } from '../state/breathBenchmarkStore.js';
import { useTempoDetection } from '../hooks/useTempoDetection.js';
import { FileUploadDrawer } from './FileUploadDrawer.jsx';
import { useTempoAudioStore } from '../state/tempoAudioStore.js';
import { useSessionOverrideStore } from '../state/sessionOverrideStore.js';

export const TempoSyncPanel = ({ isPracticing = false, onRunBenchmark }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [expandedManual, setExpandedManual] = useState(false);
  const [showNoStable, setShowNoStable] = useState(false);
  const [tapTimes, setTapTimes] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopA, setLoopA] = useState(0);
  const [loopB, setLoopB] = useState(null);
  const [isLooping, setIsLooping] = useState(false);
  const noStableTimerRef = useRef(null);
  const tapClearTimerRef = useRef(null);
  const enabledRef = useRef(false);
  const isInitializedRef = useRef(false);
  const getAudioElementRef = useRef(null);

  const lockedBySession = useSessionOverrideStore((s) => s.isLocked('tempoSync'));

  // Store selectors
  const enabled = useTempoSyncStore(s => s.enabled);
  const setEnabled = useTempoSyncStore(s => s.setEnabled);
  const bpm = useTempoSyncStore(s => s.bpm);
  const setBpm = useTempoSyncStore(s => s.setBpm);
  const beatsPerPhase = useTempoSyncStore(s => s.beatsPerPhase);
  const setBeatsPerPhase = useTempoSyncStore(s => s.setBeatsPerPhase);
  const confidence = useTempoSyncStore(s => s.confidence);
  const setConfidence = useTempoSyncStore(s => s.setConfidence);
  const playbackState = useTempoSyncStore(s => s.playbackState);
  const isLocked = useTempoSyncStore(s => s.isLocked);
  const setLocked = useTempoSyncStore(s => s.setLocked);
  const breathMultiplier = useTempoSyncStore(s => s.breathMultiplier);
  const setBreathMultiplier = useTempoSyncStore(s => s.setBreathMultiplier);
  const getPhaseDuration = useTempoSyncStore(s => s.getPhaseDuration);
  const resetDetection = useTempoSyncStore(s => s.resetDetection);
  const hasSong = useTempoAudioStore(s => s.hasSong);
  const songName = useTempoAudioStore(s => s.songName);
  const songDurationSec = useTempoAudioStore(s => s.songDurationSec);
  const benchmark = useBreathBenchmarkStore(s => s.benchmark);
  const hasBenchmark = Boolean(
    benchmark &&
    Number.isFinite(benchmark.inhale) && benchmark.inhale > 0 &&
    Number.isFinite(benchmark.hold1) && benchmark.hold1 > 0 &&
    Number.isFinite(benchmark.exhale) && benchmark.exhale > 0 &&
    Number.isFinite(benchmark.hold2) && benchmark.hold2 > 0
  );
  const isBenchmarkBlocked = enabled && !hasBenchmark;

  // Audio detection hook
  const {
    initializeAudioContext,
    loadAudioFile,
    startDetection,
    playAudio,
    pauseAudio,
    stopAudio,
    getAudioElement,
    setLoopState,
    resetDetection: resetDetectionHook,
  } = useTempoDetection();

  useEffect(() => {
    console.log('[TempoSyncPanel] mounted');
    return () => console.log('[TempoSyncPanel] unmounted');
  }, []);

  useEffect(() => {
    window.__tempoSyncIsMounted = true;
    window.__tempoSyncGetAudio = () => getAudioElement?.() || null;
    return () => {
      window.__tempoSyncIsMounted = false;
      delete window.__tempoSyncGetAudio;
    };
  }, [getAudioElement]);

  // Initialize on first use
  const handleInitialize = () => {
    if (isInitialized) return;
    initializeAudioContext();
    startDetection();
    setIsInitialized(true);
  };

  // Auto-initialize when enabled
  useEffect(() => {
    if (enabled && !isInitialized) {
      initializeAudioContext();
      startDetection();
      setIsInitialized(true);
    }
  }, [enabled, isInitialized, initializeAudioContext, startDetection]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

  useEffect(() => {
    getAudioElementRef.current = getAudioElement;
  }, [getAudioElement]);

  // Sync duration from store
  const prevSongDurationRef = useRef(songDurationSec);
  useEffect(() => {
    if (songDurationSec !== prevSongDurationRef.current) {
      prevSongDurationRef.current = songDurationSec;
      if (Number.isFinite(songDurationSec)) {
        setDuration(songDurationSec);
      } else if (!hasSong) {
        setDuration(0);
        setCurrentTime(0);
      }
    }
  }, [songDurationSec, hasSong]);

  // Expose audio start/stop functions globally for practice section to call
  useEffect(() => {
    window.__tempoSyncStartAudio = () => {
      console.log('[TempoSyncPanel] __tempoSyncStartAudio called');
      // Use the hook's playAudio which plays the audio element with BPM detection
      playAudio();
    };
    window.__tempoSyncStopAudio = () => {
      console.log('[TempoSyncPanel] __tempoSyncStopAudio called');
      // Stop the audio when practice ends
      stopAudio();
    };
    return () => {
      delete window.__tempoSyncStartAudio;
      delete window.__tempoSyncStopAudio;
    };
  }, [playAudio, stopAudio]);

  // Listen for practice start event to begin audio playback
  // useEffect(() => {
  //   const handleStartAudio = () => {
  //     console.log('[TempoSync] Received tempo-sync-start-audio event', {
  //       enabled: enabledRef.current,
  //       isInitialized: isInitializedRef.current,
  //       fileName: fileNameRef.current,
  //       hasPlayAudio: !!playAudio
  //     });
  //     if (enabledRef.current && isInitializedRef.current && fileNameRef.current !== 'No file selected') {
  //       console.log('[TempoSync] Starting audio playback');
  //       const audioElement = getAudioElementRef.current ? getAudioElementRef.current() : null;
  //       if (audioElement) {
  //         audioElement.currentTime = 0;
  //       }
  //       pendingAutoPlayRef.current = true;
  //       attemptAutoPlay('event');
  //     } else {
  //       console.log('[TempoSync] Cannot start audio - requirements not met');
  //     }
  //   };

  //   window.addEventListener('tempo-sync-start-audio', handleStartAudio);
  //   return () => {
  //     window.removeEventListener('tempo-sync-start-audio', handleStartAudio);
  //   };
  // }, []);

  // File load handler - uses useTempoDetection hook for BPM analysis
  const handleFileLoad = async (file) => {
    if (!file) return;

    if (!isInitialized) {
      handleInitialize();
    }

    try {
      setLoopA(0);
      setLoopB(null);
      setIsLooping(false);

      // Load via useTempoDetection hook (handles BPM analysis + audio element creation)
      const audio = await loadAudioFile(file);

      // Also sync to tempoAudioStore for global playback state
      useTempoAudioStore.getState().loadSongFile(file);

      // Set up time tracking on the hook's audio element
      if (audio) {
        // Duration is set when metadata loads
        const handleMetadata = () => {
          if (Number.isFinite(audio.duration)) {
            setDuration(audio.duration);
            // Also update the store's duration
            useTempoAudioStore.setState({ songDurationSec: audio.duration });
          }
          setCurrentTime(0);
        };

        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime);
        };

        // Check if metadata is already loaded
        if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
          handleMetadata();
        } else {
          audio.addEventListener('loadedmetadata', handleMetadata, { once: true });
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);
      }

      console.log('[TempoSyncPanel] File loaded via hook:', file.name);
    } catch (error) {
      console.error('Failed to load audio file:', error);
    }
  };

  const handleClearSong = () => {
    useTempoAudioStore.getState().clearSong();
    setDuration(0);
    setCurrentTime(0);
    setLoopA(0);
    setLoopB(null);
    setIsLooping(false);
  };

  // Sync loop state to hook whenever it changes
  useEffect(() => {
    setLoopState(loopA, loopB, isLooping);
  }, [loopA, loopB, isLooping]);

  const phaseDuration = getPhaseDuration();
  const confidencePercent = Math.round(confidence * 100);
  const isPlaying = playbackState === 'playing';

  // Calculate beats per phase for display
  const beatsPerPhaseDisplay = bpm > 0 ? Math.round(phaseDuration * bpm / 60) : beatsPerPhase;

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const audio = getAudioElement();
    if (audio) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * duration;
      setCurrentTime(percent * duration);
    }
  };

  const handleSetLoopA = () => {
    const audio = getAudioElement();
    if (audio) {
      setLoopA(audio.currentTime);
    }
  };

  const handleSetLoopB = () => {
    const audio = getAudioElement();
    if (audio) {
      setLoopB(audio.currentTime);
    }
  };

  const handleResetDetection = () => {
    // Reset both the hook's detection state and the store's state
    if (resetDetectionHook) {
      resetDetectionHook();
    }
    if (resetDetection) {
      resetDetection();
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    setTapTimes((prev) => {
      const next = [...prev, now];
      while (next.length > 8) {
        next.shift();
      }
      if (next.length < 4) {
        return next;
      }
      const intervals = [];
      for (let i = 1; i < next.length; i++) {
        intervals.push(next[i] - next[i - 1]);
      }
      const sorted = [...intervals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      if (median > 0) {
        const nextBpm = Math.round(60000 / median);
        setBpm(nextBpm);
        setConfidence(1.0);
        if (isPracticing) {
          setLocked(true);
        }
      }
      return next;
    });
  };

  const handleClearTaps = () => {
    setTapTimes([]);
  };

  // Monitor confidence and show warning
  const prevConfidenceRef = useRef(confidence);
  const prevIsPlayingRef = useRef(isPlaying);
  useEffect(() => {
    const threshold = 0.35;
    const confChanged = confidence !== prevConfidenceRef.current;
    const playChanged = isPlaying !== prevIsPlayingRef.current;
    prevConfidenceRef.current = confidence;
    prevIsPlayingRef.current = isPlaying;

    if (!isPlaying || confidence >= threshold) {
      if (showNoStable && (confChanged || playChanged)) {
        setShowNoStable(false);
      }
      if (noStableTimerRef.current) {
        clearTimeout(noStableTimerRef.current);
        noStableTimerRef.current = null;
      }
      return;
    }

    if (!noStableTimerRef.current) {
      noStableTimerRef.current = setTimeout(() => {
        setShowNoStable(true);
      }, 2500);
    }

    return () => {
      if (noStableTimerRef.current && (confidence >= threshold || !isPlaying)) {
        clearTimeout(noStableTimerRef.current);
        noStableTimerRef.current = null;
      }
    };
  }, [confidence, isPlaying]);

  useEffect(() => {
    return () => {
      if (noStableTimerRef.current) {
        clearTimeout(noStableTimerRef.current);
        noStableTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tapClearTimerRef.current) {
      clearTimeout(tapClearTimerRef.current);
      tapClearTimerRef.current = null;
    }
    if (tapTimes.length > 0) {
      tapClearTimerRef.current = setTimeout(() => {
        setTapTimes([]);
      }, 2500);
    }
    return () => {
      if (tapClearTimerRef.current) {
        clearTimeout(tapClearTimerRef.current);
        tapClearTimerRef.current = null;
      }
    };
  }, [tapTimes]);

  const playbackStatusLabel = playbackState === 'paused' ? 'Paused' : playbackState === 'ended' ? 'Ended' : 'Idle';

  return (
    <div
      style={{
        marginTop: '16px',
        pointerEvents: lockedBySession ? 'none' : 'auto',
        opacity: lockedBySession ? 0.55 : 1,
        filter: lockedBySession ? 'grayscale(0.15)' : 'none',
      }}
      data-tutorial="tempo-sync-panel"
    >
      {lockedBySession && (
        <div
          style={{
            marginBottom: '10px',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          Locked by curriculum
        </div>
      )}
      {/* Enable/Disable Toggle */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          🎵 TEMPO SYNC:
        </label>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: enabled ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
            color: enabled ? '#000' : 'var(--text-primary)',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {enabled && !hasBenchmark && (
        <div style={{ fontSize: '10px', color: '#fca5a5', letterSpacing: '0.05em', marginTop: '-6px', marginBottom: '12px' }}>
          Benchmark required for Tempo Sync breathing.
        </div>
      )}

      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Main Card: BPM + Lock + Multiplier */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(74, 222, 128, 0.2)',
            }}
          >
            {/* BPM Display (Prominent) */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.12em', lineHeight: 1 }}>
                {bpm}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '2px' }}>
                BPM
              </div>
            </div>

            {/* Confidence Bar (Subordinate) */}
            {enabled && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    height: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${isPlaying ? confidence * 100 : 0}%`,
                      backgroundColor: isLocked ? '#4ade80' : 'var(--accent-primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                {!isPlaying && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.05em' }}>
                    {playbackStatusLabel}
                  </div>
                )}
                {isPlaying && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.05em' }}>
                    {showNoStable
                      ? `No stable tempo detected - ${confidencePercent}%`
                      : `${isLocked ? '🔒 LOCKED' : confidence > 0.8 ? 'CONFIDENT' : confidence > 0.4 ? '🔄 DETECTING' : '⏳ WAITING'} - ${confidencePercent}%`}
                  </div>
                )}
              </div>
            )}

            {/* Lock & Multiplier Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Lock Button */}
              <button
                onClick={() => setLocked(!isLocked)}
                disabled={isPracticing}
                style={{
                  padding: '10px',
                  backgroundColor: isLocked ? '#4ade8033' : 'rgba(255, 255, 255, 0.05)',
                  border: isLocked ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: isLocked ? '#4ade80' : 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isPracticing ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.08em',
                  opacity: isPracticing ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isPracticing) {
                    e.currentTarget.style.border = isLocked ? '2px solid #4ade80' : '1px solid rgba(74, 222, 128, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = isLocked ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.1)';
                }}
              >
                {isLocked ? '🔒' : '🔓'}
              </button>

              {/* Breath Pace Display */}
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>
                  {beatsPerPhaseDisplay} beats
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {phaseDuration.toFixed(1)}s @ x{breathMultiplier}
                </div>
              </div>
            </div>

            {/* Multiplier Grid (2x2) */}
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[1, 2, 3, 4].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setBreathMultiplier(mult)}
                  disabled={isPracticing || isBenchmarkBlocked}
                  style={{
                    padding: '8px',
                    backgroundColor: breathMultiplier === mult ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                    border: breathMultiplier === mult ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: breathMultiplier === mult ? '#000' : 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: isPracticing || isBenchmarkBlocked ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em',
                    opacity: isPracticing || isBenchmarkBlocked ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  x{mult}
                </button>
              ))}
            </div>

            {phaseDuration >= 60 && (
              <div style={{ fontSize: '10px', color: '#fca5a5', marginTop: '8px', letterSpacing: '0.05em', textAlign: 'center' }}>
                ⚠ Max duration reached
              </div>
            )}
          </div>

          {/* Collapsible Settings Section */}
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setExpandedSettings(!expandedSettings)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: expandedSettings ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: 'none',
                borderBottom: expandedSettings ? '1px solid rgba(74, 222, 128, 0.2)' : 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⚙ PLAYBACK & BEATS</span>
              <span style={{ transform: expandedSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
            </button>

            {expandedSettings && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>                {/* Reset Detection Button */}
                <button
                  onClick={handleResetDetection}
                  style={{
                    padding: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '6px',
                    color: 'rgba(212, 175, 55, 0.85)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                  }}
                >
                  ↻ RESET BPM DETECTION
                </button>
                {/* Playback Controls */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={playAudio}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(74, 222, 128, 0.15)',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      borderRadius: '6px',
                      color: 'var(--accent-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ▶ PLAY
                  </button>
                  <button
                    onClick={pauseAudio}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ⏸ PAUSE
                  </button>
                  <button
                    onClick={stopAudio}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ⏹ STOP
                  </button>
                </div>

                {/* Beats Per Phase */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Beats per phase
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[2, 4, 8, 16].map((beats) => (
                      <button
                        key={beats}
                        onClick={() => setBeatsPerPhase(beats)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: beatsPerPhase === beats ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                          border: beatsPerPhase === beats ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: beatsPerPhase === beats ? '#000' : 'var(--text-primary)',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {beats}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Manual Entry Section */}
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setExpandedManual(!expandedManual)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: expandedManual ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: 'none',
                borderBottom: expandedManual ? '1px solid rgba(74, 222, 128, 0.2)' : 'none',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <span>✎ MANUAL BPM</span>
              <span style={{ transform: expandedManual ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
            </button>

            {expandedManual && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  disabled={isBenchmarkBlocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    boxSizing: 'border-box',
                    cursor: isBenchmarkBlocked ? 'not-allowed' : 'text',
                    opacity: isBenchmarkBlocked ? 0.5 : 1,
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={handleTapTempo}
                    disabled={isBenchmarkBlocked}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: 'rgba(74, 222, 128, 0.12)',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      borderRadius: '6px',
                      color: 'var(--accent-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: isBenchmarkBlocked ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.08em',
                      opacity: isBenchmarkBlocked ? 0.5 : 1,
                    }}
                  >
                    TAP TEMPO
                  </button>
                  <button
                    onClick={handleClearTaps}
                    disabled={isBenchmarkBlocked}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: isBenchmarkBlocked ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.08em',
                      opacity: isBenchmarkBlocked ? 0.5 : 1,
                    }}
                  >
                    CLEAR TAPS
                  </button>
                </div>
                <button
                  onClick={resetDetection}
                  disabled={isBenchmarkBlocked}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isBenchmarkBlocked ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.08em',
                    opacity: isBenchmarkBlocked ? 0.5 : 1,
                  }}
                >
                  RESET DETECTION
                </button>
                {isBenchmarkBlocked && (
                  <button
                    onClick={onRunBenchmark}
                    disabled={!onRunBenchmark}
                    style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '9px',
                      fontWeight: 700,
                      cursor: onRunBenchmark ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: onRunBenchmark ? 1 : 0.5,
                    }}
                  >
                    RUN BENCHMARK
                  </button>
                )}
              </div>
            )}
          </div>

          {/* File Upload Trigger Button */}
          <button
            onClick={() => setShowFileDrawer(true)}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '8px',
              color: 'rgba(212, 175, 55, 0.85)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.08em',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
            }}
          >
            📁 LOAD AUDIO FILE
          </button>

          <button
            onClick={handleClearSong}
            disabled={!hasSong}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: hasSong ? 'pointer' : 'not-allowed',
              letterSpacing: '0.08em',
              transition: 'all 0.2s ease',
              opacity: hasSong ? 1 : 0.5,
            }}
          >
            Clear Song
          </button>

          {/* Audio File Info & Controls */}
          <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* File Name */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>📄 File</div>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all', fontWeight: 500, letterSpacing: '0.03em' }}>
                {songName || 'No song loaded'}
              </div>
              {Number.isFinite(songDurationSec) && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.05em' }}>
                  Duration: {formatTime(songDurationSec)}
                </div>
              )}
            </div>

            {hasSong && (
              <>
                {/* Progress Scrubber */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>▶ Progress</span>
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <div
                    onClick={handleSeek}
                    style={{
                      height: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                        backgroundColor: 'var(--accent-primary)',
                        transition: isPlaying ? 'none' : 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {/* A/B Loop Controls */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🔁 A/B Loop</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '9px' }}>
                      <input
                        type="checkbox"
                        checked={isLooping}
                        onChange={(e) => setIsLooping(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Active
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      onClick={handleSetLoopA}
                      style={{
                        padding: '6px',
                        backgroundColor: loopA !== 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: loopA !== 0 ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      A: {formatTime(loopA)}
                    </button>
                    <button
                      onClick={handleSetLoopB}
                      style={{
                        padding: '6px',
                        backgroundColor: loopB !== null ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: loopB !== null ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      B: {loopB !== null ? formatTime(loopB) : '-'}
                    </button>
                  </div>
                  {loopB !== null && (
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', letterSpacing: '0.03em' }}>
                      Loop range: {formatTime(loopB - loopA)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* File Upload Drawer */}
      <FileUploadDrawer
        isOpen={showFileDrawer}
        onClose={() => setShowFileDrawer(false)}
        onFileSelect={handleFileLoad}
      />
    </div>
  );
};
