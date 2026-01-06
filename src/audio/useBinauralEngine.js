// src/audio/useBinauralEngine.js

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BinauralEngine } from './BinauralEngine';

const DEFAULT_GAINS = new Array(10).fill(0.6);

export function useBinauralEngine() {
    const engineRef = useRef(null);
    const audioContextRef = useRef(null);

    const [isReady, setIsReady] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [fc, setFc] = useState(220);
    const [ratio, setRatioState] = useState(1);
    const [deltaF, setDeltaFState] = useState(0);
    const [spreadMode, setSpreadModeState] = useState('integer');
    const [chaos, setChaosState] = useState(0);
    const [voiceGains, setVoiceGainsState] = useState(DEFAULT_GAINS);

    const ensureReady = useCallback(async () => {
        if (isReady) return true;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = audioContextRef.current || new AudioContext();

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        engineRef.current = engineRef.current || new BinauralEngine();
        engineRef.current.init(audioContextRef.current);

        engineRef.current.setMasterCarrier(fc);
        engineRef.current.setSpread(spreadMode, 1);
        engineRef.current.setRatio(ratio);
        engineRef.current.setDeltaF(deltaF);
        engineRef.current.setChaos(chaos);
        voiceGains.forEach((gain, index) => engineRef.current.setVoiceGain(index, gain));

        setIsReady(true);
        return true;
    }, [chaos, deltaF, fc, isReady, ratio, spreadMode, voiceGains]);

    const start = useCallback(async () => {
        await ensureReady();
        engineRef.current.start();
        setIsRunning(true);
    }, [ensureReady]);

    const stop = useCallback(() => {
        if (!engineRef.current) return;
        engineRef.current.stop();
        setIsRunning(false);
    }, []);

    const setMasterCarrier = useCallback((value) => {
        setFc(value);
        if (engineRef.current) {
            engineRef.current.setMasterCarrier(value);
        }
    }, []);

    const setSpread = useCallback((mode, amount) => {
        setSpreadModeState(mode);
        if (engineRef.current) {
            engineRef.current.setSpread(mode, amount);
        }
    }, []);

    const setRatio = useCallback((value) => {
        setRatioState(value);
        if (engineRef.current) {
            engineRef.current.setRatio(value);
        }
    }, []);

    const setDeltaF = useCallback((value) => {
        setDeltaFState(value);
        if (engineRef.current) {
            engineRef.current.setDeltaF(value);
        }
    }, []);

    const setChaos = useCallback((value) => {
        setChaosState(value);
        if (engineRef.current) {
            engineRef.current.setChaos(value);
        }
    }, []);

    const setVoiceGain = useCallback((index, value) => {
        setVoiceGainsState((prev) => {
            const next = prev.slice();
            next[index] = value;
            return next;
        });
        if (engineRef.current) {
            engineRef.current.setVoiceGain(index, value);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (engineRef.current) {
                engineRef.current.stop();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return useMemo(() => ({
        isReady,
        isRunning,
        fc,
        ratio,
        deltaF,
        spreadMode,
        chaos,
        voiceGains,
        ensureReady,
        start,
        stop,
        setMasterCarrier,
        setSpread,
        setRatio,
        setDeltaF,
        setChaos,
        setVoiceGain,
    }), [
        chaos,
        deltaF,
        ensureReady,
        fc,
        isReady,
        isRunning,
        ratio,
        setChaos,
        setDeltaF,
        setMasterCarrier,
        setRatio,
        setSpread,
        setVoiceGain,
        spreadMode,
        start,
        stop,
        voiceGains,
    ]);
}
