// src/components/BinauralTrainerPanel.jsx

import { useEffect, useMemo, useRef } from 'react';
import { useBinauralEngine } from '../audio/useBinauralEngine';
import { ratioPresets } from '../audio/ratios';

export function BinauralTrainerPanel() {
    const {
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
    } = useBinauralEngine();

    const didInitDefaults = useRef(false);

    useEffect(() => {
        if (didInitDefaults.current) return;
        didInitDefaults.current = true;
        setMasterCarrier(144);
        setDeltaF(6);
    }, [setDeltaF, setMasterCarrier]);

    const ratioOptions = useMemo(() => ratioPresets, []);

    return (
        <div className="w-full">
            <div className="flex min-h-0 flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {!isReady && (
                        <button
                            type="button"
                            onClick={ensureReady}
                            className="rounded border px-3 py-1"
                        >
                            Enable Audio
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={isRunning ? stop : start}
                        className="rounded border px-3 py-1"
                    >
                        {isRunning ? 'Stop' : 'Start'}
                    </button>
                </div>

                <label className="flex flex-col gap-2">
                    <span className="text-sm">Master Carrier: {fc.toFixed(1)} Hz</span>
                    <input
                        type="range"
                        min={40}
                        max={1200}
                        step={1}
                        value={fc}
                        onChange={(event) => setMasterCarrier(Number(event.target.value))}
                    />
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm">Ratio</span>
                    <select
                        value={ratio}
                        onChange={(event) => setRatio(Number(event.target.value))}
                        className="rounded border px-2 py-1"
                    >
                        {ratioOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm">DeltaF: {deltaF.toFixed(2)} Hz</span>
                    <input
                        type="range"
                        min={0}
                        max={20}
                        step={0.1}
                        value={deltaF}
                        onChange={(event) => setDeltaF(Number(event.target.value))}
                    />
                </label>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSpread('integer', 1)}
                        className={`rounded border px-3 py-1 ${spreadMode === 'integer' ? 'bg-black text-white' : ''}`}
                    >
                        Integer
                    </button>
                    <button
                        type="button"
                        onClick={() => setSpread('phi', 1)}
                        className={`rounded border px-3 py-1 ${spreadMode === 'phi' ? 'bg-black text-white' : ''}`}
                    >
                        Phi
                    </button>
                </div>

                <label className="flex flex-col gap-2">
                    <span className="text-sm">Chaos: {chaos.toFixed(2)}</span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={chaos}
                        onChange={(event) => setChaos(Number(event.target.value))}
                    />
                </label>

                <div className="flex min-h-0 flex-col gap-2">
                    <span className="text-sm">Voice Gains</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {voiceGains.map((gain, index) => (
                            <label key={`gain-${index}`} className="flex flex-col gap-1">
                                <span className="text-xs">{index + 1}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={gain}
                                    onChange={(event) => setVoiceGain(index, Number(event.target.value))}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
