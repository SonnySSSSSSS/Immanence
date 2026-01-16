import { useEffect, useRef } from 'react';
import { analyze } from 'web-audio-beat-detector';
import { useTempoSyncStore } from '../state/tempoSyncStore.js';

// Audio analysis constants
const LOWPASS_FREQUENCY = 1000;
const MIN_BEAT_GAP_MS = 200;
const MAX_BEAT_GAP_MS = 2000;
const BEAT_HISTORY_SIZE = 16;
const PEAK_THRESHOLD_MULTIPLIER = 1.1;
const MIN_AMPLITUDE = 10;
const STABLE_CONFIDENCE_THRESHOLD = 0.55;
const STABLE_BPM_TOLERANCE = 5;
const STABLE_BEATS_REQUIRED = 4;
const ENERGY_FLOOR = 10;
const FLUX_FLOOR = 1.2;
const FLUX_NORMALIZER = 25;
const INTERVAL_BIN_MS = 15;
const MIN_INTERVALS_FOR_CONFIDENCE = 3;
const PEAK_PROMINENCE_DIVISOR = 80;

export const useTempoDetection = () => {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const filterRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const audioElementRef = useRef(null);
  const objectUrlRef = useRef(null);
  const rafRef = useRef(null);
  const isPlayingRef = useRef(false);
  const decayTimerRef = useRef(null);
  const lastConfidenceRef = useRef(0);
  const prevBassRef = useRef(null);
  const beatTimesRef = useRef([]);
  const isLockedRef = useRef(false);
  const rollingBpmRef = useRef(120);
  const stableCountRef = useRef(0);
  const debugCounterRef = useRef(0);
  const beatDebugRef = useRef({ lastLog: 0, beats: 0, lastBeat: 0 });
  const confDebugLastLogRef = useRef(0);
  const loopARef = useRef(0);
  const loopBRef = useRef(null);
  const isLoopingRef = useRef(false);
  const loopIntervalRef = useRef(null);
  const isProgrammaticSeekRef = useRef(false);

  const setBpm = useTempoSyncStore(s => s.setBpm);
  const setConfidence = useTempoSyncStore(s => s.setConfidence);
  const setListening = useTempoSyncStore(s => s.setListening);
  const setPlaybackState = useTempoSyncStore(s => s.setPlaybackState);
  const resetSession = useTempoSyncStore(s => s.resetSession);
  const markBeat = useTempoSyncStore(s => s.markBeat);
  const isLocked = useTempoSyncStore(s => s.isLocked);
  const reset = useTempoSyncStore(s => s.reset);

  const getNowMs = () => {
    if (audioContextRef.current?.currentTime != null) {
      return audioContextRef.current.currentTime * 1000;
    }
    if (audioElementRef.current?.currentTime != null) {
      return audioElementRef.current.currentTime * 1000;
    }
    return performance.now();
  };

  const stopDetection = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const stopConfidenceDecay = () => {
    if (decayTimerRef.current) {
      clearInterval(decayTimerRef.current);
      decayTimerRef.current = null;
    }
  };

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const disconnectSource = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Already disconnected
      }
      sourceRef.current = null;
    }
  };

  const cleanupAudioElement = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.onplay = null;
    audioElementRef.current.onpause = null;
    audioElementRef.current.onended = null;
    audioElementRef.current.onseeking = null;
  };

  const resetBeatTracking = () => {
    beatTimesRef.current = [];
    stableCountRef.current = 0;
    rollingBpmRef.current = 120;
    lastConfidenceRef.current = 0;
    setConfidence(0);
  };

  const stopLoopInterval = () => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
  };

  const updateLoopInterval = () => {
    const audio = audioElementRef.current;
    const shouldLoop = isLoopingRef.current && loopBRef.current != null && audio && !audio.paused;
    if (!shouldLoop) {
      stopLoopInterval();
      return;
    }
    if (loopIntervalRef.current) return;

    const epsilon = 0.05;
    loopIntervalRef.current = setInterval(() => {
      const currentAudio = audioElementRef.current;
      if (!currentAudio || currentAudio.paused || !isLoopingRef.current || loopBRef.current == null) {
        stopLoopInterval();
        return;
      }
      if (currentAudio.currentTime >= loopBRef.current - epsilon) {
        isProgrammaticSeekRef.current = true;
        currentAudio.currentTime = loopARef.current;
        setTimeout(() => {
          isProgrammaticSeekRef.current = false;
        }, 0);
      }
    }, 30);
  };

  // Expose loop control methods (updates refs)
  const setLoopState = (loopA, loopB, isLooping) => {
    loopARef.current = loopA;
    loopBRef.current = loopB;
    isLoopingRef.current = isLooping;
    updateLoopInterval();
  };

  // Track locked state for detection loop
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      stopConfidenceDecay();
      cleanupAudioElement();
      disconnectSource();
      stopLoopInterval();
    };
  }, []);

  const startConfidenceDecay = () => {
    stopConfidenceDecay();
    const startValue = lastConfidenceRef.current || 0;
    const steps = 8;
    const stepMs = 100;
    let step = 0;

    decayTimerRef.current = setInterval(() => {
      step += 1;
      const nextValue = Math.max(0, startValue * (1 - step / steps));
      lastConfidenceRef.current = nextValue;
      setConfidence(nextValue);
      if (step >= steps) {
        stopConfidenceDecay();
      }
    }, stepMs);
  };

  // Initialize audio context
  const initializeAudioContext = () => {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    const filter = filterRef.current;

    const isValidContext = ctx &&
      typeof ctx.createMediaElementSource === 'function' &&
      ctx.state !== 'closed';

    if (isValidContext && analyser && filter) {
      return { ctx, analyser, filter };
    }

    if (ctx && !isValidContext) {
      audioContextRef.current = null;
      analyserRef.current = null;
      filterRef.current = null;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const nextCtx = new AudioContextClass();

      const analyserNode = nextCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.5;

      const filterNode = nextCtx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = LOWPASS_FREQUENCY;
      filterNode.connect(analyserNode);

      audioContextRef.current = nextCtx;
      analyserRef.current = analyserNode;
      filterRef.current = filterNode;
      dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);

      return { ctx: audioContextRef.current, filter: filterRef.current, analyser: analyserRef.current };
    } catch (error) {
      console.error('[TempoDetection] Failed to initialize AudioContext:', error);
      throw error;
    }
  };

  // Load and analyze audio file
  const loadAudioFile = (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        const audioInit = initializeAudioContext();
        const ctx = audioInit.ctx;
        const filter = audioInit.filter;

        if (!ctx || !filter) {
          reject(new Error('Audio context not initialized'));
          return;
        }

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        resetSession();

        try {
          const arrayBuffer = typeof file.arrayBuffer === 'function'
            ? await file.arrayBuffer()
            : await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(reader.error);
              reader.onload = () => resolve(reader.result);
              reader.readAsArrayBuffer(file);
            });
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          const tempo = await analyze(audioBuffer);
          if (Number.isFinite(tempo)) {
            if (!isLockedRef.current) {
              setBpm(Math.round(tempo));
            }
            lastConfidenceRef.current = 0.9;
            setConfidence(0.9);
            rollingBpmRef.current = tempo;
          }
        } catch (error) {
          console.warn('[TempoDetection] Offline BPM analysis failed:', error);
        }

        const audio = new Audio();
        cleanupAudioElement();
        revokeObjectUrl();
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        audio.src = objectUrl;
        audio.preload = 'auto';

        audio.addEventListener('error', () => console.error('[Tempo] audio error', audio.error));
        audio.addEventListener('play', () => console.log('[Tempo] event: play'));
        audio.addEventListener('pause', () => console.log('[Tempo] event: pause'));
        audio.addEventListener('ended', () => console.log('[Tempo] event: ended'));
        audio.addEventListener('canplay', () => console.log('[Tempo] event: canplay'));
        audio.addEventListener('loadeddata', () => console.log('[Tempo] event: loadeddata'));
        audio.addEventListener('loadedmetadata', () => console.log('[Tempo] event: loadedmetadata'));

        audio.load();
        audioElementRef.current = audio;

        disconnectSource();
        sourceRef.current = ctx.createMediaElementSource(audio);
        sourceRef.current.connect(ctx.destination);
        sourceRef.current.connect(filter);
        console.log('[Tempo] Audio connected to AudioContext');

        resetBeatTracking();
        setListening(true);
        setPlaybackState('idle');
        reset();

        audio.onplay = () => {
          isPlayingRef.current = true;
          setPlaybackState('playing');
          resetBeatTracking();
          stopConfidenceDecay();
          lastConfidenceRef.current = 0;
          setConfidence(0);
          updateLoopInterval();
        };

        audio.onpause = () => {
          isPlayingRef.current = false;
          setPlaybackState('paused');
          resetBeatTracking();
          startConfidenceDecay();
          updateLoopInterval();
        };

        audio.onended = () => {
          isPlayingRef.current = false;
          setPlaybackState('ended');
          resetBeatTracking();
          startConfidenceDecay();
          updateLoopInterval();
        };

    audio.onseeking = () => {
      if (isProgrammaticSeekRef.current) {
        resetBeatTracking();
        lastConfidenceRef.current = 0;
        setConfidence(0);
        return;
      }
      isPlayingRef.current = false;
      setPlaybackState('paused');
      resetBeatTracking();
      lastConfidenceRef.current = 0;
      setConfidence(0);
      updateLoopInterval();
    };

    audio.onseeked = () => {
      if (audio && !audio.paused) {
        isPlayingRef.current = true;
        setPlaybackState('playing');
      }
    };

        resolve(audio);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Detect beats and calculate BPM
  const detectBeat = () => {
    if (!isPlayingRef.current) return null;
    if (!analyserRef.current || !dataArrayRef.current) return null;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    let peak = 0;
    const startBin = 2;
    const endBin = Math.min(80, dataArrayRef.current.length);
    const bassBinCount = Math.max(1, endBin - startBin);

    if (!prevBassRef.current || prevBassRef.current.length !== bassBinCount) {
      prevBassRef.current = new Uint8Array(bassBinCount);
    }

    let bassSum = 0;
    let fluxSum = 0;
    for (let i = startBin; i < endBin; i++) {
      const curr = dataArrayRef.current[i];
      const prev = prevBassRef.current[i - startBin];
      bassSum += curr;
      fluxSum += Math.max(0, curr - prev);
      prevBassRef.current[i - startBin] = curr;
    }
    const bassEnergy = bassSum / bassBinCount;
    const spectralFlux = fluxSum / bassBinCount;

    debugCounterRef.current += 1;
    if (debugCounterRef.current % 30 === 0) {
      const conf = lastConfidenceRef.current;
      console.log('[TempoDbg]', {
        bassEnergy: Number(bassEnergy.toFixed(1)),
        flux: Number(spectralFlux.toFixed(1)),
        conf: Number(conf.toFixed(2)),
        stable: stableCountRef.current,
      });
    }

    for (let i = startBin; i < endBin; i++) {
      if (dataArrayRef.current[i] > peak) {
        peak = dataArrayRef.current[i];
      }
    }

    let sum = 0;
    for (let i = startBin; i < endBin; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / (endBin - startBin);
    const threshold = average * PEAK_THRESHOLD_MULTIPLIER;

    if (bassEnergy <= ENERGY_FLOOR || spectralFlux <= FLUX_FLOOR) {
      if (lastConfidenceRef.current > 0.05) {
        lastConfidenceRef.current = 0;
        setConfidence(0);
      }
      return null;
    }

    if (peak > threshold && peak > MIN_AMPLITUDE) {
      const now = getNowMs();
      const lastBeatTime = beatTimesRef.current[beatTimesRef.current.length - 1];
      const timeSinceLastBeat = lastBeatTime ? now - lastBeatTime : Infinity;

      if (timeSinceLastBeat > MIN_BEAT_GAP_MS) {
        beatTimesRef.current.push(now);

        if (beatTimesRef.current.length > BEAT_HISTORY_SIZE) {
          beatTimesRef.current.shift();
        }

        beatDebugRef.current.beats += 1;
        const elapsed = now - (beatDebugRef.current.lastBeat || now);
        beatDebugRef.current.lastBeat = now;

        // Increment beat counter on every detected beat (for tempo sync session)
        if (markBeat) {
          markBeat(now);
        }

        if (now - beatDebugRef.current.lastLog > 250) {
          beatDebugRef.current.lastLog = now;
          console.log('[Beat]', {
            peak: Math.round(peak),
            avg: Number(average.toFixed(1)),
            thr: Number(threshold.toFixed(1)),
            ratio: Number((peak / Math.max(1, threshold)).toFixed(2)),
            bassEnergy: Number(bassEnergy.toFixed(1)),
            flux: Number(spectralFlux.toFixed(2)),
            dtMs: Math.round(elapsed),
            beatsSeen: beatDebugRef.current.beats,
          });
        }

        if (beatTimesRef.current.length > 1) {
          const intervals = [];
          for (let i = 1; i < beatTimesRef.current.length; i++) {
            const interval = beatTimesRef.current[i] - beatTimesRef.current[i - 1];
            if (interval > MIN_BEAT_GAP_MS && interval < MAX_BEAT_GAP_MS) {
              intervals.push(interval);
            }
          }

          if (intervals.length > 0) {
            const sorted = [...intervals].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const binCounts = new Map();
            for (const interval of intervals) {
              const bin = Math.round(interval / INTERVAL_BIN_MS) * INTERVAL_BIN_MS;
              binCounts.set(bin, (binCounts.get(bin) || 0) + 1);
            }
            let bestBin = null;
            let bestCount = -1;
            for (const [bin, count] of binCounts.entries()) {
              if (count > bestCount) {
                bestCount = count;
                bestBin = bin;
              }
            }
            const targetInterval = bestBin || median;
            let calculatedBpm = Math.round(60000 / targetInterval);

            const candidates = [calculatedBpm, calculatedBpm * 2, calculatedBpm / 2]
              .map(Math.round)
              .filter((bpmCandidate) => bpmCandidate >= 30 && bpmCandidate <= 300);

            const medianAbsError = (expectedInterval) => {
              const errors = intervals.map(interval => Math.abs(interval - expectedInterval)).sort((a, b) => a - b);
              return errors[Math.floor(errors.length / 2)];
            };

            let bestBpm = calculatedBpm;
            let bestError = Infinity;
            for (const bpmCandidate of candidates) {
              const expected = 60000 / bpmCandidate;
              const error = medianAbsError(expected);
              if (error < bestError) {
                bestError = error;
                bestBpm = bpmCandidate;
              }
            }

            const toleranceWindow = bestError * 1.1;
            const lowerCandidates = candidates.filter(bpmCandidate => {
              const expected = 60000 / bpmCandidate;
              const error = medianAbsError(expected);
              return error <= toleranceWindow;
            });
            if (lowerCandidates.length > 0) {
              bestBpm = Math.min(...lowerCandidates);
            }

            calculatedBpm = bestBpm;

            const expectedInterval = 60000 / calculatedBpm;
            const intervalTerm = Math.max(0, 1 - bestError / expectedInterval);
            const densityTerm = Math.min(1, intervals.length / MIN_INTERVALS_FOR_CONFIDENCE);
            const prominence = Math.min(1, Math.max(0, (peak - threshold) / PEAK_PROMINENCE_DIVISOR));
            const confidenceScore = Math.min(1, Math.max(0, 0.10 + 0.80 * (intervalTerm * densityTerm) + 0.10 * prominence));
            lastConfidenceRef.current = confidenceScore;

            if (now - confDebugLastLogRef.current > 400) {
              confDebugLastLogRef.current = now;
              console.log('[Conf]', {
                bpmCandidate: calculatedBpm,
                targetIntervalMs: Number(targetInterval.toFixed(1)),
                medAbsErrMs: Number(bestError.toFixed(1)),
                intervalTerm: Number(intervalTerm.toFixed(2)),
                densityTerm: Number(densityTerm.toFixed(2)),
                prominence: Number(prominence.toFixed(2)),
                conf: Number(confidenceScore.toFixed(2)),
                stable: stableCountRef.current,
              });
            }

            if (stableCountRef.current === 0 && intervals.length >= MIN_INTERVALS_FOR_CONFIDENCE) {
              rollingBpmRef.current = calculatedBpm;
            }

            const isStable = Math.abs(calculatedBpm - rollingBpmRef.current) <= STABLE_BPM_TOLERANCE;

            if (isStable) {
              stableCountRef.current += 1;
              rollingBpmRef.current = rollingBpmRef.current * 0.85 + calculatedBpm * 0.15;
              if (stableCountRef.current >= STABLE_BEATS_REQUIRED && confidenceScore > STABLE_CONFIDENCE_THRESHOLD) {
                if (!isLockedRef.current) {
                  setBpm(calculatedBpm);
                }
              }
            } else {
              stableCountRef.current = 0;
              rollingBpmRef.current = rollingBpmRef.current * 0.75 + calculatedBpm * 0.25;
            }

            setConfidence(confidenceScore);
            // Note: markBeat is now called earlier (line ~439) on every detected beat

            return {
              bpm: calculatedBpm,
              confidence: confidenceScore,
              isStable,
              stableCount: stableCountRef.current,
            };
          }
        }
      }
    }

    return null;
  };

  // Start beat detection loop
  const startDetection = () => {
    if (!analyserRef.current) return;
    if (rafRef.current) return;

    const detectLoop = () => {
      detectBeat();
      rafRef.current = requestAnimationFrame(detectLoop);
    };

    rafRef.current = requestAnimationFrame(detectLoop);
  };

  const playAudio = async () => {
    const audio = audioElementRef.current;
    const ctx = audioContextRef.current;

    console.log('[Tempo] playAudio()', {
      hasAudio: !!audio,
      src: audio?.src,
      paused: audio?.paused,
      time: audio?.currentTime,
      readyState: audio?.readyState,
      ctxState: ctx?.state,
    });

    if (!audio) return;

    try {
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[Tempo] ctx resumed');
      }
      const p = audio.play();
      console.log('[Tempo] audio.play() returned', p);
      await p;
      console.log('[Tempo] audio is playing');
      updateLoopInterval();
    } catch (err) {
      console.error('[Tempo] audio.play() FAILED', err);
    }
  };

  const resumeAudio = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  };

  const pauseAudio = () => {
    const audio = audioElementRef.current;
    console.log('[Tempo] pauseAudio()', { hasAudio: !!audio, paused: audio?.paused, time: audio?.currentTime });
    audio?.pause();
  };

  const stopAudio = () => {
    const audio = audioElementRef.current;
    console.log('[Tempo] stopAudio()', { hasAudio: !!audio, paused: audio?.paused, time: audio?.currentTime });
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  const getAudioElement = () => audioElementRef.current;

  const resetDetection = () => {
    resetBeatTracking();
    reset();
  };

  return {
    initializeAudioContext,
    loadAudioFile,
    detectBeat,
    startDetection,
    playAudio,
    resumeAudio,
    pauseAudio,
    stopAudio,
    getAudioElement,
    setLoopState,
    resetDetection,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
  };
};
