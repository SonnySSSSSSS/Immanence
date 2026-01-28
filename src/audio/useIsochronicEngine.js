// src/audio/useIsochronicEngine.js
//
// React hook wrapper for IsochronicEngine
// Mirrors useBinauralEngine lifecycle:
// - Lazy engine creation
// - Stable imperative API
// - Clean start/stop
//
// No UI wiring in this step.

import { useEffect, useRef, useCallback, useState } from "react";
import { IsochronicEngine } from "./IsochronicEngine";

export function useIsochronicEngine() {
  const engineRef = useRef(null);
  const ctxRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Lazily create AudioContext + engine
  const ensureEngine = useCallback(() => {
    if (!engineRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API not supported");
      }

      ctxRef.current = new AudioCtx();
      engineRef.current = new IsochronicEngine(ctxRef.current);
      setIsReady(true);
    }
    return engineRef.current;
  }, []);

  const start = useCallback(() => {
    const engine = ensureEngine();
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    engine.start();
    setIsRunning(true);
  }, [ensureEngine]);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setIsRunning(false);
  }, []);

  // Parameter setters (safe even if engine not started yet)
  const setPulseHz = useCallback((hz) => {
    const engine = ensureEngine();
    engine.setPulseHz(hz);
  }, [ensureEngine]);

  const setCarrierHz = useCallback((hz) => {
    const engine = ensureEngine();
    engine.setCarrierHz(hz);
  }, [ensureEngine]);

  const setMasterGain = useCallback((value01) => {
    const engine = ensureEngine();
    console.log("[useIsoEngine] setMasterGain called with:", value01);
    engine.setMasterGain(value01);
  }, [ensureEngine]);

  const setReverbWet = useCallback((value01) => {
    const engine = ensureEngine();
    engine.setReverbWet(value01);
  }, [ensureEngine]);

  const setChorusWet = useCallback((value01) => {
    const engine = ensureEngine();
    engine.setChorusWet(value01);
  }, [ensureEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.stop();
        } catch {}
        engineRef.current = null;
      }
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch {}
        ctxRef.current = null;
      }
    };
  }, []);

  return {
    isReady,
    isRunning,
    start,
    stop,
    setPulseHz,
    setCarrierHz,
    setMasterGain,
    setReverbWet,
    setChorusWet,
  };
}
