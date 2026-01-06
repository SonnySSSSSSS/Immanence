// src/components/dev/PrecisionMeterDevPanel.jsx
// Dev panel for testing precision meter with mock data

import React, { useState } from 'react';
import { useTrackingStore } from '../../state/trackingStore.js';
import { useDisplayModeStore } from '../../state/displayModeStore.js';

export function PrecisionMeterDevPanel({ onClose }) {
    const colorScheme = useDisplayModeStore(s => s.colorScheme);
    const isLight = colorScheme === 'light';
    
    const setDevModeOverride = useTrackingStore(s => s.setDevModeOverride);
    const clearDevModeOverride = useTrackingStore(s => s.clearDevModeOverride);
    const devModeOverride = useTrackingStore(s => s.devModeOverride);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [mockData, setMockData] = useState(
        devModeOverride || days.map(() => ({ practiced: false, offsetMinutes: 0 }))
    );

    const handleTogglePracticed = (index) => {
        const updated = [...mockData];
        updated[index] = { ...updated[index], practiced: !updated[index].practiced };
        setMockData(updated);
    };

    const handleOffsetChange = (index, value) => {
        const updated = [...mockData];
        updated[index] = { ...updated[index], offsetMinutes: parseFloat(value) };
        setMockData(updated);
    };

    const handleApply = () => {
        setDevModeOverride(mockData);
    };

    const handleReset = () => {
        clearDevModeOverride();
        setMockData(days.map(() => ({ practiced: false, offsetMinutes: 0 })));
    };

    return (
        <div 
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className={`relative w-full max-w-2xl rounded-2xl border p-6 ${
                    isLight 
                        ? 'bg-white/95 border-amber-900/20' 
                        : 'bg-[#0a0a12]/95 border-white/10'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-lg font-bold uppercase tracking-wider ${
                        isLight ? 'text-amber-900' : 'text-white'
                    }`}>
                        Precision Meter Dev Panel
                    </h2>
                    <button
                        onClick={onClose}
                        className={`text-sm px-3 py-1 rounded ${
                            isLight 
                                ? 'text-amber-900/60 hover:text-amber-900 hover:bg-amber-900/5' 
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        ✕
                    </button>
                </div>

                {/* Controls */}
                <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                    {days.map((day, i) => (
                        <div 
                            key={i} 
                            className={`flex items-center gap-4 p-3 rounded-lg ${
                                isLight ? 'bg-amber-50/50' : 'bg-white/5'
                            }`}
                        >
                            {/* Day Label */}
                            <div className={`w-20 text-xs font-bold uppercase ${
                                isLight ? 'text-amber-900/70' : 'text-white/70'
                            }`}>
                                {day.slice(0, 3)}
                            </div>

                            {/* Practiced Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={mockData[i].practiced}
                                    onChange={() => handleTogglePracticed(i)}
                                    className="w-4 h-4"
                                />
                                <span className={`text-xs ${
                                    isLight ? 'text-amber-900/60' : 'text-white/60'
                                }`}>
                                    Practiced
                                </span>
                            </label>

                            {/* Offset Slider */}
                            <div className="flex-1 flex items-center gap-3">
                                <input
                                    type="range"
                                    min="-15"
                                    max="15"
                                    step="0.5"
                                    value={mockData[i].offsetMinutes}
                                    onChange={(e) => handleOffsetChange(i, e.target.value)}
                                    disabled={!mockData[i].practiced}
                                    className="flex-1"
                                />
                                <span className={`text-xs font-mono w-16 text-right ${
                                    isLight ? 'text-amber-900' : 'text-white'
                                }`}>
                                    {mockData[i].offsetMinutes > 0 ? '+' : ''}{mockData[i].offsetMinutes.toFixed(1)}m
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleApply}
                        className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                            isLight
                                ? 'bg-amber-900 text-white hover:bg-amber-800'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        Apply Mock Data
                    </button>
                    <button
                        onClick={handleReset}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                            isLight
                                ? 'bg-amber-900/10 text-amber-900 hover:bg-amber-900/20'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        Reset
                    </button>
                </div>

                {/* Info */}
                <div className={`mt-4 text-xs ${
                    isLight ? 'text-amber-900/50' : 'text-white/40'
                }`}>
                    <p>• Toggle "Practiced" to show/hide data points</p>
                    <p>• Adjust offset slider to position on the 5-level scale</p>
                    <p>• Click "Apply" to inject mock data into the chart</p>
                </div>
            </div>
        </div>
    );
}
